export interface ExchangeResponseOrderFeesInterface {
  amountPercentage: number;
}

export class ExchangeResponseOrderFees implements ExchangeResponseOrderFeesInterface {
  amountPercentage: number;

  constructor(amountPercentage: number) {
    this.amountPercentage = amountPercentage;
  }
}
