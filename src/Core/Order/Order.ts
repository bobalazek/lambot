import { AssetPair } from '../Asset/AssetPair';
import { Assets } from '../Asset/Assets';
import { ExchangeAccountTypeEnum } from '../Exchange/ExchangeAccount';

export interface OrderInterface {
  id: string; // Prefix each order with the session id, so we know where it came from. "LAMBOT_{SESSION_ID}_{BUY_OR_SELL}"
  assetPair: AssetPair;
  side: OrderSideEnum;
  amount: string;
  price: string; // only relevant for limit orders
  type: OrderTypeEnum;
  accountType: ExchangeAccountTypeEnum;
  exchangeResponse: unknown;
  toExport(): unknown;
}

export enum OrderSideEnum {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum OrderTypeEnum {
  LIMIT = 'LIMIT',
  MARKET = 'MARKET',
}

export class Order implements OrderInterface {
  id: string;
  assetPair: AssetPair;
  side: OrderSideEnum;
  amount: string;
  price: string;
  type: OrderTypeEnum;
  accountType: ExchangeAccountTypeEnum;
  exchangeResponse: unknown;

  constructor(
    id: string,
    assetPair: AssetPair,
    side: OrderSideEnum,
    amount: string,
    price: string = null,
    type: OrderTypeEnum = OrderTypeEnum.MARKET,
    accountType: ExchangeAccountTypeEnum = ExchangeAccountTypeEnum.SPOT,
    exchangeResponse: unknown = null
  ) {
    this.id = id;
    this.assetPair = assetPair;
    this.side = side;
    this.amount = amount;
    this.price = price;
    this.type = type;
    this.accountType = accountType;
    this.exchangeResponse = exchangeResponse;
  }

  toExport() {
    return {
      id: this.id,
      assetPair: [
        this.assetPair.assetBase.toString(),
        this.assetPair.assetQuote.toString(),
      ],
      side: this.side,
      amount: this.amount,
      price: this.price,
      type: this.type,
      accountType: this.accountType,
      exchangeResponse: this.exchangeResponse,
    };
  }

  static fromImport(data: any): Order {
    const order = new Order(
      data.id,
      new AssetPair(
        Assets.getBySymbol(data.assetPair[0]),
        Assets.getBySymbol(data.assetPair[1]),
      ),
      data.side,
      data.amount,
      data.price,
      data.type,
      data.accountType
    );
    order.exchangeResponse = data.exchangeResponse;

    return order;
  }
}
