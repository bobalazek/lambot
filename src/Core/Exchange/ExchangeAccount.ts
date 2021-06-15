import { ExchangeResponseAccountAssetInterface } from './Response/ExchangeResponseAccountAsset';
import { ExchangeTrade } from './ExchangeTrade';

export interface ExchangeAccountInterface {
  type: ExchangeAccountTypeEnum;
  assets: ExchangeAccountAssetsMap;
  trades: ExchangeTrade[];
  toExport(): unknown;
}

export enum ExchangeAccountTypeEnum {
  SPOT = 'SPOT',
  FUTURES = 'FUTURES',
  MARGIN = 'MARGIN',
  OPTIONS = 'OPTIONS',
}

export type ExchangeAccountAssetsMap = Map<string, ExchangeResponseAccountAssetInterface>;

export type ExchangeAccountsMap = Map<string, ExchangeAccountInterface>;

export class ExchangeAccount implements ExchangeAccountInterface {
  type: ExchangeAccountTypeEnum;
  assets: ExchangeAccountAssetsMap;
  trades: ExchangeTrade[];

  constructor(type: ExchangeAccountTypeEnum) {
    this.type = type;
    this.assets = new Map();
    this.trades = [];
  }

  /***** Export/Import *****/
  toExport() {
    return {
      type: this.type,
      assets: this.assets.entries(),
      trades: this.trades.map((trade) => {
        return trade.toExport();
      }),
    };
  }

  static fromImport(data: any): ExchangeAccount {
    const exchangeAccount = new ExchangeAccount(data.type);

    exchangeAccount.assets = new Map(data.assets);

    data.forEach((tradeData) => {
      exchangeAccount.trades.push(ExchangeTrade.fromImport(tradeData));
    });

    return exchangeAccount;
  }
}
