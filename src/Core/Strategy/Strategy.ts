export interface StrategyParametersInterface {
  // How much of the base asset do we want to use per trade?
  tradeAmount: string;

  // How many open trades are we allowed to have for this asset?
  maximumOpenTrades: number;

  // How much do we want to get profit, until we trigger a sell?
  takeProfitPercentage: number;

  // If we have a sudden trough when we are are ready to take profit,
  // should we wait for it to be stable, or sell anyway?
  takeProfitTroughTimeoutSeconds: number;

  // Should we enable trailing take profit?
  trailingTakeProfitEnabled: boolean;

  // How much can the value trough (from the highest point) until we actually sell?
  trailingTakeProfitSlipPercentage: number;

  // Should we enable stop loss?
  stopLossEnabled: boolean;

  // How much can we lose until we trigger a sell?
  stopLossPercentage: number;

  // How long should we wait until we actually sell if it troughs below a certain value?
  // Usefull with suden large troughs!
  stopLossTimeoutSeconds: number;

  // Should we enable trailing stop loss?
  // This will activate AFTER you hit your initial takeProfitPercentage.
  // After that, the stop loss will then be set as to the takeProfit percentage.
  trailingStopLossEnabled: boolean;

  // How much percentage in profit do we need to increase,
  // relative to the CURRENT stopLossPercentage,
  // before we should increase the stop loss again?
  trailingStopLossThresholdPercentage: number;

  // Relates to the option above. It specifies by how much should it increase,
  // once it reaches that values specified above.
  // For example, the above value you'd probably set like 0.5 percent,
  // while this value, you would probably only set to 0.25, so it slowly
  // follows the above value "from a distance", in case of small dips.
  trailingStopLossThresholdValuePercentage: number;

  // How much percentage can the price rise after a trough, until we want to trigger a buy order?
  // This is mostly used so we follow the trough down, and once it starts getting back up, we buy!
  buyTroughUptrendThresholdPercentage: number;

  // Relates to the setting above. What is the maximum age (in seconds), we would still consider a buy?
  buyTroughUptrendThresholdMaximumAgeSeconds: number;
}

export interface StrategyInterface extends StrategyParametersInterface {
  toExport(): unknown;
}

export class Strategy implements StrategyInterface {
  tradeAmount: string;
  maximumOpenTrades: number;
  takeProfitPercentage: number;
  takeProfitTroughTimeoutSeconds: number;
  trailingTakeProfitEnabled: boolean;
  trailingTakeProfitSlipPercentage: number;
  stopLossEnabled: boolean;
  stopLossPercentage: number;
  stopLossTimeoutSeconds: number;
  trailingStopLossEnabled: boolean;
  trailingStopLossThresholdPercentage: number;
  trailingStopLossThresholdValuePercentage: number;
  buyTroughUptrendThresholdPercentage: number;
  buyTroughUptrendThresholdMaximumAgeSeconds: number;

  constructor(parameters: StrategyParametersInterface) {
    this.tradeAmount = parameters.tradeAmount;
    this.maximumOpenTrades = parameters.maximumOpenTrades;
    this.takeProfitPercentage = parameters.takeProfitPercentage;
    this.takeProfitTroughTimeoutSeconds = parameters.takeProfitTroughTimeoutSeconds;
    this.trailingTakeProfitEnabled = parameters.trailingTakeProfitEnabled;
    this.trailingTakeProfitSlipPercentage = parameters.trailingTakeProfitSlipPercentage;
    this.stopLossEnabled = parameters.stopLossEnabled;
    this.stopLossPercentage = parameters.stopLossPercentage;
    this.stopLossTimeoutSeconds = parameters.stopLossTimeoutSeconds;
    this.trailingStopLossEnabled = parameters.trailingStopLossEnabled;
    this.trailingStopLossThresholdPercentage = parameters.trailingStopLossThresholdPercentage;
    this.trailingStopLossThresholdValuePercentage = parameters.trailingStopLossThresholdValuePercentage;
    this.buyTroughUptrendThresholdPercentage = parameters.buyTroughUptrendThresholdPercentage;
    this.buyTroughUptrendThresholdMaximumAgeSeconds = parameters.buyTroughUptrendThresholdMaximumAgeSeconds;
  }

  /***** Export/Import *****/
  toExport() {
    return {
      tradeAmount: this.tradeAmount,
      maximumOpenTrades: this.maximumOpenTrades,
      takeProfitPercentage: this.takeProfitPercentage,
      takeProfitTroughTimeoutSeconds: this.takeProfitTroughTimeoutSeconds,
      trailingTakeProfitEnabled: this.trailingTakeProfitEnabled,
      trailingTakeProfitSlipPercentage: this.trailingTakeProfitSlipPercentage,
      stopLossEnabled: this.stopLossEnabled,
      stopLossPercentage: this.stopLossPercentage,
      stopLossTimeoutSeconds: this.stopLossTimeoutSeconds,
      trailingStopLossEnabled: this.trailingStopLossEnabled,
      trailingStopLossThresholdPercentage: this.trailingStopLossThresholdPercentage,
      trailingStopLossThresholdValuePercentage: this.trailingStopLossThresholdValuePercentage,
      buyTroughUptrendThresholdPercentage: this.buyTroughUptrendThresholdPercentage,
      buyTroughUptrendThresholdMaximumAgeSeconds: this.buyTroughUptrendThresholdMaximumAgeSeconds,
    };
  }

  static fromImport(data: any): Strategy {
    return new Strategy({
      tradeAmount: data.tradeAmount,
      maximumOpenTrades: data.maximumOpenTrades,
      takeProfitPercentage: data.takeProfitPercentage,
      takeProfitTroughTimeoutSeconds: data.takeProfitTroughTimeoutSeconds,
      trailingTakeProfitEnabled: data.trailingTakeProfitEnabled,
      trailingTakeProfitSlipPercentage: data.trailingTakeProfitSlipPercentage,
      stopLossEnabled: data.stopLossEnabled,
      stopLossPercentage: data.stopLossPercentage,
      stopLossTimeoutSeconds: data.stopLossTimeoutSeconds,
      trailingStopLossEnabled: data.trailingStopLossEnabled,
      trailingStopLossThresholdPercentage: data.trailingStopLossThresholdPercentage,
      trailingStopLossThresholdValuePercentage: data.trailingStopLossThresholdValuePercentage,
      buyTroughUptrendThresholdPercentage: data.buyTroughUptrendThresholdPercentage,
      buyTroughUptrendThresholdMaximumAgeSeconds: data.buyTroughUptrendThresholdMaximumAgeSeconds,
    });
  }
}
