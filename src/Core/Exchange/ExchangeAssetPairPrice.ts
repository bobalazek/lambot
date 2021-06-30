import { ExchangeAssetPairInterface } from './ExchangeAssetPair';

export interface ExchangeAssetPairPriceChangeInterface {
  relativePricePercentage: number; // relative to the previous entry - ((price - prevPrice) / prevPrice) * 100
  price: number;
  prevPrice: number;
  timestamp: number;
}

export interface ExchangeAssetPairPriceEntryInterface {
  timestamp: number;
  price: string;
}

export interface ExchangeAssetPairPriceTrend {
  status: ExchangeAssetPairPriceTrendStatusEnum;
  trendPercentage: number;
}

export enum ExchangeAssetPairPriceTrendStatusEnum {
  UPTREND = 'UPTREND',
  DOWNTREND = 'DOWNTREND',
  SIDEWAYS_TREND  = 'SIDEWAYS_TREND',
}

export const ExchangeAssetPairTrendIconMap = new Map<ExchangeAssetPairPriceTrendStatusEnum, string>([
  [ExchangeAssetPairPriceTrendStatusEnum.UPTREND, '🟢'],
  [ExchangeAssetPairPriceTrendStatusEnum.DOWNTREND, '🔴'],
  [ExchangeAssetPairPriceTrendStatusEnum.SIDEWAYS_TREND, '🔵'],
]);

export type ExchangeAssetPairsMap = Map<string, ExchangeAssetPairInterface>;
