import { Asset } from '../Asset/Asset';

export interface OrderFeesInterface {
  amountPercentage: number;
}

export enum OrderFeesTypeEnum {
  MAKER = 'MAKER',
  TAKER = 'TAKER',
}

export class OrderFees implements OrderFeesInterface {
  amountPercentage: number;

  constructor(amountPercentage: number) {
    this.amountPercentage = amountPercentage;
  }
}
