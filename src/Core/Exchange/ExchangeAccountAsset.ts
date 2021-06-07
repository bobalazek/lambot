import { Exchange } from './Exchange';

export interface ExchangeAccountAssetInterface {
  exchange: Exchange;
  symbol: string;
  getAmountFree(): Promise<string>;
  getAmountLocked(): Promise<string>;
}

export class ExchangeAccountAsset implements ExchangeAccountAssetInterface {
  exchange: Exchange;
  symbol: string;

  constructor(
    exchange: Exchange,
    symbol: string
  ) {
    this.exchange = exchange;
    this.symbol = symbol;
  }

  async getAmountFree() {
    return '0';
  }

  async getAmountLocked() {
    return '0';
  }
}
