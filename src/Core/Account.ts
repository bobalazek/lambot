import { ApiCredentials } from './ApiCredentials';
import { Asset, AssetInterface } from './Asset';
import { Order, OrderInterface, OrderSideEnum, OrderTypeEnum } from './Order';

export interface AccountInterface {
  name: string;
  apiCredentials: Map<string, ApiCredentials>;
  assets: AccountAssetInterface[];
  getOrders(): Promise<OrderInterface[]>;
  getOrder(id: string): Promise<OrderInterface>;
  cancelOrder(id: string): Promise<OrderInterface>;
  newOrder(order: OrderInterface): Promise<OrderInterface>;
  getAssets(): Promise<AssetInterface[]>;
  getAsset(symbol: string): Promise<AssetInterface>;
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
  name: string;
  apiCredentials: Map<string, ApiCredentials>;
  assets: AccountAssetInterface[];

  constructor(
    name: string,
    apiCredentials: Map<string, ApiCredentials>
  ) {
    this.name = name;
    this.apiCredentials = apiCredentials;
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

  buyAsset(symbol: string, quantity: string): Promise<Order> {
    return new Promise(async (resolve) => {
      const order = new Order(
        '0001',
        symbol,
        OrderSideEnum.BUY,
        OrderTypeEnum.LIMIT,
        quantity
      );

      return resolve(this.newOrder(order));
    });
  }

  sellAsset(symbol: string, quantity: string): Promise<Order> {
    return new Promise(async (resolve) => {
      const order = new Order(
        '0001',
        symbol,
        OrderSideEnum.SELL,
        OrderTypeEnum.LIMIT,
        quantity
      );

      return resolve(this.newOrder(order));
    });
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
