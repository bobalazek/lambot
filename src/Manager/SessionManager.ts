import path from 'path';

import { ExhangesFactory } from '../Core/Exchanges';
import { Session } from '../Core/Session';

const DATA_SESSIONS_DIR = path.resolve(__dirname, '..', '..', 'data', 'sessions');

export class SessionManager {
  async save(session: Session): Promise<string> {
    const sessionPath = path.resolve(DATA_SESSIONS_DIR, session.id + '.json');

    return sessionPath;
  }

  async load(sessionPath: string): Promise<Session> {
    return new Session('123', ExhangesFactory.get('binance'));
  }
}
