import logger from '../Utils/Logger';
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

    logger.info('Booting up the exchange ...');

    await this.session.exchange.boot(this.session);

    logger.info(`Starting the ticks now ...`);

    while(true) {
      await this._tick();
    }
  }

  private async _tick(): Promise<void> {
    return new Promise((resolve) => {
      // Update current prices
      // Check if we need to do any order
      // Excecute orders

      setTimeout(() => {
        logger.debug(`Ticking ...`);

        resolve();
      }, 1000);
    });
  }
}
