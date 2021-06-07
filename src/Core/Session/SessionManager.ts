import path from 'path';
import fs from 'fs';
import chalk from 'chalk';

import { ExchangesEnum, ExchangesFactory } from '../Exchange/ExchangesFactory';
import { Session } from './Session';
import { SessionAsset } from './SessionAsset';
import logger from '../../Utils/Logger';
import { SessionConfig } from './SessionConfig';

const DATA_SESSIONS_DIR = path.resolve(__dirname, '..', 'data', 'sessions');

export class SessionManager {
  static async save(session: Session): Promise<string> {
    logger.info(chalk.cyan('Saving the session ...'));

    const sessionFilePath = this.getPathById(session.id);

    const data = {
      session: session.toExport(),
      createdAt: +new Date(),
      version: 1,
    };

    fs.writeFileSync(sessionFilePath, JSON.stringify(data, null, 4), {
      encoding: 'utf8',
      flag: 'w+',
    });

    return sessionFilePath;
  }

  static async load(id: string): Promise<Session | null> {
    logger.info(chalk.cyan(`Loading session with ID "${id}" ...`));

    const sessionFilePath = this.getPathById(id);
    if (!fs.existsSync(sessionFilePath)) {
      logger.info(chalk.cyan(`Loading session with ID "${id}" ...`));

      return null;
    }

    const contents = fs.readFileSync(sessionFilePath, 'utf8');
    const data = JSON.parse(contents);

    return Session.fromImport(data);
  }

  static async new(
    id: string,
    config: SessionConfig,
    exchangeKey: ExchangesEnum | string,
    sessionAssets: SessionAsset[]
  ): Promise<Session> {
    logger.info(chalk.cyan(`Creating a new session with ID "${id}" ...`));

    const exchange = ExchangesFactory.get(exchangeKey);
    const session = new Session(id, exchange, config);

    sessionAssets.forEach((sessionAsset) => {
      session.addAsset(
        sessionAsset.asset,
        sessionAsset.assetPairs
      );
    });

    return session;
  }

  static async newOrLoad(
    id: string,
    config: SessionConfig,
    exchangeKey: ExchangesEnum | string,
    sessionAssets: SessionAsset[]
  ): Promise<Session> {
    const sessionFilePath = this.getPathById(id);
    if (fs.existsSync(sessionFilePath)) {
      const sessionLoaded = await this.load(id);

      // TODO: what to do if parameters are different?

      if (sessionLoaded) {
        return sessionLoaded;
      }
    }

    return this.new(id, config, exchangeKey, sessionAssets);
  }

  static getPathById(id: string): string {
    return path.resolve(DATA_SESSIONS_DIR, id + '.json');
  }
}
