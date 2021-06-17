export interface SessionConfigInterface {
  warmupPeriodSeconds: number; // How long do we wait until we actually start trading?
  assetPriceUpdateIntervalSeconds: number; // At which interval we want to update the prices?
  showAssetPriceUpdates: boolean; // Should we show the current price & staus for all the assets?
  showOpenTradeUpdates: boolean; // Should we show the status of all the current open trades?
  memoryUsageMonitoringIntervalSeconds: number; // At which interval we want to display the memory usage? Set to 0 if disabled
  toExport(): unknown;
}

export class SessionConfig implements SessionConfigInterface {
  warmupPeriodSeconds: number;
  assetPriceUpdateIntervalSeconds: number;
  showAssetPriceUpdates: boolean;
  showOpenTradeUpdates: boolean;
  memoryUsageMonitoringIntervalSeconds: number;

  constructor({
    warmupPeriodSeconds = 60,
    assetPriceUpdateIntervalSeconds = 2,
    showAssetPriceUpdates = false,
    showOpenTradeUpdates = true,
    memoryUsageMonitoringIntervalSeconds = 30,
  }) {
    this.warmupPeriodSeconds = warmupPeriodSeconds;
    this.assetPriceUpdateIntervalSeconds = assetPriceUpdateIntervalSeconds;
    this.showAssetPriceUpdates = showAssetPriceUpdates;
    this.showOpenTradeUpdates = showOpenTradeUpdates;
    this.memoryUsageMonitoringIntervalSeconds = memoryUsageMonitoringIntervalSeconds;
  }

  /***** Export/Import *****/
  toExport() {
    return {
      warmupPeriodSeconds: this.warmupPeriodSeconds,
      assetPriceUpdateIntervalSeconds: this.assetPriceUpdateIntervalSeconds,
      showAssetPriceUpdates: this.showAssetPriceUpdates,
      showOpenTradeUpdates: this.showOpenTradeUpdates,
      memoryUsageMonitoringIntervalSeconds: this.memoryUsageMonitoringIntervalSeconds,
    };
  }

  static fromImport(data: any): SessionConfig {
    return new SessionConfig({
      warmupPeriodSeconds: data.warmupPeriodSeconds,
      assetPriceUpdateIntervalSeconds: data.assetPriceUpdateIntervalSeconds,
      showAssetPriceUpdates: data.showAssetPriceUpdates,
      showOpenTradeUpdates: data.showOpenTradeUpdates,
      memoryUsageMonitoringIntervalSeconds: data.memoryUsageMonitoringIntervalSeconds,
    });
  }
}
