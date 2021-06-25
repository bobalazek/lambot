import chalk from 'chalk';

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
  interval: ReturnType<typeof setInterval>;
  startTime: number;

  constructor(session: Session) {
    this.session = session;
    this.status = TraderStatusEnum.STOPPED;
  }

  async start(): Promise<boolean> {
    this.status = TraderStatusEnum.RUNNING;
    this.startTime = Date.now();

    const updateIntervalTime = this.session.strategy.parameters.priceIntervalSeconds * 1000;
    if (updateIntervalTime) {
      this.interval = setInterval(
        this.tick.bind(this, updateIntervalTime),
        updateIntervalTime
      );
    }

    await this.session.strategy.boot(this.session);

    return true;
  }

  stop() {
    this.status = TraderStatusEnum.STOPPED;

    clearInterval(this.interval);
  }

  async tick(updateIntervalTime: number) {
    const now = Date.now();

    await this._updateAssetPairPrices(now);

    this._printAssetPairPriceUpdates(now);

    const processingStartTime = Date.now();

    await this._processTrades(now);

    this._printOpenTradeUpdates(now);

    this._cleanupAssetPairPrices(
      now,
      processingStartTime,
      updateIntervalTime
    );
  }

  async processCurrentTrades(): Promise<void> {
    logger.debug('Starting to process trades ...');

    for (const exchangeTrade of this.session.getOpenTrades()) {
      await this.session.strategy.checkForSellSignal(exchangeTrade);
    }
  }

  async processPotentialTrades(): Promise<void> {
    logger.debug('Starting to process new potential trades ...');

    for (const assetPair of this.session.strategy.getSortedAssetPairs()) {
      await this.session.strategy.checkForBuySignal(assetPair);
    }
  }

  /***** Helpers *****/
  async _updateAssetPairPrices(now: number) {
    const {
      session,
    } = this;
    const assetPairs = session.getAssetPairs();

    logger.debug(`Updating asset prices ...`);

    const assetPairPrices = await session.exchange.getAssetPairPrices();
    for (let i = 0; i < assetPairPrices.length; i++) {
      const priceData = assetPairPrices[i];
      if (!assetPairs.has(priceData.symbol)) {
        continue;
      }

      const assetPairPrice = session.exchange.assetPairPrices.get(priceData.symbol);
      if (!assetPairPrice) {
        logger.info(chalk.red.bold(
          `Asset price for symbol "${priceData.symbol}" not found.`
        ));

        process.exit(1);
      }

      assetPairPrice.addPriceEntry({
        timestamp: priceData.timestamp,
        price: priceData.price,
      });

      assetPairPrice.processPriceEntries();
    }
  }

  _printAssetPairPriceUpdates(now: number) {
    if (!this.session.config.showAssetPairPriceUpdates) {
      return;
    }

    logger.info(chalk.bold('Asset pair price updates:'));
    this.session.exchange.assetPairPrices.forEach((exchangeAssetPairPrice, key) => {
      const priceText = exchangeAssetPairPrice.getPriceText();

      logger.info(chalk.bold(key) + ' - ' + priceText);
    });
  }

  _printOpenTradeUpdates(now: number) {
    if (!this.session.config.showOpenTradeUpdates) {
      return;
    }

    let hasAnyOpenTrades = false;
    logger.info(chalk.bold('Open trade updates:'));
    this.session.getOpenTrades().forEach((exchangeTrade) => {
      const assetPairPrice = this.session.exchange.assetPairPrices.get(
        exchangeTrade.assetPair.getKey()
      );
      const assetPairPriceEntryNewest = assetPairPrice.getNewestPriceEntry();
      const currentAssetPairPrice = parseFloat(assetPairPriceEntryNewest.price);
      const profitPercentage = exchangeTrade.getCurrentProfitPercentage(currentAssetPairPrice);
      const timeAgoSeconds = Math.round((now - exchangeTrade.timestamp) / 1000);

      hasAnyOpenTrades = true;

      logger.info(
        chalk.bold(exchangeTrade.assetPair.getKey()) +
        ` @ ${currentAssetPairPrice}` +
        ` (bought @ ${exchangeTrade.buyPrice}; ${timeAgoSeconds} seconds ago)` +
        ` current profit: ${colorTextPercentageByValue(profitPercentage)} (excluding fees)`
      );
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

  _cleanupAssetPairPrices(
    tickStartTime: number,
    processingStartTime: number,
    updateIntervalTime: number
  ) {
    // Cleanup entries if processing time takes too long
    const processingTime = Date.now() - processingStartTime;
    logger.debug(`Processing a tick took ${processingTime}ms.`);

    if (processingTime > updateIntervalTime / 2) {
      this.session.exchange.assetPairPrices.forEach((exchangeAssetPairPrice) => {
        exchangeAssetPairPrice.cleanupPriceEntries(0.5);
      });
    }
  }
}
