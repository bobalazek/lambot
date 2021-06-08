import chalk from 'chalk';

import { ApiCredentials } from '../Api/ApiCredentials';
import { AssetPairStringConverterInterface } from '../Asset/AssetPair';
import { Order } from '../Order/Order';
import { OrderFees, OrderFeesTypeEnum } from '../Order/OrderFees';
import { Session } from '../Session/Session';
import { SessionManager } from '../Session/SessionManager';
import { ExchangeAccountAsset, ExchangeAccountAssetInterface } from './ExchangeAccountAsset';
import { ExchangeAssetPair, ExchangeAssetPairInterface } from './ExchangeAssetPair';
import { ExchangesFactory } from './ExchangesFactory';
import { ExchangeValidator } from './ExchangeValidator';
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
  getAssetPairs(): Promise<ExchangeAssetPairInterface[]>;
  getAssetPrices(): Promise<ExchangeAssetPriceWithSymbolEntryInterface[]>;
  getAssetFees(symbol: string, amount: string, orderFeesType: OrderFeesTypeEnum): Promise<OrderFees>;
  getSession(): Session;
  getSessionAssetPairPricesMap(): ExchangeAssetPricesMap;
  getSessionAssetPairPrice(symbol: string): ExchangeAssetPriceInterface;
  addSessionAssetPairPrice(
    symbol: string,
    assetPairPrice: ExchangeAssetPriceInterface
  ): ExchangeAssetPriceInterface;
  addSessionAssetPairPriceEntry(
    symbol: string,
    assetPriceDataEntry: ExchangeAssetPriceEntryInterface
  ): ExchangeAssetPriceEntryInterface;
  startSessionAssetPriceUpdatingInterval(updateInterval: number): ReturnType<typeof setInterval>;
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

    logger.info(chalk.cyan(
      'Booting up the exchange ...'
    ));

    await ExchangeValidator.validate(this);

    logger.info(chalk.bold(
      'I will be trading with the following assets:'
    ));

    session.assets.forEach((sessionAsset) => {
      logger.info(chalk.bold(
        sessionAsset.toString(this.assetPairConverter)
      ));
    });

    await SessionManager.save(session);

    const {
      assetPriceUpdateIntervalSeconds,
    } = session.config;

    this.startSessionAssetPriceUpdatingInterval(assetPriceUpdateIntervalSeconds * 1000);

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

  async getAssetPairs(): Promise<ExchangeAssetPair[]> {
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

  getSessionAssetPairPricesMap(): ExchangeAssetPricesMap {
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

  startSessionAssetPriceUpdatingInterval(updateInterval: number): ReturnType<typeof setInterval> {
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

      // Now that we updated our prices, let's process the entries!
      logger.info(chalk.bold('Asset pair price updates:'));
      this._sessionAssetPairPrices.forEach((exchangeAssetPrice, key) => {
        exchangeAssetPrice.processEntries();

        const statusText = exchangeAssetPrice.getStatusText(now);

        logger.info(chalk.bold(key) + ' - ' + statusText);
      });
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
