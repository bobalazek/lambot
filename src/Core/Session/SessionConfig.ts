export interface SessionConfigInterface {
  // How long do we wait until we actually start trading?
  warmupPeriodSeconds: number;

  // At which interval we want to update the prices?
  assetPairPriceUpdateIntervalSeconds: number;

  // Should we show the current price & staus for all the assets?
  showAssetPairPriceUpdates: boolean;

  // Should we show the status of all the current open trades?
  showOpenTradeUpdates: boolean;

  // At which interval we want to display the memory usage? Set to 0 if disabled
  memoryUsageMonitoringIntervalSeconds: number;
}

export class SessionConfig implements SessionConfigInterface {
  warmupPeriodSeconds: number;
  assetPairPriceUpdateIntervalSeconds: number;
  showAssetPairPriceUpdates: boolean;
  showOpenTradeUpdates: boolean;
  memoryUsageMonitoringIntervalSeconds: number;

  constructor({
    warmupPeriodSeconds = 60,
    assetPairPriceUpdateIntervalSeconds = 1,
    showAssetPairPriceUpdates = false,
    showOpenTradeUpdates = true,
    memoryUsageMonitoringIntervalSeconds = 30,
  }) {
    this.warmupPeriodSeconds = warmupPeriodSeconds;
    this.assetPairPriceUpdateIntervalSeconds = assetPairPriceUpdateIntervalSeconds;
    this.showAssetPairPriceUpdates = showAssetPairPriceUpdates;
    this.showOpenTradeUpdates = showOpenTradeUpdates;
    this.memoryUsageMonitoringIntervalSeconds = memoryUsageMonitoringIntervalSeconds;
  }

  /***** Export/Import *****/
  toExport() {
    return {
      warmupPeriodSeconds: this.warmupPeriodSeconds,
      assetPairPriceUpdateIntervalSeconds: this.assetPairPriceUpdateIntervalSeconds,
      showAssetPairPriceUpdates: this.showAssetPairPriceUpdates,
      showOpenTradeUpdates: this.showOpenTradeUpdates,
      memoryUsageMonitoringIntervalSeconds: this.memoryUsageMonitoringIntervalSeconds,
    };
  }

  static fromImport(data: any): SessionConfig {
    return new SessionConfig({
      warmupPeriodSeconds: data.warmupPeriodSeconds,
      assetPairPriceUpdateIntervalSeconds: data.assetPairPriceUpdateIntervalSeconds,
      showAssetPairPriceUpdates: data.showAssetPairPriceUpdates,
      showOpenTradeUpdates: data.showOpenTradeUpdates,
      memoryUsageMonitoringIntervalSeconds: data.memoryUsageMonitoringIntervalSeconds,
    });
  }
}
