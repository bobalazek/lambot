import { Asset } from '../Asset/Asset';
import { AssetPair } from '../Asset/AssetPair';
import { Exchange } from '../Exchange/Exchange';
import { Session } from '../Session/Session';

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
  id: string; // Prefix each order with the session id, so we know where it came from. "LAMBOT_{SESSION_ID}_{BUY_OR_SELL}"
  assetPair: AssetPair;
  side: OrderSideEnum;
  amount: string;
  price: string; // only relevant for limit orders
  type: OrderTypeEnum;
  accountType: OrderAccountTypeEnum;
}

export interface OrderFeesInterface {
  amountPercentage: number;
  asset: Asset;
}

export enum OrderFeesTypeEnum {
  MAKER = 'MAKER',
  TAKER = 'TAKER',
}

export class Order implements OrderInterface {
  id: string;
  assetPair: AssetPair;
  side: OrderSideEnum;
  amount: string;
  price: string;
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
    price: string = null,
    type: OrderTypeEnum = OrderTypeEnum.MARKET,
    accountType: OrderAccountTypeEnum = OrderAccountTypeEnum.SPOT
  ) {
    this.id = id;
    this.assetPair = assetPair;
    this.side = side;
    this.amount = amount;
    this.price = price;
    this.type = type;
    this.accountType = accountType;
  }
}

export class OrderFees implements OrderFeesInterface {
  amountPercentage: number;
  asset: Asset;

  constructor(
    amountPercentage: number,
    asset: Asset
  ) {
    this.amountPercentage = amountPercentage;
    this.asset = asset;
  }
}
