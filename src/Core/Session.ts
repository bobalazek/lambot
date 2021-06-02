import { Account, AccountInterface } from './Account';
import { Asset, AssetInterface } from './Asset';
import { Exchange, ExchangeInterface } from './Exchange';
import { Strategy, StrategyInterface } from './Strategy';

export interface SessionInterface {
  id: string;
  account: AccountInterface;
  exchange: ExchangeInterface;
  strategy: StrategyInterface;
  assets: SessionAssetInterface[];
  createdAt: number;
  startedAt: number;
  endedAt: number;
  isTestMode: boolean;
}

export interface SessionAssetInterface {
  session: SessionInterface;
  asset: AssetInterface;
  pairs: Set<string>; // With which pairs do we want to trade? BTC_USDT, ETH_BTC, ...
  quantityPerOrder: string; // What's the base quantity we want to trade each order?
  quantityFree: string; // How much free funds do we still have to use?
  quantityLocked: string; // How much funds are currently in order?
  startOnDip: boolean; // If that is set to false, then trading will start immediately, else it will wait for a dip
}

export class Session implements SessionInterface {
  id: string;
  account: Account;
  exchange: Exchange;
  strategy: Strategy;
  assets: SessionAsset[];
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
  session: SessionInterface;
  asset: AssetInterface;
  pairs: Set<string>;
  quantityPerOrder: string;
  quantityFree: string;
  quantityLocked: string;
  startOnDip: boolean;

  constructor(session: Session, asset: Asset) {
    this.session = session;
    this.asset = asset;
  }
}
