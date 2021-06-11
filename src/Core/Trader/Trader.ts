import chalk from 'chalk';

import { Session } from '../Session/Session';
import logger from '../../Utils/Logger';

export interface TraderInterface {
  session: Session;
  start(): ReturnType<typeof setInterval>;
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
    } = session.config;
    const updateInterval = assetPriceUpdateIntervalSeconds * 1000;
    const assetPairsList = session.getAssetPairsList();

    return setInterval(async () => {
      const assetPrices = await session.exchange.getAssetPrices();
      const now = Date.now();

      for (let i = 0; i < assetPrices.length; i++) {
        const assetData = assetPrices[i];
        if (!assetPairsList.has(assetData.symbol)) {
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

      const trendIntervalTime = 2000; // TODO: should be configurable

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
    }, updateInterval);
  }
}
