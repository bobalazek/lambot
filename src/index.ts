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
  const baseAsset = Assets.USDT;
  const assets = [
    Assets.ETH, Assets.ETC, Assets.BTC, Assets.BNB, Assets.BCH,
    Assets.LTC, Assets.DOGE, Assets.ADA, Assets.DOT, Assets.UNI,
    Assets.SOL, Assets.LINK, Assets.DAI, Assets.MATIC, Assets.ALGO,
    Assets.XRP, Assets.ICP, Assets.THETA, Assets.XLM, Assets.VET,
    Assets.TRX, Assets.FIL, Assets.XMR, Assets.EOS, Assets.SHIB,
    Assets.SUSHI, Assets.AAVE, Assets.KSM, Assets.LUNA, Assets.BTT,
  ];

  // Important! Must be set BEFORE session loading, because inside the session manager,
  // we use that variable to determine the file name.
  Manager.isTestMode = isTestMode;

  const session = await SessionManager.newOrLoad(
    sessionId,
    new SessionConfig({}),
    ExchangesEnum.BINANCE,
    baseAsset,
    assets.map((asset) => {
      return new AssetPair(asset, baseAsset);
    }),
    new DefaultStrategy({}),
    SessionTradingTypeEnum.SPOT,
    ExchangeOrderTypeEnum.MARKET
  );

  await Manager.boot(session);
})();
