import chalk from 'chalk';

import { ExchangeTrade } from '../Exchange/ExchangeTrade';
import { ExchangeAssetPriceInterface } from '../Exchange/ExchangeAssetPrice';
import { Session } from '../Session/Session';
import { SessionAsset } from '../Session/SessionAsset';
import logger from '../../Utils/Logger';

export interface TraderInterface {
  session: Session;
  start(): ReturnType<typeof setInterval>;
  shouldBuy(
    sessionAsset: SessionAsset,
    exchangeAssetPrice: ExchangeAssetPriceInterface
  ): boolean;
  shouldSell(
    sessionAsset: SessionAsset,
    exchangeAssetPrice: ExchangeAssetPriceInterface
  ): boolean;
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
      if (processingTime > 200) {
        session.exchange.assetPairPrices.forEach((exchangeAssetPrice) => {
          exchangeAssetPrice.cleanupEntries(0.5);
        });
      }

      // Actually start checking if we can do any trades
      await this._processCurrentTrades();
      await this._processPotentialTrades();
    }, updateInterval);
  }

  shouldBuy(
    sessionAsset: SessionAsset,
    exchangeAssetPrice: ExchangeAssetPriceInterface
  ): boolean {
    return false;
  }

  shouldSell(
    sessionAsset: SessionAsset,
    exchangeAssetPrice: ExchangeAssetPriceInterface
  ): boolean {
    return false;
  }

  async _processCurrentTrades(): Promise<void> {
    const {
      session,
    } = this;

    logger.debug('Starting to process trades ...');

    session.assets.forEach((sessionAsset) => {
      const assetPrice = session.exchange.assetPairPrices.get(sessionAsset.asset.symbol);
      if (this.shouldSell(
        sessionAsset,
        assetPrice
      )) {
        // TODO: trigger sell!
      }
    });
  }

  async _processPotentialTrades(): Promise<void> {
    const {
      session,
    } = this;

    logger.debug('Starting to process new potential trades ...');

    session.assets.forEach((sessionAsset) => {
      const assetPrice = session.exchange.assetPairPrices.get(sessionAsset.asset.symbol);
      if (this.shouldBuy(
        sessionAsset,
        assetPrice
      )) {
        // TODO: trigger buy!
      }
    });
  }
}
