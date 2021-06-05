import logger from '../Utils/Logger';
import { ExchangeAssetPrice } from './Exchange';
import { Session } from './Session';

export class Trader {
  session: Session;
  isTestMode: boolean;

  constructor(session: Session, isTestMode: boolean = true) {
    this.session = session;
    this.isTestMode = isTestMode;
  }

  async boot() {
    logger.info(
      this.isTestMode
        ? 'Trader (in TEST MODE) is starting now ...'
        : 'Trader is starting now ...'
    );

    logger.info(`Session ID: ${this.session.id}; Exchange: ${this.session.exchange.name}`);

    await this.session.exchange.boot(this.session);

    this._startMemoryUsageMonitoring(15 * 1000);
    this._startExchangeSessionAssetPairMonitoring(5 * 1000);
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

      logger.debug(memoryUsageText);
    }, updateInterval);
  }

  private _startExchangeSessionAssetPairMonitoring(updateInterval: number) {
    return setInterval(() => {
      logger.info('Last price updates:');

      this.session.exchange.getSessionAssetPairPrices().forEach((sessionAssetPairPrice, key) => {
        logger.info(key + ' - ' + sessionAssetPairPrice.lastPrice);
      });
    }, updateInterval);
  }
}
