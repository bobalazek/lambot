import { AssetPair } from '../Asset/AssetPair';
import { Assets } from '../Asset/Assets';
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
  toString(): string;
  toExport(): unknown;
}

export enum ExchangeOrderSideEnum {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum ExchangeOrderTypeEnum {
  LIMIT = 'LIMIT',
  MARKET = 'MARKET',
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
    type: ExchangeOrderTypeEnum = ExchangeOrderTypeEnum.MARKET,
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

  /***** Export/Import *****/
  toString() {
    return JSON.stringify({
      id: this.id,
      side: this.side,
      assetPair: [
        this.assetPair.assetBase,
        this.assetPair.assetQuote,
      ],
      amount: this.amount,
      price: this.price,
      type: this.type,
    });
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

  static fromImport(data: any): ExchangeOrder {
    const order = new ExchangeOrder(
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
