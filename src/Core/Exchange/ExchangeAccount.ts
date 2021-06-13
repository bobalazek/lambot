import { ExchangeAccountAssetsMap } from './ExchangeAccountAsset';
import { ExchangePosition } from './ExchangePosition';

export interface ExchangeAccountInterface {
  type: ExchangeAccountTypeEnum;
  assets: ExchangeAccountAssetsMap;
  positions: ExchangePosition[];
  toExport(): unknown;
}

export enum ExchangeAccountTypeEnum {
  SPOT = 'SPOT',
  FUTURES = 'FUTURES',
  MARGIN = 'MARGIN',
  OPTIONS = 'OPTIONS',
}

export type ExchangeAccountsMap = Map<string, ExchangeAccountInterface>;

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
      assets: this.assets.entries(),
      positions: this.positions.map((position) => {
        return position.toExport();
      }),
    };
  }

  static fromImport(data: any): ExchangeAccount {
    const exchangeAccount = new ExchangeAccount(data.type);

    exchangeAccount.assets = new Map(data.assets);

    data.forEach((positionData) => {
      exchangeAccount.positions.push(ExchangePosition.fromImport(positionData));
    });

    return exchangeAccount;
  }
}
