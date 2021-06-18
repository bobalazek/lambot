import chalk from 'chalk';

import { AssetPair } from '../Asset/AssetPair';
import { ExchangeAssetPriceInterface } from '../Exchange/ExchangeAssetPrice';
import { ExchangeOrder, ExchangeOrderSideEnum, ExchangeOrderTypeEnum } from '../Exchange/ExchangeOrder';
import { ExchangeTrade, ExchangeTradeStatusEnum, ExchangeTradeTypeEnum } from '../Exchange/ExchangeTrade';
import { Session } from '../Session/Session';
import { SessionAsset } from '../Session/SessionAsset';
import { calculatePercentage, colorTextByValue } from '../../Utils/Helpers';
import logger from '../../Utils/Logger';

export interface TraderInterface {
  session: Session;
  status: TraderStatusEnum;
  startTime: number;
  start(): void;
  stop(): void;
  processCurrentTrades(): Promise<void>;
  processPotentialTrades(): Promise<void>;
  getSortedAssetPairs(sessionAsset: SessionAsset): AssetPair[];
  checkForBuySignal(assetPair: AssetPair, sessionAsset: SessionAsset): Promise<ExchangeOrder>;
  checkForSellSignal(exchangeTrade: ExchangeTrade, sessionAsset: SessionAsset): Promise<ExchangeOrder>;
}

export enum TraderStatusEnum {
  STOPPED = 'STOPPED',
  RUNNING = 'RUNNING',
}

export class Trader implements TraderInterface {
  session: Session;
  status: TraderStatusEnum;
  interval: ReturnType<typeof setInterval>;
  statisticsInterval: ReturnType<typeof setInterval>;
  startTime: number;

  constructor(session: Session) {
    this.session = session;
    this.status = TraderStatusEnum.STOPPED;
  }

  async start(): Promise<boolean> {
    this.status = TraderStatusEnum.RUNNING;
    this.startTime = Date.now();

    // Price statistics update
    const updateStatisticsIntervalTime = this.session.config.assetPriceStatisticsUpdateIntervalSeconds * 1000;
    await this._updateAssetPriceStatistics();
    this.statisticsInterval = setInterval(async () => {
      await this._updateAssetPriceStatistics();
    }, updateStatisticsIntervalTime);

    // Price update
    const updateIntervalTime = this.session.config.assetPriceUpdateIntervalSeconds * 1000;
    this.interval = setInterval(async () => {
      const now = Date.now();

      await this._updateAssetPrices(now);

      this._printAssetPriceUpdates(now);

      await this._processTrades(now);

      this._printOpenTradeUpdates(now);

      this._cleanupAssetPrices(now, updateIntervalTime);
    }, updateIntervalTime);

    return true;
  }

  stop() {
    this.status = TraderStatusEnum.STOPPED;

    clearInterval(this.interval);
    clearInterval(this.statisticsInterval);
  }

  async processCurrentTrades(): Promise<void> {
    logger.debug('Starting to process trades ...');

    this.session.assets.forEach((sessionAsset) => {
      sessionAsset.getOpenTrades().forEach((exchangeTrade) => {
        this.checkForSellSignal(exchangeTrade, sessionAsset);
      });
    });
  }

  async processPotentialTrades(): Promise<void> {
    logger.debug('Starting to process new potential trades ...');

    this.session.assets.forEach((sessionAsset) => {
      this.getSortedAssetPairs(sessionAsset).forEach((assetPair) => {
        this.checkForBuySignal(assetPair, sessionAsset);
      });
    });
  }

  getSortedAssetPairs(sessionAsset: SessionAsset) {
    const {
      assetPairs,
      strategy,
    } = sessionAsset;

    const maximumAge = strategy.buyTroughUptrendThresholdMaximumAgeSeconds * 1000;

    // Sort by assets that had the biggest increase since the last largest trough
    return [...assetPairs].sort((assetPairA, assetPairB) => {
      const percentageA = this._getLargestTroughPercentage(
        assetPairA,
        maximumAge
      );
      const percentageB = this._getLargestTroughPercentage(
        assetPairB,
        maximumAge
      );

      if (percentageA === null) {
        return 1;
      }

      if (percentageB === null) {
        return -1;
      }

      return percentageB - percentageA;
    });
  }

  async checkForBuySignal(assetPair: AssetPair, sessionAsset: SessionAsset): Promise<ExchangeOrder> {
    const {
      strategy,
      trades,
    } = sessionAsset;

    const openTrades = sessionAsset.getOpenTrades();
    if (
      strategy.maximumOpenTrades !== -1 &&
      openTrades.length >= strategy.maximumOpenTrades
    ) {
      return null;
    }

    const sessionAssetAssetPairTrades = trades.filter((exchangeTrade) => {
      return (
        AssetPair.toKey(exchangeTrade.assetPair) === AssetPair.toKey(assetPair) &&
        (
          exchangeTrade.status === ExchangeTradeStatusEnum.OPEN ||
          exchangeTrade.status === ExchangeTradeStatusEnum.BUY_PENDING
        )
      );
    });

    if (
      strategy.maximumOpenTradesPerAssetPair !== -1 &&
      sessionAssetAssetPairTrades.length >= strategy.maximumOpenTradesPerAssetPair
    ) {
      return null;
    }

    const assetPrice = this._getAssetPairPrice(assetPair);
    if (strategy.minimumDailyVolume !== -1) {
      const assetPriceStatisticsNewest = assetPrice.getNewestStatistics();
      if (
        !assetPriceStatisticsNewest ||
        parseFloat(assetPriceStatisticsNewest.volume) < strategy.minimumDailyVolume
      ) {
        return null;
      }
    }

    const percentage = this._getLargestTroughPercentage(
      assetPair,
      strategy.buyTroughUptrendThresholdMaximumAgeSeconds * 1000
    );

    if (
      percentage === null || // No trough yet
      percentage === 0 || // That means that we are currently in a trough!
      percentage < strategy.buyTroughUptrendThresholdPercentage
    ) {
      return null;
    }

    // Execute buy!
    const assetPairSymbol = AssetPair.toKey(assetPair);
    const assetPriceNewest = assetPrice.getNewestEntry();

    const now = Date.now();
    const id = 'LAMBOT_' + this.session.id + '_' + assetPairSymbol + '_' + now;
    const order = this._createNewOrder(
      assetPair,
      sessionAsset,
      ExchangeOrderSideEnum.BUY,
      sessionAsset.strategy.tradeAmount,
      id
    );
    const exchangeTrade = new ExchangeTrade(
      id,
      assetPair.assetBase,
      assetPair,
      ExchangeTradeTypeEnum.LONG,
      ExchangeTradeStatusEnum.BUY_PENDING,
      now
    );
    exchangeTrade.buyPrice = parseFloat(assetPriceNewest.price);
    exchangeTrade.buyOrder = order;

    sessionAsset.trades.push(exchangeTrade);

    // TODO: send to exchange

    // Now that we "pseudo" created the trade, change the status to open
    // That will later happen when you actually buy the asset on the exchange.
    exchangeTrade.status = ExchangeTradeStatusEnum.OPEN;

    logger.notice(chalk.green.bold(
      `I am buying "${assetPairSymbol}" at "${exchangeTrade.buyPrice}"!`
    ));

    return order;
  }

  async checkForSellSignal(exchangeTrade: ExchangeTrade, sessionAsset: SessionAsset): Promise<ExchangeOrder> {
    const {
      strategy,
    } = sessionAsset;

    const currentProfitPercentage = this._getExchangeTradeCurrentProfitPercentage(
      exchangeTrade
    );

    return null;

    // Exectute sell!
    const assetPairSymbol = AssetPair.toKey(exchangeTrade.assetPair);
    const assetPrice = this._getAssetPairPrice(exchangeTrade.assetPair);
    const assetPriceNewest = assetPrice.getNewestEntry();

    const order = this._createNewOrder(
      exchangeTrade.assetPair,
      sessionAsset,
      ExchangeOrderSideEnum.SELL,
      sessionAsset.strategy.tradeAmount,
      exchangeTrade.id
    );
    exchangeTrade.sellPrice = parseFloat(assetPriceNewest.price);
    exchangeTrade.sellOrder = order;
    exchangeTrade.status = ExchangeTradeStatusEnum.SELL_PENDING;

    const profitAmount = exchangeTrade.buyPrice - exchangeTrade.sellPrice;
    const profitPercentage = calculatePercentage(
      exchangeTrade.buyPrice,
      exchangeTrade.sellPrice
    );

    // TODO: send to exchange

    // Now that we "pseudo" created the trade, change the status to closed
    // That will later happen when you actually sell the asset on the exchange.
    exchangeTrade.status = ExchangeTradeStatusEnum.CLOSED;

    logger.notice(chalk.green.bold(
      `I am selling "${assetPairSymbol}". I made "${profitAmount.toPrecision(3)}" (${colorTextByValue(profitPercentage)}) profit!`
    ));

    return order;
  }

  /***** Helpers *****/
  async _updateAssetPriceStatistics() {
    const {
      session,
    } = this;
    const assetPairs = session.getAllAssetPairs();

    logger.debug(`Updating asset price statistics ...`);

    const assetStatistics = await session.exchange.getAssetStatistics();
    for (let i = 0; i < assetStatistics.length; i++) {
      const statisticsData = assetStatistics[i];
      if (!assetPairs.has(statisticsData.symbol)) {
        continue;
      }

      const assetPrice = session.exchange.assetPairPrices.get(statisticsData.symbol);
      if (!assetPrice) {
        logger.info(chalk.red.bold(
          `Assset price for symbol "${statisticsData.symbol}" not found.`
        ));

        process.exit(1);
      }

      assetPrice.addStatistics(statisticsData);
    }
  }

  async _updateAssetPrices(now: number) {
    const {
      session,
    } = this;
    const assetPairs = session.getAllAssetPairs();

    logger.debug(`Updating asset prices ...`);

    const assetPrices = await session.exchange.getAssetPrices();
    for (let i = 0; i < assetPrices.length; i++) {
      const priceData = assetPrices[i];
      if (!assetPairs.has(priceData.symbol)) {
        continue;
      }

      const assetPrice = session.exchange.assetPairPrices.get(priceData.symbol);
      if (!assetPrice) {
        logger.info(chalk.red.bold(
          `Assset price for symbol "${priceData.symbol}" not found.`
        ));

        process.exit(1);
      }

      assetPrice.addEntry({
        timestamp: now,
        price: priceData.price,
      });

      assetPrice.processEntries();
    }
  }

  _printAssetPriceUpdates(now: number) {
    if (!this.session.config.showAssetPriceUpdates) {
      return;
    }

    logger.info(chalk.bold('Asset pair price updates:'));
    this.session.exchange.assetPairPrices.forEach((exchangeAssetPrice, key) => {
      const priceText = exchangeAssetPrice.getPriceText();

      logger.info(chalk.bold(key) + ' - ' + priceText);
    });
  }

  _printOpenTradeUpdates(now: number) {
    if (!this.session.config.showOpenTradeUpdates) {
      return;
    }

    let hasAnyOpenTrades = false;
    logger.info(chalk.bold('Open trade updates:'));
    this.session.assets.forEach((sessionAsset) => {
      sessionAsset.getOpenTrades().forEach((exchangeTrade) => {
        const currentProfitPercentage = this._getExchangeTradeCurrentProfitPercentage(
          exchangeTrade
        );
        const timeAgoSeconds = Math.round((now - exchangeTrade.timestamp) / 1000);

        hasAnyOpenTrades = true;

        logger.info(
          chalk.bold(AssetPair.toKey(exchangeTrade.assetPair)) +
          ` (bought ${timeAgoSeconds} seconds ago) -` +
          ` current profit: ${colorTextByValue(currentProfitPercentage)}`
        );
      });
    });

    if (!hasAnyOpenTrades) {
      logger.debug('No open trades found yet.');
    }
  }

  async _processTrades(now: number) {
    const warmupPeriodTime = this.session.config.warmupPeriodSeconds * 1000;
    const warmupPeriodCountdownSeconds = Math.round((now - this.startTime - warmupPeriodTime) * -0.001);
    if (warmupPeriodCountdownSeconds < 0) {
      // Actually start checking if we can do any trades
      await this.processCurrentTrades();
      await this.processPotentialTrades();
    } else {
      logger.debug(`I am still warming up. ${warmupPeriodCountdownSeconds} seconds to go!`);
    }
  }

  _cleanupAssetPrices(now: number, updateIntervalTime: number) {
    // Cleanup entries if processing time takes too long
    const processingTime = Date.now() - now;
    logger.debug(`Processing a tick took ${processingTime}ms.`);

    if (processingTime > updateIntervalTime / 2) {
      this.session.exchange.assetPairPrices.forEach((exchangeAssetPrice) => {
        exchangeAssetPrice.cleanupEntries(0.5);
      });
    }
  }

  _createNewOrder(
    assetPair: AssetPair,
    sessionAsset: SessionAsset,
    orderSide: ExchangeOrderSideEnum,
    amount: string,
    idPrefix: string
  ) {
    return new ExchangeOrder(
      idPrefix + '_' + orderSide,
      assetPair,
      orderSide,
      amount,
      null,
      ExchangeOrderTypeEnum.MARKET,
      this.session.exchange.getAccountType(sessionAsset.tradingType)
    );
  }

  _getLargestTroughPercentage(
    assetPair: AssetPair,
    maximumAge: number
  ): number {
    const assetPrice = this._getAssetPairPrice(assetPair);
    const newestPriceEntry = assetPrice.getNewestEntry();
    const largestTroughPriceEntry = assetPrice.getLargestTroughEntry(
      maximumAge
    );
    if (
      !newestPriceEntry ||
      !largestTroughPriceEntry
    ) {
      return null;
    }

    return calculatePercentage(
      parseFloat(newestPriceEntry.price),
      parseFloat(largestTroughPriceEntry.price)
    );
  }

  _getAssetPairPrice(assetPair: AssetPair): ExchangeAssetPriceInterface {
    return this.session.exchange.assetPairPrices.get(
      AssetPair.toKey(assetPair)
    );
  }

  _getExchangeTradeCurrentProfitPercentage(exchangeTrade: ExchangeTrade) {
    const assetPrice = this._getAssetPairPrice(exchangeTrade.assetPair);
    const assetPriceNewest = assetPrice.getNewestEntry();

    const buyAssetPrice = exchangeTrade.buyPrice;
    const currentAssetPrice = parseFloat(assetPriceNewest.price);
    return calculatePercentage(
      buyAssetPrice,
      currentAssetPrice
    );
  }
}
