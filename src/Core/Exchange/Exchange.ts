import chalk from 'chalk';

import { AssetPair } from '../Asset/AssetPair';
import { AssetPairStringConverterInterface } from '../Asset/AssetPairStringConverter';
import { ExchangeApiCredentialsInterface } from './ExchangeApiCredentials';
import { ExchangeAccount, ExchangeAccountsMap, ExchangeAccountTypeEnum } from './ExchangeAccount';
import { ExchangeAssetPairsMap } from './ExchangeAssetPairPrice';
import { ExchangeResponseAccountAssetInterface } from './Response/ExchangeResponseAccountAsset';
import { ExchangeResponseOrderFeesInterface } from './Response/ExchangeResponseOrderFees';
import { ExchangeResponseAssetPairInterface } from './Response/ExchangeResponseAssetPair';
import { ExchangeResponseAssetPairPriceEntryInterface } from './Response/ExchangeResponseAssetPairPriceEntry';
import { ExchangeResponseAssetPairCandlestickInterface } from './Response/ExchangeResponseAssetPairCandlestick';
import { ExchangeTradeTypeEnum } from './ExchangeTrade';
import { ExchangeOrder } from './ExchangeOrder';
import { ExchangeValidator } from './ExchangeValidator';
import { ExchangeOrderFeesTypeEnum } from './ExchangeOrderFees';
import { ExchangesFactory } from './ExchangesFactory';
import { Manager } from '../Manager';
import { Session, SessionTradingTypeEnum } from '../Session/Session';
import { SessionManager } from '../Session/SessionManager';
import { asyncForEach } from '../../Utils/Helpers';
import logger from '../../Utils/Logger';

export interface ExchangeInterface {
  key: string;
  name: string;
  apiCredentials: ExchangeApiCredentialsInterface;
  assetPairConverter: AssetPairStringConverterInterface;
  accounts: ExchangeAccountsMap;
  assetPairs: ExchangeAssetPairsMap;
  session: Session;
  boot(session: Session): Promise<boolean>;
  getAccountOrders(type: ExchangeAccountTypeEnum, assetPair?: AssetPair): Promise<ExchangeOrder[]>;
  addAccountOrder(type: ExchangeAccountTypeEnum, order: ExchangeOrder): Promise<ExchangeOrder>;
  getAccountAssets(type: ExchangeAccountTypeEnum): Promise<ExchangeResponseAccountAssetInterface[]>;
  getAssetPairs(): Promise<ExchangeResponseAssetPairInterface[]>;
  getAssetPairPrices(): Promise<ExchangeResponseAssetPairPriceEntryInterface[]>;
  getAssetPairCandlesticks(
    assetPair: AssetPair,
    timeframeSeconds: number,
    startTime?: number,
    endTime?: number,
    limit?: number
  ): Promise<ExchangeResponseAssetPairCandlestickInterface[]>;
  getAssetFees(
    assetPair: AssetPair,
    amount: string,
    orderFeesType: ExchangeOrderFeesTypeEnum,
    tradeType: ExchangeTradeTypeEnum
  ): Promise<ExchangeResponseOrderFeesInterface>;
  getAccountType(accountType: SessionTradingTypeEnum): ExchangeAccountTypeEnum;
}

export class Exchange implements ExchangeInterface {
  key: string;
  name: string;
  apiCredentials: ExchangeApiCredentialsInterface;
  assetPairConverter: AssetPairStringConverterInterface;
  assetPairs: ExchangeAssetPairsMap;
  accounts: ExchangeAccountsMap;
  session: Session;

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
    this.assetPairs = new Map();
    this.accounts = new Map();
  }

  async boot(session: Session): Promise<boolean> {
    this.session = session;

    logger.info(chalk.cyan(
      'Booting up the exchange ...'
    ));

    await ExchangeValidator.validate(this);

    await this._setupAccounts();

    await this._checkPersistenceData();

    this._printTradableAssets();

    await SessionManager.save(this.session);

    return true;
  }

  /***** API Data fetching ******/
  async getAccountOrders(type: ExchangeAccountTypeEnum, assetPair?: AssetPair): Promise<ExchangeOrder[]> {
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

  async getAssetPairPrices(): Promise<ExchangeResponseAssetPairPriceEntryInterface[]> {
    throw new Error('getAssetPairPrices() not implemented yet.');
  }

  async getAssetPairCandlesticks(
    assetPair: AssetPair,
    timeframeSeconds: number,
    startTime?: number,
    endTime?: number,
    limit?: number
  ): Promise<ExchangeResponseAssetPairCandlestickInterface[]> {
    throw new Error('getAssetPairCandlesticks() not implemented yet.');
  }

  async getAssetFees(
    assetPair: AssetPair,
    amount: string,
    orderFeesType: ExchangeOrderFeesTypeEnum,
    tradeType: ExchangeTradeTypeEnum
  ): Promise<ExchangeResponseOrderFeesInterface> {
    throw new Error('getAssetFees() not implemented yet.');
  }

  /***** Helpers *****/
  getAccountType(accountType: SessionTradingTypeEnum): ExchangeAccountTypeEnum {
    let exchangeAccountType: ExchangeAccountTypeEnum = null;

    switch (accountType) {
      case SessionTradingTypeEnum.FUTURES:
        exchangeAccountType = ExchangeAccountTypeEnum.FUTURES;
        break;
      case SessionTradingTypeEnum.MARGIN:
        exchangeAccountType = ExchangeAccountTypeEnum.MARGIN;
        break;
      case SessionTradingTypeEnum.SPOT:
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
  async _setupAccounts(): Promise<any> {
    return await asyncForEach(this.session.tradingTypes, async (accountType) => {
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

  async _checkPersistenceData(): Promise<boolean> {
    if (
      Manager.isTestMode ||
      !this.session.isLoadedFromPersistence
    ) {
      return false;
    }

    logger.debug('Checking persistence data ...');

    const exchangeOpenTrades = await this.getAccountOrders(
      ExchangeAccountTypeEnum.SPOT
    );
    const exchangeOpenTradesMap = new Map();
    exchangeOpenTrades.forEach((openTrade) => {
      exchangeOpenTradesMap.set(openTrade.id, openTrade);
    });

    logger.debug(`Found ${exchangeOpenTrades.length} open trades on the exchange.`);

    const openTrades = this.session.getOpenTrades();
    openTrades.forEach((openTrade) => {
      if (exchangeOpenTradesMap.has(openTrade.id)) {
        return;
      }

      for (let i = 0; i < this.session.trades.length; i++) {
        if (this.session.trades[i].id !== openTrade.id) {
          continue;
        }

        this.session.trades.splice(i, 1);
      }

      logger.info(chalk.bold(
        `Seems like you closed the trade with ID "${openTrade.id}" manually on the exchange, ` +
        `so we are removing this trade from our trades array.`
      ));
    });

    return true;
  }

  _printTradableAssets() {
    logger.info(chalk.bold(
      'I will be trading with the following assets:'
    ));
    logger.info(chalk.bold(
      `Strategy name: ${JSON.stringify(this.session.strategy.name)}; ` +
      `Strategy parameters: ${JSON.stringify(this.session.strategy.parameters)}; ` +
      `Session asset: ${this.session.getKey()}`
    ));
  }
}
