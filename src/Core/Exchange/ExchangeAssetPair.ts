import { Asset } from '../Asset/Asset';
import {
  AssetPairInterface,
  AssetPairStringConverterDefault,
  AssetPairStringConverterInterface,
} from '../Asset/AssetPair';

export interface ExchangeAssetPairInterface extends AssetPairInterface {
  amountMinimum: string;
  amountMaximum: string;
  priceMinimum: string;
  priceMaximum: string;
}

export class ExchangeAssetPair implements ExchangeAssetPairInterface {
  assetBase: Asset;
  assetQuote: Asset;
  amountMinimum: string;
  amountMaximum: string;
  priceMinimum: string;
  priceMaximum: string;

  constructor(
    assetBase: Asset,
    assetQuote: Asset,
    amountMinimum: string,
    amountMaximum: string,
    priceMinimum: string,
    priceMaximum: string
  ) {
    this.assetBase = assetBase;
    this.assetQuote = assetQuote;
    this.amountMinimum = amountMinimum;
    this.amountMaximum = amountMaximum;
    this.priceMinimum = priceMinimum;
    this.priceMaximum = priceMaximum;
  }

  toString(converter: AssetPairStringConverterInterface = new AssetPairStringConverterDefault()): string {
    return converter.convert(this);
  }
}
