import { Asset } from './Asset';
import { AssetPairStringConverterInterface } from './AssetPairStringConverter';
import { Assets } from './Assets';

export interface AssetPairDataInterface {
  assetBase: Asset;
  assetQuote: Asset;
}

export interface AssetPairInterface extends AssetPairDataInterface {
  toExchangeSymbolString(converter: AssetPairStringConverterInterface): string;
}

export class AssetPair implements AssetPairInterface {
  assetBase: Asset;
  assetQuote: Asset;

  constructor(assetBase: Asset, assetQuote: Asset) {
    this.assetBase = assetBase;
    this.assetQuote = assetQuote;
  }

  toExchangeSymbolString(converter: AssetPairStringConverterInterface): string {
    return converter.convert(this);
  }

  toString(): string {
    return AssetPair.toKey(this);
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

  static toKey(data: AssetPairDataInterface): string {
    return (
      data.assetBase.symbol +
      data.assetQuote.symbol
    );
  }
}
