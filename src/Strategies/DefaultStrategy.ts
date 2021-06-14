import { Strategy } from '../Core/Strategy/Strategy';


export class DefaultStrategy extends Strategy {
  constructor({
    tradeAmount = '1',
    maximumOpenTrades = 5,
    minimumDailyVolume = 0,
    takeProfitPercentage = 5,
    takeProfitTroughTimeoutSeconds = 0,
    trailingTakeProfitEnabled = true,
    trailingTakeProfitSlipPercentage = 0.25,
    stopLossEnabled = true,
    stopLossPercentage = 3,
    stopLossTimeoutSeconds = 30,
    trailingStopLossEnabled = false,
    trailingStopLossThresholdPercentage = 0,
    buyTroughSlipPercentage = 0.25,
  }) {
    super({
      tradeAmount,
      maximumOpenTrades,
      minimumDailyVolume,
      takeProfitPercentage,
      takeProfitTroughTimeoutSeconds,
      trailingTakeProfitEnabled,
      trailingTakeProfitSlipPercentage,
      stopLossEnabled,
      stopLossPercentage,
      stopLossTimeoutSeconds,
      trailingStopLossEnabled,
      trailingStopLossThresholdPercentage,
      buyTroughSlipPercentage,
    });
  }
}
