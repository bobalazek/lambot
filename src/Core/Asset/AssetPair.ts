import { Asset } from './Asset';

export interface AssetPairInterface {
  assetBase: Asset;
  assetQuote: Asset;
  toString(delimiter: string): string;
}

export class AssetPair implements AssetPairInterface {
  assetBase: Asset;
  assetQuote: Asset;

  constructor(assetBase: Asset, assetQuote: Asset) {
    this.assetBase = assetBase;
    this.assetQuote = assetQuote;
  }

  toString(delimiter: string): string {
    return (
      this.assetBase.symbol +
      delimiter +
      this.assetQuote.symbol
    );
  }
};
