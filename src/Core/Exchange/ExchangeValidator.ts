import chalk from 'chalk';

import { Exchange } from './Exchange';
import logger from '../../Utils/Logger';

export class ExchangeValidator {
  public static async validate(exchange: Exchange) {
    logger.debug(chalk.italic(
      'Starting session and exchange validation ...'
    ));

    const session = exchange.getSession();
    const {
      assetPriceUpdateIntervalSeconds
    } = session.config;

    if (assetPriceUpdateIntervalSeconds < 1) {
      logger.critical(chalk.red.bold(
        `You cannot set the asset price update interval to less than 1!`
      ));

      process.exit(1);
    }

    const sessionAssets = session.assets;
    if (sessionAssets.length === 0) {
      logger.critical(chalk.red.bold(
        'No assets found for this session!'
      ));

      process.exit(1);
    }

    const exhangeAssetPairs = await exchange.getAssetPairs();
    const exhangeAssetPairsMap = new Map(exhangeAssetPairs.map((assetPair) => {
      const key = assetPair.toString(exchange.assetPairConverter);
      return [key, assetPair];
    }));

    // Do session asset validations
    sessionAssets.forEach((sessionAsset) => {
      const sessionAssetAssetPairSet = sessionAsset.getAssetPairsSet(exchange.assetPairConverter);
      sessionAssetAssetPairSet.forEach((assetPairString) => {
        // Check if that pair exists on the exchange
        if (!exhangeAssetPairsMap.has(assetPairString)) {
          logger.critical(chalk.red.bold(
            `Oh dear. We did not seem to have found the "${assetPairString}" asset pair on the exchange.`
          ));

          process.exit(1);
        }

        // Check if our order amount is too small or big
        const exhangeAssetPair = exhangeAssetPairsMap.get(assetPairString);
        const orderAmount = parseFloat(sessionAsset.strategy.orderAmount);
        if (parseFloat(exhangeAssetPair.amountMaximum) < orderAmount) {
          logger.critical(chalk.red.bold(
            `The order amount for "${assetPairString}" is too big for this exchange asset. ` +
            `You specified: "${sessionAsset.strategy.orderAmount}". ` +
            `Maximum: "${exhangeAssetPair.amountMaximum}"`
          ));

          process.exit(1);
        } else if (parseFloat(exhangeAssetPair.amountMinimum) > orderAmount) {
          logger.critical(chalk.red.bold(
            `The order amount for "${assetPairString}" is too small for this exchange asset. ` +
            `You specified: "${sessionAsset.strategy.orderAmount}". ` +
            `Minimum: "${exhangeAssetPair.amountMinimum}"`
          ));

          process.exit(1);
        }
      });
    });
  }
}
