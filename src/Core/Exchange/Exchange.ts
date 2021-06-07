import chalk from 'chalk';

import { ApiCredentials } from '../Api/ApiCredentials';
import { AssetPair } from '../Asset/AssetPair';
import { Order, OrderFees } from '../Order/Order';
import { Session } from '../Session/Session';
import { ExchangesFactory } from './ExchangesFactory';
import { SessionManager } from '../Session/SessionManager';
import {
  ExchangeAssetPrice,
  ExchangeAssetPriceEntryInterface,
  ExchangeAssetPriceInterface,
  ExchangeAssetPricesMap,
} from './ExchangeAssetPrice';
import logger from '../../Utils/Logger';

export interface ExchangeInterface {
  key: string;
  name: string;
  apiCredentials: ApiCredentials;
  assetPairDelimiter: string;
  boot(session: Session): Promise<boolean>;
  getAccountOrders(): Promise<Order[]>;
  addAccountOrder(order: Order): Promise<Order>;
  getAccountAssets(): Promise<ExchangeAccountAsset[]>;
  getAssetPairs(): Promise<AssetPair[]>;
  getAssetPrices(): Promise<ExchangeAssetPriceEntryInterface[]>;
  getAssetFees(symbol: string, amount: string): Promise<OrderFees>;
  getSession(): Session;
  getSessionAssetPairPrices(): ExchangeAssetPricesMap;
  getSessionAssetPairPrice(symbol: string): ExchangeAssetPriceInterface;
  addSessionAssetPairPrice(symbol: string, assetPairPrice: ExchangeAssetPriceInterface): ExchangeAssetPriceInterface;
  getSessionAssetPairPriceEntryNewest(symbol: string): ExchangeAssetPriceEntryInterface;
  addSessionAssetPairPriceEntry(
    symbol: string,
    assetPriceDataEntry: ExchangeAssetPriceEntryInterface,
    newestEntryInterval: number
  ): ExchangeAssetPriceEntryInterface;
}

export interface ExchangeAccountAssetInterface {
  exchange: Exchange;
  symbol: string;
  amountFree: string;
  amountLocked: string;
}

export class Exchange implements ExchangeInterface {
  key: string;
  name: string;
  apiCredentials: ApiCredentials;
  assetPairDelimiter: string;

  _session: Session;
  _sessionAssetPairPrices: ExchangeAssetPricesMap;

  constructor(
    key: string,
    name: string,
    apiCredentials: ApiCredentials,
    assetPairDelimiter: string = ''
  ) {
    this.key = key;
    this.name = name;
    this.apiCredentials = apiCredentials;
    this.assetPairDelimiter = assetPairDelimiter;

    this._sessionAssetPairPrices = new Map();
  }

  async boot(session: Session): Promise<boolean> {
    this._session = session;

    logger.info(chalk.cyan('Booting up the exchange ...'));

    const sessionAssets = session.assets;
    if (sessionAssets.length === 0) {
      logger.critical(chalk.red.bold(
        'No assets found for this session!'
      ));

      process.exit(1);
    }

    const exhangeAssetPairs = await this.getAssetPairs();
    const exhangeAssetPairsSet = new Set(exhangeAssetPairs.map((assetPair) => {
      return assetPair.toString(this.assetPairDelimiter);
    }));

    logger.info(chalk.bold('I will be trading with the following assets:'));

    sessionAssets.forEach((sessionAsset) => {
      const sessionAssetAssetPairSet = sessionAsset.getAssetPairsSet(this.assetPairDelimiter);
      sessionAssetAssetPairSet.forEach((assetPairString) => {
        if (!exhangeAssetPairsSet.has(assetPairString)) {
          logger.critical(chalk.red.bold(
            `Oh dear. We did not seem to have found the "${assetPairString}" asset pair on the exchange.`
          ));

          process.exit(1);
        }
      });

      logger.info(chalk.bold(sessionAsset.toString(this.assetPairDelimiter)));
    });

    await SessionManager.save(session);

    return true;
  }

  async getAccountOrders(): Promise<Order[]> {
    throw new Error('getAccountOrders() not implemented yet.');
  }

  async addAccountOrder(order: Order): Promise<Order> {
    throw new Error('addAccountOrder() not implemented yet.');
  }

  async getAccountAssets(): Promise<ExchangeAccountAsset[]> {
    throw new Error('getAccountAssets() not implemented yet.');
  }

  async getAssetPairs(): Promise<AssetPair[]> {
    throw new Error('getAssetPairs() not implemented yet.');
  }

  async getAssetPrices(): Promise<ExchangeAssetPriceEntryInterface[]> {
    throw new Error('getAssetPrices() not implemented yet.');
  }

  async getAssetFees(symbol: string, amount: string): Promise<OrderFees> {
    throw new Error('getAssetFees() not implemented yet.');
  }

  getSession(): Session {
    return this._session;
  }

  getSessionAssetPairPrices(): ExchangeAssetPricesMap {
    return this._sessionAssetPairPrices;
  }

  getSessionAssetPairPrice(symbol: string): ExchangeAssetPriceInterface {
    return this._sessionAssetPairPrices.get(symbol);
  }

  addSessionAssetPairPrice(
    symbol: string,
    assetPairPrice: ExchangeAssetPrice = new ExchangeAssetPrice()
  ): ExchangeAssetPrice {
    this._sessionAssetPairPrices.set(symbol, assetPairPrice);

    return assetPairPrice;
  }

  getSessionAssetPairPriceEntryNewest(symbol: string): ExchangeAssetPriceEntryInterface {
    const symbolAssetPrice = <ExchangeAssetPrice>this.getSessionAssetPairPrice(symbol);
    if (!symbolAssetPrice) {
      return null;
    }

    return symbolAssetPrice.getNewestEntry();
  }

  addSessionAssetPairPriceEntry(
    symbol: string,
    assetPriceDataEntry: ExchangeAssetPriceEntryInterface
  ): ExchangeAssetPriceEntryInterface {
    const symbolAssetPrice = <ExchangeAssetPrice>this.getSessionAssetPairPrice(symbol);
    if (!symbolAssetPrice) {
      return null;
    }

    return symbolAssetPrice.addEntry(assetPriceDataEntry);
  }

  toExport(): Object {
    return {
      key: this.key,
      apiCredentials: {
        key: this.apiCredentials.key,
        secret: this.apiCredentials.secret,
      },
    };
  }

  static async fromImport(data: any): Promise<Exchange> {
    return ExchangesFactory.get(data.key, data.apiCredentials);
  }
}

export class ExchangeAccountAsset implements ExchangeAccountAssetInterface {
  exchange: Exchange;
  symbol: string;
  amountFree: string;
  amountLocked: string;

  constructor(
    exchange: Exchange,
    symbol: string,
    amountFree: string = '0',
    amountLocked: string = '0'
  ) {
    this.exchange = exchange;
    this.symbol = symbol;
    this.amountFree = amountFree;
    this.amountLocked = amountLocked;
  }
}
