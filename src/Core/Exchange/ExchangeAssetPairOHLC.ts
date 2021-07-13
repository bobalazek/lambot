import { AssetPair } from '../Asset/AssetPair';

export interface ExchangeAssetPairOHLCInterface {
  assetPair: AssetPair;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  closePrice: string;
  volume: string; // baseAsset volume
  volumeQuote: string; // quoteAsset volume
  openTime: number;
  closeTime: number;
  tradesCount?: number;
}
