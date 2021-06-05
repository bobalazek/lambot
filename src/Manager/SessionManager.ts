import path from 'path';

import { ExchangesEnum, ExhangesFactory } from '../Core/Exchanges';
import { Session, SessionAsset } from '../Core/Session';

const DATA_SESSIONS_DIR = path.resolve(__dirname, '..', '..', 'data', 'sessions');

export class SessionManager {
  static async save(session: Session): Promise<string> {
    const sessionPath = path.resolve(DATA_SESSIONS_DIR, session.id + '.json');

    // TODO

    return sessionPath;
  }

  static async load(sessionPath: string): Promise<Session | null> {
    // TODO

    return null;
  }

  static async new(
    id: string,
    exchangeString: ExchangesEnum | string,
    sessionAssets: SessionAsset[]
  ): Promise<Session> {
    const exchange = ExhangesFactory.get(exchangeString);
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
}
