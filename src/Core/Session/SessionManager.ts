import path from 'path';
import fs from 'fs';
import chalk from 'chalk';

import { ExchangesEnum, ExchangesFactory } from '../Exchange/ExchangesFactory';
import { Session } from './Session';
import { SessionAsset } from './SessionAsset';
import { SessionConfig } from './SessionConfig';
import { DATA_SESSIONS_DIR } from '../../Constants';
import logger from '../../Utils/Logger';

export class SessionManager {
  static async save(session: Session): Promise<string> {
    logger.info(chalk.cyan('Saving the session ...'));

    const sessionFilePath = this.getPathById(session.id);

    const data = {
      session: session.toExport(),
      createdAt: Date.now(),
      version: 1,
    };

    fs.mkdirSync(DATA_SESSIONS_DIR, { recursive: true });
    fs.writeFileSync(sessionFilePath, JSON.stringify(data, null, 4), {
      encoding: 'utf8',
      flag: 'w+',
    });

    logger.debug(`Session saved to "${sessionFilePath}"`);

    return sessionFilePath;
  }

  static async load(id: string): Promise<Session | null> {
    logger.info(chalk.cyan(`Loading session with ID "${id}" ...`));

    const sessionFilePath = this.getPathById(id);
    if (!fs.existsSync(sessionFilePath)) {
      logger.info(chalk.cyan(`Session with ID "${id}" does not exist.`));

      return null;
    }

    const contents = fs.readFileSync(sessionFilePath, 'utf8');
    const data = JSON.parse(contents);

    logger.debug(`Session loaded from "${sessionFilePath}"`);

    return Session.fromImport(data);
  }

  static async new(
    id: string,
    config: SessionConfig,
    exchangeKey: ExchangesEnum,
    sessionAssets: SessionAsset[]
  ): Promise<Session> {
    logger.info(chalk.cyan(`Creating a new session with ID "${id}" ...`));

    const exchange = ExchangesFactory.get(exchangeKey);
    const session = new Session(id, exchange, config);

    sessionAssets.forEach((sessionAsset) => {
      session.addAsset(sessionAsset);
    });

    return session;
  }

  static async newOrLoad(
    id: string,
    config: SessionConfig,
    exchangeKey: ExchangesEnum,
    sessionAssets: SessionAsset[]
  ): Promise<Session> {
    const sessionFilePath = this.getPathById(id);
    if (fs.existsSync(sessionFilePath)) {
      const session = await this.load(id);

      // Just to make sure, we will override the config and session assets in case they changed.
      session.config = config;
      session.assets.forEach((sessionAsset, index) => {
        const configSessionAsset = sessionAssets[index];
        if (sessionAsset.asset.getKey() !== configSessionAsset.asset.getKey()) {
          logger.critical(chalk.red.bold(
            `The base asset does not match between the loaded session and your current config. ` +
            `Either change your base asset back to ${sessionAsset.asset.getKey()}, or start a new session!`
          ));

          process.exit(1);
        }

        if (JSON.stringify(sessionAsset.assetPairs) !== JSON.stringify(configSessionAsset.assetPairs)) {
          sessionAsset.assetPairs.forEach((assetPair, subIndex) => {
            const configAssetPair = configSessionAsset.assetPairs[subIndex];
            if (JSON.stringify(assetPair) !== JSON.stringify(configAssetPair)) {
              logger.critical(chalk.red.bold(
                `Assets in the new config don't match those in your current config. ` +
                `You can only add new asset pairs, if you append them at the end of the array. ` +
                `You can NOT remove or reorder any existing asset pairs in the array!`
              ));

              process.exit(1);
            }
          });

          const assetPairsCount = sessionAsset.assetPairs.length;
          const configAssetPairsCount = configSessionAsset.assetPairs.length;
          if (configAssetPairsCount > assetPairsCount) {
            for (let i = assetPairsCount; i < configAssetPairsCount; i++) {
              const newAssetPair = configSessionAsset.assetPairs[i]
              session.addAssetPair(newAssetPair);

              logger.debug(
                `Adding a new asset pair to the loaded session: ${newAssetPair.toString()}`
              );
            }
          }
        }

        sessionAsset.strategy = configSessionAsset.strategy;

        const openTrades = sessionAsset.getOpenTrades();
        if (openTrades.length > 0) {
          // TODO: check for any open trades on the exchange
        }
      });

      if (session) {
        return session;
      }
    }

    return this.new(
      id,
      config,
      exchangeKey,
      sessionAssets
    );
  }

  static getPathById(id: string): string {
    return path.resolve(DATA_SESSIONS_DIR, id + '.json');
  }
}
