import { Exchange } from './Exchange';
import { Session } from './Session';

export enum OrderSideEnum {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum OrderTypeEnum {
  LIMIT = 'LIMIT',
  MARKET = 'MARKET',
}
export interface OrderInterface {
  id: string; // Prefix each order with the session id, so we know where it came from.
  symbol: string; // BTCETH
  side: OrderSideEnum;
  type: OrderTypeEnum;
  amount: string;
  fee: string;
  time: number;
  exchangeResponse: unknown;
  session: Session;
  exchange: Exchange;
}

export interface OrderFeesInterface {
  takerFeePercentage: string;
  makerFeePercentage: string;
}

export class Order implements OrderInterface {
  id: string;
  symbol: string;
  side: OrderSideEnum;
  type: OrderTypeEnum;
  amount: string;
  fee: string;
  time: number;
  exchangeResponse: unknown;
  session: Session;
  exchange: Exchange;

  constructor(
    id: string,
    symbol: string,
    side: OrderSideEnum,
    amount: string
  ) {
    this.id = id;
    this.symbol = symbol;
    this.side = side;
    this.amount = amount;
  }
}

export class OrderFees implements OrderFeesInterface {
  takerFeePercentage: string;
  makerFeePercentage: string;

  constructor(takerFeePercentage: string, makerFeePercentage: string) {
    this.takerFeePercentage = takerFeePercentage;
    this.makerFeePercentage = makerFeePercentage;
  }
}
