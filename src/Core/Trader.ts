import { Session } from './Session';

export class Trader {
  session: Session;
  isTestMode: boolean;

  constructor(session: Session, isTestMode: boolean = true) {
    this.session = session;
    this.isTestMode = isTestMode;
  }

  async boot() {
    console.info(this.isTestMode
        ? `Trader (in TEST MODE) is starting now ...`
        : `Trader is starting now ...`);

    console.log(`
      Exchange: ${this.session.exchange.name};
      Session ID: ${this.session.id};
    `);

    console.log('Starting the exchange ...');

    await this.session.exchange.boot(this.session);

    console.info(`Starting the ticks now ...`);

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
        console.log(`Tick at ${new Date()}`);

        resolve();
      }, 1000);
    });
  }
}
