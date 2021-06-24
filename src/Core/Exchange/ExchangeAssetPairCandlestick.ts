export interface ExchangeAssetPairCandlestickInterface {
  openTime: number;
  closeTime: number;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  closePrice: string;
  volume: string;
  tradesCount: number;
}

export class ExchangeAssetPairCandlestick implements ExchangeAssetPairCandlestickInterface {
  openTime: number;
  closeTime: number;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  closePrice: string;
  volume: string;
  tradesCount: number;

  constructor({
    openTime,
    closeTime,
    openPrice,
    highPrice,
    lowPrice,
    closePrice,
    volume,
    tradesCount,
  }) {
    this.openTime = openTime;
    this.closeTime = closeTime;
    this.openPrice = openPrice;
    this.highPrice = highPrice;
    this.lowPrice = lowPrice;
    this.closePrice = closePrice;
    this.volume = volume;
    this.tradesCount = tradesCount;
  }
}
