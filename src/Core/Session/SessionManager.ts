import path from 'path';
import fs from 'fs';
import chalk from 'chalk';

import { Asset } from '../Asset/Asset';
import { AssetPair } from '../Asset/AssetPair';
import { Manager } from '../Manager';
import { ExchangesEnum, ExchangesFactory } from '../Exchange/ExchangesFactory';
import { ExchangeOrderTypeEnum } from '../Exchange/ExchangeOrder';
import { Session, SessionTradingTypeEnum } from './Session';
import { SessionConfig } from './SessionConfig';
import { Strategy } from '../Strategy/Strategy';
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
    asset: Asset,
    assetPairs: AssetPair[],
    strategy: Strategy,
    tradingTypes: SessionTradingTypeEnum[],
    orderType: ExchangeOrderTypeEnum
  ): Promise<Session> {
    logger.info(chalk.cyan(`Creating a new session with ID ${id} ...`));

    const exchange = ExchangesFactory.get(exchangeKey);
    const session = new Session(
      id,
      exchange,
      config,
      asset,
      assetPairs,
      strategy,
      tradingTypes,
      orderType
    );

    return session;
  }

  static async newOrLoad(
    id: string,
    config: SessionConfig,
    exchangeKey: ExchangesEnum,
    asset: Asset,
    assetPairs: AssetPair[],
    strategy: Strategy,
    tradingTypes: SessionTradingTypeEnum[],
    orderType: ExchangeOrderTypeEnum
  ): Promise<Session> {
    const sessionFilePath = this.getPathById(id);
    if (fs.existsSync(sessionFilePath)) {
      const session = await this.load(id);

      // Just to make sure, we will override the config and session assets in case they changed.
      session.isLoadedFromPersistence = true;
      session.config = config;
      if (session.asset.getKey() !== asset.getKey()) {
        logger.critical(chalk.red.bold(
          `The base asset does not match between the loaded session and your current config. ` +
          `Either change your base asset back to ${session.asset.getKey()}, or start a new session!`
        ));

        process.exit(1);
      }

      if (JSON.stringify(session.assetPairs) !== JSON.stringify(assetPairs)) {
        session.assetPairs.forEach((assetPair, subIndex) => {
          const configAssetPair = assetPairs[subIndex];
          if (JSON.stringify(assetPair) !== JSON.stringify(configAssetPair)) {
            logger.critical(chalk.red.bold(
              `Assets in the new config don't match those in your current config. ` +
              `You can only add new asset pairs, if you append them at the end of the array. ` +
              `You can NOT remove or reorder any existing asset pairs in the array!`
            ));

            process.exit(1);
          }
        });

        const assetPairsCount = session.assetPairs.length;
        const configAssetPairsCount = assetPairs.length;
        if (configAssetPairsCount > assetPairsCount) {
          for (let i = assetPairsCount; i < configAssetPairsCount; i++) {
            const newAssetPair = assetPairs[i]
            session.addAssetPair(newAssetPair);

            logger.debug(
              `Adding a new asset pair to the loaded session: ${newAssetPair.getKey()}`
            );
          }
        }
      }

      session.strategy = strategy;

      if (session) {
        return session;
      }
    }

    return this.new(
      id,
      config,
      exchangeKey,
      asset,
      assetPairs,
      strategy,
      tradingTypes,
      orderType
    );
  }

  static getTradesSummary(session: Session) {
    const allTrades = session.trades;
    const closedTrades = session.getClosedTrades();
    const openTrades = session.getOpenTrades();

    const totalCount = allTrades.length;
    const closedCount = closedTrades.length;
    const openCount = openTrades.length;

    const closedProfitPercentage = closedTrades.map((exchangeTrade) => {
      return exchangeTrade.getProfitPercentage();
    }).reduce((total, current) => {
      return total + current;
    }, 0) / closedTrades.length;
    const closedProfitIncludingFeesPercentage = closedTrades.map((exchangeTrade) => {
      return exchangeTrade.getProfitPercentage(true);
    }).reduce((total, current) => {
      return total + current;
    }, 0) / closedTrades.length;
    const openProfitPercentage = openTrades.map((exchangeTrade) => {
      const assetPairPrice = Manager.session.exchange.assetPairs.get(
        exchangeTrade.assetPair.getKey()
      );
      const assetPairPriceEntryNewest = assetPairPrice.getNewestPriceEntry();
      const currentAssetPairPrice = parseFloat(assetPairPriceEntryNewest.price);

      return exchangeTrade.getCurrentProfitPercentage(currentAssetPairPrice);
    }).reduce((total, current) => {
      return total + current;
    }, 0) / openTrades.length;
    const openProfitIncludingFeesPercentage = openTrades.map((exchangeTrade) => {
      const assetPairPrice = Manager.session.exchange.assetPairs.get(
        exchangeTrade.assetPair.getKey()
      );
      const assetPairPriceEntryNewest = assetPairPrice.getNewestPriceEntry();
      const currentAssetPairPrice = parseFloat(assetPairPriceEntryNewest.price);

      return exchangeTrade.getCurrentProfitPercentage(currentAssetPairPrice, true);
    }).reduce((total, current) => {
      return total + current;
    }, 0) / openTrades.length;

    return {
      totalCount,
      closedCount,
      openCount,
      closedProfitPercentage,
      closedProfitIncludingFeesPercentage,
      openProfitPercentage,
      openProfitIncludingFeesPercentage,
    }
  }

  /***** Helpers *****/
  static getPathById(id: string): string {
    const suffix = Manager.isTestMode
      ? '.testing'
      : '.production';

    return path.resolve(DATA_SESSIONS_DIR, id + suffix + '.json');
  }
}
