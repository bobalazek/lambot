import { AssetPair } from '../Asset/AssetPair';

export interface ExchangeAssetPairOHLCInterface {
  assetPair: AssetPair;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string; // baseAsset volume
  volumeQuote: string; // quoteAsset volume
  openTime: number;
  closeTime: number;
  tradesCount?: number;
}
