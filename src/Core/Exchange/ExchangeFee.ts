import { Asset } from '../Asset/Asset';

export interface ExchangeFeeInterface {
  type: ExchangeFeeTypeEnum;
  amount: number;
  asset?: Asset;
}

export enum ExchangeFeeTypeEnum {
  PERCENTAGE = 'PERCENTAGE',
  AMOUNT = 'AMOUNT',
}

export class ExchangeFee implements ExchangeFeeInterface {
  type: ExchangeFeeTypeEnum;
  amount: number;
  asset?: Asset;

  constructor(
    type: ExchangeFeeTypeEnum,
    amount: number,
    asset: Asset = null
  ) {
    this.type = type;
    this.amount = amount;
    this.asset = asset;
  }

  /***** Export/Import *****/
  toExport() {
    return {
      type: this.type,
      amount: this.amount,
      asset: this.asset?.toExport(),
    };
  }

  static fromImport(data: any): ExchangeFee {
    return new ExchangeFee(
      data.type,
      data.amount,
      data.asset
    );
  }
}
