import path from 'path';
import fs from 'fs';
import chalk from 'chalk';

import { Asset } from '../Asset/Asset';
import { AssetPair } from '../Asset/AssetPair';
import { ExchangesEnum, ExchangesFactory } from '../Exchange/ExchangesFactory';
import { Session, SessionOrderTypes } from './Session';
import { SessionConfig } from './SessionConfig';
import { SessionTradingTypeEnum } from './SessionTradingType';
import { Strategy } from '../Strategy/Strategy';
import { Manager } from '../../Manager';
import { DATA_SESSIONS_DIR } from '../../Constants';
import logger from '../../Utils/Logger';
import { ExchangeTrade } from '../Exchange/ExchangeTrade';

export class SessionManager {
  static save(session: Session): string {
    logger.info(chalk.cyan('Saving the session ...'));

    if (process.env.NODE_ENV === 'test') {
      logger.debug(`Test environment. Skipping save ...`);

      return null;
    }

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

  static load(id: string): Promise<Session | null> {
    logger.info(chalk.cyan(`Loading session with ID "${id}" ...`));

    if (process.env.NODE_ENV === 'test') {
      logger.debug(`Test environment. Skipping load ...`);

      return null;
    }

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
    orderTypes: SessionOrderTypes,
    tradingTypes: SessionTradingTypeEnum[]
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
      orderTypes,
      tradingTypes
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
    orderTypes: SessionOrderTypes,
    tradingTypes: SessionTradingTypeEnum[]
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
      orderTypes,
      tradingTypes
    );
  }

  static getTradesSummary(session: Session) {
    return {
      total: {
        count: session.trades.length,
      },
      open: SessionManager.tradeStatisticsForType(session, session.getOpenTrades(), false),
      closed: SessionManager.tradeStatisticsForType(session, session.getClosedTrades(), true),
    }
  }

  /***** Helpers *****/
  static getPathById(id: string): string {
    const suffix = Manager.isTestMode
      ? '.testing'
      : '.production';

    return path.resolve(DATA_SESSIONS_DIR, id + suffix + '.json');
  }

  static tradeStatisticsForType(session: Session, trades: ExchangeTrade[], isClosed: boolean) {
    const sum = (total: number, current: number) => {
      return total + current;
    };
    const count = trades.length;

    let withFeesPercentages = [];
    let withoutFeesPercentages = [];
    let withFeesAmounts = [];
    let withoutFeesAmounts = [];

    trades.forEach((exchangeTrade) => {
      const assetPair = session.exchange.assetPairs.get(
        exchangeTrade.assetPair.getKey()
      );
      const assetPairPriceEntryNewest = assetPair?.getNewestPriceEntry();
      if (!assetPairPriceEntryNewest) {
        withFeesPercentages.push(0);
        withoutFeesPercentages.push(0);
        withFeesAmounts.push(0);
        withoutFeesAmounts.push(0);

        return;
      }

      const price = parseFloat(assetPairPriceEntryNewest.price);

      withFeesPercentages.push(
        isClosed
          ? exchangeTrade.getProfitPercentage(true)
          : exchangeTrade.getCurrentProfitPercentage(price, true)
      );
      withoutFeesPercentages.push(
        isClosed
          ? exchangeTrade.getProfitPercentage()
          : exchangeTrade.getCurrentProfitPercentage(price)
      );
      withFeesAmounts.push(
        isClosed
          ? exchangeTrade.getProfitAmount(true)
          : exchangeTrade.getCurrentProfitAmount(price, true)
      );
      withoutFeesAmounts.push(
        isClosed
          ? exchangeTrade.getProfitAmount()
          :  exchangeTrade.getCurrentProfitAmount(price)
      );
    });

    return {
      count,
      profitPercentages: {
        withoutFees: {
          sum: (withoutFeesPercentages.reduce(sum, 0) / count) || 0,
          percentages: withoutFeesPercentages,
        },
        withFees: {
          sum: (withFeesPercentages.reduce(sum, 0) / count) || 0,
          percentages: withFeesPercentages,
        },
      },
      profitAmounts: {
        asset: session.asset,
        withoutFees: {
          sum: withoutFeesAmounts.reduce(sum, 0) || 0,
          amounts: withoutFeesAmounts,
        },
        withFees: {
          sum: withFeesAmounts.reduce(sum, 0) || 0,
          amounts: withFeesAmounts,
        },
      },
    }
  }
}
