import chalk from 'chalk';

import { Session } from './Session/Session';
import { Trader } from './Trader/Trader';
import logger from '../Utils/Logger';

export class Manager {
  public static session: Session;
  public static trader: Trader;
  public static isTestMode: boolean;

  public static async boot(
    session: Session,
    isTestMode = true
  ): Promise<Trader> {
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
      `Exchange: ${this.session.exchange.name}; ` +
      `Session ID: ${this.session.id}; ` +
      `Session config: ${JSON.stringify(this.session.config)}`
    ));

    await this.session.exchange.boot(this.session);

    this.trader = new Trader(this.session);

    await this.trader.start();

    if (memoryUsageMonitoringIntervalSeconds) {
      this._startMemoryUsageMonitoring(
        memoryUsageMonitoringIntervalSeconds * 1000
      );
    }

    return this.trader;
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
