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
  asset: string; // Must be underscore delimited, like: BTC_ETH
  side: OrderSideEnum;
  type: OrderTypeEnum;
  amount: string;
  time: number;
  isCompleted: boolean;
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
  asset: string;
  side: OrderSideEnum;
  type: OrderTypeEnum;
  amount: string;
  time: number;
  isCompleted: boolean;
  exchangeResponse: unknown;
  session: Session;
  exchange: Exchange;

  constructor(
    id: string,
    asset: string,
    side: OrderSideEnum,
    amount: string
  ) {
    this.id = id;
    this.asset = asset;
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
