import { SessionConfigParametersInterface } from './SessionConfigParameters';

// TODO: do the same as with StrategyParameters, so we don't have a separate class,
// but only a interface?

export interface SessionConfigInterface extends SessionConfigParametersInterface {
  toExport(): unknown;
}

export class SessionConfig implements SessionConfigInterface {
  warmupPeriodSeconds: number;
  assetPriceUpdateIntervalSeconds: number;
  assetPriceStatisticsUpdateIntervalSeconds: number;
  showAssetPriceUpdates: boolean;
  showOpenTradeUpdates: boolean;
  memoryUsageMonitoringIntervalSeconds: number;

  constructor({
    warmupPeriodSeconds = 60,
    assetPriceUpdateIntervalSeconds = 1,
    assetPriceStatisticsUpdateIntervalSeconds = 300,
    showAssetPriceUpdates = false,
    showOpenTradeUpdates = true,
    memoryUsageMonitoringIntervalSeconds = 30,
  }) {
    this.warmupPeriodSeconds = warmupPeriodSeconds;
    this.assetPriceUpdateIntervalSeconds = assetPriceUpdateIntervalSeconds;
    this.assetPriceStatisticsUpdateIntervalSeconds = assetPriceStatisticsUpdateIntervalSeconds;
    this.showAssetPriceUpdates = showAssetPriceUpdates;
    this.showOpenTradeUpdates = showOpenTradeUpdates;
    this.memoryUsageMonitoringIntervalSeconds = memoryUsageMonitoringIntervalSeconds;
  }

  /***** Export/Import *****/
  toExport() {
    return {
      warmupPeriodSeconds: this.warmupPeriodSeconds,
      assetPriceUpdateIntervalSeconds: this.assetPriceUpdateIntervalSeconds,
      assetPriceStatisticsUpdateIntervalSeconds: this.assetPriceStatisticsUpdateIntervalSeconds,
      showAssetPriceUpdates: this.showAssetPriceUpdates,
      showOpenTradeUpdates: this.showOpenTradeUpdates,
      memoryUsageMonitoringIntervalSeconds: this.memoryUsageMonitoringIntervalSeconds,
    };
  }

  static fromImport(data: any): SessionConfig {
    return new SessionConfig({
      warmupPeriodSeconds: data.warmupPeriodSeconds,
      assetPriceUpdateIntervalSeconds: data.assetPriceUpdateIntervalSeconds,
      assetPriceStatisticsUpdateIntervalSeconds: data.assetPriceStatisticsUpdateIntervalSeconds,
      showAssetPriceUpdates: data.showAssetPriceUpdates,
      showOpenTradeUpdates: data.showOpenTradeUpdates,
      memoryUsageMonitoringIntervalSeconds: data.memoryUsageMonitoringIntervalSeconds,
    });
  }
}
