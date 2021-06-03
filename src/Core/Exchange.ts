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

export class ExchangeAssetPrice extends Map<string, {
  timestamp: number,
  value: string,
}[]> {
  /**
   * BTCETH: [
   *   100000000: '0.00001',
   *   100000001: '0.00002',
   *   100000003: '0.00003',
   * ],
   */
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
  _assetPrices: ExchangeAssetPrice;

  constructor(
    key: string,
    name: string,
    apiCredentials: ApiCredentials
  ) {
    this.key = key;
    this.name = name;
    this.apiCredentials = apiCredentials;
    this._assetPrices = new Map();
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
