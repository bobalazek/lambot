import chalk from 'chalk';

import { Asset } from '../Asset/Asset';
import { AssetPair } from '../Asset/AssetPair';
import { Exchange } from '../Exchange/Exchange';
import { ExchangeAssetPair } from '../Exchange/ExchangeAssetPair';
import { ExchangeOrderTypeEnum } from '../Exchange/ExchangeOrderType';
import { ExchangeTrade, ExchangeTradeStatusEnum } from '../Exchange/ExchangeTrade';
import { SessionTradingTypeEnum } from './SessionTradingType';
import { SessionConfig } from './SessionConfig';
import { Strategy } from '../Strategy/Strategy';
import logger from '../../Utils/Logger';

export interface SessionInterface {
  id: string;
  exchange: Exchange;
  config: SessionConfig;
  asset: Asset; // What is the default asset you want to trade in?
  assetPairs: AssetPair[]; // With which pairs do we want to trade? BTC_USDT, BTC_ETH, ...
  strategy: Strategy;
  orderTypes: SessionOrderTypes;
  tradingTypes: SessionTradingTypeEnum[];
  trades: ExchangeTrade[];
  status: SessionStatusEnum;
  createdAt: number;
  startedAt: number;
  endedAt: number | null;
  isLoadedFromPersistence: boolean;
  getOpenTrades(): ExchangeTrade[];
  getClosedTrades(): ExchangeTrade[];
  getAssetPairs(): Set<string>;
  addAssetPair(assetPair: AssetPair): ExchangeAssetPair;
  getKey(): string;
}

export enum SessionStatusEnum {
  PENDING = 'PENDING',
  STARTED = 'STARTED',
  ENDED = 'ENDED',
}

export type SessionOrderTypes = {
  buy: ExchangeOrderTypeEnum,
  sell: ExchangeOrderTypeEnum,
}

export class Session implements SessionInterface {
  id: string;
  exchange: Exchange;
  config: SessionConfig;
  asset: Asset;
  assetPairs: AssetPair[];
  strategy: Strategy;
  orderTypes: SessionOrderTypes;
  tradingTypes: SessionTradingTypeEnum[];
  trades: ExchangeTrade[];
  status: SessionStatusEnum;
  createdAt: number;
  startedAt: number;
  endedAt: number | null;
  isLoadedFromPersistence: boolean;

  constructor(
    id: string,
    exchange: Exchange,
    config: SessionConfig,
    asset: Asset,
    assetPairs: AssetPair[],
    strategy: Strategy,
    orderTypes: SessionOrderTypes,
    tradingTypes: SessionTradingTypeEnum[]
  ) {
    this.id = id;
    this.exchange = exchange;
    this.config = config;
    this.asset = asset;
    this.assetPairs = assetPairs;
    this.strategy = strategy;
    this.orderTypes = orderTypes;
    this.tradingTypes = tradingTypes;

    this.trades = [];
    this.status = SessionStatusEnum.STARTED;
    this.createdAt = Date.now();
    this.startedAt = Date.now();
    this.endedAt = null;
    this.isLoadedFromPersistence = false;

    assetPairs.forEach((assetPair) => {
      this.addAssetPair(assetPair);
    });
  }

  getOpenTrades(): ExchangeTrade[] {
    return this.trades.filter((trade) => {
      return trade.status === ExchangeTradeStatusEnum.OPEN;
    });
  }

  getClosedTrades(): ExchangeTrade[] {
    return this.trades.filter((trade) => {
      return trade.status === ExchangeTradeStatusEnum.CLOSED;
    });
  }

  getAssetPairs(): Set<string> {
    return new Set(this.assetPairs.map((assetPair) => {
      return assetPair.getKey();
    }));
  }

  addAssetPair(assetPair: AssetPair) {
    const exchangeAssetPair = new ExchangeAssetPair(assetPair);
    this.exchange.assetPairs.set(
      assetPair.getKey(),
      exchangeAssetPair
    );

    return exchangeAssetPair;
  }

  getKey() {
    return JSON.stringify({
      id: this.id,
      exchange: this.exchange.key,
      asset: this.asset.getKey(),
      assetPairs: this.assetPairs.map((assetPair) => {
        return assetPair.getKey();
      }),
      createdAt: this.createdAt,
    });
  }

  /***** Export/Import *****/
  toExport() {
    return {
      id: this.id,
      status: this.status,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      exchange: this.exchange.toExport(),
      config: this.config.toExport(),
      asset: this.asset.toExport(),
      assetPairs: this.assetPairs.map((assetPair) => {
        return assetPair.toExport();
      }),
      strategy: this.strategy.toExport(),
      orderTypes: this.orderTypes,
      tradingTypes: this.tradingTypes,
      trades: this.trades.map((trade) => {
        return trade.toExport();
      }),
    };
  }

  static async fromImport(data: any): Promise<Session> {
    const sessionData = data.session;
    if (sessionData.status === SessionStatusEnum.ENDED) {
      logger.critical(chalk.red.bold(
        'The session you are trying to import has already ended. Please create a new one instead.'
      ));
      process.exit(1);
    }

    const exchange = Exchange.fromImport(sessionData.exchange);
    if (!exchange) {
      logger.critical(chalk.red.bold(
        'Exchange not found.'
      ));
      process.exit(1);
    }

    const config = SessionConfig.fromImport(sessionData.config);

    const session = new Session(
      sessionData.id,
      exchange,
      config,
      Asset.fromImport(sessionData.asset),
      sessionData.assetPairs.map((assetPairData: any) => {
        return AssetPair.fromImport(assetPairData);
      }),
      Strategy.fromImport(sessionData.strategy),
      sessionData.orderTypes,
      sessionData.tradingTypes
    );

    if (typeof sessionData.trades !== 'undefined') {
      session.trades = sessionData.trades.map((tradeData: any) => {
        return ExchangeTrade.fromImport(tradeData);
      });
    }

    session.status = sessionData.status;
    session.createdAt = sessionData.createdAt;
    session.endedAt = sessionData.endedAt;

    return session;
  }
}
