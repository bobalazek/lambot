import chalk from 'chalk';

import { ApiCredentials } from '../Api/ApiCredentials';
import { AssetPairStringConverterInterface } from '../Asset/AssetPair';
import { Order } from '../Order/Order';
import { OrderFees, OrderFeesTypeEnum } from '../Order/OrderFees';
import { Session } from '../Session/Session';
import { SessionManager } from '../Session/SessionManager';
import { ExchangeAccountAsset, ExchangeAccountAssetInterface } from './ExchangeAccountAsset';
import { ExchangeAssetPair, ExchangeAssetPairInterface } from './ExchangeAssetPair';
import { ExchangeAssetPriceWithSymbolEntryInterface } from './ExchangeAssetPrice';
import { ExchangesFactory } from './ExchangesFactory';
import { ExchangeValidator } from './ExchangeValidator';
import logger from '../../Utils/Logger';

export interface ExchangeInterface {
  key: string;
  name: string;
  apiCredentials: ApiCredentials;
  assetPairConverter: AssetPairStringConverterInterface;
  session: Session;
  boot(session: Session): Promise<boolean>;
  getAccountOrders(): Promise<Order[]>;
  addAccountOrder(order: Order): Promise<Order>;
  getAccountAssets(): Promise<ExchangeAccountAssetInterface[]>;
  getAssetPairs(): Promise<ExchangeAssetPairInterface[]>;
  getAssetPrices(): Promise<ExchangeAssetPriceWithSymbolEntryInterface[]>;
  getAssetFees(symbol: string, amount: string, orderFeesType: OrderFeesTypeEnum): Promise<OrderFees>;
  startSessionAssetPriceUpdatingInterval(updateInterval: number): ReturnType<typeof setInterval>;
  toExport(): unknown;
}

export class Exchange implements ExchangeInterface {
  key: string;
  name: string;
  apiCredentials: ApiCredentials;
  assetPairConverter: AssetPairStringConverterInterface;
  session: Session;

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
  }

  async boot(session: Session): Promise<boolean> {
    this.session = session;

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

  startSessionAssetPriceUpdatingInterval(updateInterval: number): ReturnType<typeof setInterval> {
    const assetPairsList = this.session.getAssetPairsList();

    return setInterval(async () => {
      const assetPrices = await this.getAssetPrices();
      const now = +new Date();

      for (let i = 0; i < assetPrices.length; i++) {
        const assetData = assetPrices[i];
        if (!assetPairsList.has(assetData.symbol)) {
          continue;
        }

        this.session.addAssetPairPriceEntry(assetData.symbol, {
          timestamp: now,
          price: assetData.price,
        });
      }

      // Now that we updated our prices, let's process the entries!
      logger.info(chalk.bold('Asset pair price updates:'));
      this.session.assetPairPrices.forEach((exchangeAssetPrice, key) => {
        exchangeAssetPrice.processEntries();

        const statusText = exchangeAssetPrice.getStatusText(now);

        logger.info(chalk.bold(key) + ' - ' + statusText);
      });
    }, updateInterval);
  }

  toExport() {
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
