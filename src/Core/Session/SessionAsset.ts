import { Asset } from '../Asset/Asset';
import { AssetPair } from '../Asset/AssetPair';
import { Order } from '../Order/Order';

export interface SessionAssetInterface {
  asset: Asset; // What is the default asset you want to trade in?
  assetPairs: AssetPair[]; // With which pairs do we want to trade? BTC_USDT, BTC_ETH, ...
  amountTotal: string; // How much total resources we want to use for this session?
  amountPerOrder: string; // What's the base amount we want to trade each order?
  getAssetPairsSet(assetPairDelimiter: string): Set<string>;
  toString(assetPairDelimiter: string): string;
}

export class SessionAsset implements SessionAssetInterface {
  asset: Asset;
  assetPairs: AssetPair[];
  amountTotal: string;
  amountPerOrder: string;

  _orders: Order[];
  _amountFree: string; // How much free funds do we still have to use?
  _amountLocked: string; // How much funds are currently in order?

  constructor(
    asset: Asset,
    assetPairs: AssetPair[],
    amountTotal: string,
    amountPerOrder: string
  ) {
    this.asset = asset;
    this.assetPairs = assetPairs;
    this.amountTotal = amountTotal;
    this.amountPerOrder = amountPerOrder;
  }

  getAssetPairsSet(assetPairDelimiter: string): Set<string> {
    const assetPairs = new Set<string>();

    this.assetPairs.forEach((assetPair) => {
      assetPairs.add(assetPair.toString(assetPairDelimiter));
    });

    return assetPairs;
  }

  toString(assetPairDelimiter: string): string {
    const assetString = this.asset.toString();
    const assetPairsString = this.assetPairs.map((assetPair) => {
      return assetPair.toString(assetPairDelimiter);
    }).join(', ');

    return (
      'Base asset: ' + assetString +
      '; ' +
      'Asset pairs: ' + assetPairsString
    );
  }
}
