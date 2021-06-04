import { ApiCredentials } from './ApiCredentials';
import { AssetPair } from './Asset';
import { Order, OrderFees } from './Order';
import { Session } from './Session';

export interface ExchangeInterface {
  key: string;
  name: string;
  apiCredentials: ApiCredentials;
  boot(session: Session): Promise<boolean>;
  getAccountOrders(): Promise<Order[]>;
  addAccountOrder(order: Order): Promise<Order>;
  getAccountAssets(): Promise<ExchangeAccountAsset[]>;
  getAssetPairs(): Promise<AssetPair[]>;
  getAssetFees(symbol: string, amount: string): Promise<OrderFees>;
  getSession(): Session;
  addSessionAssetPairPrice(symbol: string, assetPairPrice: ExchangeAssetPrice): ExchangeAssetPrice;
  getSessionAssetPairPriceEntryLast(symbol: string): ExchangeAssetPriceEntryInterface | null;
  addSessionAssetPairPriceEntry(
    symbol: string,
    assetPriceDataEntry: ExchangeAssetPriceEntryInterface,
    lastEntryInterval: number
  ): ExchangeAssetPriceEntryInterface;
}

export type ExchangeAssetPricesMap = Map<string, ExchangeAssetPriceInterface>;

export interface ExchangeAssetPriceInterface {
  entries: ExchangeAssetPriceEntryInterface[];
}

export interface ExchangeAssetPriceEntryInterface {
  timestamp: number;
  askPrice: string;
  bidPrice: string;
}

export interface ExchangeAccountAssetInterface {
  exchange: Exchange;
  symbol: string;
  amountFree: string;
  amountLocked: string;
}

export class Exchange implements ExchangeInterface {
  key: string;
  name: string;
  apiCredentials: ApiCredentials;
  _session: Session;
  _sessionAssetPairPrices: ExchangeAssetPricesMap;

  constructor(
    key: string,
    name: string,
    apiCredentials: ApiCredentials
  ) {
    this.key = key;
    this.name = name;
    this.apiCredentials = apiCredentials;
    this._sessionAssetPairPrices = new Map();
  }

  async boot(session: Session): Promise<boolean> {
    this._session = session;

    return true;
  }

  async getAccountOrders(): Promise<Order[]> {
    throw new Error('getAccountOrders() not implemented yet.');
  }

  async addAccountOrder(order: Order): Promise<Order> {
    throw new Error('addAccountOrder() not implemented yet.');
  }

  async getAccountAssets(): Promise<ExchangeAccountAsset[]> {
    throw new Error('getAccountAssets() not implemented yet.');
  }

  async getAssetPairs(): Promise<AssetPair[]> {
    throw new Error('getAssetPairs() not implemented yet.');
  }

  async getAssetFees(symbol: string, amount: string): Promise<OrderFees> {
    throw new Error('getAssetFees() not implemented yet.');
  }

  getSession(): Session {
    return this._session;
  }

  getSessionAssetPairPrices(symbol?: string): ExchangeAssetPricesMap | ExchangeAssetPrice {
    return symbol
      ? this._sessionAssetPairPrices.get(symbol)
      : this._sessionAssetPairPrices;
  }

  addSessionAssetPairPrice(
    symbol: string,
    assetPairPrice: ExchangeAssetPrice = new ExchangeAssetPrice()
  ): ExchangeAssetPrice {
    this._sessionAssetPairPrices.set(symbol, assetPairPrice);

    return assetPairPrice;
  }

  getSessionAssetPairPriceEntryLast(symbol: string): ExchangeAssetPriceEntryInterface | null {
    const symbolAssetPrice = <ExchangeAssetPrice>this.getSessionAssetPairPrices(symbol);
    if (
      !symbolAssetPrice ||
      symbolAssetPrice.entries.length === 0
    ) {
      return null;
    }

    return symbolAssetPrice.entries[symbolAssetPrice.entries.length - 1];
  }

  addSessionAssetPairPriceEntry(
    symbol: string,
    assetPriceDataEntry: ExchangeAssetPriceEntryInterface
  ): ExchangeAssetPriceEntryInterface {
    const symbolAssetPrice = <ExchangeAssetPrice>this.getSessionAssetPairPrices(symbol);

    symbolAssetPrice.entries.push(assetPriceDataEntry);

    return assetPriceDataEntry;
  }
}

export class ExchangeAccountAsset implements ExchangeAccountAssetInterface {
  exchange: Exchange;
  symbol: string;
  amountFree: string;
  amountLocked: string;

  constructor(
    exchange: Exchange,
    symbol: string,
    amountFree: string = '0',
    amountLocked: string = '0'
  ) {
    this.exchange = exchange;
    this.symbol = symbol;
    this.amountFree = amountFree;
    this.amountLocked = amountLocked;
  }
}

export class ExchangeAssetPrice {
  entries: ExchangeAssetPriceEntryInterface[];

  constructor() {
    this.entries = [];
  }
}
