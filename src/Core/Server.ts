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

  constructor(port: number) {
    this.app = express();

    logger.info(chalk.cyan(
      `Starting the server ...`
    ));

    this._configureRoutes();

    this.app.listen(port, () => {
      logger.info(chalk.cyan(
        `Server started at port ${port}`
      ));
    });
  }

  private _configureRoutes() {
    this.app.get('/', (request: Request, response: Response) => {
      response.status(200).json({
        isTestMode: Manager.isTestMode,
      });
    });

    this.app.get('/session', (request: Request, response: Response) => {
      const data = Manager.session.toExport();
      delete data.trades;
      response.status(200).json(data);
    });

    this.app.get('/session/trades', (request: Request, response: Response) => {
      response.status(200).json(Manager.session.trades.map((exchangeTrade) => {
        return exchangeTrade.toExport();
      }));
    });

    this.app.get('/session/trades/summary', (request: Request, response: Response) => {
      response.status(200).json(SessionManager.getTradesSummary(Manager.session));
    });
  }
}
