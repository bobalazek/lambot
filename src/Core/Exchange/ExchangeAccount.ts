import { ExchangeResponseAccountAssetInterface } from './Response/ExchangeResponseAccountAsset';

export interface ExchangeAccountInterface {
  type: ExchangeAccountTypeEnum;
  assets: ExchangeAccountAssetsMap;
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

  constructor(type: ExchangeAccountTypeEnum) {
    this.type = type;
    this.assets = new Map();
  }

  /***** Export/Import *****/
  toExport() {
    return {
      type: this.type,
      assets: this.assets.entries(),
    };
  }

  static fromImport(data: any): ExchangeAccount {
    const exchangeAccount = new ExchangeAccount(data.type);

    exchangeAccount.assets = new Map(data.assets);

    return exchangeAccount;
  }
}
