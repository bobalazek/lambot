import chalk from 'chalk';
import express, {
  Application,
  Request,
  Response,
} from 'express';

import { Manager } from './Manager';
import { SessionManager } from './Session/SessionManager';
import logger from '../Utils/Logger';

export class Server {
  app: Application;
  port: number;

  constructor(port: number) {
    this.app = express();
    this.port = port;
  }

  async boot(): Promise<Application> {
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
    this.app.get('/', (request: Request, response: Response) => {
      response.status(200).json({
        isTestMode: Manager.isTestMode,
      });
    });

    this.app.get('/api/session', (request: Request, response: Response) => {
      const data = Manager.session.toExport();
      delete data.trades;
      response.status(200).json(data);
    });

    this.app.get('/api/session/trades', (request: Request, response: Response) => {
      response.status(200).json(Manager.session.trades.map((exchangeTrade) => {
        return exchangeTrade.toExport();
      }));
    });

    this.app.get('/api/session/trades/summary', (request: Request, response: Response) => {
      response.status(200).json(SessionManager.getTradesSummary(Manager.session));
    });
  }
}
