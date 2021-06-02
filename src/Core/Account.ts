import { Asset, AssetFees, AssetFeesInterface, AssetInterface } from './Asset';
import { Exchange, ExchangeInterface } from './Exchange';
import { Order, OrderInterface, OrderSideEnum, OrderTypeEnum } from './Order';

export interface AccountInterface {
  key: string;
  name: string;
  exchange: ExchangeInterface;
  getOrders(): Promise<OrderInterface[]>;
  getOrder(id: string): Promise<OrderInterface>;
  cancelOrder(id: string): Promise<OrderInterface>;
  newOrder(order: OrderInterface): Promise<OrderInterface>;
  getAssets(): Promise<AssetInterface[]>;
  getAsset(symbol: string): Promise<AssetInterface>;
  getAssetFees(symbol: string, quantity: string): Promise<AssetFeesInterface>;
  buyAsset(symbol: string, quantity: string): Promise<OrderInterface>;
  sellAsset(symbol: string, quantity: string): Promise<OrderInterface>;
}

export interface AccountAssetInterface {
  account: AccountInterface;
  asset: AssetInterface;
  quantityFree: string;
  quantityLocked: string;
}
export class Account implements AccountInterface {
  key: string;
  name: string;
  exchange: Exchange;

  constructor(key: string, name: string, exchange: Exchange) {
    this.key = key;
    this.name = name;
    this.exchange = exchange;
  }

  getOrders(): Promise<Order[]> {
    return new Promise((resolve) => {
      return resolve([]);
    });
  }

  getOrder(id: string): Promise<Order> {
    return new Promise(async (resolve, reject) => {
      const orders = await this.getOrders();

      const order = orders.find((order) => {
        return order.id === id;
      });
      if (!order) {
        return reject(`Order with ID "${id}" not found.`);
      }

      return resolve(order);
    });
  }

  cancelOrder(id: string): Promise<Order> {
    return new Promise(async (resolve, reject) => {
      const order = this.getOrder(id);
      if (!order) {
        return reject(`Order with ID "${id}" not found.`);
      }

      return resolve(order);
    });
  }

  newOrder(order: Order): Promise<Order> {
    return new Promise(async (resolve) => {
      return resolve(order);
    });
  }

  getAssets(): Promise<Asset[]> {
    return new Promise((resolve) => {
      return resolve([]);
    });
  }

  getAsset(symbol: string): Promise<Asset> {
    return new Promise(async (resolve, reject) => {
      const assets = await this.getAssets();

      const asset = assets.find((asset) => {
        return asset.symbol === symbol;
      });
      if (!asset) {
        return reject(`Asset with symbol "${symbol}" not found.`);
      }

      return resolve(asset);
    });
  }

  getAssetFees(symbol: string, quantity: string): Promise<AssetFees> {
    return new Promise(async (resolve) => {
      const assetFees = this._getMockAssetFees();

      return resolve(assetFees);
    });
  }

  buyAsset(symbol: string, quantity: string): Promise<Order> {
    return new Promise(async (resolve) => {
      const order = this._getMockOrder();

      return resolve(this.newOrder(order));
    });
  }

  sellAsset(symbol: string, quantity: string): Promise<Order> {
    return new Promise(async (resolve) => {
      const order = this._getMockOrder();

      return resolve(this.newOrder(order));
    });
  }

  /***** Mocks *****/
  private _getMockAssetFees(): AssetFees {
    return new AssetFees(
      '0.075',
      '0.075'
    );
  }

  private _getMockOrder(): Order {
    return new Order(
      '0001',
      'BTC',
      OrderSideEnum.SELL,
      OrderTypeEnum.LIMIT,
      '0.000000001'
    );
  }
}

export class AccountAsset implements AccountAssetInterface {
  account: AccountInterface;
  asset: AssetInterface;
  quantityFree: string;
  quantityLocked: string;

  constructor(
    account: AccountInterface,
    asset: AssetInterface,
    quantityFree: string = '0',
    quantityLocked: string = '0'
  ) {
    this.account = account;
    this.asset = asset;
    this.quantityFree = quantityFree;
    this.quantityLocked = quantityLocked;
  }
}
