import { Asset } from '../Asset/Asset';
import {
  AssetPairInterface,
  AssetPairStringConverterDefault,
  AssetPairStringConverterInterface,
} from '../Asset/AssetPair';
import { SessionAssetTradingTypeEnum } from '../Session/SessionAsset';

export interface ExchangeAssetPairInterface extends AssetPairInterface {
  amountMinimum: string;
  amountMaximum: string;
  priceMinimum: string;
  priceMaximum: string;
  tradingTypes: SessionAssetTradingTypeEnum[];
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

  toString(converter: AssetPairStringConverterInterface = new AssetPairStringConverterDefault()): string {
    return converter.convert(this);
  }
}
