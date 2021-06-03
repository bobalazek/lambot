import { Exchange } from './Exchange';
import { Session } from './Session';

export enum OrderSideEnum {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum OrderTypeEnum {
  LIMIT = 'LIMIT',
  MARKET = 'MARKET',
  STOP_LOSS = 'STOP_LOSS',
  STOP_LOSS_LIMIT = 'STOP_LOSS_LIMIT',
  TAKE_PROFIT = 'TAKE_PROFIT',
  TAKE_PROFIT_LIMIT = 'TAKE_PROFIT_LIMIT',
  LIMIT_MARKER = 'LIMIT_MARKER',
}

export enum OrderStatusEnum {
  NEW = 'NEW',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
  FILLED = 'FILLED',
  CANCELED = 'CANCELED',
  PENDING_CANCEL = 'PENDING_CANCEL',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export interface OrderInterface {
  id: string; // Prefix each order with the session id, so we know where it came from.
  symbol: string;
  side: OrderSideEnum;
  type: OrderTypeEnum;
  status: OrderStatusEnum;
  baseAsset: string;
  baseAssetAmount: string;
  baseAssetPrice: string;
  quoteAsset: string;
  quoteAssetQuantity: string;
  quoteAssetPrice: string;
  fee: string;
  trailing: boolean;
  trailingPercentage: number;
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
  status: OrderStatusEnum;
  baseAsset: string;
  baseAssetAmount: string;
  baseAssetPrice: string;
  quoteAsset: string;
  quoteAssetQuantity: string;
  quoteAssetPrice: string;
  fee: string;
  trailing: boolean;
  trailingPercentage: number;
  time: number;
  exchangeResponse: unknown;
  session: Session;
  exchange: Exchange;

  constructor(
    id: string,
    symbol: string,
    side: OrderSideEnum,
    type: OrderTypeEnum,
    quantity: string
  ) {
    this.id = id;
    this.symbol = symbol;
    this.side = side;
    this.type = type;
    // TODO: quantity
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
