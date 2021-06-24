import { AssetPair } from '../Asset/AssetPair';
import { ExchangeAssetPairCandlestickInterface } from './ExchangeAssetPairCandlestick';

export interface ExchangeAssetPairInterface {
  assetPair: AssetPair;
  candlesticks: ExchangeAssetPairCandlestickInterface[];
}

export class ExchangeAssetPair implements ExchangeAssetPairInterface {
  assetPair: AssetPair;
  candlesticks: ExchangeAssetPairCandlestickInterface[];

  constructor(assetPair: AssetPair) {
    this.assetPair = assetPair;
  }
}
