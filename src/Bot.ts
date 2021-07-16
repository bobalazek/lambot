import fs from 'fs';
import dotenv from 'dotenv';
import { Command } from 'commander';

import { Manager } from './Manager';
import { SessionManager } from './Core/Session/SessionManager';
import { ConfigInterface } from './Config';

dotenv.config();

// Prepare CLI
const program = new Command();
program
  .option('-a, --action', 'What action do we want to execute? Available: "trade"', 'trade')
  .option('-p, --production', 'Does actual trading with your account.', false)
  .option('-s, --session <session>', 'You can override your session ID with this parameter. It will load if one with the same ID already exists, else it will create a new one.')
  .parse(process.argv)
;
const programOptions = program.opts();

// Actual program
const isTestMode = !programOptions.production;
const sessionId = programOptions.session;

// A workaround for the top-level-await issue
(async() => {
  const configFile = '../config/Config.ts';
  if (!fs.existsSync(configFile)) {
    console.log(
      `Can not find the "/config/Config.ts" file. ` +
      `Please create the config file by copying the example file from the same directory!`
    );
    process.exit(1);
  }

  const config: ConfigInterface = (await import(configFile)).default;

  // Important!
  // This MUST be set BEFORE session loading, because inside the session manager,
  // we use that variable to determine the file name.
  Manager.isTestMode = isTestMode;

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

  await Manager.boot(session);
})();
