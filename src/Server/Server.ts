import chalk from 'chalk';
import express, {
  Application,
  Request,
  Response,
} from 'express';

import { SessionManager } from '../Core/Session/SessionManager';
import { Trader } from '../Trader/Trader';
import logger from '../Utils/Logger';

export class Server {
  app: Application;
  port: number;
  trader!: Trader;

  constructor(port: number) {
    this.app = express();
    this.port = port;
  }

  async boot(trader: Trader): Promise<Application> {
    this.trader = trader;

    logger.info(chalk.cyan(
      `Booting the server ...`
    ));

    this._configureRoutes();

    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        logger.info(chalk.cyan(
          `Server started at port ${this.port}`
        ));

        resolve(this.app);
      });
    });
  }

  private _configureRoutes() {
    this.app.get('/api', (request: Request, response: Response) => {
      response.status(200).json({
        isTestMode: this.trader.isTestMode,
      });
    });

    this.app.get('/api/session', (request: Request, response: Response) => {
      const data = this.trader.session.toExport();
      data.trades = [];
      response.status(200).json(data);
    });

    this.app.get('/api/session/trades', (request: Request, response: Response) => {
      response.status(200).json(this.trader.session.trades.map((exchangeTrade) => {
        return exchangeTrade.toExport();
      }));
    });

    this.app.get('/api/session/trades/summary', (request: Request, response: Response) => {
      response.status(200).json(SessionManager.getTradesSummary(this.trader.session));
    });
  }
}
