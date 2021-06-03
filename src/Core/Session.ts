import { Account } from './Account';

export interface SessionInterface {
  id: string;
  account: Account;
  assets: SessionAsset[];
  warmupPeriod: number; // In seconds. How long should we wait and pool the data before we start trading.
  createdAt: number;
  startedAt: number;
  endedAt: number;
}

export interface SessionAssetInterface {
  session: Session;
  asset: string; // What is the default asset you want to trade in?
  assetPairs: AssetPair[]; // With which pairs do we want to trade? BTC_USDT, BTC_ETH, ...
  amountPerOrder: string; // What's the base amount we want to trade each order?
  amountFree: string; // How much free funds do we still have to use?
  amountLocked: string; // How much funds are currently in order?
  startOnDip: boolean; // If that is set to false, then trading will start immediately, else it will wait for a dip
}

export type AssetPair = [string, string];

export class Session implements SessionInterface {
  id: string;
  account: Account;
  assets: SessionAsset[];
  warmupPeriod: number;
  createdAt: number;
  startedAt: number;
  endedAt: number;

  constructor(id: string, account: Account) {
    this.id = id;
    this.account = account;
  }

  addAsset(asset: string, assetPairs: AssetPair[]) {
    this.assets.push(new SessionAsset(this, asset, assetPairs));
  }
}

export class SessionAsset implements SessionAssetInterface {
  session: Session;
  asset: string;
  assetPairs: AssetPair[];
  amountPerOrder: string;
  amountFree: string;
  amountLocked: string;
  startOnDip: boolean;

  constructor(session: Session, asset: string, assetPairs: AssetPair[]) {
    this.session = session;
    this.asset = asset;
    this.assetPairs = assetPairs;
  }
}
