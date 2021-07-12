import chalk from 'chalk';

import { AssetPair } from '../Asset/AssetPair';
import { ExchangeApiCredentialsInterface } from './ExchangeApiCredentials';
import { ExchangeAccount, ExchangeAccountsMap, ExchangeAccountTypeEnum } from './ExchangeAccount';
import { ExchangeAssetPairsMap } from './ExchangeAssetPairPrice';
import { ExchangeResponseAccountAssetInterface } from './Response/ExchangeResponseAccountAsset';
import { ExchangeResponseOrderFeesInterface } from './Response/ExchangeResponseOrderFees';
import { ExchangeResponseAssetPairInterface } from './Response/ExchangeResponseAssetPair';
import { ExchangeResponseAssetPairPriceEntryInterface } from './Response/ExchangeResponseAssetPairPriceEntry';
import { ExchangeResponseAssetPairCandlestickInterface } from './Response/ExchangeResponseAssetPairCandlestick';
import { ExchangeResponseAssetPairStatisticsInterface } from './Response/ExchangeResponseAssetPairStatistics';
import { ExchangeTradeTypeEnum } from './ExchangeTrade';
import { ExchangeOrder } from './ExchangeOrder';
import { ExchangeValidator } from './ExchangeValidator';
import { ExchangeOrderFeesTypeEnum } from './ExchangeOrderFees';
import { ExchangesFactory } from './ExchangesFactory';
import { Manager } from '../Manager';
import { Session } from '../Session/Session';
import { SessionManager } from '../Session/SessionManager';
import { SessionTradingTypeEnum } from '../Session/SessionTradingType';
import { asyncForEach } from '../../Utils/Helpers';
import logger from '../../Utils/Logger';

export interface ExchangeInterface {
  key: string;
  name: string;
  apiCredentials: ExchangeApiCredentialsInterface;
  accounts: ExchangeAccountsMap;
  assetPairs: ExchangeAssetPairsMap;
  session: Session;
  boot(session: Session): Promise<boolean>;
  convertAssetPairToString(assetPair: AssetPair): string;
  getAccountOrders(accountType: ExchangeAccountTypeEnum, assetPair?: AssetPair): Promise<ExchangeOrder[]>;
  addAccountOrder(accountType: ExchangeAccountTypeEnum, order: ExchangeOrder): Promise<ExchangeOrder>;
  getAccountAssets(accountType: ExchangeAccountTypeEnum): Promise<ExchangeResponseAccountAssetInterface[]>;
  getAssetPairs(): Promise<ExchangeResponseAssetPairInterface[]>;
  getAssetPairPrices(): Promise<ExchangeResponseAssetPairPriceEntryInterface[]>;
  getAssetPairStatistics(): Promise<ExchangeResponseAssetPairStatisticsInterface[]>;
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
  assetPairs: ExchangeAssetPairsMap;
  accounts: ExchangeAccountsMap;
  session: Session;

  constructor(
    key: string,
    name: string,
    apiCredentials: ExchangeApiCredentialsInterface
  ) {
    this.key = key;
    this.name = name;
    this.apiCredentials = apiCredentials;
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

    SessionManager.save(this.session);

    return true;
  }

  convertAssetPairToString(assetPair: AssetPair): string {
    throw new Error('convertAssetPairToString() not implemented yet.');
  }

  /***** API Data fetching ******/
  async getAccountOrders(accountType: ExchangeAccountTypeEnum, assetPair?: AssetPair): Promise<ExchangeOrder[]> {
    throw new Error('getAccountOrders() not implemented yet.');
  }

  async addAccountOrder(accountType: ExchangeAccountTypeEnum, order: ExchangeOrder): Promise<ExchangeOrder> {
    throw new Error('addAccountOrder() not implemented yet.');
  }

  async getAccountAssets(accountType: ExchangeAccountTypeEnum): Promise<ExchangeResponseAccountAssetInterface[]> {
    throw new Error('getAccountAssets() not implemented yet.');
  }

  async getAssetPairs(): Promise<ExchangeResponseAssetPairInterface[]> {
    throw new Error('getAssetPairs() not implemented yet.');
  }

  async getAssetPairPrices(): Promise<ExchangeResponseAssetPairPriceEntryInterface[]> {
    throw new Error('getAssetPairPrices() not implemented yet.');
  }

  async getAssetPairStatistics(): Promise<ExchangeResponseAssetPairStatisticsInterface[]> {
    throw new Error('getAssetPairStatistics() not implemented yet.');
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

  async _checkPersistenceData(): Promise<any> {
    if (
      Manager.isTestMode ||
      !this.session.isLoadedFromPersistence
    ) {
      return;
    }

    logger.debug('Checking persistence data ...');

    const exchangeOpenTradesSet = new Set<string>();
    const sessionOpenTrades = this.session.getOpenTrades();

    await asyncForEach(this.session.tradingTypes, async (accountType) => {
      const exchangeAccountType = this.getAccountType(accountType);
      const exchangeAccountOpenTrades = await this.getAccountOrders(exchangeAccountType);

      exchangeAccountOpenTrades.forEach((openTrade) => {
        exchangeOpenTradesSet.add(openTrade.id);
      });

      logger.debug(
        `Found ${exchangeAccountOpenTrades.length} open trades on the exchange for account type "${accountType}".`
      );
    });

    sessionOpenTrades.forEach((openTrade) => {
      if (exchangeOpenTradesSet.has(openTrade.id)) {
        return;
      }

      const sessionTradeIndex = this.session.trades.findIndex((trade) => {
        return trade.id === openTrade.id;
      });
      if (sessionTradeIndex === -1) {
        return;
      }

      const sessionTrade = this.session.trades[sessionTradeIndex];

      this.session.trades.splice(sessionTradeIndex, 1);

      logger.info(chalk.bold(
        `Seems like you closed the trade with ID "${sessionTrade.id}" manually on the exchange, ` +
        `so we are removing this trade from our trades array!`
      ));
    });
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
