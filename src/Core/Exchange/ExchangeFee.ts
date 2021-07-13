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
