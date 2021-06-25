import dotenv from 'dotenv';
import { Command } from 'commander';

import { AssetPair } from './Core/Asset/AssetPair';
import { Assets } from './Core/Asset/Assets';
import { Manager } from './Core/Manager';
import { ExchangesEnum } from './Core/Exchange/ExchangesFactory';
import { SessionManager } from './Core/Session/SessionManager';
import { SessionConfig } from './Core/Session/SessionConfig';
import { DefaultStrategy } from './Strategies/DefaultStrategy';
import { ExchangeOrderTypeEnum } from './Core/Exchange/ExchangeOrder';
import { SessionTradingTypeEnum } from './Core/Session/Session';

// Prepare environment variables
dotenv.config();

// Prepare CLI
const program = new Command();
program
  .version('0.1')
  .option('-p, --production', 'Does actual trading with your account.', false)
  .requiredOption('-s, --session <session>', 'Enter your session ID. It will load if one with the same ID already exists, else it will create a new one.')
  .parse(process.argv)
;
const programOptions = program.opts();

// Actual program
const isTestMode = !programOptions.production;
const sessionId = programOptions.session;

// A workaround for the top-level-await issue
(async() => {
  const session = await SessionManager.newOrLoad(
    sessionId,
    new SessionConfig({}),
    ExchangesEnum.BINANCE,
    Assets.USDT,
    [
      new AssetPair(Assets.ETH, Assets.USDT),
      new AssetPair(Assets.ETC, Assets.USDT),
      new AssetPair(Assets.BTC, Assets.USDT),
      new AssetPair(Assets.BNB, Assets.USDT),
      new AssetPair(Assets.BCH, Assets.USDT),
      new AssetPair(Assets.ETC, Assets.USDT),
      new AssetPair(Assets.LTC, Assets.USDT),
      new AssetPair(Assets.DOGE, Assets.USDT),
      new AssetPair(Assets.ADA, Assets.USDT),
      new AssetPair(Assets.DOT, Assets.USDT),
      new AssetPair(Assets.UNI, Assets.USDT),
      new AssetPair(Assets.SOL, Assets.USDT),
      new AssetPair(Assets.LINK, Assets.USDT),
      new AssetPair(Assets.DAI, Assets.USDT),
      new AssetPair(Assets.MATIC, Assets.USDT),
      new AssetPair(Assets.ALGO, Assets.USDT),
    ],
    new DefaultStrategy({}),
    SessionTradingTypeEnum.SPOT,
    ExchangeOrderTypeEnum.MARKET
  );

  const trader = await Manager.boot(session, isTestMode);
  await trader.start();
})();
