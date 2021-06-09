import { ExchangeAccountAssetsMap } from './ExchangeAccountAsset';

export interface ExchangeAccountInterface {
  type: ExchangeAccountTypeEnum;
}

export type ExchangeAccountsMap = Map<string, ExchangeAccountInterface>;

export enum ExchangeAccountTypeEnum {
  SPOT = 'SPOT',
}

export class ExchangeAccount implements ExchangeAccountInterface {
  type: ExchangeAccountTypeEnum;
  assets: ExchangeAccountAssetsMap;

  constructor(type: ExchangeAccountTypeEnum) {
    this.type = type;
    this.assets = new Map();
  }
}
