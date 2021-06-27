import { SERVER_PORT } from '../../Constants';

export interface SessionConfigInterface {
  // How long do we wait until we actually start trading?
  warmupPeriodSeconds: number;

  // Should we show the current price & status for all the assets?
  showAssetPairPriceUpdates: boolean;

  // Should we show the status of all the current open trades?
  showOpenTradeUpdates: boolean;

  // At which interval we want to display the memory usage? Set to 0 if disabled
  memoryUsageMonitoringIntervalSeconds: number;

  // Should we enable the web server api?
  webServerApiEnabled: boolean;

  // What is the port of the server?
  webServerApiPort: number;
}

export class SessionConfig implements SessionConfigInterface {
  warmupPeriodSeconds: number;
  showAssetPairPriceUpdates: boolean;
  showOpenTradeUpdates: boolean;
  memoryUsageMonitoringIntervalSeconds: number;
  webServerApiEnabled: boolean;
  webServerApiPort: number;

  constructor({
    warmupPeriodSeconds = 60,
    showAssetPairPriceUpdates = false,
    showOpenTradeUpdates = true,
    memoryUsageMonitoringIntervalSeconds = 30,
    webServerApiEnabled = true,
    webServerApiPort = SERVER_PORT,
  }) {
    this.warmupPeriodSeconds = warmupPeriodSeconds;
    this.showAssetPairPriceUpdates = showAssetPairPriceUpdates;
    this.showOpenTradeUpdates = showOpenTradeUpdates;
    this.memoryUsageMonitoringIntervalSeconds = memoryUsageMonitoringIntervalSeconds;
    this.webServerApiEnabled = webServerApiEnabled;
    this.webServerApiPort = webServerApiPort;
  }

  /***** Export/Import *****/
  toExport() {
    return {
      warmupPeriodSeconds: this.warmupPeriodSeconds,
      showAssetPairPriceUpdates: this.showAssetPairPriceUpdates,
      showOpenTradeUpdates: this.showOpenTradeUpdates,
      memoryUsageMonitoringIntervalSeconds: this.memoryUsageMonitoringIntervalSeconds,
    };
  }

  static fromImport(data: any): SessionConfig {
    return new SessionConfig({
      warmupPeriodSeconds: data.warmupPeriodSeconds,
      showAssetPairPriceUpdates: data.showAssetPairPriceUpdates,
      showOpenTradeUpdates: data.showOpenTradeUpdates,
      memoryUsageMonitoringIntervalSeconds: data.memoryUsageMonitoringIntervalSeconds,
    });
  }
}
