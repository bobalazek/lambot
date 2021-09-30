export interface StrategyParametersInterface {
  // How much of the base asset do we want to use per trade?
  tradeAmount: string;

  // How many open trades are we allowed to have for this asset? Set -1 for unlimited.
  maximumOpenTrades: number;

  // How many open trades are we allowed to have for this asset AND this asset pair? Set -1 for unlimited.
  maximumOpenTradesPerAssetPair: number;

  // How much daily volume (converted to the base asset) do we need to consider a buy?
  minimumDailyVolume: number;

  /********* Take Profit **********/
  // How much do we want to get profit, until we trigger a sell?
  // Note: This DOES NOT take the fees into account!
  takeProfitPercentage: number;

  // Should we enable trailing take profit?
  trailingTakeProfitEnabled: boolean;

  // How much can the value trough (from the highest point) until we actually sell?
  trailingTakeProfitSlipPercentage: number;

  /********* Stop Loss **********/
  // Should we enable stop loss?
  stopLossEnabled: boolean;

  // How much can we lose until we trigger a sell?
  // Positive integer, which is inverted to determine the "tirggerStopLossPercentage"
  // Note: This DOES NOT take the fees into account!
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
  trailingStopLossPercentage: number;
}
