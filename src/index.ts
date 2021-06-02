import { Account } from './Core/Account';
import { Exchange } from './Core/Exchange';
import { Session } from './Core/Session';
import { Trader } from './Core/Trader';

const exchange = new Exchange('binance', 'Binance', {
  key: 'test',
  secret: 'test',
});
const account = new Account('BorutBinance', exchange);
const sessionId = (new Date()).toISOString().replace(/\..+/, '');
const session = new Session(sessionId, account, exchange);
const trader = new Trader([
  session,
]);
trader.start();
