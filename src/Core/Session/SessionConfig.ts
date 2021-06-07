export interface SessionConfigInterface {
  isTestMode: boolean;
  warmupPeriodSeconds: number; // How long do we wait until we actually start trading?
  assetPriceUpdateIntervalSeconds: number; // At which interval we want to update the prices?
  memoryUsageMonitoringIntervalSeconds: number; // At which interval we want to display the memory usage?
  toExport(): Object;
}

export class SessionConfig implements SessionConfigInterface {
  isTestMode: boolean;
  warmupPeriodSeconds: number;
  assetPriceUpdateIntervalSeconds: number;
  memoryUsageMonitoringIntervalSeconds: number;

  constructor({
    isTestMode = true,
    warmupPeriodSeconds = 300,
    assetPriceUpdateIntervalSeconds = 2,
    memoryUsageMonitoringIntervalSeconds = 30,
  }) {
    this.isTestMode = isTestMode;
    this.warmupPeriodSeconds = warmupPeriodSeconds;
    this.assetPriceUpdateIntervalSeconds = assetPriceUpdateIntervalSeconds;
    this.memoryUsageMonitoringIntervalSeconds = memoryUsageMonitoringIntervalSeconds;
  }

  toExport(): Object {
    return {
      isTestMode: this.isTestMode,
      warmupPeriodSeconds: this.warmupPeriodSeconds,
      assetPriceUpdateIntervalSeconds: this.assetPriceUpdateIntervalSeconds,
      memoryUsageMonitoringIntervalSeconds: this.memoryUsageMonitoringIntervalSeconds,
    };
  }

  static async fromImport(data: any): Promise<SessionConfig> {
    return new SessionConfig({
      isTestMode: data.isTestMode,
      warmupPeriodSeconds: data.warmupPeriodSeconds,
      assetPriceUpdateIntervalSeconds: data.assetPriceUpdateIntervalSeconds,
      memoryUsageMonitoringIntervalSeconds: data.memoryUsageMonitoringIntervalSeconds,
    });
  }
}
