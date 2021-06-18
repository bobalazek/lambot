import chalk from 'chalk';

import { ExchangeApiCredentialsInterface } from './ExchangeApiCredentials';
import { AssetPairStringConverterInterface } from '../Asset/AssetPairStringConverter';
import { ExchangeAccount, ExchangeAccountsMap, ExchangeAccountTypeEnum } from './ExchangeAccount';
import { ExchangeResponseAccountAssetInterface } from './Response/ExchangeResponseAccountAsset';
import { ExchangeAssetPricesMap } from './ExchangeAssetPrice';
import { ExchangeResponseOrderFeesInterface } from './Response/ExchangeResponseOrderFees';
import { ExchangeResponseAssetPriceEntryInterface } from './Response/ExchangeResponseAssetPriceEntry';
import { ExchangeResponseAssetPairInterface } from './Response/ExchangeResponseAssetPair';
import { ExchangeResponseAssetStatisticsInterface } from './Response/ExchangeRespnseAssetStatistics';
import { ExchangeValidator } from './ExchangeValidator';
import { ExchangeOrderFeesTypeEnum } from './ExchangeOrderFees';
import { ExchangesFactory } from './ExchangesFactory';
import { Session } from '../Session/Session';
import { SessionAssetTradingTypeEnum } from '../Session/SessionAsset';
import { SessionManager } from '../Session/SessionManager';
import { ExchangeOrder } from './ExchangeOrder';
import { Trader } from '../Trader/Trader';
import { asyncForEach } from '../../Utils/Helpers';
import logger from '../../Utils/Logger';

export interface ExchangeInterface {
  key: string;
  name: string;
  apiCredentials: ExchangeApiCredentialsInterface;
  assetPairConverter: AssetPairStringConverterInterface;
  accounts: ExchangeAccountsMap;
  assetPairPrices: ExchangeAssetPricesMap;
  session: Session;
  trader: Trader;
  boot(session: Session): Promise<boolean>;
  start(): Promise<boolean>;
  getAccountOrders(type: ExchangeAccountTypeEnum, symbol: string): Promise<ExchangeOrder[]>;
  addAccountOrder(type: ExchangeAccountTypeEnum, order: ExchangeOrder): Promise<ExchangeOrder>;
  getAccountAssets(type: ExchangeAccountTypeEnum): Promise<ExchangeResponseAccountAssetInterface[]>;
  getAssetPairs(): Promise<ExchangeResponseAssetPairInterface[]>;
  getAssetPrices(): Promise<ExchangeResponseAssetPriceEntryInterface[]>;
  getAssetStatistics(): Promise<ExchangeResponseAssetStatisticsInterface[]>;
  getAssetFees(symbol: string, amount: string, orderFeesType: ExchangeOrderFeesTypeEnum): Promise<ExchangeResponseOrderFeesInterface>;
  getAccountType(accountType: SessionAssetTradingTypeEnum): ExchangeAccountTypeEnum;
  toExport(): unknown;
}

export class Exchange implements ExchangeInterface {
  key: string;
  name: string;
  apiCredentials: ExchangeApiCredentialsInterface;
  assetPairConverter: AssetPairStringConverterInterface;
  assetPairPrices: ExchangeAssetPricesMap;
  accounts: ExchangeAccountsMap;
  session: Session;
  trader: Trader;

  constructor(
    key: string,
    name: string,
    apiCredentials: ExchangeApiCredentialsInterface,
    assetPairConverter: AssetPairStringConverterInterface
  ) {
    this.key = key;
    this.name = name;
    this.apiCredentials = apiCredentials;
    this.assetPairConverter = assetPairConverter;
    this.assetPairPrices = new Map();
    this.accounts = new Map();
  }

  async boot(session: Session): Promise<boolean> {
    this.session = session;

    logger.info(chalk.cyan(
      'Booting up the exchange ...'
    ));

    await ExchangeValidator.validate(this);

    await this._setupAccounts();

    // TODO: add asset statistics to the asset!

    this._printTradableAssets();

    await SessionManager.save(this.session);

    return true;
  }

  async start(): Promise<boolean> {
    this.trader = new Trader(this.session);

    return true
  }

  /***** API Data fetching ******/
  async getAccountOrders(type: ExchangeAccountTypeEnum, symbol: string): Promise<ExchangeOrder[]> {
    throw new Error('getAccountOrders() not implemented yet.');
  }

  async addAccountOrder(type: ExchangeAccountTypeEnum, order: ExchangeOrder): Promise<ExchangeOrder> {
    throw new Error('addAccountOrder() not implemented yet.');
  }

  async getAccountAssets(type: ExchangeAccountTypeEnum): Promise<ExchangeResponseAccountAssetInterface[]> {
    throw new Error('getAccountAssets() not implemented yet.');
  }

  async getAssetPairs(): Promise<ExchangeResponseAssetPairInterface[]> {
    throw new Error('getAssetPairs() not implemented yet.');
  }

  async getAssetPrices(): Promise<ExchangeResponseAssetPriceEntryInterface[]> {
    throw new Error('getAssetPrices() not implemented yet.');
  }

  async getAssetStatistics(): Promise<ExchangeResponseAssetStatisticsInterface[]> {
    throw new Error('getAssetStatistics() not implemented yet.');
  }

  async getAssetFees(symbol: string, amount: string, orderFeesType: ExchangeOrderFeesTypeEnum): Promise<ExchangeResponseOrderFeesInterface> {
    throw new Error('getAssetFees() not implemented yet.');
  }

  /***** Helpers *****/
  getAccountType(accountType: SessionAssetTradingTypeEnum): ExchangeAccountTypeEnum {
    let exchangeAccountType: ExchangeAccountTypeEnum = null;

    switch (accountType) {
      case SessionAssetTradingTypeEnum.FUTURES:
        exchangeAccountType = ExchangeAccountTypeEnum.FUTURES;
        break;
      case SessionAssetTradingTypeEnum.MARGIN:
        exchangeAccountType = ExchangeAccountTypeEnum.MARGIN;
        break;
      case SessionAssetTradingTypeEnum.SPOT:
        exchangeAccountType = ExchangeAccountTypeEnum.SPOT;
        break;
      default:
        logger.critical(chalk.red.bold(
          `Invalid account type.`
        ));

        process.exit(1);
    }

    return exchangeAccountType;
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

  /***** Helpers *****/
  async _setupAccounts() {
    const accountTypes = [...new Set(this.session.assets.map((sessionAsset) => {
      return sessionAsset.tradingType;
    }))];

    await asyncForEach(accountTypes, async (accountType) => {
      const exchangeAccountType = this.getAccountType(accountType);
      const exchangeAccount = new ExchangeAccount(exchangeAccountType);
      const exchangeAccountAssets = await this.getAccountAssets(exchangeAccountType);
      exchangeAccountAssets.forEach((exchangeAccountAsset) =>  {
        const key = exchangeAccountAsset.asset.getKey();
        exchangeAccount.assets.set(key, exchangeAccountAsset);
      });
      this.accounts.set(exchangeAccountType, exchangeAccount);
    });
  }

  _printTradableAssets() {
    logger.info(chalk.bold(
      'I will be trading with the following assets:'
    ));
    this.session.assets.forEach((sessionAsset) => {
      logger.info(chalk.bold(
        sessionAsset.toString()
      ));
    });
  }
}
