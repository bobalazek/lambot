import { Account } from './Account';
import { Exchange } from './Exchange';

export interface SessionInterface {
  id: string;
  account: Account;
  exchange: Exchange;
  assets: SessionAsset[];
  warmupPeriod: number; // In seconds. How long should we wait and pool the data before we start trading.
  createdAt: number;
  startedAt: number;
  endedAt: number;
  isTestMode: boolean;
}

export interface SessionAssetInterface {
  session: Session;
  asset: string;
  pairs: string[]; // With which pairs do we want to trade? BTC_USDT, ETH_BTC, ...
  quantityPerOrder: string; // What's the base quantity we want to trade each order?
  quantityFree: string; // How much free funds do we still have to use?
  quantityLocked: string; // How much funds are currently in order?
  startOnDip: boolean; // If that is set to false, then trading will start immediately, else it will wait for a dip
}

export class Session implements SessionInterface {
  id: string;
  account: Account;
  exchange: Exchange;
  assets: SessionAsset[];
  warmupPeriod: number;
  createdAt: number;
  startedAt: number;
  endedAt: number;
  isTestMode: boolean;

  constructor(id: string, account: Account, exchange: Exchange) {
    this.id = id;
    this.account = account;
    this.exchange = exchange;
  }
}

export class SessionAsset implements SessionAssetInterface {
  session: Session;
  asset: string;
  pairs: string[];
  quantityPerOrder: string;
  quantityFree: string;
  quantityLocked: string;
  startOnDip: boolean;

  constructor(session: Session, asset: string) {
    this.session = session;
    this.asset = asset;
  }
}
