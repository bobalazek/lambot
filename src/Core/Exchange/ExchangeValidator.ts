import chalk from 'chalk';

import { AssetPairConverter } from '../Asset/AssetPair';
import { Exchange } from './Exchange';
import logger from '../../Utils/Logger';

export class ExchangeValidator {
  public static async validate(exchange: Exchange) {
    const {
      warmupPeriodSeconds,
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

    const exhangeAssetPairs = await exchange.getAssetPairs();
    const exhangeAssetPairsMap = new Map(exhangeAssetPairs.map((assetPair) => {
      const key = AssetPairConverter.convert(assetPair);
      return [key, assetPair];
    }));

    // Do session asset validations
    const {
      tradingTypes,
      strategy,
    } = exchange.session;

    const tradeAmount = parseFloat(strategy.parameters.tradeAmount);

    // Check if trailing take profit is enabled and we have no slippage set
    if (
      strategy.parameters.trailingTakeProfitEnabled &&
      !(strategy.parameters.trailingTakeProfitSlipPercentage > 0)
    ) {
      logger.critical(chalk.red.bold(
        `If trailing take profit is enabled, you need to set the slip percentage to more than 0.`
      ));
      process.exit(1);
    }

    // Check if trailing take profit is enabled and we have no slippage set
    if (
      strategy.parameters.trailingStopLossEnabled &&
      !(strategy.parameters.trailingStopLossPercentage > 0)
    ) {
      logger.critical(chalk.red.bold(
        `If trailing stop loss is enabled, you need to set the percentage to more than 0.`
      ));
      process.exit(1);
    }

    exchange.session.getAssetPairs().forEach((assetPairSymbol) => {
      // Check if that pair exists on the exchange
      if (!exhangeAssetPairsMap.has(assetPairSymbol)) {
        logger.critical(chalk.red.bold(
          `Oh dear. We did not seem to have found the "${assetPairSymbol}" asset pair on the exchange.`
        ));
        process.exit(1);
      }

      const exchangeAssetPair = exhangeAssetPairsMap.get(assetPairSymbol);

      // Check if we can to the trading type we specified
      if (!tradingTypes.every((item) => {
        return exchangeAssetPair.tradingTypes.includes(item);
      })) {
        logger.critical(chalk.red.bold(
          `Trading type "${tradingTypes}" is not available for "${assetPairSymbol}".`
        ));
        process.exit(1);
      }

      // Check if our order amount is too small or big
      const exhangeAssetPair = exhangeAssetPairsMap.get(assetPairSymbol);
      if (parseFloat(exhangeAssetPair.amountMaximum) < tradeAmount) {
        logger.critical(chalk.red.bold(
          `The order amount for "${assetPairSymbol}" is too big for this exchange asset. ` +
          `You specified: "${strategy.parameters.tradeAmount}". ` +
          `Maximum: "${exhangeAssetPair.amountMaximum}"`
        ));
        process.exit(1);
      } else if (parseFloat(exhangeAssetPair.amountMinimum) > tradeAmount) {
        logger.critical(chalk.red.bold(
          `The order amount for "${assetPairSymbol}" is too small for this exchange asset. ` +
          `You specified: "${strategy.parameters.tradeAmount}". ` +
          `Minimum: "${exhangeAssetPair.amountMinimum}"`
        ));
        process.exit(1);
      }
    });
  }
}
