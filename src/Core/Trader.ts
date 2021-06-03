import { Exchange } from './Exchange';
import { Session } from './Session';

export class Trader {
  sessions: Session[];
  exchanges: Map<string, Exchange>;
  isTestMode: boolean;

  constructor(sessions: Session[], isTestMode: boolean = true) {
    this.sessions = sessions;
    this.exchanges = new Map();
    this.isTestMode = isTestMode;
  }

  async start() {
    console.info(this.isTestMode
        ? `Trader (in TEST MODE) is starting now ...`
        : `Trader is starting now ...`);

    this.sessions.forEach((session) => {
      console.log(`
        Account: ${session.account.key};
        Exchange: ${session.account.exchange.name};
        Session ID: ${session.id};
      `);
    });

    await this._prepareExhanges();

    console.info(`Starting the ticks now ...`);

    while(true) {
      await this._tick();
    }
  }

  private async _prepareExhanges(): Promise<void> {
    // Those exchanges here will only be used when updating the prices.
    // Other, account related bits (get orders, ...) will still be executed
    // by the same API, but indirectly via account.exchange.customMethod().

    return new Promise((resolve) => {
      this.sessions.forEach((session) => {
        const { exchange } = session.account;
        const exchangeKey = exchange.key;

        // We only need one exchange to pool the prices for now.
        // In the future we may conect to more and alternate between them.
        if (this.exchanges.has(exchangeKey)) {
          return;
        }

        this.exchanges.set(exchangeKey, exchange);

        console.log(`Prepared the "${exchangeKey}" exchange from "${session.account.key}".`)
      });

      resolve();
    });
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
