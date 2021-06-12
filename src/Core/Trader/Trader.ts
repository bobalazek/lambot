import chalk from 'chalk';

import { Session } from '../Session/Session';
import { ExchangeOrder } from '../Exchange/ExchangeOrder';
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
      trendIntervalSeconds,
    } = session.config;
    const updateInterval = assetPriceUpdateIntervalSeconds * 1000;
    const trendIntervalTime = trendIntervalSeconds * 1000;
    const assetPairsList = session.getAssetPairsList();

    return setInterval(async () => {
      // Update the current asset prices
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

      // Actually start checking if we can do any orders
      const orders = await this._getOrders();
      this._executeOrders(orders);
    }, updateInterval);
  }

  async _getOrders(): Promise<ExchangeOrder[]> {
    const {
      session,
    } = this;
    const {
      positions,
    } = session.exchange.account;

    logger.debug('Starting to get orders ...');

    const orders: ExchangeOrder[] = [];

    session.assets.forEach((sessionAsset) => {
      const {
        strategy,
      } = sessionAsset;

      // TODO
    });

    return orders;
  }

  async _executeOrders(orders: ExchangeOrder[]): Promise<ExchangeOrder[]> {
    logger.debug('Starting to execute orders ...');

    if (orders.length === 0) {
      logger.debug('No orders found.');

      return [];
    }

    const executedOrders: ExchangeOrder[] = [];

    orders.forEach((order) => {
      logger.debug(`Executing order "${order.toString()}" ...`);

      // TODO

      executedOrders.push(order);
    });

    return executedOrders;
  }
}
