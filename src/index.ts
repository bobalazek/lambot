import { Account } from './Core/Account';
import { Assets } from './Core/Asset';
import { Exchange } from './Core/Exchange';
import { Session } from './Core/Session';
import { Trader } from './Core/Trader';

const isTestMode = true;
const sessionId = (new Date()).toISOString().replace(/\..+/, '');
const exchange = new Exchange('binance', 'Binance', {
  key: 'test',
  secret: 'test',
});
const account = new Account('BorutBinance', exchange);

const session = new Session(sessionId, account);
session.addAsset(Assets.ETH, [
  [Assets.ETH, Assets.USDT],
]);

const trader = new Trader([
  session,
], isTestMode);
trader.start();
