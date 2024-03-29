import { AssetPair } from '../Asset/AssetPair';
import { ExchangeOrder, ExchangeOrderInterface } from './ExchangeOrder';
import { calculatePercentage } from '../../Utils/Helpers';
import { Session } from '../Session/Session';
import { ExchangeFee, ExchangeFeeTypeEnum } from './ExchangeFee';

export interface ExchangeTradeInterface {
  id: string; // Prefix each order with the session id, so we know where it came from.
  assetPair: AssetPair;
  type: ExchangeTradeTypeEnum;
  amount: string; // The amount of the base currency bought
  amountQuote: string; // The amount of the quote currency used to pay for
  createdAt: number;
  status: ExchangeTradeStatusEnum;
  entryPrice: number | null;
  exitPrice: number | null;
  entryFees: ExchangeFee[];
  exitFees: ExchangeFee[];
  entryAt?: number;
  exitAt?: number;
  currentProfitPercentage: number | null;
  peakProfitPercentage: number | null; // What is the peak profit we reached?
  troughProfitPercentage: number | null; // What is the trough profit we reached?
  targetStopLossPercentage: number | null; // At which currentProfitPercentage will the stop loss trigger - can be positive or negative
  triggerStopLossSellAt: number | null; // If we are in the stop loss timeout, when should we trigger the sell?
  lastProcessedAt: number | null;
  entryOrder?: ExchangeOrderInterface;
  exitOrder?: ExchangeOrderInterface;
  prepareData(): void;
  shouldSell(session: Session, prepareData: boolean): boolean;
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

export enum ExchangeTradeEntryOrExitEnum {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
}

export class ExchangeTrade {
  id: string;
  assetPair: AssetPair;
  type: ExchangeTradeTypeEnum;
  amount: string;
  amountQuote: string;
  createdAt: number;
  status: ExchangeTradeStatusEnum;
  entryPrice: number | null;
  exitPrice: number | null;
  entryFees: ExchangeFee[];
  exitFees: ExchangeFee[];
  entryAt?: number;
  exitAt?: number;
  currentProfitPercentage: number | null;
  peakProfitPercentage: number | null;
  troughProfitPercentage: number | null;
  targetStopLossPercentage: number | null;
  triggerStopLossSellAt: number | null;
  lastProcessedAt: number | null;
  entryOrder?: ExchangeOrder;
  exitOrder?: ExchangeOrder;

  constructor(
    id: string,
    assetPair: AssetPair,
    type: ExchangeTradeTypeEnum,
    amount: string,
    amountQuote: string,
    createdAt: number = Date.now(),
    status: ExchangeTradeStatusEnum = ExchangeTradeStatusEnum.OPEN
  ) {
    this.id = id;
    this.assetPair = assetPair;
    this.type = type;
    this.amount = amount;
    this.amountQuote = amountQuote;
    this.createdAt = createdAt;
    this.status = status;
    this.entryPrice = null;
    this.exitPrice = null;
    this.entryFees = [];
    this.exitFees = [];
    this.currentProfitPercentage = null;
    this.peakProfitPercentage = null;
    this.troughProfitPercentage = null;
    this.targetStopLossPercentage = null;
    this.triggerStopLossSellAt = null;
    this.lastProcessedAt = null;
  }

  prepareData(session: Session) {
    const now = Date.now();
    const {
      strategy,
    } = session;
    const exchangeAssetPair = session.exchange.assetPairs.get(
      this.assetPair.getKey()
    );
    if (!exchangeAssetPair) {
      return;
    }

    const exchangeAssetPairEntryNewest = exchangeAssetPair.getNewestPriceEntry();
    if (!exchangeAssetPairEntryNewest) {
      return;
    }

    this.currentProfitPercentage = this.getCurrentProfitPercentage(
      parseFloat(exchangeAssetPairEntryNewest.price)
    );

    if (
      this.peakProfitPercentage === null ||
      this.peakProfitPercentage < this.currentProfitPercentage
    ) {
      this.peakProfitPercentage = this.currentProfitPercentage;
    }

    if (
      this.troughProfitPercentage === null ||
      this.troughProfitPercentage > this.currentProfitPercentage
    ) {
      this.troughProfitPercentage = this.currentProfitPercentage;
    }

    if (this.targetStopLossPercentage === null) {
      this.targetStopLossPercentage = -strategy.parameters.stopLossPercentage;
    }

    const expectedTargetStopLossPercentage = this.peakProfitPercentage - strategy.parameters.trailingStopLossPercentage;
    const diffStopLossPercentage = this.peakProfitPercentage - this.targetStopLossPercentage;
    if (
      strategy.parameters.trailingStopLossEnabled &&
      strategy.parameters.trailingStopLossPercentage < diffStopLossPercentage &&
      this.targetStopLossPercentage < expectedTargetStopLossPercentage
    ) {
      this.targetStopLossPercentage = expectedTargetStopLossPercentage;
    }

    if (
      strategy.parameters.stopLossEnabled &&
      this.currentProfitPercentage < this.targetStopLossPercentage &&
      !this.triggerStopLossSellAt
    ) {
      this.triggerStopLossSellAt = now;
    } else if (
      strategy.parameters.stopLossEnabled &&
      this.currentProfitPercentage > this.targetStopLossPercentage &&
      this.triggerStopLossSellAt
    ) {
      this.triggerStopLossSellAt = null;
    }

    this.lastProcessedAt = now;
  }

  shouldSell(session: Session, prepareData: boolean = true): boolean {
    const now = Date.now();
    const {
      strategy,
    } = session;

    if (prepareData) {
      this.prepareData(session);
    }

    const exchangeAssetPair = session.exchange.assetPairs.get(
      this.assetPair.getKey()
    );
    if (!exchangeAssetPair) {
      return false;
    }

    const exchangeAssetPairEntryNewest = exchangeAssetPair.getNewestPriceEntry();
    if (!exchangeAssetPairEntryNewest) {
      return false;
    }

    const currentProfitPercentage = this.getCurrentProfitPercentage(
      parseFloat(exchangeAssetPairEntryNewest.price)
    );

    if (currentProfitPercentage > strategy.parameters.takeProfitPercentage) {
      if (!strategy.parameters.trailingTakeProfitEnabled) {
        return true;
      }

      if (this.peakProfitPercentage === null) {
        return false;
      }

      // Once we reach over this takeProfitPercentage threshold, we should set the stop loss percentage
      // to that value, to prevent dipping down again when the trigger doesn't execute
      // because of trailing take profit enabled.
      this.targetStopLossPercentage = strategy.parameters.takeProfitPercentage;

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
    // and there we set the new targetStopLossPercentage to the takeProfitPercentage,
    // so it doesn't every again fall below this value.
    if (
      this.targetStopLossPercentage !== null &&
      currentProfitPercentage < this.targetStopLossPercentage
    ) {
      return true;
    }

    if (
      strategy.parameters.stopLossEnabled &&
      this.targetStopLossPercentage !== null &&
      currentProfitPercentage < this.targetStopLossPercentage
    ) {
      if (strategy.parameters.stopLossTimeoutSeconds === 0) {
        return true;
      }

      const stopLossTimeoutTime = strategy.parameters.stopLossTimeoutSeconds * 1000;
      if (
        this.triggerStopLossSellAt !== null &&
        now - this.triggerStopLossSellAt > stopLossTimeoutTime
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Gets the current profit, relating to the current price we provide it.
   */
  getCurrentProfitPercentage(currentPrice: number, includingFees: boolean = false): number {
    if (this.entryPrice === null) {
      return 0;
    }

    return (
      calculatePercentage(currentPrice, this.entryPrice) -
      (includingFees ? this.getFeePercentage(ExchangeTradeEntryOrExitEnum.ENTRY) : 0) -
      (includingFees ? this.getFeePercentage(ExchangeTradeEntryOrExitEnum.ENTRY) : 0) // at this point we don't have the exitFeesPercentage yet, so assume it's the same as buy
    ) * (this.type === ExchangeTradeTypeEnum.SHORT ? -1 : 1);
  }

  /**
   * Gets the final profit of this trade - must be called after the exitPrice is set to make sense.
   */
  getProfitPercentage(includingFees: boolean = false): number {
    if (this.entryPrice === null || this.exitPrice === null) {
      return 0;
    }

    return (
      calculatePercentage(this.exitPrice, this.entryPrice) -
      (includingFees ? this.getFeePercentage(ExchangeTradeEntryOrExitEnum.ENTRY) : 0) -
      (includingFees ? this.getFeePercentage(ExchangeTradeEntryOrExitEnum.EXIT) : 0)
    ) * (this.type === ExchangeTradeTypeEnum.SHORT ? -1 : 1);
  }

  /**
   * Gets the current profit in the quote currency!
   */
  getCurrentProfitAmount(currentPrice: number, includingFees: boolean = false): number {
    if (this.entryPrice === null) {
      return 0;
    }

    const amount = parseFloat(this.amount);
    return (
      (amount * (currentPrice - this.entryPrice)) -
      (includingFees ? amount * this.entryPrice * this.getFeePercentage(ExchangeTradeEntryOrExitEnum.ENTRY) * 0.01 : 0) -
      (includingFees ? amount * currentPrice * this.getFeePercentage(ExchangeTradeEntryOrExitEnum.ENTRY) * 0.01 : 0) // at this point we don't have the exitFeesPercentage yet, so assume it's the same as buy
    ) * (this.type === ExchangeTradeTypeEnum.SHORT ? -1 : 1);
  }

  /**
   * Gets the final profit in the quote currency!
   */
  getProfitAmount(includingFees: boolean = false): number {
    if (this.entryPrice === null || this.exitPrice === null) {
      return 0;
    }

    const amount = parseFloat(this.amount);
    return (
      (amount * (this.exitPrice - this.entryPrice)) -
      (includingFees ? amount * this.entryPrice * this.getFeePercentage(ExchangeTradeEntryOrExitEnum.ENTRY) * 0.01 : 0) -
      (includingFees ? amount * this.exitPrice * this.getFeePercentage(ExchangeTradeEntryOrExitEnum.EXIT) * 0.01 : 0)
    ) * (this.type === ExchangeTradeTypeEnum.SHORT ? -1 : 1);
  }

  getFeePercentage(entryOrExit: ExchangeTradeEntryOrExitEnum): number {
    const fees = entryOrExit === ExchangeTradeEntryOrExitEnum.ENTRY
      ? this.entryFees
      : this.exitFees;

    const fee = fees[0];
    if (
      !fee ||
      fee.type !== ExchangeFeeTypeEnum.PERCENTAGE
    ) {
      return 0;
    }

    // TODO: implement amount based fees!

    return fee.amount;
  }

  /***** Export/Import *****/
  toExport() {
    return {
      id: this.id,
      assetPair: this.assetPair.toExport(),
      type: this.type,
      amount: this.amount,
      amountQuote: this.amountQuote,
      createdAt: this.createdAt,
      status: this.status,
      entryPrice: this.entryPrice,
      exitPrice: this.exitPrice,
      entryFees: this.entryFees,
      exitFees: this.exitFees,
      entryAt: this.entryAt,
      exitAt: this.exitAt,
      currentProfitPercentage: this.currentProfitPercentage,
      peakProfitPercentage: this.peakProfitPercentage,
      troughProfitPercentage: this.troughProfitPercentage,
      targetStopLossPercentage: this.targetStopLossPercentage,
      triggerStopLossSellAt: this.triggerStopLossSellAt,
      lastProcessedAt: this.lastProcessedAt,
      entryOrder: this.entryOrder?.toExport(),
      exitOrder: this.exitOrder?.toExport(),
    };
  }

  static fromImport(data: any): ExchangeTrade {
    const exchangeTrade = new ExchangeTrade(
      data.id,
      AssetPair.fromImport(data.assetPair),
      data.type,
      data.amount,
      data.amountQuote,
      data.createdAt,
      data.status
    );

    if (typeof data.entryPrice !== 'undefined') {
      exchangeTrade.entryPrice = data.entryPrice;
    }

    if (typeof data.exitPrice !== 'undefined') {
      exchangeTrade.exitPrice = data.exitPrice;
    }

    if (typeof data.entryFees !== 'undefined') {
      exchangeTrade.entryFees = data.entryFees;
    }

    if (typeof data.exitFees !== 'undefined') {
      exchangeTrade.exitFees = data.exitFees;
    }

    if (typeof data.entryAt !== 'undefined') {
      exchangeTrade.entryAt = data.entryAt;
    }

    if (typeof data.exitAt !== 'undefined') {
      exchangeTrade.exitAt = data.exitAt;
    }

    if (typeof data.peakProfitPercentage !== 'undefined') {
      exchangeTrade.peakProfitPercentage = data.peakProfitPercentage;
    }

    if (typeof data.troughProfitPercentage !== 'undefined') {
      exchangeTrade.troughProfitPercentage = data.troughProfitPercentage;
    }

    if (typeof data.targetStopLossPercentage !== 'undefined') {
      exchangeTrade.targetStopLossPercentage = data.targetStopLossPercentage;
    }

    if (typeof data.triggerStopLossSellAt !== 'undefined') {
      exchangeTrade.triggerStopLossSellAt = data.triggerStopLossSellAt;
    }

    if (typeof data.lastProcessedAt !== 'undefined') {
      exchangeTrade.lastProcessedAt = data.lastProcessedAt;
    }

    if (typeof data.entryOrder !== 'undefined') {
      exchangeTrade.entryOrder = ExchangeOrder.fromImport(data.entryOrder);
    }

    if (typeof data.exitOrder !== 'undefined') {
      exchangeTrade.exitOrder = ExchangeOrder.fromImport(data.exitOrder);
    }

    return exchangeTrade;
  }
}
