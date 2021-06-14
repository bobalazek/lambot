import chalk from 'chalk';

import { ExchangeAssetPriceInterface } from '../Exchange/ExchangeAssetPrice';
import { Session } from '../Session/Session';
import { SessionAsset } from '../Session/SessionAsset';
import logger from '../../Utils/Logger';

export interface TraderInterface {
  session: Session;
  start(): ReturnType<typeof setInterval>;
  processCurrentTrades(): Promise<void>;
  processPotentialTrades(): Promise<void>;
  shouldBuy(sessionAsset: SessionAsset): boolean;
  shouldSell(sessionAsset: SessionAsset): boolean;
  executeBuy(sessionAsset: SessionAsset): boolean;
  executeSell(sessionAsset: SessionAsset): boolean;
}

export class Trader implements TraderInterface {
  session: Session;

  constructor(session: Session) {
    this.session = session;

    this.start();
  }

  start() {
    const {
      session,
    } = this;
    const {
      assetPriceUpdateIntervalSeconds,
      trendIntervalSeconds,
    } = session.config;
    const updateInterval = assetPriceUpdateIntervalSeconds * 1000;
    const trendIntervalTime = trendIntervalSeconds * 1000;
    const assetPairs = session.getAssetPairs();

    return setInterval(async () => {
      // Update the current asset prices
      const assetPrices = await session.exchange.getAssetPrices();
      const now = Date.now();

      for (let i = 0; i < assetPrices.length; i++) {
        const assetData = assetPrices[i];
        if (!assetPairs.has(assetData.symbol)) {
          continue;
        }

        const assetPrice = session.exchange.assetPairPrices.get(assetData.symbol);
        if (!assetPrice) {
          logger.info(chalk.red.bold(
            `Assset price for symbol "${assetData.symbol}" not found.`
          ));

          process.exit(1);
        }

        assetPrice.addEntry({
          timestamp: now,
          price: assetData.price,
        });
      }

      // Now that we updated our prices, let's process the entries!
      logger.info(chalk.bold('Starting to process entries ...'));
      session.exchange.assetPairPrices.forEach((exchangeAssetPrice) => {
        exchangeAssetPrice.processEntries();
      });
      const processingTime = Date.now() - now;
      logger.debug(`Processing took ${processingTime}ms.`);

      // Return the price data
      logger.info(chalk.bold('Asset pair price updates:'));
      session.exchange.assetPairPrices.forEach((exchangeAssetPrice, key) => {
        const priceText = exchangeAssetPrice.getPriceText(now, trendIntervalTime);

        logger.info(chalk.bold(key) + ' - ' + priceText);
      });

      // Cleanup entries if processing time takes too long
      if (processingTime > updateInterval / 10) {
        session.exchange.assetPairPrices.forEach((exchangeAssetPrice) => {
          exchangeAssetPrice.cleanupEntries(0.5);
        });
      }

      // Actually start checking if we can do any trades
      await this.processCurrentTrades();
      await this.processPotentialTrades();
    }, updateInterval);
  }

  async processCurrentTrades(): Promise<void> {
    const {
      session,
    } = this;

    logger.debug('Starting to process trades ...');

    session.assets.forEach((sessionAsset) => {
      if (!this.shouldSell(sessionAsset)) {
        return;
      }

      this.executeSell(sessionAsset);
    });
  }

  async processPotentialTrades(): Promise<void> {
    logger.debug('Starting to process new potential trades ...');

    // TODO: order them by the biggest relative profit percentage or something?
    this.session.assets.forEach((sessionAsset) => {
      if (!this.shouldBuy(sessionAsset)) {
        return;
      }

      this.executeBuy(sessionAsset);
    });
  }

  shouldBuy(sessionAsset: SessionAsset): boolean {
    const assetPrice = this.session.exchange.assetPairPrices.get(sessionAsset.asset.symbol);

    // TODO

    return false;
  }

  shouldSell(sessionAsset: SessionAsset): boolean {
    const assetPrice = this.session.exchange.assetPairPrices.get(sessionAsset.asset.symbol);

    // TODO

    return false;
  }

  executeBuy(sessionAsset: SessionAsset): boolean {
    // TODO

    return false;
  }

  executeSell(sessionAsset: SessionAsset): boolean {
    // TODO

    return false;
  }
}
