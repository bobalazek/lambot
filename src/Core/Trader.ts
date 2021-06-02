import { Session } from './Session';

export class Trader {
  session: Session;

  constructor(session: Session) {
    this.session = session;
  }

  async start() {
    console.log(`Starting session "${this.session.id}" for "${this.session.account.name}".`);

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
