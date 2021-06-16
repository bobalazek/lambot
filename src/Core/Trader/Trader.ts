import chalk from 'chalk';

import { AssetPair } from '../Asset/AssetPair';
import { ExchangeOrder, ExchangeOrderSideEnum, ExchangeOrderTypeEnum } from '../Exchange/ExchangeOrder';
import { Session } from '../Session/Session';
import { SessionAsset } from '../Session/SessionAsset';
import { calculatePercentage } from '../../Utils/Helpers';
import logger from '../../Utils/Logger';

export interface TraderInterface {
  session: Session;
  status: TraderStatusEnum;
  startTime: number;
  start(): ReturnType<typeof setInterval>;
  stop(): void;
  processCurrentTrades(): Promise<void>;
  processPotentialTrades(): Promise<void>;
  shouldBuy(assetPair: AssetPair, sessionAsset: SessionAsset): boolean;
  shouldSell(assetPair: AssetPair, sessionAsset: SessionAsset): boolean;
  executeBuy(assetPair: AssetPair, sessionAsset: SessionAsset): Promise<ExchangeOrder>;
  executeSell(assetPair: AssetPair, sessionAsset: SessionAsset): Promise<ExchangeOrder>;
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

      // Return the price data
      logger.info(chalk.bold('Asset pair price updates:'));
      session.exchange.assetPairPrices.forEach((exchangeAssetPrice, key) => {
        const priceText = exchangeAssetPrice.getPriceText(now);

        logger.info(chalk.bold(key) + ' - ' + priceText);
      });

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
      sessionAsset.assetPairs.forEach((assetPair) => {
        if (!this.shouldSell(assetPair, sessionAsset)) {
          return;
        }

        this.executeSell(assetPair, sessionAsset);
      });
    });
  }

  async processPotentialTrades(): Promise<void> {
    logger.debug('Starting to process new potential trades ...');

    this.session.assets.forEach((sessionAsset) => {
      const {
        assetPairs,
      } = sessionAsset;

      const assetPairsSorted = [...assetPairs];
      // TODO: order them (assetPairs) by the biggest relative profit percentage or something?
      // So we can prioritize the assets we may buy sooner.

      assetPairsSorted.forEach((assetPair) => {
        if (!this.shouldBuy(assetPair, sessionAsset)) {
          return;
        }

        this.executeBuy(assetPair, sessionAsset);
      });
    });
  }

  shouldBuy(assetPair: AssetPair, sessionAsset: SessionAsset): boolean {
    const {
      trades,
      strategy,
    } = sessionAsset;

    if (trades.length >= strategy.maximumOpenTrades) {
      return false;
    }

    const assetPrice = this.session.exchange.assetPairPrices.get(
      AssetPair.toKey(assetPair)
    );

    const newestPriceEntry = assetPrice.getNewestEntry();
    const largestTroughPriceEntry = assetPrice.getLargestTroughEntry();
    if (
      !newestPriceEntry ||
      !largestTroughPriceEntry
    ) {
      return null;
    }

    const percentage = calculatePercentage(
      parseFloat(newestPriceEntry.price),
      parseFloat(largestTroughPriceEntry.price)
    );

    if (percentage < strategy.buyTroughUptrendThresholdPercentage) {
      return false;
    }

    const now = Date.now();
    const largestTroughAgeSeconds = Math.round((now - largestTroughPriceEntry.timestamp) / 1000);
    if (largestTroughAgeSeconds > strategy.buyTroughUptrendThresholdMaximumAgeSeconds) {
      return false;
    }

    return true;
  }

  shouldSell(assetPair: AssetPair, sessionAsset: SessionAsset): boolean {
    const assetPrice = this.session.exchange.assetPairPrices.get(
      AssetPair.toKey(assetPair)
    );

    // TODO

    return false;
  }

  async executeBuy(assetPair: AssetPair, sessionAsset: SessionAsset): Promise<ExchangeOrder> {
    const order = this._createNewOrder(
      assetPair,
      sessionAsset,
      ExchangeOrderSideEnum.BUY,
      sessionAsset.strategy.tradeAmount
    );

    logger.notice(chalk.green.bold(
      `I am buying "${assetPair.toString()}"!`
    ));

    // TODO: send to exchange, but that should happen in a separate loop
    // Maybe add nanoevents and trigger it there?

    return order;
  }

  async executeSell(assetPair: AssetPair, sessionAsset: SessionAsset): Promise<ExchangeOrder> {
    const order = this._createNewOrder(
      assetPair,
      sessionAsset,
      ExchangeOrderSideEnum.SELL,
      sessionAsset.strategy.tradeAmount
    );

    logger.notice(chalk.green.bold(
      `I am selling "${assetPair.toString()}"!`
    ));

    // TODO: send to exchange

    return order;
  }

  _createNewOrder(
    assetPair: AssetPair,
    sessionAsset: SessionAsset,
    orderSide: ExchangeOrderSideEnum,
    amount: string
  ) {
    const {
      session,
    } = this;

    const now = Date.now();
    const assetPairSymbol = AssetPair.toKey(assetPair);
    const id = this.session.id + '_' + assetPairSymbol + '_' + orderSide + '_' + now;
    const accountType = session.exchange.getAccountType(sessionAsset.tradingType);

    return new ExchangeOrder(
      id,
      assetPair,
      orderSide,
      amount,
      null,
      ExchangeOrderTypeEnum.MARKET,
      accountType
    );
  }
}
