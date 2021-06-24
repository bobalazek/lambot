import { Asset } from './Asset';
import { AssetPairStringConverterInterface } from './AssetPairStringConverter';
import { Assets } from './Assets';

export interface AssetPairDataInterface {
  assetBase: Asset;
  assetQuote: Asset;
}

export interface AssetPairInterface extends AssetPairDataInterface {
  symbol?: string;
  getKey(): string;
  getExchangeSymbolString(converter: AssetPairStringConverterInterface): string;
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

    return AssetPairConverter.convert(this);
  }

  getExchangeSymbolString(converter: AssetPairStringConverterInterface): string {
    if (this.symbol) {
      return this.symbol;
    }

    return converter.convert(this);
  }

  toExport() {
    return {
      assetBase: this.assetBase.symbol,
      assetQuote: this.assetQuote.symbol,
      symbol: this.symbol,
    };
  }

  static fromImport(data: any): AssetPair {
    return new AssetPair(
      Assets.getBySymbol(data.assetBase),
      Assets.getBySymbol(data.assetQuote),
      data.symbol
    );
  }
}

export class AssetPairConverter {
  static convert(assetPair: AssetPairDataInterface) {
    return (
      assetPair.assetBase.symbol +
      assetPair.assetQuote.symbol
    );
  }
}
