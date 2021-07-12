import { AssetPair } from '../Asset/AssetPair';

export interface ExchangeAssetPairOHLCVInterface {
  assetPair: AssetPair;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  openTime: number;
  closeTime: number;
  tradesCount?: number;
}
