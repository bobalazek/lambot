import dotenv from 'dotenv';
import { Command } from 'commander';

import { Manager } from './Core/Manager';
import { SessionManager } from './Core/Session/SessionManager';
import config from '../config/Config';

dotenv.config();

// Prepare CLI
const program = new Command();
program
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
  // Important! Must be set BEFORE session loading, because inside the session manager,
  // we use that variable to determine the file name.
  Manager.isTestMode = isTestMode;

  const session = await SessionManager.newOrLoad(
    sessionId,
    config.sessionConfig,
    config.sessionExchange,
    config.sessionAsset,
    config.sessionAssetPairs,
    config.sessionStrategy,
    config.sessionTradingTypes,
    config.sessionOrderType
  );

  await Manager.boot(session);
})();
