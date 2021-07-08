import { AssetPair } from '../Asset/AssetPair';
import { ExchangeAccountTypeEnum } from './ExchangeAccount';

export interface ExchangeOrderInterface {
  id: string; // Prefix each order with the session id, so we know where it came from. "LAMBOT_{SESSION_ID}_{BUY_OR_SELL}"
  assetPair: AssetPair;
  side: ExchangeOrderSideEnum;
  amount: string;
  price: string; // only relevant for limit orders
  type: ExchangeOrderTypeEnum;
  accountType: ExchangeAccountTypeEnum;
  exchangeResponse: unknown;
}

export enum ExchangeOrderSideEnum {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum ExchangeOrderTypeEnum {
  LIMIT = 'LIMIT',
  MARKET = 'MARKET',
}

export enum ExchangeOrderTimeInForceEnum {
  GTC = 'GTC', // Good Til Canceled - An order will be on the book unless the order is canceled.
  IOC = 'IOC', // Immediate Or Cancel - An order will try to fill the order as much as it can before the order expires.
  FOK = 'FOK', // Fill or Kill - An order will expire if the full order cannot be filled upon execution.
}

export class ExchangeOrder implements ExchangeOrderInterface {
  id: string;
  assetPair: AssetPair;
  side: ExchangeOrderSideEnum;
  amount: string;
  price: string;
  type: ExchangeOrderTypeEnum;
  accountType: ExchangeAccountTypeEnum;
  exchangeResponse: unknown;

  constructor(
    id: string,
    assetPair: AssetPair,
    side: ExchangeOrderSideEnum,
    amount: string,
    price: string = null,
    type: ExchangeOrderTypeEnum,
    accountType: ExchangeAccountTypeEnum,
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

  getKey() {
    return JSON.stringify({
      id: this.id,
      side: this.side,
      assetPair: this.assetPair.toExport(),
      amount: this.amount,
      price: this.price,
      type: this.type,
    });
  }

  /***** Export/Import *****/
  toExport() {
    return {
      id: this.id,
      assetPair: this.assetPair.toExport(),
      side: this.side,
      amount: this.amount,
      price: this.price,
      type: this.type,
      accountType: this.accountType,
      exchangeResponse: this.exchangeResponse,
    };
  }

  static fromImport(data: any): ExchangeOrder {
    const order = new ExchangeOrder(
      data.id,
      AssetPair.fromImport(data.assetPair),
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
