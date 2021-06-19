import { Asset } from '../Asset/Asset';
import { AssetPair } from '../Asset/AssetPair';
import { ExchangeOrder, ExchangeOrderInterface } from './ExchangeOrder';
import { calculatePercentage } from '../../Utils/Helpers';

export interface ExchangeTradeInterface {
  id: string; // Prefix each order with the session id, so we know where it came from.
  asset: Asset;
  assetPair: AssetPair;
  type: ExchangeTradeTypeEnum;
  status: ExchangeTradeStatusEnum;
  timestamp: number;
  buyPrice: number;
  sellPrice: number;
  currentPrice: number;
  buyFeesPercentage: number;
  sellFeesPercentage: number;
  triggerSellPercentage: number; // At which price should we trigger a sell? This can be floating, if we have a trailing take profit
  buyOrder: ExchangeOrderInterface;
  sellOrder: ExchangeOrderInterface;
  getCurrentProfitPercentage(currentPrice: number): number;
  toExport(): unknown;
}

export enum ExchangeTradeTypeEnum {
  LONG = 'LONG',
  SHORT = 'SHORT',
  NEUTRAL = 'NEUTRAL',
}

export enum ExchangeTradeStatusEnum {
  BUY_PENDING = 'BUY_PENDING',
  OPEN = 'OPEN',
  SELL_PENDING = 'SELL_PENDING',
  CLOSED = 'CLOSED',
}

export class ExchangeTrade {
  id: string;
  asset: Asset;
  assetPair: AssetPair;
  type: ExchangeTradeTypeEnum;
  status: ExchangeTradeStatusEnum;
  timestamp: number;
  buyPrice: number;
  sellPrice: number;
  buyFeesPercentage: number;
  sellFeesPercentage: number;
  peakProfitPercentage: number; // What was the highest profit percentage we reached?
  triggerSellPercentage: number; // At what relative percentage (currentPrice compared to buyPrice) should we sell?
  buyOrder: ExchangeOrder;
  sellOrder: ExchangeOrder;

  constructor(
    id: string,
    asset: Asset,
    assetPair: AssetPair,
    type: ExchangeTradeTypeEnum,
    status: ExchangeTradeStatusEnum,
    timestamp: number = Date.now()
  ) {
    this.id = id;
    this.asset = asset;
    this.assetPair = assetPair;
    this.type = type;
    this.status = status;
    this.timestamp = timestamp;
  }

  getCurrentProfitPercentage(currentPrice: number): number {
    return calculatePercentage(
      currentPrice,
      this.buyPrice
    );
  }

  /***** Export/Import *****/
  toExport() {
    return {
      id: this.id,
      asset: this.asset.toExport(),
      assetPair: this.assetPair.toExport(),
      type: this.type,
      status: this.status,
      timestamp: this.timestamp,
      buyPrice: this.buyPrice,
      sellPrice: this.sellPrice,
      buyFeesPercentage: this.buyFeesPercentage,
      sellFeesPercentage: this.sellFeesPercentage,
      peakProfitPercentage: this.peakProfitPercentage,
      triggerSellPercentage: this.triggerSellPercentage,
      buyOrder: this.buyOrder?.toExport(),
      sellOrder: this.sellOrder?.toExport(),
    };
  }

  static fromImport(data: any): ExchangeTrade {
    const exchangeTrade = new ExchangeTrade(
      data.id,
      Asset.fromImport(data.asset),
      AssetPair.fromImport(data.assetPair),
      data.type,
      data.status,
      data.timestamp
    );

    if (data.buyPrice) {
      exchangeTrade.buyPrice = data.buyPrice;
    }

    if (data.sellPrice) {
      exchangeTrade.sellPrice = data.sellPrice;
    }

    if (data.buyFeesPercentage) {
      exchangeTrade.buyFeesPercentage = data.buyFeesPercentage;
    }

    if (data.sellFeesPercentage) {
      exchangeTrade.sellFeesPercentage = data.sellFeesPercentage;
    }

    if (data.peakProfitPercentage) {
      exchangeTrade.peakProfitPercentage = data.peakProfitPercentage;
    }

    if (data.triggerSellPercentage) {
      exchangeTrade.triggerSellPercentage = data.triggerSellPercentage;
    }

    if (data.buyOrder) {
      exchangeTrade.buyOrder = ExchangeOrder.fromImport(data.buyOrder);
    }

    if (data.sellOrder) {
      exchangeTrade.sellOrder = ExchangeOrder.fromImport(data.sellOrder);
    }

    return exchangeTrade;
  }
}
