import { ApiCredentials } from './ApiCredentials';
import { Asset, AssetPair } from './Asset';
import { Order, OrderFees } from './Order';
import { Session } from './Session';

export interface ExchangeInterface {
  key: string;
  name: string;
  apiCredentials: ApiCredentials;
  boot(session: Session): Promise<boolean>;
  getAccountOrders(): Promise<Order[]>;
  newAccountOrder(order: Order): Promise<Order>;
  getAccountAssets(): Promise<ExchangeAccountAsset[]>;
  getAssetFees(symbol: string, amount: string): Promise<OrderFees>;
  getAssetPairs(asset: Asset): Promise<AssetPair[]>;
  buyAsset(symbol: string, amount: string): Promise<Order>;
  sellAsset(symbol: string, amount: string): Promise<Order>;
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
  _assetPairPrices: ExchangeAssetPricesMap;

  constructor(
    key: string,
    name: string,
    apiCredentials: ApiCredentials
  ) {
    this.key = key;
    this.name = name;
    this.apiCredentials = apiCredentials;
    this._assetPairPrices = new Map();
  }

  async boot(session: Session): Promise<boolean> {
    throw new Error('boot() not implemented yet.');
  }

  async getAccountOrders(): Promise<Order[]> {
    throw new Error('getAccountOrders() not implemented yet.');
  }

  async newAccountOrder(order: Order): Promise<Order> {
    throw new Error('newAccountOrder() not implemented yet.');
  }

  async getAccountAssets(): Promise<ExchangeAccountAsset[]> {
    throw new Error('getAccountAssets() not implemented yet.');
  }

  async getAssetFees(symbol: string, amount: string): Promise<OrderFees> {
    throw new Error('getAssetFees() not implemented yet.');
  }

  async getAssetPairs(asset: Asset): Promise<AssetPair[]> {
    throw new Error('getAssetPairs() not implemented yet.');
  }

  async buyAsset(symbol: string, amount: string): Promise<Order> {
    throw new Error('buyAsset() not implemented yet.');
  }

  async sellAsset(symbol: string, amount: string): Promise<Order> {
    throw new Error('sellAsset() not implemented yet.');
  }

  getAssetPairsSet(): Set<string> {
    const assetPairs = new Set<string>();

    this._assetPairPrices.forEach((_, key) => {
      assetPairs.add(key);
    });

    return assetPairs;
  }

  getAssetPairPrices(symbol?: string): ExchangeAssetPricesMap | ExchangeAssetPrice {
    return symbol
      ? this._assetPairPrices.get(symbol)
      : this._assetPairPrices;
  }

  addAssetPairPrice(symbol: string): ExchangeAssetPrice {
    const assetPairPrice = new ExchangeAssetPrice();

    this._assetPairPrices.set(symbol, assetPairPrice);

    return assetPairPrice;
  }

  /**
   * @param symbol
   * @param assetPriceDataEntry
   * @param lastEntryInterval Only add the entry if the last entry was created longer ago then the specified interval
   * @returns
   */
  addAssetPairPriceEntry(
    symbol: string,
    assetPriceDataEntry: ExchangeAssetPriceEntryInterface,
    lastEntryInterval: number = 5000
  ): boolean {
    const now = +new Date();
    const symbolAssetPrice = <ExchangeAssetPrice>this.getAssetPairPrices(symbol);

    if (symbolAssetPrice.entries.length > 0) {
      const assetPricesLast = symbolAssetPrice.entries[symbolAssetPrice.entries.length - 1];
      if (now - assetPricesLast.timestamp < lastEntryInterval) {
        return false;
      }
    }

    symbolAssetPrice.entries.push(assetPriceDataEntry);

    return true;
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
