import { Exchange } from './Exchange';
import { Order, OrderFees, OrderInterface, OrderSideEnum, OrderTypeEnum } from './Order';

export interface AccountInterface {
  key: string;
  exchange: Exchange;
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order>;
  cancelOrder(id: string): Promise<Order>;
  newOrder(order: Order): Promise<Order>;
  getAssets(): Promise<AccountAsset[]>;
  getAsset(symbol: string): Promise<AccountAsset>;
  getAssetFees(symbol: string, quantity: string): Promise<OrderFees>;
  buyAsset(symbol: string, quantity: string): Promise<Order>;
  sellAsset(symbol: string, quantity: string): Promise<Order>;
}

export interface AccountAssetInterface {
  account: Account;
  symbol: string;
  quantityFree: string;
  quantityLocked: string;
}

export class Account implements AccountInterface {
  key: string;
  exchange: Exchange;

  constructor(key: string, exchange: Exchange) {
    this.key = key;
    this.exchange = exchange;
  }

  async getOrders(): Promise<Order[]> {
    return [];
  }

  async getOrder(id: string): Promise<Order> {
    const orders = await this.getOrders();

    const order = orders.find((order) => {
      return order.id === id;
    });
    if (!order) {
      throw new Error(`Order with ID "${id}" not found.`);
    }

    return order;
  }

  async cancelOrder(id: string): Promise<Order> {
      const order = this.getOrder(id);
      if (!order) {
        throw new Error(`Order with ID "${id}" not found.`);
      }

      return order;
  }

  async newOrder(order: Order): Promise<Order> {
    return order;
  }

  async getAssets(): Promise<AccountAsset[]> {
    return [];
  }

  async getAsset(symbol: string): Promise<AccountAsset> {
    const assets = await this.getAssets();

    const asset = assets.find((asset) => {
      return asset.symbol === symbol;
    });
    if (!asset) {
      throw new Error(`Asset with symbol "${symbol}" not found.`);
    }

    return asset;
  }

  async getAssetFees(symbol: string, quantity: string): Promise<OrderFees> {
    const assetFees = this._getMockAssetFees();

    return assetFees;
  }

  async buyAsset(symbol: string, quantity: string): Promise<Order> {
    const order = this._getMockOrder();

    return this.newOrder(order);
  }

  async sellAsset(symbol: string, quantity: string): Promise<Order> {
    const order = this._getMockOrder();

    return this.newOrder(order);
  }

  /***** Mocks *****/
  private _getMockAssetFees(): OrderFees {
    return new OrderFees(
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
  account: Account;
  symbol: string;
  quantityFree: string;
  quantityLocked: string;

  constructor(
    account: Account,
    symbol: string,
    quantityFree: string = '0',
    quantityLocked: string = '0'
  ) {
    this.account = account;
    this.symbol = symbol;
    this.quantityFree = quantityFree;
    this.quantityLocked = quantityLocked;
  }
}
