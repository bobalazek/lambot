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
  start(): ReturnType<typeof setInterval>;
  stop(): void;
  processCurrentTrades(): Promise<void>;
  processPotentialTrades(): Promise<void>;
  getSortedAssetPairs(sessionAsset: SessionAsset): AssetPair[];
  shouldBuyAssetPair(assetPair: AssetPair, sessionAsset: SessionAsset): boolean;
  shouldSellTrade(exchangeTrade: ExchangeTrade, sessionAsset: SessionAsset): boolean;
  executeBuy(assetPair: AssetPair, sessionAsset: SessionAsset): Promise<ExchangeOrder>;
  executeSell(exchangeTrade: ExchangeTrade, sessionAsset: SessionAsset): Promise<ExchangeOrder>;
}

export enum TraderStatusEnum {
  STOPPED = 'STOPPED',
  RUNNING = 'RUNNING',
}

export class Trader implements TraderInterface {
  session: Session;
  status: TraderStatusEnum;
  interval: ReturnType<typeof setInterval>;
  startTime: number;

  constructor(session: Session) {
    this.session = session;
    this.status = TraderStatusEnum.STOPPED;
    this.startTime = 0;

    this.start();
  }

  start() {
    const {
      session,
    } = this;
    const {
      warmupPeriodSeconds,
      assetPriceUpdateIntervalSeconds,
      showAssetPriceUpdates,
    } = session.config;
    const warmupPeriodTime = warmupPeriodSeconds * 1000;
    const updateIntervalTime = assetPriceUpdateIntervalSeconds * 1000;
    const assetPairs = session.getAssetPairs();

    this.status = TraderStatusEnum.RUNNING;
    this.startTime = Date.now();

    return this.interval = setInterval(async () => {
      // Update the current asset prices
      const assetPrices = await session.exchange.getAssetPrices();
      const now = Date.now();

      for (let i = 0; i < assetPrices.length; i++) {
        const assetData = assetPrices[i];
        if (!assetPairs.has(assetData.symbol)) {
          continue;
        }

        const assetPrice = session.exchange.assetPairPrices.get(assetData.symbol);
        if (!assetPrice) {
          logger.info(chalk.red.bold(
            `Assset price for symbol "${assetData.symbol}" not found.`
          ));

          process.exit(1);
        }

        assetPrice.addEntry({
          timestamp: now,
          price: assetData.price,
        });

        assetPrice.processEntries();
      }

      if (showAssetPriceUpdates) {
        // Return the price data
        logger.info(chalk.bold('Asset pair price updates:'));
        session.exchange.assetPairPrices.forEach((exchangeAssetPrice, key) => {
          const priceText = exchangeAssetPrice.getPriceText();

          logger.info(chalk.bold(key) + ' - ' + priceText);
        });
      }

      const warmupPeriodCountdownSeconds = Math.round((now - this.startTime - warmupPeriodTime) * -0.001);
      if (warmupPeriodCountdownSeconds < 0) {
        // Actually start checking if we can do any trades
        await this.processCurrentTrades();
        await this.processPotentialTrades();
      } else {
        logger.debug(`I am still warming up. ${warmupPeriodCountdownSeconds} seconds to go!`);
      }

      // Cleanup entries if processing time takes too long
      const processingTime = Date.now() - now;
      logger.debug(`Processing a tick took ${processingTime}ms.`);

      if (processingTime > updateIntervalTime / 2) {
        session.exchange.assetPairPrices.forEach((exchangeAssetPrice) => {
          exchangeAssetPrice.cleanupEntries(0.5);
        });
      }
    }, updateIntervalTime);
  }

  stop() {
    this.status = TraderStatusEnum.STOPPED;

    clearInterval(this.interval);
  }

  async processCurrentTrades(): Promise<void> {
    const {
      session,
    } = this;

    logger.debug('Starting to process trades ...');

    session.assets.forEach((sessionAsset) => {
      sessionAsset.getOpenTrades().forEach((trade) => {
        if (!this.shouldSellTrade(trade, sessionAsset)) {
          return;
        }

        this.executeSell(trade, sessionAsset);
      });
    });
  }

  async processPotentialTrades(): Promise<void> {
    logger.debug('Starting to process new potential trades ...');

    this.session.assets.forEach((sessionAsset) => {
      this.getSortedAssetPairs(sessionAsset).forEach((assetPair) => {
        if (!this.shouldBuyAssetPair(assetPair, sessionAsset)) {
          return;
        }

        this.executeBuy(assetPair, sessionAsset);
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

  shouldBuyAssetPair(assetPair: AssetPair, sessionAsset: SessionAsset): boolean {
    const {
      strategy,
    } = sessionAsset;
    const openTrades = sessionAsset.getOpenTrades();

    if (
      strategy.maximumOpenTrades !== -1 &&
      openTrades.length >= strategy.maximumOpenTrades
    ) {
      return false;
    }

    const sessionAssetAssetPairOpenTrades = openTrades.filter((trade) => {
      return AssetPair.toKey(trade.assetPair) === AssetPair.toKey(assetPair);
    });

    if (
      strategy.maximumOpenTradesPerAssetPair !== -1 &&
      sessionAssetAssetPairOpenTrades.length >= strategy.maximumOpenTradesPerAssetPair
    ) {
      return false;
    }

    const percentage = this._getLargestTroughPercentage(
      assetPair,
      strategy.buyTroughUptrendThresholdMaximumAgeSeconds * 1000
    );

    if (
      percentage === null ||
      percentage < strategy.buyTroughUptrendThresholdPercentage
    ) {
      return false;
    }

    return true;
  }

  shouldSellTrade(exchangeTrade: ExchangeTrade, sessionAsset: SessionAsset): boolean {
    const {
      trades,
      strategy,
    } = sessionAsset;

    const assetPrice = this._getAssetPairPrice(exchangeTrade.assetPair);

    // TODO

    return false;
  }

  async executeBuy(assetPair: AssetPair, sessionAsset: SessionAsset): Promise<ExchangeOrder> {
    const assetPairSymbol = AssetPair.toKey(assetPair);
    const assetPrice = this._getAssetPairPrice(assetPair);
    const assetPriveNewest = assetPrice.getNewestEntry();

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
    exchangeTrade.buyPrice = parseFloat(assetPriveNewest.price);
    exchangeTrade.buyOrder = order;

    sessionAsset.trades.push(exchangeTrade);

    // TODO: send to exchange

    logger.notice(chalk.green.bold(
      `I am buying "${assetPairSymbol}" at "${exchangeTrade.buyPrice}"!`
    ));

    return order;
  }

  async executeSell(exchangeTrade: ExchangeTrade, sessionAsset: SessionAsset): Promise<ExchangeOrder> {
    const assetPairSymbol = AssetPair.toKey(exchangeTrade.assetPair);
    const assetPrice = this._getAssetPairPrice(exchangeTrade.assetPair);
    const assetPriveNewest = assetPrice.getNewestEntry();

    const order = this._createNewOrder(
      exchangeTrade.assetPair,
      sessionAsset,
      ExchangeOrderSideEnum.SELL,
      sessionAsset.strategy.tradeAmount,
      exchangeTrade.id
    );
    exchangeTrade.sellPrice = parseFloat(assetPriveNewest.price);
    exchangeTrade.sellOrder = order;
    exchangeTrade.status = ExchangeTradeStatusEnum.SELL_PENDING;

    const profitAmount = exchangeTrade.buyPrice - exchangeTrade.sellPrice;
    const profitPercentage = calculatePercentage(
      exchangeTrade.buyPrice,
      exchangeTrade.sellPrice
    );

    // TODO: send to exchange

    logger.notice(chalk.green.bold(
      `I am selling "${assetPairSymbol}". I made "${profitAmount.toPrecision(3)}" (${colorTextByValue(profitPercentage)}) profit!`
    ));

    return order;
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
}
