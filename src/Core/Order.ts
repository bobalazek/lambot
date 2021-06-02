import { Asset, AssetInterface } from './Asset';
import { Exchange, ExchangeInterface } from './Exchange';
import { Session, SessionInterface } from './Session';
import { Strategy, StrategyInterface } from './Strategy';

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
  baseAsset: AssetInterface;
  baseAssetAmount: string;
  baseAssetPrice: string;
  quoteAsset: AssetInterface;
  quoteAssetQuantity: string;
  quoteAssetPrice: string;
  feePercentage: number;
  trailing: boolean;
  trailingPercentage: number;
  time: number;
  session: SessionInterface;
  exchange: ExchangeInterface;
  strategy: StrategyInterface;
}

export class Order implements OrderInterface {
  id: string;
  symbol: string;
  side: OrderSideEnum;
  type: OrderTypeEnum;
  status: OrderStatusEnum;
  baseAsset: Asset;
  baseAssetAmount: string;
  baseAssetPrice: string;
  quoteAsset: Asset;
  quoteAssetQuantity: string;
  quoteAssetPrice: string;
  feePercentage: number;
  trailing: boolean;
  trailingPercentage: number;
  time: number;
  session: Session;
  exchange: Exchange;
  strategy: Strategy;

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
