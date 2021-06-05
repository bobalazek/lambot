import path from 'path';
import fs from 'fs';

import { ExchangesEnum, ExchangesFactory } from '../Core/Exchanges';
import { Session, SessionAsset } from '../Core/Session';
import logger from '../Utils/Logger';

const DATA_SESSIONS_DIR = path.resolve(__dirname, '..', 'data', 'sessions');

export class SessionManager {
  static async save(session: Session): Promise<string> {
    logger.info('Saving the session ...');

    const sessionFilePath = this.getPathById(session.id);

    const object = {
      session: session.toExport(),
      exchange: session.exchange.toExport(),
      createdAt: +new Date(),
    };

    fs.writeFileSync(sessionFilePath, JSON.stringify(object, null, 4), {
      encoding: 'utf8',
      flag: 'w+',
    });

    return sessionFilePath;
  }

  static async load(id: string): Promise<Session | null> {
    logger.info(`Loading session with ID "${id}" ...`);

    const sessionFilePath = this.getPathById(id);
    if (!fs.existsSync(sessionFilePath)) {
      logger.debug(`Loading session with ID "${id}" ...`);

      return null;
    }

    const contents = fs.readFileSync(sessionFilePath, 'utf8');
    const object = JSON.parse(contents);

    return Session.fromImport(object);
  }

  static async new(
    id: string,
    exchangeString: ExchangesEnum | string,
    sessionAssets: SessionAsset[]
  ): Promise<Session> {
    logger.info(`Creating a new session with ID "${id}" ...`);

    const exchange = ExchangesFactory.get(exchangeString);
    const session = new Session(id, exchange);

    sessionAssets.forEach((sessionAsset) => {
      session.addAsset(
        sessionAsset.asset,
        sessionAsset.assetPairs,
        sessionAsset.amountTotal,
        sessionAsset.amountPerOrder
      );
    });

    return session;
  }

  static async newOrLoad(
    id: string,
    exchangeString: ExchangesEnum | string,
    sessionAssets: SessionAsset[]
  ): Promise<Session> {
    const sessionFilePath = this.getPathById(id);
    if (fs.existsSync(sessionFilePath)) {
      const sessionLoaded = await this.load(id);

      if (sessionLoaded) {
        return sessionLoaded;
      }

      logger.info(`Tried to load session with ID "${id}", but it returned null ...`);
    }

    return this.new(id, exchangeString, sessionAssets);
  }

  static getPathById(id: string): string {
    return path.resolve(DATA_SESSIONS_DIR, id + '.json');
  }
}
