import chalk from 'chalk';

import { ApiCredentials } from '../Api/ApiCredentials';
import { AssetPairStringConverterInterface } from '../Asset/AssetPair';
import { Order } from '../Order/Order';
import { OrderFees, OrderFeesTypeEnum } from '../Order/OrderFees';
import { Session } from '../Session/Session';
import { SessionManager } from '../Session/SessionManager';
import { ExchangeAccount, ExchangeAccountsMap, ExchangeAccountTypeEnum } from './ExchangeAccount';
import { ExchangeAccountAsset, ExchangeAccountAssetInterface } from './ExchangeAccountAsset';
import { ExchangeAssetPair, ExchangeAssetPairInterface } from './ExchangeAssetPair';
import {
  ExchangeAssetPricesMap,
  ExchangeAssetPriceWithSymbolEntryInterface,
} from './ExchangeAssetPrice';
import { ExchangesFactory } from './ExchangesFactory';
import { ExchangeValidator } from './ExchangeValidator';
import logger from '../../Utils/Logger';
import { asyncForEach } from '../../Utils/Helpers';

export interface ExchangeInterface {
  key: string;
  name: string;
  apiCredentials: ApiCredentials;
  assetPairConverter: AssetPairStringConverterInterface;
  accounts: ExchangeAccountsMap;
  assetPairPrices: ExchangeAssetPricesMap;
  session: Session;
  boot(session: Session): Promise<boolean>;
  startSessionAssetPriceUpdatingInterval(updateInterval: number): ReturnType<typeof setInterval>;
  getAccountOrders(type: ExchangeAccountTypeEnum): Promise<Order[]>;
  addAccountOrder(type: ExchangeAccountTypeEnum, order: Order): Promise<Order>;
  getAccountAssets(type: ExchangeAccountTypeEnum): Promise<ExchangeAccountAssetInterface[]>;
  getAssetPairs(): Promise<ExchangeAssetPairInterface[]>;
  getAssetPrices(): Promise<ExchangeAssetPriceWithSymbolEntryInterface[]>;
  getAssetFees(
    symbol: string,
    amount: string,
    orderFeesType: OrderFeesTypeEnum
  ): Promise<OrderFees>;
  toExport(): unknown;
}

export class Exchange implements ExchangeInterface {
  key: string;
  name: string;
  apiCredentials: ApiCredentials;
  assetPairConverter: AssetPairStringConverterInterface;
  accounts: ExchangeAccountsMap;
  assetPairPrices: ExchangeAssetPricesMap;
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
    this.accounts = new Map();
    this.assetPairPrices = new Map();
  }

  async boot(session: Session): Promise<boolean> {
    this.session = session;

    logger.info(chalk.cyan(
      'Booting up the exchange ...'
    ));

    // Validate
    await ExchangeValidator.validate(this);

    // Setup accounts
    const accountTypes = [
      ExchangeAccountTypeEnum.SPOT,
    ];
    await asyncForEach(accountTypes, async (accountType) => {
      const exchangeAccount = new ExchangeAccount(accountType);
      const exchangeAccountAssets = await this.getAccountAssets(accountType);
      exchangeAccountAssets.forEach((exchangeAccountAsset) =>  {
        const key = exchangeAccountAsset.asset.toString();
        exchangeAccount.assets.set(key, exchangeAccountAsset);
      });

      this.accounts.set(accountType, exchangeAccount);
    });

    // Show which assets we will be trading with this session
    logger.info(chalk.bold(
      'I will be trading with the following assets:'
    ));
    session.assets.forEach((sessionAsset) => {
      logger.info(chalk.bold(
        sessionAsset.toString(this.assetPairConverter)
      ));
    });

    // Save the session
    await SessionManager.save(session);

    // Start the price update interval
    const {
      assetPriceUpdateIntervalSeconds,
    } = session.config;
    this.startSessionAssetPriceUpdatingInterval(assetPriceUpdateIntervalSeconds * 1000);

    return true;
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

        const assetPrice = this.assetPairPrices.get(assetData.symbol);
        if (!assetPrice) {
          logger.info(chalk.red.bold(
            `Assset price for symbol "${assetData.symbol}" not found.`
          ));

          process.exit(1);
        }

        assetPrice.addEntry({
          timestamp: now,
          price: assetData.price,
        });
      }

      // Now that we updated our prices, let's process the entries!
      logger.info(chalk.bold('Asset pair price updates:'));
      this.assetPairPrices.forEach((exchangeAssetPrice, key) => {
        exchangeAssetPrice.processEntries();

        const statusText = exchangeAssetPrice.getStatusText(now);

        logger.info(chalk.bold(key) + ' - ' + statusText);
      });
    }, updateInterval);
  }

  /***** API Data fetching ******/
  async getAccountOrders(type: ExchangeAccountTypeEnum): Promise<Order[]> {
    throw new Error('getAccountOrders() not implemented yet.');
  }

  async addAccountOrder(type: ExchangeAccountTypeEnum, order: Order): Promise<Order> {
    throw new Error('addAccountOrder() not implemented yet.');
  }

  async getAccountAssets(type: ExchangeAccountTypeEnum): Promise<ExchangeAccountAsset[]> {
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

  /***** Export/Import *****/
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
