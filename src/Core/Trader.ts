import chalk from 'chalk';

import { Session } from './Session/Session';
import { colorTextPercentageByValue } from '../Utils/Helpers';
import logger from '../Utils/Logger';

export interface TraderInterface {
  session: Session;
  status: TraderStatusEnum;
  startTime: number;
  start(): Promise<boolean>;
  stop(): Promise<boolean>;
  priceTick(): void;
  candlestickTick(): void;
}

export enum TraderStatusEnum {
  STOPPED = 'STOPPED',
  RUNNING = 'RUNNING',
}

export class Trader implements TraderInterface {
  session: Session;
  status: TraderStatusEnum;
  startTime: number;

  _priceTickInterval: ReturnType<typeof setInterval>;
  _candlestickTickInterval: ReturnType<typeof setInterval>;

  constructor(session: Session) {
    this.session = session;
    this.status = TraderStatusEnum.STOPPED;
  }

  async start(): Promise<boolean> {
    this.status = TraderStatusEnum.RUNNING;
    this.startTime = Date.now();

    await this.session.strategy.boot(this.session);

    const priceIntervalTime = this.session.strategy.parameters.priceIntervalSeconds * 1000;
    if (priceIntervalTime) {
      this._priceTickInterval = setInterval(
        this.priceTick.bind(this),
        priceIntervalTime
      );
    }

    const candlestickIntervalTime = this.session.strategy.parameters.candlestickIntervalSeconds * 1000;
    if (candlestickIntervalTime) {
      this._candlestickTickInterval = setInterval(
        this.candlestickTick.bind(this),
        candlestickIntervalTime
      );
    }

    return true;
  }

  async stop(): Promise<boolean> {
    this.status = TraderStatusEnum.STOPPED;

    clearInterval(this._priceTickInterval);
    clearInterval(this._candlestickTickInterval);

    return true;
  }

  async priceTick() {
    const now = Date.now();
    const priceIntervalTime = this.session.strategy.parameters.priceIntervalSeconds * 1000;

    await this._updateAssetPairPrices(now);

    this._printAssetPairPriceUpdates(now);

    const processingStartTime = Date.now();

    await this._processTrades(now);

    this._printOpenTradeUpdates(now);

    this._cleanupAssetPairPrices(
      now,
      processingStartTime,
      priceIntervalTime / 2
    );
  }

  async candlestickTick() {
    const now = Date.now();

    await this._updateAssetPairCandlesticks(now);

    // TODO
  }

  /***** Helpers *****/
  async _updateAssetPairPrices(now: number) {
    const assetPairs = this.session.getAssetPairs();

    logger.debug(`Updating asset prices ...`);

    const assetPairPrices = await this.session.exchange.getAssetPairPrices();
    for (let i = 0; i < assetPairPrices.length; i++) {
      const priceData = assetPairPrices[i];
      if (!assetPairs.has(priceData.symbol)) {
        continue;
      }

      const assetPairPrice = this.session.exchange.assetPairs.get(priceData.symbol);
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

  async _updateAssetPairCandlesticks(now: number) {
    logger.debug(`Updating asset candlesticks ...`);

    for (const assetPair of this.session.assetPairs) {
      const assetPairCandlesticksData = await this.session.exchange.getAssetPairCandlesticks(
        assetPair,
        this.session.strategy.parameters.candlestickIntervalSeconds
      );

      const exchangeAssetPair = this.session.exchange.assetPairs.get(
        assetPair.getKey()
      );

      exchangeAssetPair.setCandlesticks(assetPairCandlesticksData);
    }
  }

  _printAssetPairPriceUpdates(now: number) {
    if (!this.session.config.showAssetPairPriceUpdates) {
      return;
    }

    logger.info(chalk.bold('Asset pair price updates:'));
    this.session.exchange.assetPairs.forEach((exchangeAssetPairPrice, key) => {
      const priceText = exchangeAssetPairPrice.getPriceText();

      logger.info(chalk.bold(key) + ' - ' + priceText);
    });
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

  _printOpenTradeUpdates(now: number) {
    if (!this.session.config.showOpenTradeUpdates) {
      return;
    }

    const openTrades = this.session.getOpenTrades();

    logger.info(chalk.bold('Open trade updates:'));
    openTrades.forEach((exchangeTrade) => {
      const assetPairPrice = this.session.exchange.assetPairs.get(
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

    this.session.exchange.assetPairs.forEach((exchangeAssetPair) => {
      exchangeAssetPair.cleanupPriceEntries(0.5);
    });
  }
}
