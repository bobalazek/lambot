import path from 'path';
import fs from 'fs';
import chalk from 'chalk';

import { ExchangesEnum, ExchangesFactory } from '../Exchange/ExchangesFactory';
import { Session } from './Session';
import { SessionAsset } from './SessionAsset';
import { SessionConfig } from './SessionConfig';
import { DATA_SESSIONS_DIR } from '../../constants';
import logger from '../../Utils/Logger';

export class SessionManager {
  static async save(session: Session): Promise<string> {
    logger.info(chalk.cyan('Saving the session ...'));

    const sessionFilePath = this.getPathById(session.id);

    const data = {
      session: session.toExport(),
      createdAt: Date.now(),
      version: 1,
    };

    fs.mkdirSync(DATA_SESSIONS_DIR, { recursive: true });
    fs.writeFileSync(sessionFilePath, JSON.stringify(data, null, 4), {
      encoding: 'utf8',
      flag: 'w+',
    });

    logger.debug(`Session saved to "${sessionFilePath}"`);

    return sessionFilePath;
  }

  static async load(id: string): Promise<Session | null> {
    logger.info(chalk.cyan(`Loading session with ID "${id}" ...`));

    const sessionFilePath = this.getPathById(id);
    if (!fs.existsSync(sessionFilePath)) {
      logger.info(chalk.cyan(`Session with ID "${id}" does not exist.`));

      return null;
    }

    const contents = fs.readFileSync(sessionFilePath, 'utf8');
    const data = JSON.parse(contents);

    logger.debug(`Session loaded from "${sessionFilePath}"`);

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
        sessionAsset.assetPairs,
        sessionAsset.strategy
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

    return this.new(
      id,
      config,
      exchangeKey,
      sessionAssets
    );
  }

  static getPathById(id: string): string {
    return path.resolve(DATA_SESSIONS_DIR, id + '.json');
  }
}
