import dotenv from 'dotenv';
import { Command } from 'commander';

import { SessionManager } from './Core/Session/SessionManager';
import { Trader } from './Trader/Trader';
import config from '../config/Config';

dotenv.config();

const program = new Command();

// Prepare CLI
const tradeCommand = program
  .command('trade')
  .option('-a, --action', 'What action do we want to execute? Available: "trade"', 'trade')
  .option('-p, --production', 'Does actual trading with your account.', false)
  .option('-s, --session <session>', 'You can override your session ID with this parameter. It will load if one with the same ID already exists, else it will create a new one.')
  .action(async (options: any) => {
    const isTestMode = !options.production;
    const sessionId = options.session;

    SessionManager.isTestMode = isTestMode;

    const session = await SessionManager.newOrLoad(
      sessionId || config.sessionId,
      config.sessionConfig,
      config.sessionExchange,
      config.sessionAsset,
      config.sessionAssetPairs,
      config.sessionStrategy,
      config.sessionOrderTypes,
      config.sessionTradingTypes,
    );

    const trader = new Trader();

    await trader.boot(session, isTestMode);
  })
;
program.addCommand(tradeCommand);

program.parse(process.argv);
