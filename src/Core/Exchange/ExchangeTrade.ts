import { Asset } from '../Asset/Asset';
import { AssetPair } from '../Asset/AssetPair';
import { ExchangeOrder, ExchangeOrderInterface } from './ExchangeOrder';
import { Manager } from '../Manager';
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
  shouldSell(): boolean;
  getCurrentProfitPercentage(currentPrice: number): number;
  getProfitPercentage(): number;
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
    ) * (this.type === ExchangeTradeTypeEnum.SHORT ? -1 : 1);
  }

  /**
   * Gets the final profit of this trade - must be called after the sellPrice is set to make sense.
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
    ) * (this.type === ExchangeTradeTypeEnum.SHORT ? -1 : 1);
  }

  shouldSell(): boolean {
    const now = Date.now();
    const session = Manager.session;
    const {
      strategy,
    } = session;
    const assetPairPrice = session.exchange.assetPairs.get(
      this.assetPair.getKey()
    );
    const assetPairPriceEntryNewest = assetPairPrice.getNewestPriceEntry();
    const currentAssetPairPrice = parseFloat(assetPairPriceEntryNewest.price);
    const currentProfitPercentage = this.getCurrentProfitPercentage(currentAssetPairPrice);

    if (
      this.peakProfitPercentage === null ||
      this.peakProfitPercentage < currentProfitPercentage
    ) {
      this.peakProfitPercentage = currentProfitPercentage;
    }

    if (
      this.troughProfitPercentage === null ||
      this.troughProfitPercentage > currentProfitPercentage
    ) {
      this.troughProfitPercentage = currentProfitPercentage;
    }

    if (this.triggerStopLossPercentage === null) {
      this.triggerStopLossPercentage = -strategy.parameters.stopLossPercentage;
    }

    const expectedTriggerStopLossPercentage = this.peakProfitPercentage - strategy.parameters.trailingStopLossPercentage;
    const diffStopLossPercentage = this.peakProfitPercentage - this.triggerStopLossPercentage;
    if (
      strategy.parameters.trailingStopLossEnabled &&
      strategy.parameters.trailingStopLossPercentage < diffStopLossPercentage &&
      this.triggerStopLossPercentage < expectedTriggerStopLossPercentage
    ) {
      this.triggerStopLossPercentage = expectedTriggerStopLossPercentage;
    }

    if (currentProfitPercentage > strategy.parameters.takeProfitPercentage) {
      if (!strategy.parameters.trailingTakeProfitEnabled) {
        return true;
      }

      // Once we reach over this takeProfitPercentage threshold, we should set the stop loss percentage
      // to that value, to prevent dipping down again when the trigger doesn't execute
      // because of trailing take profit enabled.
      this.triggerStopLossPercentage = strategy.parameters.takeProfitPercentage;

      const slipSincePeakProfitPercentage = this.peakProfitPercentage - currentProfitPercentage;
      if (
        strategy.parameters.trailingTakeProfitEnabled &&
        slipSincePeakProfitPercentage === 0 // We are peaking right now!
      ) {
        return false;
      }

      if (
        strategy.parameters.trailingTakeProfitEnabled &&
        strategy.parameters.trailingTakeProfitSlipPercentage < slipSincePeakProfitPercentage
      ) {
        return true;
      }
    }

    // Just to make sure that we trigger a sell when the currentProfitPercentage is less than the trigger.
    // This basically covers the case when we have trailingTakeProfitEnabled,
    // and there we set the new triggerStopLossPercentage to the takeProfitPercentage,
    // so it doesn't every again fall below this value.
    if (currentProfitPercentage < this.triggerStopLossPercentage) {
      return true;
    }

    if (
      strategy.parameters.stopLossEnabled &&
      currentProfitPercentage < this.triggerStopLossPercentage
    ) {
      if (strategy.parameters.stopLossTimeoutSeconds === 0) {
        return true;
      }

      if (!this.triggerStopLossSellAt) {
        this.triggerStopLossSellAt = now;
      }

      const stopLossTimeoutTime = strategy.parameters.stopLossTimeoutSeconds * 1000;
      if (now - this.triggerStopLossSellAt > stopLossTimeoutTime) {
        return true;
      }
    } else if (
      strategy.parameters.stopLossEnabled &&
      currentProfitPercentage > this.triggerStopLossPercentage &&
      this.triggerStopLossSellAt
    ) {
      // We are out of the stop loss percentage loss, so let's reset the timer!
      this.triggerStopLossSellAt = null;
    }

    return false;
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
