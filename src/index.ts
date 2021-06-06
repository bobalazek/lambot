import dotenv from 'dotenv';
import { Command } from 'commander';

import { AssetPair, Assets } from './Core/Asset';
import { Trader } from './Core/Trader';
import { SessionManager } from './Manager/SessionManager';
import { SessionAsset } from './Core/Session';

// Prepare environment variables
dotenv.config();

// Prepare CLI
const program = new Command();
program
  .version('0.1')
  .option('-p, --production', 'Use actual production credentials', false)
  .requiredOption('-s, --session <session>', 'Want to continue a session? Leave blank if you want to start a new one.')
  .parse(process.argv)
;
const programOptions = program.opts();

// Actual program
const isTestMode = !programOptions.production;
const sessionId = programOptions.session;

// A workaround for the top-lever-await issue
(async() => {
  const session = await SessionManager.newOrLoad(
    sessionId,
    'binance',
    [
      new SessionAsset(
        null, // Keep that null, because it will be set in the manager
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
      ),
    ]
  );

  const trader = new Trader(session, isTestMode);

  trader.boot();
})();
