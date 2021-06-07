import { Asset } from './Asset';

export interface AssetPairInterface {
  assetBase: Asset;
  assetQuote: Asset;
  toString(converter: AssetPairStringConverterInterface): string;
}

export interface AssetPairStringConverterInterface {
  convert(assetPair: AssetPair): string;
}

export class AssetPair implements AssetPairInterface {
  assetBase: Asset;
  assetQuote: Asset;

  constructor(assetBase: Asset, assetQuote: Asset) {
    this.assetBase = assetBase;
    this.assetQuote = assetQuote;
  }

  toString(converter: AssetPairStringConverterInterface = new AssetPairStringConverterDefault()): string {
    return converter.convert(this);
  }
};

export class AssetPairStringConverterDefault implements AssetPairStringConverterInterface {
  convert(assetPair: AssetPair): string {
    return (
      assetPair.assetBase.symbol +
      assetPair.assetQuote.symbol
    );
  }
}
