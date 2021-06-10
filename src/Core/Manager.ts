import chalk from 'chalk';

import { Session } from './Session/Session';
import logger from '../Utils/Logger';

export class Manager {
  public static session: Session;
  public static isTestMode: boolean;

  public static async boot(
    session: Session,
    isTestMode = true
  ) {
    this.session = session;
    this.isTestMode = isTestMode;

    const {
      memoryUsageMonitoringIntervalSeconds,
    } = this.session.config;

    logger.info(chalk.cyan(
      this.isTestMode
        ? 'Trader (in TEST MODE) is starting now ...'
        : 'Trader is starting now ...'
    ));

    logger.info(chalk.cyan(
      `Session ID: ${this.session.id}; Exchange: ${this.session.exchange.name}`
    ));

    await this.session.exchange.boot(this.session);
    await this.session.exchange.start();

    if (memoryUsageMonitoringIntervalSeconds) {
      this._startMemoryUsageMonitoring(
        memoryUsageMonitoringIntervalSeconds * 1000
      );
    }
  }

  private static _startMemoryUsageMonitoring(updateInterval: number) {
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
}
