import { Asset } from './Asset';

export interface AssetPairDataInterface {
  assetBase: Asset;
  assetQuote: Asset;
}

export interface AssetPairInterface extends AssetPairDataInterface {
  symbol?: string;
  getKey(): string;
}

export class AssetPair implements AssetPairInterface {
  assetBase: Asset;
  assetQuote: Asset;
  symbol?: string;

  constructor(assetBase: Asset, assetQuote: Asset, symbol?: string) {
    this.assetBase = assetBase;
    this.assetQuote = assetQuote;
    this.symbol = symbol;
  }

  getKey(): string {
    if (this.symbol) {
      return this.symbol;
    }

    return AssetPairDataConverter.convert(this);
  }

  toExport() {
    return {
      assetBase: this.assetBase.toExport(),
      assetQuote: this.assetQuote.toExport(),
      symbol: this.symbol,
    };
  }

  static fromImport(data: any): AssetPair {
    return new AssetPair(
      Asset.fromImport(data.assetBase),
      Asset.fromImport(data.assetQuote),
      data.symbol
    );
  }
}

export class AssetPairDataConverter {
  static convert(assetPair: AssetPairDataInterface) {
    return (
      assetPair.assetBase.symbol +
      assetPair.assetQuote.symbol
    );
  }
}
