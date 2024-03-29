import { AssetPair } from '../Asset/AssetPair';
import { ExchangeAccountTypeEnum } from './ExchangeAccount';
import { ExchangeOrderSideEnum } from './ExchangeOrderSide';
import { ExchangeOrderTypeEnum } from './ExchangeOrderType';

export interface ExchangeOrderInterface {
  id: string; // Prefix each order with the session id, so we know where it came from. "LAMBOT_{SESSION_ID}_{BUY_OR_SELL}"
  assetPair: AssetPair;
  side: ExchangeOrderSideEnum;
  amount: string;
  price: string | null; // only relevant for limit orders
  type: ExchangeOrderTypeEnum;
  accountType: ExchangeAccountTypeEnum;
  exchangeResponse: unknown;
}

export class ExchangeOrder implements ExchangeOrderInterface {
  id: string;
  assetPair: AssetPair;
  side: ExchangeOrderSideEnum;
  amount: string;
  price: string | null;
  type: ExchangeOrderTypeEnum;
  accountType: ExchangeAccountTypeEnum;
  exchangeResponse: unknown;

  constructor(
    id: string,
    assetPair: AssetPair,
    side: ExchangeOrderSideEnum,
    amount: string,
    price: string | null = null,
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
