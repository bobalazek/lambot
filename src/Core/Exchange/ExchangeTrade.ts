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
  buyPrice?: number;
  sellPrice?: number;
  buyFeesPercentage?: number;
  sellFeesPercentage?: number;
  peakProfitPercentage?: number; // What is the peak profit we reached?
  troughProfitPercentage?: number; // What is the trough profit we reached?
  triggerStopLossPercentage?: number; // At which currentProfitPercentage will the stop loss trigger (can be positive or negative?
  triggerStopLossSellAt?: number; // If we are in the stop loss timeout, when should we trigger the sell?
  buyOrder?: ExchangeOrderInterface;
  sellOrder?: ExchangeOrderInterface;
  getCurrentProfitPercentage(currentPrice: number): number;
  getProfitPercentage(): number;
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
  amount?: string;
  buyPrice?: number;
  sellPrice?: number;
  buyFeesPercentage?: number;
  sellFeesPercentage?: number;
  peakProfitPercentage?: number;
  troughProfitPercentage?: number;
  triggerStopLossPercentage?: number;
  triggerStopLossSellAt?: number;
  buyOrder?: ExchangeOrder;
  sellOrder?: ExchangeOrder;

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
    this.peakProfitPercentage = null;
    this.troughProfitPercentage = null;
    this.triggerStopLossPercentage = null;
    this.triggerStopLossSellAt = null;
  }

  /**
   * Gets the current profit, relating to the current price we provide it.
   */
  getCurrentProfitPercentage(currentPrice: number, includingFees: boolean = false): number {
    const buyPrice = includingFees
      ? this.buyPrice + (this.buyPrice * this.buyFeesPercentage)
      : this.buyPrice;

    return calculatePercentage(
      currentPrice,
      buyPrice
    );
  }

  /**
   * Gets the final profit of this trade - must be called after the sellPrice is set.
   */
  getProfitPercentage(includingFees: boolean = false): number {
    const sellPrice = includingFees
      ? this.sellPrice - (this.sellPrice * this.sellFeesPercentage)
      : this.sellPrice;
    const buyPrice = includingFees
      ? this.buyPrice + (this.buyPrice * this.buyFeesPercentage)
      : this.buyPrice;

    return calculatePercentage(
      sellPrice,
      buyPrice
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
      amount: this.amount,
      buyPrice: this.buyPrice,
      sellPrice: this.sellPrice,
      buyFeesPercentage: this.buyFeesPercentage,
      sellFeesPercentage: this.sellFeesPercentage,
      peakProfitPercentage: this.peakProfitPercentage,
      troughProfitPercentage: this.troughProfitPercentage,
      triggerStopLossPercentage: this.triggerStopLossPercentage,
      triggerStopLossSellAt: this.triggerStopLossSellAt,
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

    if (typeof data.amount !== 'undefined') {
      exchangeTrade.amount = data.amount;
    }

    if (typeof data.buyPrice !== 'undefined') {
      exchangeTrade.buyPrice = data.buyPrice;
    }

    if (typeof data.sellPrice !== 'undefined') {
      exchangeTrade.sellPrice = data.sellPrice;
    }

    if (typeof data.buyFeesPercentage !== 'undefined') {
      exchangeTrade.buyFeesPercentage = data.buyFeesPercentage;
    }

    if (typeof data.sellFeesPercentage !== 'undefined') {
      exchangeTrade.sellFeesPercentage = data.sellFeesPercentage;
    }

    if (typeof data.peakProfitPercentage !== 'undefined') {
      exchangeTrade.peakProfitPercentage = data.peakProfitPercentage;
    }

    if (typeof data.troughProfitPercentage !== 'undefined') {
      exchangeTrade.troughProfitPercentage = data.troughProfitPercentage;
    }

    if (typeof data.triggerStopLossPercentage !== 'undefined') {
      exchangeTrade.triggerStopLossPercentage = data.triggerStopLossPercentage;
    }

    if (typeof data.triggerStopLossSellAt !== 'undefined') {
      exchangeTrade.triggerStopLossSellAt = data.triggerStopLossSellAt;
    }

    if (typeof data.buyOrder !== 'undefined') {
      exchangeTrade.buyOrder = ExchangeOrder.fromImport(data.buyOrder);
    }

    if (typeof data.sellOrder !== 'undefined') {
      exchangeTrade.sellOrder = ExchangeOrder.fromImport(data.sellOrder);
    }

    return exchangeTrade;
  }
}
