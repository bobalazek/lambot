export interface SessionConfigInterface {
  // How long do we wait until we actually start trading?
  warmupPeriodSeconds: number;

  // Should we show the status of all the current open trades?
  openTradeUpdateIntervalSeconds: number;

  // Should we show the current price & status for all the assets?
  assetPairPriceUpdateIntervalSeconds: number;

  // After how many seconds we refetch the candlestick data?
  assetPairCandlestickUpdateIntervalSeconds: number;

  // At which interval we want to display the memory usage? Set to 0 if disabled
  memoryUsageMonitoringIntervalSeconds: number;

  // Should we enable the web server api?
  webServerApiEnabled: boolean;

  // What is the port of the server?
  webServerApiPort: number;
}

export class SessionConfig implements SessionConfigInterface {
  warmupPeriodSeconds: number;
  openTradeUpdateIntervalSeconds: number;
  assetPairPriceUpdateIntervalSeconds: number;
  assetPairCandlestickUpdateIntervalSeconds: number;
  memoryUsageMonitoringIntervalSeconds: number;
  webServerApiEnabled: boolean;
  webServerApiPort: number;

  constructor({
    warmupPeriodSeconds = 60,
    openTradeUpdateIntervalSeconds = 5,
    assetPairPriceUpdateIntervalSeconds = 1,
    assetPairCandlestickUpdateIntervalSeconds = 0,
    memoryUsageMonitoringIntervalSeconds = 30,
    webServerApiEnabled = false,
    webServerApiPort = 3000,
  }) {
    this.warmupPeriodSeconds = warmupPeriodSeconds;
    this.openTradeUpdateIntervalSeconds = openTradeUpdateIntervalSeconds;
    this.assetPairPriceUpdateIntervalSeconds = assetPairPriceUpdateIntervalSeconds;
    this.assetPairCandlestickUpdateIntervalSeconds = assetPairCandlestickUpdateIntervalSeconds;
    this.memoryUsageMonitoringIntervalSeconds = memoryUsageMonitoringIntervalSeconds;
    this.webServerApiEnabled = webServerApiEnabled;
    this.webServerApiPort = webServerApiPort;
  }

  /***** Export/Import *****/
  toExport() {
    return {
      warmupPeriodSeconds: this.warmupPeriodSeconds,
      openTradeUpdateIntervalSeconds: this.openTradeUpdateIntervalSeconds,
      assetPairPriceUpdateIntervalSeconds: this.assetPairPriceUpdateIntervalSeconds,
      assetPairCandlestickUpdateIntervalSeconds: this.assetPairCandlestickUpdateIntervalSeconds,
      memoryUsageMonitoringIntervalSeconds: this.memoryUsageMonitoringIntervalSeconds,
      webServerApiEnabled: this.webServerApiEnabled,
      webServerApiPort: this.webServerApiPort,
    };
  }

  static fromImport(data: any): SessionConfig {
    return new SessionConfig({
      warmupPeriodSeconds: data.warmupPeriodSeconds,
      openTradeUpdateIntervalSeconds: data.openTradeUpdateIntervalSeconds,
      assetPairPriceUpdateIntervalSeconds: data.assetPairPriceUpdateIntervalSeconds,
      assetPairCandlestickUpdateIntervalSeconds: data.assetPairCandlestickUpdateIntervalSeconds,
      memoryUsageMonitoringIntervalSeconds: data.memoryUsageMonitoringIntervalSeconds,
      webServerApiEnabled: data.webServerApiEnabled,
      webServerApiPort: data.webServerApiPort,
    });
  }
}
