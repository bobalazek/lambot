import { Asset, AssetPair } from './Asset';
import { Exchange } from './Exchange';

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
  amountPerOrder: string; // What's the base amount we want to trade each order?
  amountFree: string; // How much free funds do we still have to use?
  amountLocked: string; // How much funds are currently in order?
  startOnDip: boolean; // If that is set to false, then trading will start immediately, else it will wait for a dip
}

export class Session implements SessionInterface {
  id: string;
  exchange: Exchange;
  assets: SessionAsset[] = [];
  warmupPeriod: number = 5 * 60 * 1000;
  createdAt: number;
  startedAt: number;
  endedAt: number;

  constructor(id: string, exchange: Exchange) {
    this.id = id;
    this.exchange = exchange;
  }

  addAsset(
    asset: Asset,
    assetPairs: AssetPair[],
    amountPerOrder: string
  ) {
    this.assets.push(
      new SessionAsset(
        this,
        asset,
        assetPairs,
        amountPerOrder
      )
    );
  }
}

export class SessionAsset implements SessionAssetInterface {
  session: Session;
  asset: Asset;
  assetPairs: AssetPair[];
  amountPerOrder: string;
  amountFree: string;
  amountLocked: string;
  startOnDip: boolean;

  constructor(
    session: Session,
    asset: Asset,
    assetPairs: AssetPair[],
    amountPerOrder: string
  ) {
    this.session = session;
    this.asset = asset;
    this.assetPairs = assetPairs;
    this.amountPerOrder = amountPerOrder;
  }
}
