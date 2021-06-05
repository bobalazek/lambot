import { AssetPair } from './Asset';
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

export enum OrderAccountTypeEnum {
  SPOT = 'SPOT',
  FUTURES = 'FUTURES',
  MARGIN = 'MARGIN',
  OPTIONS = 'OPTIONS',
}

export interface OrderInterface {
  id: string; // Prefix each order with the session id, so we know where it came from.
  assetPair: AssetPair;
  side: OrderSideEnum;
  amount: string;
  type: OrderTypeEnum;
  accountType: OrderAccountTypeEnum;
}

export interface OrderFeesInterface {
  takerFeePercentage: string;
  makerFeePercentage: string;
}

export class Order implements OrderInterface {
  id: string;
  assetPair: AssetPair;
  side: OrderSideEnum;
  amount: string;
  type: OrderTypeEnum;
  accountType: OrderAccountTypeEnum;

  _time: number;
  _exchangeResponse: unknown;
  _session: Session;
  _exchange: Exchange;

  constructor(
    id: string,
    assetPair: AssetPair,
    side: OrderSideEnum,
    amount: string,
    type: OrderTypeEnum = OrderTypeEnum.MARKET,
    accountType: OrderAccountTypeEnum = OrderAccountTypeEnum.SPOT
  ) {
    this.id = id;
    this.assetPair = assetPair;
    this.side = side;
    this.amount = amount;
    this.type = type;
    this.accountType = accountType;
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
