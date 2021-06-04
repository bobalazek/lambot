import dotenv from 'dotenv';
import { Command } from 'commander';

import { AssetPair, Assets } from './Core/Asset';
import { Session } from './Core/Session';
import { Trader } from './Core/Trader';
import { BinanceExchange } from './Exchanges/BinanceExchange';

// Prepare environment variables
dotenv.config();

// Prepare CLI
const program = new Command();
program
  .version('0.1')
  .option('-p, --production', 'Use actual production credentials', false)
  .option('-s, --session <session>', 'Want to continue a session? Leave blank if you want to start a new one.', null)
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
  Assets.USDT,
  [
    new AssetPair(Assets.ETH, Assets.USDT),
    new AssetPair(Assets.BTC, Assets.USDT),
    new AssetPair(Assets.ADA, Assets.USDT),
    new AssetPair(Assets.DOT, Assets.USDT),
    new AssetPair(Assets.FIL, Assets.USDT),
    new AssetPair(Assets.MATIC, Assets.USDT),
    new AssetPair(Assets.VET, Assets.USDT),
    new AssetPair(Assets.XRP, Assets.USDT),
    new AssetPair(Assets.LUNA, Assets.USDT),
    new AssetPair(Assets.XRP, Assets.USDT),
  ],
  '0.1',
  '0.02'
);

const trader = new Trader(session, isTestMode);

trader.boot();
