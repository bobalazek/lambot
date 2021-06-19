import { Strategy } from '../Core/Strategy/Strategy';

export class DefaultStrategy extends Strategy {
  constructor({
    tradeAmount = '15',
    maximumOpenTrades = 5,
    maximumOpenTradesPerAssetPair = 1,
    minimumDailyVolume = 10000,
    takeProfitPercentage = 1.5,
    trailingTakeProfitEnabled = true,
    trailingTakeProfitSlipPercentage = 0.1,
    stopLossEnabled = true,
    stopLossPercentage = 2,
    stopLossTimeoutSeconds = 0,
    trailingStopLossEnabled = true,
    trailingStopLossPercentage = 10,
    buyTroughUptrendPercentage = 0.1,
    buyTroughUptrendMaximumAgeSeconds = 90,
  }) {
    super({
      tradeAmount,
      maximumOpenTrades,
      maximumOpenTradesPerAssetPair,
      minimumDailyVolume,
      takeProfitPercentage,
      trailingTakeProfitEnabled,
      trailingTakeProfitSlipPercentage,
      stopLossEnabled,
      stopLossPercentage,
      stopLossTimeoutSeconds,
      trailingStopLossEnabled,
      trailingStopLossPercentage,
      buyTroughUptrendPercentage,
      buyTroughUptrendMaximumAgeSeconds,
    });
  }
}
