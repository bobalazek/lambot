import { Asset, AssetPair } from './Asset';
import { Exchange } from './Exchange';
import { Order } from './Order';

export interface SessionInterface {
  id: string;
  exchange: Exchange;
  assets: SessionAsset[];
  createdAt: number;
  startedAt: number;
  endedAt: number;
  getAllAssetPairsSet(): Set<string>;
}

export interface SessionAssetInterface {
  session: Session;
  asset: Asset; // What is the default asset you want to trade in?
  assetPairs: AssetPair[]; // With which pairs do we want to trade? BTC_USDT, BTC_ETH, ...
  amountTotal: string; // How much total resources we want to use for this session?
  amountPerOrder: string; // What's the base amount we want to trade each order?
  getAssetPairsSet(): Set<string>;
  toString(): string;
}

export class Session implements SessionInterface {
  id: string;
  exchange: Exchange;
  assets: SessionAsset[];
  createdAt: number;
  startedAt: number;
  endedAt: number;

  constructor(id: string, exchange: Exchange) {
    this.id = id;
    this.exchange = exchange;
    this.assets = [];
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

    assetPairs.forEach((assetPair) => {
      this.exchange.addSessionAssetPairPrice(
        assetPair.toString(this.exchange.assetPairDelimiter)
      );
    });
  }

  getAllAssetPairsSet(): Set<string> {
    const assetPairs = new Set<string>();

    this.assets.forEach((sessionAsset) => {
      sessionAsset.getAssetPairsSet().forEach((assetPair) => {
        assetPairs.add(assetPair);
      });
    });

    return assetPairs;
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

  getAssetPairsSet(): Set<string> {
    const assetPairs = new Set<string>();

    this.assetPairs.forEach((assetPair) => {
      assetPairs.add(assetPair.toString(this.session.exchange.assetPairDelimiter));
    });

    return assetPairs;
  }

  toString(): string {
    const assetString = this.asset.toString();
    const assetPairsString = this.assetPairs.map((assetPair) => {
      return assetPair.toString(this.session.exchange.assetPairDelimiter);
    }).join(',');

    return (
      'Base asset: ' + assetString +
      '; ' +
      'Asset pairs: ' + assetPairsString
    );
  }
}
