export interface ExchangeOrderFeesInterface {
  amountPercentage: number;
}

export enum ExchangeOrderFeesTypeEnum {
  MAKER = 'MAKER',
  TAKER = 'TAKER',
}

export class ExchangeOrderFees implements ExchangeOrderFeesInterface {
  amountPercentage: number;

  constructor(amountPercentage: number) {
    this.amountPercentage = amountPercentage;
  }
}
