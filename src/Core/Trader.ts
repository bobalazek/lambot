import { Exchange } from './Exchange';
import { Session } from './Session';

export class Trader {
  sessions: Session[];
  exchanges: Map<string, Exchange>;

  constructor(sessions: Session[]) {
    this.sessions = sessions;
    this.exchanges = new Map();
  }

  async start() {
    console.info(`Trader is starting now ...`);
    this.sessions.forEach((session) => {
      console.log(`
        Account: ${session.account.name};
        Exchange: ${session.exchange.name};
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
    return new Promise((resolve) => {
      this.sessions.forEach((session) => {
        const exchange = session.exchange;
        const exchangeKey = exchange.key;

        // We only need one exchange to pool the prices for now.
        // In the future we may conect to more and alternate between them.
        if (this.exchanges.has(exchangeKey)) {
          return;
        }

        this.exchanges.set(exchangeKey, exchange);

        console.log(`Prepared the "${exchangeKey}" exchange from "${session.account.name}".`)
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
