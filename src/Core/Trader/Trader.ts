import chalk from 'chalk';

import { Session } from '../Session/Session';
import logger from '../../Utils/Logger';

export class Trader {
  _session: Session;
  _isTestMode: boolean;

  constructor(session: Session, isTestMode = true) {
    this._session = session;
    this._isTestMode = isTestMode;
  }

  async boot() {
    const {
      memoryUsageMonitoringIntervalSeconds,
      assetPriceUpdateIntervalSeconds,
    } = this._session.config;

    logger.info(chalk.cyan(
      this._isTestMode
        ? 'Trader (in TEST MODE) is starting now ...'
        : 'Trader is starting now ...'
    ));

    logger.info(chalk.cyan(
      `Session ID: ${this._session.id}; Exchange: ${this._session.exchange.name}`
    ));

    await this._session.exchange.boot(this._session);

    this._startMemoryUsageMonitoring(memoryUsageMonitoringIntervalSeconds * 1000);
    this._startExchangeSessionAssetPairsMonitoring(assetPriceUpdateIntervalSeconds * 1000);
  }

  private _startMemoryUsageMonitoring(updateInterval: number) {
    return setInterval(() => {
      const memoryUsage = process.memoryUsage();
      const memoryUsageText = (
        'Memory usage: ' +
        Object.keys(memoryUsage).map((key) => {
          return `${key} - ${Math.round(memoryUsage[key] / 1024 / 1024 * 100) / 100} MB`;
        }).join('; ')
      );

      logger.info(chalk.cyanBright(memoryUsageText));
    }, updateInterval);
  }

  private _startExchangeSessionAssetPairsMonitoring(updateInterval: number) {
    return setInterval(() => {
      logger.info(chalk.bold('Asset pair price updates:'));

      const now = +new Date();

      this._session.exchange.getSessionAssetPairPrices().forEach((sessionAssetPairPrice, key) => {
        const statusText = sessionAssetPairPrice.getStatusText(now);

        logger.info(chalk.bold(key) + ' - ' + statusText);
      });
    }, updateInterval);
  }
}
