import chalk from 'chalk';

import { AssetPair } from './Asset/AssetPair';
import { Session } from './Session/Session';
import { colorTextPercentageByValue } from '../Utils/Helpers';
import logger from '../Utils/Logger';

export interface TraderInterface {
  session: Session;
  status: TraderStatusEnum;
  startTime: number;
  start(): void;
  stop(): void;
  tick(updateIntervalTime: number): void;
  tickStatistics(): void;
  processCurrentTrades(): Promise<void>;
  processPotentialTrades(): Promise<void>;
}

export enum TraderStatusEnum {
  STOPPED = 'STOPPED',
  RUNNING = 'RUNNING',
}

export class Trader implements TraderInterface {
  session: Session;
  status: TraderStatusEnum;
  intervalStatistics: ReturnType<typeof setInterval>;
  interval: ReturnType<typeof setInterval>;
  startTime: number;

  constructor(session: Session) {
    this.session = session;
    this.status = TraderStatusEnum.STOPPED;
  }

  async start(): Promise<boolean> {
    this.status = TraderStatusEnum.RUNNING;
    this.startTime = Date.now();

    // Price statistics update (needed for initial sort in the tick)
    await this.tickStatistics();

    const updateStatisticsIntervalTime = this.session.config.assetPriceStatisticsUpdateIntervalSeconds * 1000;
    if (updateStatisticsIntervalTime) {
      this.intervalStatistics = setInterval(
        this.tickStatistics.bind(this),
        updateStatisticsIntervalTime
      );
    }

    // Price update
    const updateIntervalTime = this.session.config.assetPriceUpdateIntervalSeconds * 1000;
    if (updateIntervalTime) {
      this.interval = setInterval(
        this.tick.bind(this, updateIntervalTime),
        updateIntervalTime
      );
    }

    this.session.assets.forEach(async (sessionAsset) => {
      await sessionAsset.strategy.boot(this.session);
    });

    return true;
  }

  stop() {
    this.status = TraderStatusEnum.STOPPED;

    clearInterval(this.intervalStatistics);
    clearInterval(this.interval);
  }

  async tick(updateIntervalTime: number) {
    const now = Date.now();

    await this._updateAssetPrices(now);

    this._printAssetPriceUpdates(now);

    const processingStartTime = Date.now();

    await this._processTrades(now);

    this._printOpenTradeUpdates(now);

    this._cleanupAssetPrices(processingStartTime, updateIntervalTime);
  }

  async tickStatistics() {
    await this._updateAssetPriceStatistics();
  }

  async processCurrentTrades(): Promise<void> {
    logger.debug('Starting to process trades ...');

    this.session.assets.forEach(async (sessionAsset) => {
      for (const exchangeTrade of sessionAsset.getOpenTrades()) {
        await sessionAsset.strategy.checkForSellSignal(exchangeTrade, sessionAsset);
      }
    });
  }

  async processPotentialTrades(): Promise<void> {
    logger.debug('Starting to process new potential trades ...');

    this.session.assets.forEach(async (sessionAsset) => {
      for (const assetPair of sessionAsset.strategy.getSortedAssetPairs(sessionAsset)) {
        await sessionAsset.strategy.checkForBuySignal(assetPair, sessionAsset);
      }
    });
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
          `Asset price for symbol "${statisticsData.symbol}" not found.`
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
          `Asset price for symbol "${priceData.symbol}" not found.`
        ));

        process.exit(1);
      }

      assetPrice.addEntry({
        timestamp: priceData.timestamp,
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
        const assetPrice = this.session.exchange.assetPairPrices.get(
          AssetPair.toKey(exchangeTrade.assetPair)
        );
        const assetPriceEntryNewest = assetPrice.getNewestEntry();
        const currentAssetPrice = parseFloat(assetPriceEntryNewest.price);
        const profitPercentage = exchangeTrade.getCurrentProfitPercentage(currentAssetPrice);
        const timeAgoSeconds = Math.round((now - exchangeTrade.timestamp) / 1000);

        hasAnyOpenTrades = true;

        logger.info(
          chalk.bold(AssetPair.toKey(exchangeTrade.assetPair)) +
          ` @ ${currentAssetPrice}` +
          ` (bought @ ${exchangeTrade.buyPrice}; ${timeAgoSeconds} seconds ago)` +
          ` current profit: ${colorTextPercentageByValue(profitPercentage)} (excluding fees)`
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

  _cleanupAssetPrices(processingStartTime: number, updateIntervalTime: number) {
    // Cleanup entries if processing time takes too long
    const processingTime = Date.now() - processingStartTime;
    logger.debug(`Processing a tick took ${processingTime}ms.`);

    if (processingTime > updateIntervalTime / 2) {
      this.session.exchange.assetPairPrices.forEach((exchangeAssetPrice) => {
        exchangeAssetPrice.cleanupEntries(0.5);
      });
    }
  }
}
