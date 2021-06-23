import chalk from 'chalk';

import { Exchange } from './Exchange';
import { AssetPair } from '../Asset/AssetPair';
import logger from '../../Utils/Logger';

export class ExchangeValidator {
  public static async validate(exchange: Exchange) {
    const {
      warmupPeriodSeconds,
      assetPriceUpdateIntervalSeconds,
    } = exchange.session.config;

    logger.debug(chalk.italic(
      'Starting session and exchange validation ...'
    ));

    if (warmupPeriodSeconds < 60) {
      logger.warning(chalk.yellow(
        `It is NOT recommended to set the warmup period to less than 60 seconds, ` +
        `because in the first minutes we do a few of heavy requests to the exchange, ` +
        `which may cause certain requests to rate-limit later on!`
      ));
    }

    if (assetPriceUpdateIntervalSeconds < 1) {
      logger.critical(chalk.red.bold(
        `You cannot set the asset price update interval to less than 1!`
      ));

      process.exit(1);
    }

    const sessionAssets = exchange.session.assets;
    if (sessionAssets.length === 0) {
      logger.critical(chalk.red.bold(
        'No assets found for this session!'
      ));

      process.exit(1);
    }

    const exhangeAssetPairs = await exchange.getAssetPairs();
    const exhangeAssetPairsMap = new Map(exhangeAssetPairs.map((assetPair) => {
      const key = AssetPair.toKey(assetPair);
      return [key, assetPair];
    }));

    // Do session asset validations
    sessionAssets.forEach((sessionAsset) => {
      const {
        tradingType,
      } = sessionAsset;
      const sessionAssetAssetPairSet = sessionAsset.getAssetPairs();

      sessionAssetAssetPairSet.forEach((assetPairSymbol) => {
        // Check if that pair exists on the exchange
        if (!exhangeAssetPairsMap.has(assetPairSymbol)) {
          logger.critical(chalk.red.bold(
            `Oh dear. We did not seem to have found the "${assetPairSymbol}" asset pair on the exchange.`
          ));

          process.exit(1);
        }

        const exchangeAssetPair = exhangeAssetPairsMap.get(assetPairSymbol);

        // Check if we can to the trading type we specified
        if (!exchangeAssetPair.tradingTypes.includes(tradingType)) {
          logger.critical(chalk.red.bold(
            `Trading type "${tradingType}" is not available for "${assetPairSymbol}".`
          ));

          process.exit(1);
        }

        // Check if trailing take profit is enabled and we have no slippage set
        if (
          sessionAsset.strategy.parameters.trailingTakeProfitEnabled &&
          !(sessionAsset.strategy.parameters.trailingTakeProfitSlipPercentage > 0)
        ) {
          logger.critical(chalk.red.bold(
            `If trailing take profit is enabled, you need to set the slip percentage to more than 0.`
          ));

          process.exit(1);
        }

        // Check if trailing take profit is enabled and we have no slippage set
        if (
          sessionAsset.strategy.parameters.trailingStopLossEnabled &&
          !(sessionAsset.strategy.parameters.trailingStopLossPercentage > 0)
        ) {
          logger.critical(chalk.red.bold(
            `If trailing stop loss is enabled, you need to set the percentage to more than 0.`
          ));

          process.exit(1);
        }

        // Check if our order amount is too small or big
        const exhangeAssetPair = exhangeAssetPairsMap.get(assetPairSymbol);
        const tradeAmount = parseFloat(sessionAsset.strategy.parameters.tradeAmount);
        if (parseFloat(exhangeAssetPair.amountMaximum) < tradeAmount) {
          logger.critical(chalk.red.bold(
            `The order amount for "${assetPairSymbol}" is too big for this exchange asset. ` +
            `You specified: "${sessionAsset.strategy.parameters.tradeAmount}". ` +
            `Maximum: "${exhangeAssetPair.amountMaximum}"`
          ));

          process.exit(1);
        } else if (parseFloat(exhangeAssetPair.amountMinimum) > tradeAmount) {
          logger.critical(chalk.red.bold(
            `The order amount for "${assetPairSymbol}" is too small for this exchange asset. ` +
            `You specified: "${sessionAsset.strategy.parameters.tradeAmount}". ` +
            `Minimum: "${exhangeAssetPair.amountMinimum}"`
          ));

          process.exit(1);
        }
      });
    });
  }
}
