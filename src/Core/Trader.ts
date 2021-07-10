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
  ticker24hTick(): void;
  priceTick(): void;
  candlestickTick(): void;
  executeBuy(assetPair: AssetPair, tradeType: ExchangeTradeTypeEnum): Promise<ExchangeTrade>;
  executeSell(exchangeTrade: ExchangeTrade): Promise<ExchangeTrade>;
}

export enum TraderStatusEnum {
  STOPPED = 'STOPPED',
  RUNNING = 'RUNNING',
}

export class Trader implements TraderInterface {
  session: Session;
  status: TraderStatusEnum;
  startTime: number;

  _ticker24TickInterval: ReturnType<typeof setInterval>;
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
    const ticker24hIntervalTime = 3600 * 1000; // TODO: make configurable?
    if (ticker24hIntervalTime) {
      await this.ticker24hTick();
      this._ticker24TickInterval = setInterval(
        this.ticker24hTick.bind(this),
        ticker24hIntervalTime
      );
    }

    const priceIntervalTime = this.session.config.assetPairPriceUpdateIntervalSeconds * 1000;
    if (priceIntervalTime) {
      await this.priceTick();
      this._priceTickInterval = setInterval(
        this.priceTick.bind(this),
        priceIntervalTime
      );
    }

    const candlestickIntervalTime = this.session.config.assetPairCandlestickUpdateIntervalSeconds * 1000;
    if (candlestickIntervalTime) {
      await this.candlestickTick();
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

    clearInterval(this._ticker24TickInterval);
    clearInterval(this._priceTickInterval);
    clearInterval(this._candlestickTickInterval);
    clearInterval(this._openTradesInterval);
    clearInterval(this._assetPairPriceInterval);

    return true;
  }

  async priceTick() {
    logger.debug(`Price tick ...`);

    const assetPairs = this.session.getAssetPairs();
    const assetPairPrices = await this.session.exchange.getAssetPairPrices();
    for (let i = 0; i < assetPairPrices.length; i++) {
      const priceData = assetPairPrices[i];
      const assetPairKey = priceData.assetPair.getKey();
      if (!assetPairs.has(assetPairKey)) {
        continue;
      }

      const assetPair = this.session.exchange.assetPairs.get(assetPairKey);
      if (!assetPair) {
        logger.info(chalk.red.bold(
          `Asset pair for symbol "${assetPairKey}" not found.`
        ));
        process.exit(1);
      }

      assetPair.addPriceEntry({
        timestamp: priceData.timestamp,
        price: priceData.price,
      });

      assetPair.processPriceEntries();
    }

    await this._processTrades();
  }

  async candlestickTick() {
    logger.debug(`Candlestick tick ...`);

    for (const assetPair of this.session.assetPairs) {
      const assetPairCandlesticksData = await this.session.exchange.getAssetPairCandlesticks(
        assetPair,
        this.session.config.assetPairCandlestickUpdateIntervalSeconds
      );

      const exchangeAssetPair = this.session.exchange.assetPairs.get(
        assetPair.getKey()
      );

      exchangeAssetPair.setCandlesticks(assetPairCandlesticksData);

      await this._processTrades(assetPair);
    }
  }

  async ticker24hTick() {
    logger.debug(`Ticker (24h) tick ...`);

    const assetPairs = this.session.getAssetPairs();
    const assetPairTickers = await this.session.exchange.getAssetPairTickers();
    for (let i = 0; i < assetPairTickers.length; i++) {
      const tickerData = assetPairTickers[i];
      const assetPairKey = tickerData.assetPair.getKey();
      if (!assetPairs.has(assetPairKey)) {
        continue;
      }

      const assetPair = this.session.exchange.assetPairs.get(assetPairKey);
      if (!assetPair) {
        logger.info(chalk.red.bold(
          `Asset pair for symbol "${assetPairKey}" not found.`
        ));
        process.exit(1);
      }

      assetPair.ticker24h = tickerData;
    }
  }

  async executeBuy(
    assetPair: AssetPair,
    tradeType: ExchangeTradeTypeEnum
  ): Promise<ExchangeTrade> {
    const now = Date.now();
    const assetPairSymbol = assetPair.getKey();
    const accountType = tradeType === ExchangeTradeTypeEnum.SHORT
      ? ExchangeAccountTypeEnum.MARGIN
      : ExchangeAccountTypeEnum.SPOT;
    const assetPairPrice = this.session.exchange.assetPairs.get(assetPairSymbol);
    const assetPairPriceEntryNewest = assetPairPrice.getNewestPriceEntry();
    if (!assetPairPriceEntryNewest) {
      logger.notice(chalk.green.bold(
        `Could not buy "${assetPairSymbol}" because no price was set.`
      ));

      return null;
    }

    const id = ID_PREFIX + this.session.id + '_' + assetPairSymbol + '_' + now;
    const orderFeesType = this.session.orderTypes.buy === ExchangeOrderTypeEnum.LIMIT
      ? ExchangeOrderFeesTypeEnum.MAKER
      : ExchangeOrderFeesTypeEnum.TAKER;
    const order = new ExchangeOrder(
      id + '_' + ExchangeOrderSideEnum.BUY,
      assetPair,
      ExchangeOrderSideEnum.BUY,
      this.session.strategy.parameters.tradeAmount,
      assetPairPriceEntryNewest.price,
      this.session.orderTypes.buy,
      accountType
    );
    const orderFees = await this.session.exchange.getAssetFees(
      assetPair,
      this.session.strategy.parameters.tradeAmount,
      orderFeesType,
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
      buyOrder.amount,
      now
    );
    exchangeTrade.buyFeesPercentage = orderFees.amountPercentage;
    exchangeTrade.buyOrder = buyOrder;
    exchangeTrade.buyPrice = parseFloat(buyOrder.price);

    this.session.trades.push(exchangeTrade);

    SessionManager.save(this.session);

    logger.notice(chalk.green.bold(
      `I bought "${assetPair.getKey()}" @ ${exchangeTrade.buyPrice}!`
    ));

    return exchangeTrade;
  }

  async executeSell(exchangeTrade: ExchangeTrade): Promise<ExchangeTrade> {
    const assetPairPrice = this.session.exchange.assetPairs.get(
      exchangeTrade.assetPair.getKey()
    );
    const assetPairPriceEntryNewest = assetPairPrice.getNewestPriceEntry();
    const accountType = exchangeTrade.type === ExchangeTradeTypeEnum.SHORT
      ? ExchangeAccountTypeEnum.MARGIN
      : ExchangeAccountTypeEnum.SPOT;
    const orderFeesType = this.session.orderTypes.sell === ExchangeOrderTypeEnum.LIMIT
      ? ExchangeOrderFeesTypeEnum.MAKER
      : ExchangeOrderFeesTypeEnum.TAKER;
    const order = new ExchangeOrder(
      exchangeTrade.id + '_' + ExchangeOrderSideEnum.SELL,
      exchangeTrade.assetPair,
      ExchangeOrderSideEnum.SELL,
      exchangeTrade.amount,
      assetPairPriceEntryNewest.price,
      this.session.orderTypes.sell,
      accountType
    );
    const orderFees = await this.session.exchange.getAssetFees(
      exchangeTrade.assetPair,
      this.session.strategy.parameters.tradeAmount,
      orderFeesType,
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
      `I sold "${exchangeTrade.assetPair.getKey()}". ` +
      `It made (${colorTextPercentageByValue(exchangeTrade.getProfitPercentage())}) profit (excluding fees)!`
    ));

    return exchangeTrade;
  }

  /***** Helpers *****/
  _printAssetPairPriceUpdates() {
    logger.info(chalk.bold('Asset pair price updates:'));
    this.session.exchange.assetPairs.forEach((exchangeAssetPairPrice, key) => {
      logger.info(
        chalk.bold(key) +
        ' - ' +
        exchangeAssetPairPrice.getPriceText()
      );
    });
  }

  async _processTrades(assetPairOnly?: AssetPair): Promise<boolean> {
    const now = Date.now();
    const warmupPeriodTime = this.session.config.warmupPeriodSeconds * 1000;
    const warmupPeriodCountdownSeconds = Math.round((now - this.startTime - warmupPeriodTime) * -0.001);

    logger.debug(assetPairOnly
        ? `Processing trades only for "${assetPairOnly.getKey()}" ...`
        : `Processing trades ...`);

    if (warmupPeriodCountdownSeconds > 0) {
      logger.debug(`I am still warming up. ${warmupPeriodCountdownSeconds} seconds to go!`);

      return false;
    }

    logger.debug(`Checking for sell signals ...`);
    for (const exchangeTrade of this.session.getOpenTrades()) {
      if (
        assetPairOnly &&
        assetPairOnly.getKey() !== exchangeTrade.assetPair.getKey()
      ) {
        continue;
      }

      const shouldSell = this.session.strategy.shouldSell(exchangeTrade);
      if (!shouldSell) {
        continue;
      }

      await this.executeSell(exchangeTrade);
    }

    logger.debug(`Checking for buy signals ...`);
    for (const assetPair of this.session.strategy.getSortedAssetPairs()) {
      if (
        assetPairOnly &&
        assetPairOnly.getKey() !== assetPair.getKey()
      ) {
        continue;
      }

      const exchangeAssetPair = this.session.exchange.assetPairs.get(
        assetPair.getKey()
      );

      const shouldBuy = this.session.strategy.shouldBuy(exchangeAssetPair);
      if (!shouldBuy) {
        continue;
      }

      await this.executeBuy(assetPair, shouldBuy);
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
      if (!assetPairPriceEntryNewest) {
        return;
      }

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
}
