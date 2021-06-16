import { Strategy } from '../Core/Strategy/Strategy';

export class DefaultStrategy extends Strategy {
  constructor({
    tradeAmount = '1',
    maximumOpenTrades = 5,
    takeProfitPercentage = 5,
    takeProfitTroughTimeoutSeconds = 0,
    trailingTakeProfitEnabled = true,
    trailingTakeProfitSlipPercentage = 0.05,
    stopLossEnabled = true,
    stopLossPercentage = 3,
    stopLossTimeoutSeconds = 30,
    trailingStopLossEnabled = false,
    trailingStopLossThresholdPercentage = 0,
    trailingStopLossThresholdValuePercentage = 0,
    buyTroughUptrendThresholdPercentage = 0.05,
    buyTroughUptrendThresholdMaximumAgeSeconds = 60,
  }) {
    super({
      tradeAmount,
      maximumOpenTrades,
      takeProfitPercentage,
      takeProfitTroughTimeoutSeconds,
      trailingTakeProfitEnabled,
      trailingTakeProfitSlipPercentage,
      stopLossEnabled,
      stopLossPercentage,
      stopLossTimeoutSeconds,
      trailingStopLossEnabled,
      trailingStopLossThresholdPercentage,
      trailingStopLossThresholdValuePercentage,
      buyTroughUptrendThresholdPercentage,
      buyTroughUptrendThresholdMaximumAgeSeconds,
    });
  }
}
