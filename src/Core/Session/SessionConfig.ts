export interface SessionConfigInterface {
  warmupPeriodSeconds: number; // How long do we wait until we actually start trading?
  assetPriceUpdateIntervalSeconds: number; // At which interval we want to update the prices?
  memoryUsageMonitoringIntervalSeconds: number; // At which interval we want to display the memory usage? Set to 0 if disabled
  toExport(): unknown;
}

export class SessionConfig implements SessionConfigInterface {
  warmupPeriodSeconds: number;
  assetPriceUpdateIntervalSeconds: number;
  memoryUsageMonitoringIntervalSeconds: number;

  constructor({
    warmupPeriodSeconds = 300,
    assetPriceUpdateIntervalSeconds = 2,
    memoryUsageMonitoringIntervalSeconds = 30,
  }) {
    this.warmupPeriodSeconds = warmupPeriodSeconds;
    this.assetPriceUpdateIntervalSeconds = assetPriceUpdateIntervalSeconds;
    this.memoryUsageMonitoringIntervalSeconds = memoryUsageMonitoringIntervalSeconds;
  }

  toExport() {
    return {
      warmupPeriodSeconds: this.warmupPeriodSeconds,
      assetPriceUpdateIntervalSeconds: this.assetPriceUpdateIntervalSeconds,
      memoryUsageMonitoringIntervalSeconds: this.memoryUsageMonitoringIntervalSeconds,
    };
  }

  static fromImport(data: any): SessionConfig {
    return new SessionConfig({
      warmupPeriodSeconds: data.warmupPeriodSeconds,
      assetPriceUpdateIntervalSeconds: data.assetPriceUpdateIntervalSeconds,
      memoryUsageMonitoringIntervalSeconds: data.memoryUsageMonitoringIntervalSeconds,
    });
  }
}
