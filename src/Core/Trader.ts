import chalk from 'chalk';

import { AssetPair } from './Asset/AssetPair';
import { ExchangeAccountTypeEnum } from './Exchange/ExchangeAccount';
import { ExchangeOrder, ExchangeOrderSideEnum, ExchangeOrderTypeEnum } from './Exchange/ExchangeOrder';
import { ExchangeTrade, ExchangeTradeStatusEnum, ExchangeTradeTypeEnum } from './Exchange/ExchangeTrade';
import { ExchangeOrderFeesTypeEnum } from './Exchange/ExchangeOrderFees';
import { Session } from './Session/Session';
import { SessionManager } from './Session/SessionManager';
import { Manager } from './Manager';
import { ID_PREFIX } from '../Constants';
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
  executeBuy(assetPair: AssetPair, price: string, tradeType: ExchangeTradeTypeEnum): Promise<ExchangeTrade>;
  executeSell(exchangeTrade: ExchangeTrade, price: string): Promise<ExchangeTrade>;
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
  _openTradesInterval: ReturnType<typeof setInterval>;
  _assetPairPriceInterval: ReturnType<typeof setInterval>;

  constructor(session: Session) {
    this.session = session;
    this.status = TraderStatusEnum.STOPPED;
  }

  async start(): Promise<boolean> {
    this.status = TraderStatusEnum.RUNNING;
    this.startTime = Date.now();

    await this.session.strategy.boot(this.session);

    // Intervals
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

    const openTradesIntervalTime = this.session.config.openTradeUpdateIntervalSeconds * 1000;
    if (openTradesIntervalTime) {
      this._openTradesInterval = setInterval(
        this._printOpenTradeUpdates.bind(this),
        openTradesIntervalTime
      );
    }

    const assetPairPriceIntervalTime = this.session.config.assetPairPriceUpdateIntervalSeconds * 1000;
    if (assetPairPriceIntervalTime) {
      this._assetPairPriceInterval = setInterval(
        this._printAssetPairPriceUpdates.bind(this),
        openTradesIntervalTime
      );
    }

    return true;
  }

  async stop(): Promise<boolean> {
    this.status = TraderStatusEnum.STOPPED;

    clearInterval(this._priceTickInterval);
    clearInterval(this._candlestickTickInterval);
    clearInterval(this._openTradesInterval);
    clearInterval(this._assetPairPriceInterval);

    return true;
  }

  async priceTick() {
    logger.debug(`Price tick ...`);

    await this._updateAssetPairPrices();

    const processingStartTime = Date.now();

    await this._processTrades();

    this._cleanupAssetPairPrices(
      processingStartTime,
      (this.session.strategy.parameters.priceIntervalSeconds * 1000) / 2
    );
  }

  async candlestickTick() {
    logger.debug(`Candlestick tick ...`);

    await this._updateAssetPairCandlesticks();
  }

  async executeBuy(
    assetPair: AssetPair,
    price: string,
    tradeType: ExchangeTradeTypeEnum
  ): Promise<ExchangeTrade> {
    const now = Date.now();
    const assetPairSymbol = assetPair.getKey();
    const accountType = tradeType === ExchangeTradeTypeEnum.SHORT
      ? ExchangeAccountTypeEnum.MARGIN
      : ExchangeAccountTypeEnum.SPOT;
    const id = ID_PREFIX + this.session.id + '_' + assetPairSymbol + '_' + now;
    const order = new ExchangeOrder(
      id + '_' + ExchangeOrderSideEnum.BUY,
      assetPair,
      ExchangeOrderSideEnum.BUY,
      this.session.strategy.parameters.tradeAmount,
      price,
      ExchangeOrderTypeEnum.MARKET,
      accountType
    );
    const orderFees = await this.session.exchange.getAssetFees(
      assetPair,
      this.session.strategy.parameters.tradeAmount,
      this.session.orderType === ExchangeOrderTypeEnum.LIMIT
        ? ExchangeOrderFeesTypeEnum.MAKER
        : ExchangeOrderFeesTypeEnum.TAKER,
      tradeType
    );

    const buyOrder: ExchangeOrder = !Manager.isTestMode
      ? await this.session.exchange.addAccountOrder(accountType, order)
      : order;
    const exchangeTrade = new ExchangeTrade(
      id,
      assetPair.assetBase,
      assetPair,
      tradeType,
      ExchangeTradeStatusEnum.OPEN,
      now
    );
    exchangeTrade.buyFeesPercentage = orderFees.amountPercentage;
    exchangeTrade.buyOrder = buyOrder;
    exchangeTrade.buyPrice = parseFloat(buyOrder.price);
    exchangeTrade.amount = buyOrder.amount;

    this.session.trades.push(exchangeTrade);

    SessionManager.save(this.session);

    logger.notice(chalk.green.bold(
      `I am bought "${assetPair.getKey()}" @ ${exchangeTrade.buyPrice}!`
    ));

    return exchangeTrade;
  }

  async executeSell(exchangeTrade: ExchangeTrade, price: string): Promise<ExchangeTrade> {
    const accountType = exchangeTrade.type === ExchangeTradeTypeEnum.SHORT
      ? ExchangeAccountTypeEnum.MARGIN
      : ExchangeAccountTypeEnum.SPOT;
    const order = new ExchangeOrder(
      exchangeTrade.id + '_' + ExchangeOrderSideEnum.SELL,
      exchangeTrade.assetPair,
      ExchangeOrderSideEnum.SELL,
      exchangeTrade.amount,
      price,
      ExchangeOrderTypeEnum.MARKET,
      accountType
    );
    const orderFees = await this.session.exchange.getAssetFees(
      exchangeTrade.assetPair,
      this.session.strategy.parameters.tradeAmount,
      this.session.orderType === ExchangeOrderTypeEnum.LIMIT
        ? ExchangeOrderFeesTypeEnum.MAKER
        : ExchangeOrderFeesTypeEnum.TAKER,
      exchangeTrade.type
    );

    const sellOrder: ExchangeOrder = !Manager.isTestMode
      ? await this.session.exchange.addAccountOrder(accountType, order)
      : order;
    exchangeTrade.sellFeesPercentage = orderFees.amountPercentage;
    exchangeTrade.sellOrder = sellOrder;
    exchangeTrade.sellPrice = parseFloat(sellOrder.price);
    exchangeTrade.status = ExchangeTradeStatusEnum.CLOSED;

    SessionManager.save(this.session);

    logger.notice(chalk.green.bold(
      `I am selling "${exchangeTrade.assetPair.getKey()}". ` +
      `It made (${colorTextPercentageByValue(exchangeTrade.getProfitPercentage())}) profit (excluding fees)!`
    ));

    return exchangeTrade;
  }

  /***** Helpers *****/
  async _updateAssetPairPrices() {
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

  async _updateAssetPairCandlesticks() {
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

      // TODO: process that asset pair
    }
  }

  _printAssetPairPriceUpdates(now: number) {
    logger.info(chalk.bold('Asset pair price updates:'));
    this.session.exchange.assetPairs.forEach((exchangeAssetPairPrice, key) => {
      logger.info(
        chalk.bold(key) +
        ' - ' +
        exchangeAssetPairPrice.getPriceText()
      );
    });
  }

  async _processTrades() {
    const now = Date.now();
    const warmupPeriodTime = this.session.config.warmupPeriodSeconds * 1000;
    const warmupPeriodCountdownSeconds = Math.round((now - this.startTime - warmupPeriodTime) * -0.001);

    logger.debug(`Processing trades ...`);

    if (warmupPeriodCountdownSeconds > 0) {
      logger.debug(`I am still warming up. ${warmupPeriodCountdownSeconds} seconds to go!`);

      return false;
    }

    /*
    // TODO: implement
    for (const assetPair of this.session.strategy.getSortedAssetPairs()) {
      await this.session.strategy.checkForBuyAndSellSignals(assetPair);
    }
    */

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

  _printOpenTradeUpdates() {
    const now = Date.now();
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
    processingStartTime: number,
    processingLimitTime: number
  ) {
    const processingTime = Date.now() - processingStartTime;

    logger.debug(`Processing a tick took ${processingTime}ms.`);

    if (processingTime < processingLimitTime) {
      return;
    }

    this.session.exchange.assetPairs.forEach((exchangeAssetPair) => {
      exchangeAssetPair.cleanupPriceEntries(0.5);
    });
  }
}
