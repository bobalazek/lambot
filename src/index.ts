import { Account } from './Core/Account';
import { Exchange } from './Core/Exchange';
import { Session } from './Core/Session';
import { Trader } from './Core/Trader';

const accountApiCredentials = {
  binance: {
    key: 'test',
    secret: 'test',
  },
};
const account = new Account('SoonToBeLamboOwner', accountApiCredentials);
const exchange = new Exchange('binance', 'Binance', account.apiCredentials.binance);

const sessionId = (new Date()).toISOString().replace(/\..+/, '');
const session = new Session(sessionId, account, exchange);

const trader = new Trader(session);
trader.start();
