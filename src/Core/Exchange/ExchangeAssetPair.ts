import { Asset } from '../Asset/Asset';
import { AssetPairInterface } from '../Asset/AssetPair';
import { AssetPairStringConverterInterface } from '../Asset/AssetPairStringConverter';
import { Assets } from '../Asset/Assets';
import { SessionAssetTradingTypeEnum } from '../Session/SessionAsset';

export interface ExchangeAssetPairInterface extends AssetPairInterface {
  amountMinimum: string;
  amountMaximum: string;
  priceMinimum: string;
  priceMaximum: string;
  tradingTypes: SessionAssetTradingTypeEnum[];
  toExport(): unknown;
}

export class ExchangeAssetPair implements ExchangeAssetPairInterface {
  assetBase: Asset;
  assetQuote: Asset;
  amountMinimum: string;
  amountMaximum: string;
  priceMinimum: string;
  priceMaximum: string;
  tradingTypes: SessionAssetTradingTypeEnum[];

  constructor(
    assetBase: Asset,
    assetQuote: Asset,
    amountMinimum: string,
    amountMaximum: string,
    priceMinimum: string,
    priceMaximum: string,
    tradingTypes: SessionAssetTradingTypeEnum[]
  ) {
    this.assetBase = assetBase;
    this.assetQuote = assetQuote;
    this.amountMinimum = amountMinimum;
    this.amountMaximum = amountMaximum;
    this.priceMinimum = priceMinimum;
    this.priceMaximum = priceMaximum;
    this.tradingTypes = tradingTypes;
  }

  toExchangeSymbolString(converter: AssetPairStringConverterInterface): string {
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
      amountMinimum: this.amountMinimum,
      amountMaximum: this.amountMaximum,
      priceMinimum: this.priceMinimum,
      priceMaximum: this.priceMaximum,
      tradingTypes: this.tradingTypes,
    };
  }

  static fromImport(data: any): ExchangeAssetPair {
    return new ExchangeAssetPair(
      Assets.getBySymbol(data.assetBase),
      Assets.getBySymbol(data.assetQuote),
      data.amountMinimum,
      data.amountMaximum,
      data.priceMinimum,
      data.priceMaximum,
      data.tradingTypes
    );
  }
}
