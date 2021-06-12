import { ExchangeAccountAssetsMap } from './ExchangeAccountAsset';
import { ExchangePosition } from './ExchangePosition';

export interface ExchangeAccountInterface {
  type: ExchangeAccountTypeEnum;
  assets: ExchangeAccountAssetsMap;
  positions: ExchangePosition[];
  toExport(): unknown;
}

export type ExchangeAccountsMap = Map<string, ExchangeAccountInterface>;

export enum ExchangeAccountTypeEnum {
  SPOT = 'SPOT',
  FUTURES = 'FUTURES',
  MARGIN = 'MARGIN',
  OPTIONS = 'OPTIONS',
}

export class ExchangeAccount implements ExchangeAccountInterface {
  type: ExchangeAccountTypeEnum;
  assets: ExchangeAccountAssetsMap;
  positions: ExchangePosition[];

  constructor(type: ExchangeAccountTypeEnum) {
    this.type = type;
    this.assets = new Map();
    this.positions = [];
  }

  /***** Export/Import *****/
  toExport() {
    return {
      type: this.type,
      positions: this.positions.map((position) => {
        return position.toExport();
      }),
    };
  }

  static fromImport(data: any): ExchangeAccount {
    // this.assets should be imported on the fly, with a API call

    const exchangeAccount = new ExchangeAccount(data.type);

    data.forEach((position) => {
      exchangeAccount.positions.push(ExchangePosition.fromImport(position));
    });

    return exchangeAccount;
  }
}
