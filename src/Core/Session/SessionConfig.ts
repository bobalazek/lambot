export interface SessionConfigInterface {
  isTestMode: boolean;
  warmupPeriodSeconds: number; // How long do we wait until we actually start trading?
  assetPriceUpdateIntervalSeconds: number; // At which interval we want to update the prices?
  memoryUsageMonitoringIntervalSeconds: number; // At which interval we want to display the memory usage?
}
