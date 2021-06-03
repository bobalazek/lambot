import { Asset, AssetPair } from './Asset';
import { Exchange } from './Exchange';
import { Order } from './Order';

export interface SessionInterface {
  id: string;
  exchange: Exchange;
  assets: SessionAsset[];
  warmupPeriod: number; // In milliseconds. How long should we just pool the prices until we actually start trading?
  createdAt: number;
  startedAt: number;
  endedAt: number;
}

export interface SessionAssetInterface {
  session: Session;
  asset: Asset; // What is the default asset you want to trade in?
  assetPairs: AssetPair[]; // With which pairs do we want to trade? BTC_USDT, BTC_ETH, ...
  amountTotal: string; // How much total resources we want to use for this session?
  amountPerOrder: string; // What's the base amount we want to trade each order?
}

export class Session implements SessionInterface {
  id: string;
  exchange: Exchange;
  assets: SessionAsset[];
  warmupPeriod: number;
  createdAt: number;
  startedAt: number;
  endedAt: number;

  constructor(id: string, exchange: Exchange) {
    this.id = id;
    this.exchange = exchange;
    this.assets = [];
    this.warmupPeriod = 5 * 60 * 1000;
  }

  /**
   * Add a asset to this session.
   *
   * @param asset Which is the base asset we want to do all the trades with?
   * @param assetPairs Which pairs do we want to trade with?
   * @param amountTotal What is the total amount we want to spend of this asset from this session?
   * @param amountPerOrder How much of this asset do we want to spend of per order?
   */
  addAsset(
    asset: Asset,
    assetPairs: AssetPair[],
    amountTotal: string,
    amountPerOrder: string
  ) {
    this.assets.push(
      new SessionAsset(
        this,
        asset,
        assetPairs,
        amountTotal,
        amountPerOrder
      )
    );
  }
}

export class SessionAsset implements SessionAssetInterface {
  session: Session;
  asset: Asset;
  assetPairs: AssetPair[];
  amountTotal: string;
  amountPerOrder: string;
  _orders: Order[];
  _amountFree: string; // How much free funds do we still have to use?
  _amountLocked: string; // How much funds are currently in order?

  constructor(
    session: Session,
    asset: Asset,
    assetPairs: AssetPair[],
    amountTotal: string,
    amountPerOrder: string
  ) {
    this.session = session;
    this.asset = asset;
    this.assetPairs = assetPairs;
    this.amountTotal = amountTotal;
    this.amountPerOrder = amountPerOrder;
  }
}
