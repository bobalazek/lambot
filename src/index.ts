import dotenv from 'dotenv';
import { Command } from 'commander';

import { AssetPair } from './Core/Asset/AssetPair';
import { Assets } from './Core/Asset/Assets';
import { Manager } from './Core/Manager';
import { SessionManager } from './Core/Session/SessionManager';
import { SessionAsset } from './Core/Session/SessionAsset';
import { SessionConfig } from './Core/Session/SessionConfig';
import { Strategy } from './Core/Strategy/Strategy';

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
  // Config
  const sessionConfig = new SessionConfig({
    assetPriceUpdateIntervalSeconds: 2,
  });
  const exchangeKey = 'binance';
  const sessionAssets = [
    new SessionAsset(
      Assets.USDT,
      [
        new AssetPair(Assets.ETH, Assets.USDT),
        new AssetPair(Assets.BTC, Assets.USDT),
        new AssetPair(Assets.BNB, Assets.USDT),
        new AssetPair(Assets.BCH, Assets.USDT),
        new AssetPair(Assets.ETC, Assets.USDT),
        new AssetPair(Assets.LTC, Assets.USDT),
        new AssetPair(Assets.DOGE, Assets.USDT),
        new AssetPair(Assets.ADA, Assets.USDT),
        new AssetPair(Assets.EOS, Assets.USDT),
        new AssetPair(Assets.KSM, Assets.USDT),
        new AssetPair(Assets.AAVE, Assets.USDT),
        new AssetPair(Assets.DOT, Assets.USDT),
        new AssetPair(Assets.FIL, Assets.USDT),
        new AssetPair(Assets.MATIC, Assets.USDT),
        new AssetPair(Assets.VET, Assets.USDT),
        new AssetPair(Assets.XRP, Assets.USDT),
        new AssetPair(Assets.LUNA, Assets.USDT),
        new AssetPair(Assets.XRP, Assets.USDT),
        new AssetPair(Assets.THETA, Assets.USDT),
        new AssetPair(Assets.UNI, Assets.USDT),
        new AssetPair(Assets.SOL, Assets.USDT),
        new AssetPair(Assets.ICP, Assets.USDT),
        new AssetPair(Assets.LINK, Assets.USDT),
        new AssetPair(Assets.ETC, Assets.USDT),
        new AssetPair(Assets.XLM, Assets.USDT),
        new AssetPair(Assets.BTT, Assets.USDT),
        new AssetPair(Assets.ALGO, Assets.USDT),
        new AssetPair(Assets.CAKE, Assets.USDT),
        new AssetPair(Assets.FTT, Assets.USDT),
        new AssetPair(Assets.RUNE, Assets.USDT),
        new AssetPair(Assets.ATOM, Assets.USDT),
        new AssetPair(Assets.AVAX, Assets.USDT),
        new AssetPair(Assets.COMP, Assets.USDT),
        new AssetPair(Assets.HBAR, Assets.USDT),
        new AssetPair(Assets.TFUEL, Assets.USDT),
        new AssetPair(Assets.XTZ, Assets.USDT),
        new AssetPair(Assets.DCR, Assets.USDT),
        new AssetPair(Assets.ZEC, Assets.USDT),
        new AssetPair(Assets.MANA, Assets.USDT),
        new AssetPair(Assets.EGLD, Assets.USDT),
      ],
      new Strategy({
        orderAmount: '15',
      })
    ),
  ];

  // Init
  const session = await SessionManager.newOrLoad(
    sessionId,
    sessionConfig,
    exchangeKey,
    sessionAssets
  );

  await Manager.boot(session, isTestMode);
})();
