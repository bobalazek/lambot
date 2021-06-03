import dotenv from 'dotenv';
import { Command } from 'commander';

import { AssetPair, Assets } from './Core/Asset';
import { Session } from './Core/Session';
import { Trader } from './Core/Trader';
import { BinanceExchange } from './Exchanges/BinanceExchange';

// Prepare environment
dotenv.config();

// Prepare CLI
const program = new Command();
program
  .version('0.1')
  .option('-p, --production', 'Use actual production credentials', false)
  .option('-s, --session', 'Want to continue a session? Leave blank if you want to start a new one.', null)
  .parse(process.argv)
;
const programOptions = program.opts();

// Actual program
const isTestMode = !programOptions.production;
const sessionId = programOptions.session ?? (new Date()).toISOString().replace(/\..+/, '');

const exchange = new BinanceExchange({
  key: process.env.BINANCE_API_KEY,
  secret: process.env.BINANCE_API_SECRET,
});
const session = new Session(sessionId, exchange);
session.addAsset(
  Assets.ETH,
  [
    new AssetPair(Assets.ETH, Assets.USDT),
  ],
  '0.05'
);

const trader = new Trader(session, isTestMode);

trader.boot();
