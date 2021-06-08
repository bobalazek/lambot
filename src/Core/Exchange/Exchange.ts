import chalk from 'chalk';

import { ApiCredentials } from '../Api/ApiCredentials';
import { AssetPair, AssetPairStringConverterInterface } from '../Asset/AssetPair';
import { Order } from '../Order/Order';
import { OrderFees, OrderFeesTypeEnum } from '../Order/OrderFees';
import { Session } from '../Session/Session';
import { ExchangeAccountAsset, ExchangeAccountAssetInterface } from './ExchangeAccountAsset';
import { ExchangesFactory } from './ExchangesFactory';
import { SessionManager } from '../Session/SessionManager';
import {
  ExchangeAssetPrice,
  ExchangeAssetPriceEntryInterface,
  ExchangeAssetPriceInterface,
  ExchangeAssetPricesMap,
  ExchangeAssetPriceWithSymbolEntryInterface,
} from './ExchangeAssetPrice';
import logger from '../../Utils/Logger';

export interface ExchangeInterface {
  key: string;
  name: string;
  apiCredentials: ApiCredentials;
  assetPairConverter: AssetPairStringConverterInterface;
  boot(session: Session): Promise<boolean>;
  getAccountOrders(): Promise<Order[]>;
  addAccountOrder(order: Order): Promise<Order>;
  getAccountAssets(): Promise<ExchangeAccountAssetInterface[]>;
  getAssetPairs(): Promise<AssetPair[]>;
  getAssetPrices(): Promise<ExchangeAssetPriceWithSymbolEntryInterface[]>;
  getAssetFees(symbol: string, amount: string, orderFeesType: OrderFeesTypeEnum): Promise<OrderFees>;
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
  startSessionAssetPriceUpdating(updateInterval: number): ReturnType<typeof setInterval>;
  toExport(): unknown;
}

export class Exchange implements ExchangeInterface {
  key: string;
  name: string;
  apiCredentials: ApiCredentials;
  assetPairConverter: AssetPairStringConverterInterface;

  _session: Session;
  _sessionAssetPairPrices: ExchangeAssetPricesMap;

  constructor(
    key: string,
    name: string,
    apiCredentials: ApiCredentials,
    assetPairConverter: AssetPairStringConverterInterface
  ) {
    this.key = key;
    this.name = name;
    this.apiCredentials = apiCredentials;
    this.assetPairConverter = assetPairConverter;

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
      return assetPair.toString(this.assetPairConverter);
    }));

    logger.info(chalk.bold('I will be trading with the following assets:'));

    sessionAssets.forEach((sessionAsset) => {
      const sessionAssetAssetPairSet = sessionAsset.getAssetPairsSet(this.assetPairConverter);
      sessionAssetAssetPairSet.forEach((assetPairString) => {
        if (!exhangeAssetPairsSet.has(assetPairString)) {
          logger.critical(chalk.red.bold(
            `Oh dear. We did not seem to have found the "${assetPairString}" asset pair on the exchange.`
          ));

          process.exit(1);
        }
      });

      logger.info(chalk.bold(sessionAsset.toString(this.assetPairConverter)));
    });

    await SessionManager.save(session);

    const updateInterval = this._session.config.assetPriceUpdateIntervalSeconds * 1000;

    this.startSessionAssetPriceUpdating(updateInterval);

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

  async getAssetPrices(): Promise<ExchangeAssetPriceWithSymbolEntryInterface[]> {
    throw new Error('getAssetPrices() not implemented yet.');
  }

  async getAssetFees(symbol: string, amount: string, orderFeesType: OrderFeesTypeEnum): Promise<OrderFees> {
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

  startSessionAssetPriceUpdating(updateInterval: number): ReturnType<typeof setInterval> {
    const allAssetPairs = this.getSession().getAllAssetPairsSet();

    return setInterval(async () => {
      const assetPrices = await this.getAssetPrices();
      const now = +new Date();

      for (let i = 0; i < assetPrices.length; i++) {
        const assetData = assetPrices[i];
        if (!allAssetPairs.has(assetData.symbol)) {
          continue;
        }

        this.addSessionAssetPairPriceEntry(assetData.symbol, {
          timestamp: now,
          price: assetData.price,
        });
      }

      // Start our magic here
    }, updateInterval);
  }

  toExport(): unknown {
    return {
      key: this.key,
      apiCredentials: {
        key: this.apiCredentials.key,
        secret: this.apiCredentials.secret,
      },
    };
  }

  static fromImport(data: any): Exchange {
    return ExchangesFactory.get(data.key, data.apiCredentials);
  }
}
