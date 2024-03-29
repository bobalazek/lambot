import chalk from 'chalk';
import crypto from 'crypto';

import { AssetPair } from '../Core/Asset/AssetPair';
import { ExchangeAccountTypeEnum } from '../Core/Exchange/ExchangeAccount';
import { ExchangeOrder } from '../Core/Exchange/ExchangeOrder';
import { ExchangeTrade, ExchangeTradeStatusEnum, ExchangeTradeTypeEnum } from '../Core/Exchange/ExchangeTrade';
import { ExchangeOrderTypeEnum } from '../Core/Exchange/ExchangeOrderType';
import { ExchangeOrderSideEnum } from '../Core/Exchange/ExchangeOrderSide';
import { ExchangeOrderFeesTypeEnum } from '../Core/Exchange/ExchangeOrderFeesType';
import { Session } from '../Core/Session/Session';
import { SessionManager } from '../Core/Session/SessionManager';
import { Server } from '../Server/Server';
import { ID_PREFIX } from '../Constants';
import { colorTextPercentageByValue, toPlainString } from '../Utils/Helpers';
import logger from '../Utils/Logger';

export enum TraderStatusEnum {
  STOPPED = 'STOPPED',
  RUNNING = 'RUNNING',
}

export class Trader {
  session!: Session;
  server!: Server;
  isTestMode: boolean = true;
  status: TraderStatusEnum = TraderStatusEnum.STOPPED;
  startTime!: number;

  _statistics24HoursTickInterval!: ReturnType<typeof setInterval>;
  _priceTickInterval!: ReturnType<typeof setInterval>;
  _candlestickTickInterval!: ReturnType<typeof setInterval>;
  _openTradesInterval!: ReturnType<typeof setInterval>;
  _assetPairPriceInterval!: ReturnType<typeof setInterval>;

  async boot(session: Session, isTestMode: boolean = true): Promise<Trader> {
    this.session = session;
    this.isTestMode = isTestMode;

    logger.info(chalk.cyan(
      this.isTestMode
        ? 'Trader (in TEST MODE) is starting now ...'
        : 'Trader is starting now ...'
    ));

    logger.info(chalk.cyan(
      `Exchange: ${this.session.exchange.name}; ` +
      `Session ID: ${this.session.id}; ` +
      `Session config: ${JSON.stringify(this.session.config)}`
    ));

    if (this.session.config.webServerApiEnabled) {
      this.server = new Server(
        this.session.config.webServerApiPort
      );

      await this.server.boot(this);
    }

    await this.session.exchange.boot(this.session);
    await this.start();

    this._startMemoryUsageMonitoring();

    return this;
  }

  async start(): Promise<boolean> {
    this.status = TraderStatusEnum.RUNNING;
    this.startTime = Date.now();

    await this.session.strategy.boot(this.session);

    // Intervals
    const statistics24HoursIntervalTime = 3600 * 1000; // TODO: make configurable?
    if (statistics24HoursIntervalTime) {
      await this.statistics24HoursTick();
      this._statistics24HoursTickInterval = setInterval(
        this.statistics24HoursTick.bind(this),
        statistics24HoursIntervalTime
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

    clearInterval(this._statistics24HoursTickInterval);
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
    for (const priceData of assetPairPrices) {
      const assetPairKey = priceData.assetPair.getKey();
      if (!assetPairs.has(assetPairKey)) {
        continue;
      }

      const assetPair = this.session.exchange.assetPairs.get(assetPairKey);
      if (!assetPair) {
        logger.error(chalk.red.bold(
          `Asset pair for symbol "${assetPairKey}" not found in the exchange.`
        ));
        continue;
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
      if (!exchangeAssetPair) {
        logger.critical(chalk.red.bold(
          'Exchange asset pair not found.'
        ));
        process.exit(1);
      }

      exchangeAssetPair.setCandlesticks(assetPairCandlesticksData);

      await this._processTrades(assetPair);
    }
  }

  async statistics24HoursTick() {
    logger.debug(`Statistics 24 Horus tick ...`);

    const assetPairs = this.session.getAssetPairs();
    const assetPairStatistics = await this.session.exchange.getAssetPairStatistics24Hours();
    for (const statisticsData of assetPairStatistics) {
      const assetPairKey = statisticsData.assetPair.getKey();
      if (!assetPairs.has(assetPairKey)) {
        continue;
      }

      const assetPair = this.session.exchange.assetPairs.get(assetPairKey);
      if (!assetPair) {
        logger.error(chalk.red.bold(
          `Asset pair for symbol "${assetPairKey}" not found in the exchange.`
        ));
        continue;
      }

      assetPair.statistics24Hours = statisticsData;
    }
  }

  async executeBuy(
    assetPair: AssetPair,
    tradeType: ExchangeTradeTypeEnum
  ): Promise<ExchangeTrade | null> {
    const now = Date.now();
    const assetPairSymbol = assetPair.getKey();
    const accountType = tradeType === ExchangeTradeTypeEnum.SHORT
      ? ExchangeAccountTypeEnum.MARGIN
      : ExchangeAccountTypeEnum.SPOT;
    const assetPairPrice = this.session.exchange.assetPairs.get(assetPairSymbol);
    if (!assetPairPrice) {
      logger.critical(chalk.red.bold(
        'Asset pair price not found.'
      ));
      process.exit(1);
    }

    const assetPairPriceEntryNewest = assetPairPrice.getNewestPriceEntry();
    if (!assetPairPriceEntryNewest) {
      logger.notice(chalk.green.bold(
        `Could not buy "${assetPairSymbol}" because no price was set.`
      ));

      return null;
    }

    const random = crypto.randomBytes(20).toString('hex').slice(0, 6);
    const id = ID_PREFIX + this.session.id + '_' + assetPairSymbol + '_' + random;
    const orderFeesType = this.session.orderTypes.buy === ExchangeOrderTypeEnum.LIMIT
      ? ExchangeOrderFeesTypeEnum.MAKER
      : ExchangeOrderFeesTypeEnum.TAKER;
    const amountQuote = this.session.strategy.parameters.tradeAmount;
    const amount = toPlainString( // TODO: needs amountToPrecision; How much amount of the quote asset we want to buy (relative to our quote asset)?
      parseFloat(amountQuote) /
      parseFloat(assetPairPriceEntryNewest.price)
    );
    const order = new ExchangeOrder(
      id + '_' + ExchangeOrderSideEnum.BUY,
      assetPair,
      ExchangeOrderSideEnum.BUY,
      amount,
      assetPairPriceEntryNewest.price,
      this.session.orderTypes.buy,
      accountType
    );
    const orderFees = await this.session.exchange.getAssetFees(
      assetPair,
      order.amount,
      orderFeesType,
      tradeType
    );

    const entryOrder: ExchangeOrder = !this.isTestMode
      ? await this.session.exchange.addAccountOrder(accountType, order)
      : order;
    const exchangeTrade = new ExchangeTrade(
      id,
      assetPair,
      tradeType,
      entryOrder.amount,
      amountQuote,
      now
    );
    exchangeTrade.entryFees.push(orderFees);
    exchangeTrade.entryOrder = entryOrder;
    exchangeTrade.entryPrice = entryOrder?.price
      ? parseFloat(entryOrder.price)
      : null;
    exchangeTrade.entryAt = Date.now();

    this.session.trades.push(exchangeTrade);

    SessionManager.save(this.session);

    logger.notice(chalk.green.bold(
      `I bought "${assetPair.getKey()}" @ ${exchangeTrade.entryPrice}!`
    ));

    return exchangeTrade;
  }

  async executeSell(exchangeTrade: ExchangeTrade): Promise<ExchangeTrade> {
    const assetPairPrice = this.session.exchange.assetPairs.get(
      exchangeTrade.assetPair.getKey()
    );
    if (!assetPairPrice) {
      logger.critical(chalk.red.bold(
        'Asset pair price not found.'
      ));
      process.exit(1);
    }

    const assetPairPriceEntryNewest = assetPairPrice.getNewestPriceEntry();
    if (!assetPairPriceEntryNewest) {
      logger.critical(chalk.red.bold(
        'Asset pair price entry newest not found.'
      ));
      process.exit(1);
    }

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
      order.amount,
      orderFeesType,
      exchangeTrade.type
    );

    const exitOrder: ExchangeOrder = !this.isTestMode
      ? await this.session.exchange.addAccountOrder(accountType, order)
      : order;
    exchangeTrade.exitFees.push(orderFees);
    exchangeTrade.exitOrder = exitOrder;
    exchangeTrade.exitPrice = exitOrder?.price
      ? parseFloat(exitOrder.price)
      : null;
    exchangeTrade.exitAt = Date.now();
    exchangeTrade.status = ExchangeTradeStatusEnum.CLOSED;

    SessionManager.save(this.session);

    const profitPercentage = exchangeTrade.getProfitPercentage();
    const profitPercentageIncludingFees = exchangeTrade.getProfitPercentage(true);

    logger.notice(chalk.green.bold(
      `I sold "${exchangeTrade.assetPair.getKey()}". ` +
      `It made ${colorTextPercentageByValue(profitPercentage)} profit ` +
      `(${colorTextPercentageByValue(profitPercentageIncludingFees)} including fees)!`
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

    logger.debug(`Populating indicators ...`);
    for (const exchangeAssetPair of this.session.exchange.assetPairs.values()) {
      if (
        assetPairOnly &&
        assetPairOnly.getKey() !== exchangeAssetPair.assetPair.getKey()
      ) {
        continue;
      }

      this.session.strategy.prepareIndicators(exchangeAssetPair);
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
      if (!exchangeAssetPair) {
        logger.critical(chalk.red.bold(
          'Exchange asset pair not found.'
        ));
        process.exit(1);
      }

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
      if (!assetPairPrice) {
        logger.critical(chalk.red.bold(
          'Asset pair price not found.'
        ));
        process.exit(1);
      }

      const assetPairPriceEntryNewest = assetPairPrice.getNewestPriceEntry();
      if (!assetPairPriceEntryNewest) {
        return;
      }

      const currentAssetPairPrice = parseFloat(assetPairPriceEntryNewest.price);
      const profitPercentage = exchangeTrade.getCurrentProfitPercentage(currentAssetPairPrice);
      const profitPercentageIncludingFees = exchangeTrade.getCurrentProfitPercentage(currentAssetPairPrice, true);
      const timeAgoSeconds = Math.round((now - exchangeTrade.createdAt) / 1000);

      logger.info(
        chalk.bold(exchangeTrade.assetPair.getKey()) +
        ` @ ${currentAssetPairPrice}` +
        ` (bought @ ${exchangeTrade.entryPrice}; ${timeAgoSeconds} seconds ago)` +
        ` current profit: ${colorTextPercentageByValue(profitPercentage)} ` +
        ` (${colorTextPercentageByValue(profitPercentageIncludingFees)} including fees)`
      );
    });

    if (openTrades.length === 0) {
      logger.debug('No open trades found yet.');
    }
  }

  _startMemoryUsageMonitoring() {
    const {
      memoryUsageMonitoringIntervalSeconds,
    } = this.session.config;

    return setInterval(() => {
      const memoryUsage = process.memoryUsage();
      logger.info(chalk.cyan(
        'Memory usage: ' +
        Object.keys(memoryUsage).map((key) => {
          return `${key} - ${Math.round(memoryUsage[<keyof typeof memoryUsage>key] / 1024 / 1024 * 100) / 100} MB`;
        }).join('; ')
      ));
    }, memoryUsageMonitoringIntervalSeconds * 1000);
  }
}
