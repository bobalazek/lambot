import { Asset, AssetInterface } from './Asset';
import { Order, OrderInterface, OrderSideEnum, OrderStatusEnum, OrderTypeEnum } from './Order';

export interface ExchangeInterface {
  key: string;
  name: string;
  getOrders(): Promise<OrderInterface[]>;
  getOrder(id: string): Promise<OrderInterface>;
  cancelOrder(id: string): Promise<OrderInterface>;
  newOrder(order: OrderInterface): Promise<OrderInterface>;
  getAssets(): Promise<AssetInterface[]>;
  getAsset(symbol: string): Promise<AssetInterface>;
  buyAsset(symbol: string, quantity: string): Promise<OrderInterface>;
  sellAsset(symbol: string, quantity: string): Promise<OrderInterface>;
}

export class Exchange implements ExchangeInterface {
  key: string;
  name: string;

  constructor(key: string, name: string) {
    this.key = key;
    this.name = name;
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
