import chalk from 'chalk';

import { Session } from './Session/Session';
import { Server } from '../Server/Server';
import { Trader } from './Trader';
import logger from '../Utils/Logger';

export class Manager {
  public static session: Session;
  public static trader: Trader;
  public static server: Server;
  public static isTestMode: boolean = true;

  public static async boot(session: Session): Promise<Trader> {
    this.session = session;

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

    this.server = new Server();

    this._startMemoryUsageMonitoring();

    return this.trader;
  }

  private static _startMemoryUsageMonitoring() {
    const {
      memoryUsageMonitoringIntervalSeconds,
    } = this.session.config;

    return setInterval(() => {
      const memoryUsage = process.memoryUsage();
      logger.info(chalk.cyan(
        'Memory usage: ' +
        Object.keys(memoryUsage).map((key) => {
          return `${key} - ${Math.round(memoryUsage[key] / 1024 / 1024 * 100) / 100} MB`;
        }).join('; ')
      ));
    }, memoryUsageMonitoringIntervalSeconds * 1000);
  }
}
