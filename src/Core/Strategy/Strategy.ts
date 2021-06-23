import { StrategyParametersInterface } from './StrategyParameters';

export interface StrategyInterface extends StrategyParametersInterface {
  toExport(): unknown;
}

export class Strategy implements StrategyInterface {
  tradeAmount: string;
  maximumOpenTrades: number;
  maximumOpenTradesPerAssetPair: number;
  minimumDailyVolume: number;
  takeProfitPercentage: number;
  trailingTakeProfitEnabled: boolean;
  trailingTakeProfitSlipPercentage: number;
  stopLossEnabled: boolean;
  stopLossPercentage: number;
  stopLossTimeoutSeconds: number;
  trailingStopLossEnabled: boolean;
  trailingStopLossPercentage: number;
  buyTroughUptrendPercentage: number;
  buyTroughUptrendMaximumAgeSeconds: number;

  constructor(parameters: StrategyParametersInterface) {
    this.tradeAmount = parameters.tradeAmount;
    this.maximumOpenTrades = parameters.maximumOpenTrades;
    this.maximumOpenTradesPerAssetPair = parameters.maximumOpenTradesPerAssetPair;
    this.minimumDailyVolume = parameters.minimumDailyVolume;
    this.takeProfitPercentage = parameters.takeProfitPercentage;
    this.trailingTakeProfitEnabled = parameters.trailingTakeProfitEnabled;
    this.trailingTakeProfitSlipPercentage = parameters.trailingTakeProfitSlipPercentage;
    this.stopLossEnabled = parameters.stopLossEnabled;
    this.stopLossPercentage = parameters.stopLossPercentage;
    this.stopLossTimeoutSeconds = parameters.stopLossTimeoutSeconds;
    this.trailingStopLossEnabled = parameters.trailingStopLossEnabled;
    this.trailingStopLossPercentage = parameters.trailingStopLossPercentage;
    this.buyTroughUptrendPercentage = parameters.buyTroughUptrendPercentage;
    this.buyTroughUptrendMaximumAgeSeconds = parameters.buyTroughUptrendMaximumAgeSeconds;
  }

  /***** Export/Import *****/
  toExport() {
    return {
      tradeAmount: this.tradeAmount,
      maximumOpenTrades: this.maximumOpenTrades,
      maximumOpenTradesPerAssetPair: this.maximumOpenTradesPerAssetPair,
      minimumDailyVolume: this.minimumDailyVolume,
      takeProfitPercentage: this.takeProfitPercentage,
      trailingTakeProfitEnabled: this.trailingTakeProfitEnabled,
      trailingTakeProfitSlipPercentage: this.trailingTakeProfitSlipPercentage,
      stopLossEnabled: this.stopLossEnabled,
      stopLossPercentage: this.stopLossPercentage,
      stopLossTimeoutSeconds: this.stopLossTimeoutSeconds,
      trailingStopLossEnabled: this.trailingStopLossEnabled,
      trailingStopLossPercentage: this.trailingStopLossPercentage,
      buyTroughUptrendPercentage: this.buyTroughUptrendPercentage,
      buyTroughUptrendMaximumAgeSeconds: this.buyTroughUptrendMaximumAgeSeconds,
    };
  }

  static fromImport(data: any): Strategy {
    return new Strategy({
      tradeAmount: data.tradeAmount,
      maximumOpenTrades: data.maximumOpenTrades,
      maximumOpenTradesPerAssetPair: data.maximumOpenTradesPerAssetPair,
      minimumDailyVolume: data.minimumDailyVolume,
      takeProfitPercentage: data.takeProfitPercentage,
      trailingTakeProfitEnabled: data.trailingTakeProfitEnabled,
      trailingTakeProfitSlipPercentage: data.trailingTakeProfitSlipPercentage,
      stopLossEnabled: data.stopLossEnabled,
      stopLossPercentage: data.stopLossPercentage,
      stopLossTimeoutSeconds: data.stopLossTimeoutSeconds,
      trailingStopLossEnabled: data.trailingStopLossEnabled,
      trailingStopLossPercentage: data.trailingStopLossPercentage,
      buyTroughUptrendPercentage: data.buyTroughUptrendPercentage,
      buyTroughUptrendMaximumAgeSeconds: data.buyTroughUptrendMaximumAgeSeconds,
    });
  }
}
