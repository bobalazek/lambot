export interface SessionConfigParametersInterface {
  // How long do we wait until we actually start trading?
  warmupPeriodSeconds: number;

  // At which interval we want to update the prices?
  assetPriceUpdateIntervalSeconds: number;

  // After how many seconds do we want to update the asset price statistis?
  // Set to 0 if disabled, altough it will run at least once in trader.start()
  assetPriceStatisticsUpdateIntervalSeconds: number;

  // Should we show the current price & staus for all the assets?
  showAssetPriceUpdates: boolean;

  // Should we show the status of all the current open trades?
  showOpenTradeUpdates: boolean;

  // At which interval we want to display the memory usage? Set to 0 if disabled
  memoryUsageMonitoringIntervalSeconds: number;
}
