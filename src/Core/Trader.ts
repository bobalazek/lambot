import chalk from 'chalk';

import { Session } from './Session/Session';
import { colorTextPercentageByValue } from '../Utils/Helpers';
import logger from '../Utils/Logger';

export interface TraderInterface {
  session: Session;
  status: TraderStatusEnum;
  interval: ReturnType<typeof setInterval>;
  startTime: number;
  start(): Promise<boolean>;
  stop(): Promise<boolean>;
  tick(): void;
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

    await this.session.strategy.boot(this.session);
    await this._startTickInterval();

    return true;
  }

  async stop(): Promise<boolean> {
    this.status = TraderStatusEnum.STOPPED;

    clearInterval(this.interval);

    return true;
  }

  async tick() {
    const now = Date.now();
    const updateIntervalTime = this.session.strategy.parameters.priceIntervalSeconds * 1000;

    await this._updateAssetPairPrices(now);

    this._printAssetPairPriceUpdates(now);

    const processingStartTime = Date.now();

    await this._processTrades(now);

    this._printOpenTradeUpdates(now);

    this._cleanupAssetPairPrices(
      now,
      processingStartTime,
      updateIntervalTime / 2
    );
  }

  /***** Helpers *****/
  async _startTickInterval() {
    const updateIntervalTime = this.session.strategy.parameters.priceIntervalSeconds * 1000;
    if (!updateIntervalTime) {
      return;
    }

    this.interval = setInterval(
      this.tick.bind(this),
      updateIntervalTime
    );
  }

  async _updateAssetPairPrices(now: number) {
    const assetPairs = this.session.getAssetPairs();

    logger.debug(`Updating asset prices ...`);

    const assetPairPrices = await this.session.exchange.getAssetPairPrices();
    for (let i = 0; i < assetPairPrices.length; i++) {
      const priceData = assetPairPrices[i];
      if (!assetPairs.has(priceData.symbol)) {
        continue;
      }

      const assetPairPrice = this.session.exchange.assetPairPrices.get(priceData.symbol);
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

    const openTrades = this.session.getOpenTrades();

    logger.info(chalk.bold('Open trade updates:'));
    openTrades.forEach((exchangeTrade) => {
      const assetPairPrice = this.session.exchange.assetPairPrices.get(
        exchangeTrade.assetPair.getKey()
      );
      const assetPairPriceEntryNewest = assetPairPrice.getNewestPriceEntry();
      const currentAssetPairPrice = parseFloat(assetPairPriceEntryNewest.price);
      const profitPercentage = exchangeTrade.getCurrentProfitPercentage(currentAssetPairPrice);
      const timeAgoSeconds = Math.round((now - exchangeTrade.timestamp) / 1000);

      logger.info(
        chalk.bold(exchangeTrade.assetPair.getKey()) +
        ` @ ${currentAssetPairPrice}` +
        ` (bought @ ${exchangeTrade.buyPrice}; ${timeAgoSeconds} seconds ago)` +
        ` current profit: ${colorTextPercentageByValue(profitPercentage)} (excluding fees)`
      );
    });

    if (openTrades.length === 0) {
      logger.debug('No open trades found yet.');
    }
  }

  async _processTrades(now: number) {
    const warmupPeriodTime = this.session.config.warmupPeriodSeconds * 1000;
    const warmupPeriodCountdownSeconds = Math.round((now - this.startTime - warmupPeriodTime) * -0.001);

    logger.debug(`Processing trades ...`);

    if (warmupPeriodCountdownSeconds > 0) {
      logger.debug(`I am still warming up. ${warmupPeriodCountdownSeconds} seconds to go!`);

      return false;
    }

    logger.debug(`Checking for sell signals ...`);
    for (const exchangeTrade of this.session.getOpenTrades()) {
      await this.session.strategy.checkForSellSignal(exchangeTrade);
    }

    logger.debug(`Checking for buy signals ...`);
    for (const assetPair of this.session.strategy.getSortedAssetPairs()) {
      await this.session.strategy.checkForBuySignal(assetPair);
    }

    return true;
  }

  _cleanupAssetPairPrices(
    tickStartTime: number,
    processingStartTime: number,
    processingTimeLimit: number
  ) {
    const processingTime = Date.now() - processingStartTime;

    logger.debug(`Processing a tick took ${processingTime}ms.`);

    if (processingTime < processingTimeLimit) {
      return;
    }

    this.session.exchange.assetPairPrices.forEach((exchangeAssetPairPrice) => {
      exchangeAssetPairPrice.cleanupPriceEntries(0.5);
    });
  }
}
