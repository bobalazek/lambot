import { Asset } from '../Asset/Asset';
import { AssetPair, AssetPairStringConverterInterface } from '../Asset/AssetPair';
import { Strategy } from '../Strategy/Strategy';

export interface SessionAssetInterface {
  asset: Asset; // What is the default asset you want to trade in?
  assetPairs: AssetPair[]; // With which pairs do we want to trade? BTC_USDT, BTC_ETH, ...
  strategy: Strategy;
  getAssetPairsSet(assetPairConverter: AssetPairStringConverterInterface): Set<string>;
  toString(assetPairConverter: AssetPairStringConverterInterface): string;
}

export class SessionAsset implements SessionAssetInterface {
  asset: Asset;
  assetPairs: AssetPair[];
  strategy: Strategy;

  constructor(
    asset: Asset,
    assetPairs: AssetPair[],
    strategy: Strategy
  ) {
    this.asset = asset;
    this.assetPairs = assetPairs;
    this.strategy = strategy;
  }

  getAssetPairsSet(assetPairConverter: AssetPairStringConverterInterface): Set<string> {
    const assetPairs = new Set<string>();

    this.assetPairs.forEach((assetPair) => {
      assetPairs.add(assetPair.toString(assetPairConverter));
    });

    return assetPairs;
  }

  toString(assetPairConverter: AssetPairStringConverterInterface): string {
    const assetString = this.asset.toString();
    const assetPairsString = this.assetPairs.map((assetPair) => {
      return assetPair.toString(assetPairConverter);
    }).join(', ');

    return (
      'Base asset: ' + assetString +
      '; ' +
      'Asset pairs: ' + assetPairsString
    );
  }
}
