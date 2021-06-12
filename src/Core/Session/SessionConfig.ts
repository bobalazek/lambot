export interface SessionConfigInterface {
  warmupPeriodSeconds: number; // How long do we wait until we actually start trading?
  assetPriceUpdateIntervalSeconds: number; // At which interval we want to update the prices?
  trendIntervalSeconds: number; // How many seconds should it average to get the current trend?
  memoryUsageMonitoringIntervalSeconds: number; // At which interval we want to display the memory usage? Set to 0 if disabled
  toExport(): unknown;
}

export class SessionConfig implements SessionConfigInterface {
  warmupPeriodSeconds: number;
  assetPriceUpdateIntervalSeconds: number;
  trendIntervalSeconds: number;
  memoryUsageMonitoringIntervalSeconds: number;

  constructor({
    warmupPeriodSeconds = 300,
    assetPriceUpdateIntervalSeconds = 2,
    trendIntervalSeconds = 2,
    memoryUsageMonitoringIntervalSeconds = 30,
  }) {
    this.warmupPeriodSeconds = warmupPeriodSeconds;
    this.assetPriceUpdateIntervalSeconds = assetPriceUpdateIntervalSeconds;
    this.trendIntervalSeconds = trendIntervalSeconds;
    this.memoryUsageMonitoringIntervalSeconds = memoryUsageMonitoringIntervalSeconds;
  }

  /***** Export/Import *****/
  toExport() {
    return {
      warmupPeriodSeconds: this.warmupPeriodSeconds,
      assetPriceUpdateIntervalSeconds: this.assetPriceUpdateIntervalSeconds,
      trendIntervalSeconds: this.trendIntervalSeconds,
      memoryUsageMonitoringIntervalSeconds: this.memoryUsageMonitoringIntervalSeconds,
    };
  }

  static fromImport(data: any): SessionConfig {
    return new SessionConfig({
      warmupPeriodSeconds: data.warmupPeriodSeconds,
      assetPriceUpdateIntervalSeconds: data.assetPriceUpdateIntervalSeconds,
      trendIntervalSeconds: data.trendIntervalSeconds,
      memoryUsageMonitoringIntervalSeconds: data.memoryUsageMonitoringIntervalSeconds,
    });
  }
}
