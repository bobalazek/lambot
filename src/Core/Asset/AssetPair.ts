import { Asset } from './Asset';
import { Assets } from './Assets';

export interface AssetPairInterface {
  assetBase: Asset;
  assetQuote: Asset;
  toString(converter: AssetPairStringConverterInterface): string;
  toExport(): unknown;
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

  toExport() {
    return {
      assetBase: this.assetBase.symbol,
      assetQuote: this.assetQuote.symbol,
    };
  }

  static fromImport(data: any): AssetPair {
    return new AssetPair(
      Assets.getBySymbol(data.assetBase),
      Assets.getBySymbol(data.assetQuote)
    );
  }
}

export class AssetPairStringConverterDefault implements AssetPairStringConverterInterface {
  convert(assetPair: AssetPair): string {
    return (
      assetPair.assetBase.symbol +
      assetPair.assetQuote.symbol
    );
  }
}
