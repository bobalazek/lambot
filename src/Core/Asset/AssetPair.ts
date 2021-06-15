import { Asset } from './Asset';
import { Assets } from './Assets';

export interface AssetPairInterface {
  assetBase: Asset;
  assetQuote: Asset;
  toExchangeSymbolString(converter: AssetPairStringConverterInterface): string;
  toString(): string;
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

  toExchangeSymbolString(
    converter: AssetPairStringConverterInterface = new AssetPairStringConverterDefault()
  ): string {
    return converter.convert(this);
  }

  toString(): string {
    return (
      this.assetBase.symbol +
      this.assetQuote.symbol
    );
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
