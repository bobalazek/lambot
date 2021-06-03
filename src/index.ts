import { Assets } from './Core/Asset';
import { Session } from './Core/Session';
import { Trader } from './Core/Trader';
import { BinanceExchange } from './Exchanges/BinanceExchange';

const isTestMode = true;
const sessionId = (new Date()).toISOString().replace(/\..+/, '');

const exchange = new BinanceExchange({
  key: 'test',
  secret: 'test',
});
const session = new Session(sessionId, exchange);
session.addAsset(Assets.ETH, [
  [Assets.ETH, Assets.USDT],
]);

const trader = new Trader(session, isTestMode);

trader.start();
