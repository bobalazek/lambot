import { AssetPair } from '../src/Core/Asset/AssetPair';
import { ExchangeAssetPairInterface } from '../src/Core/Exchange/ExchangeAssetPair';
import { ExchangeTrade } from '../src/Core/Exchange/ExchangeTrade';
import { Strategy } from '../src/Core/Strategy/Strategy';
import { calculatePercentage } from '../src/Utils/Helpers';

export class DefaultStrategy extends Strategy {
  constructor({
    tradeAmount = '15',
    maximumOpenTrades = 10,
    maximumOpenTradesPerAssetPair = 1,
    takeProfitPercentage = 2,
    trailingTakeProfitEnabled = true,
    trailingTakeProfitSlipPercentage = 0.1,
    stopLossEnabled = true,
    stopLossPercentage = 2,
    stopLossTimeoutSeconds = 0,
    trailingStopLossEnabled = true,
    trailingStopLossPercentage = 2,
    buyTroughUptrendPercentage = 0.1,
    buyTroughUptrendMaximumAgeSeconds = 90,
  }) {
    super(
      'Default',
      {
        tradeAmount,
        maximumOpenTrades,
        maximumOpenTradesPerAssetPair,
        takeProfitPercentage,
        trailingTakeProfitEnabled,
        trailingTakeProfitSlipPercentage,
        stopLossEnabled,
        stopLossPercentage,
        stopLossTimeoutSeconds,
        trailingStopLossEnabled,
        trailingStopLossPercentage,
        buyTroughUptrendPercentage,
        buyTroughUptrendMaximumAgeSeconds,
      }
    );
  }

  getSortedAssetPairs(): AssetPair[] {
    const {
      assetPairs,
    } = this.session;

    const uptrendMaximumAgeTime = this.parameters.buyTroughUptrendMaximumAgeSeconds * 1000;

    // Sort by assets that had the biggest increase since the last largest trough
    return [...assetPairs].sort((assetPairA, assetPairB) => {
      const percentageA = this._getLargestTroughPercentage(
        assetPairA,
        uptrendMaximumAgeTime
      );
      const percentageB = this._getLargestTroughPercentage(
        assetPairB,
        uptrendMaximumAgeTime
      );

      if (percentageA === null) {
        return 1;
      }

      if (percentageB === null) {
        return -1;
      }

      return percentageB - percentageA;
    });
  }

  /***** Helpers ******/
  _getLargestTroughPercentage(
    assetPair: AssetPair,
    uptrendMaximumAgeTime: number
  ): number {
    const assetPairPrice = this._getAssetPairPrice(assetPair);
    const newestPriceEntry = assetPairPrice.getNewestPriceEntry();
    const largestTroughPriceEntry = assetPairPrice.getLargestTroughPriceEntry(
      uptrendMaximumAgeTime
    );
    if (
      !newestPriceEntry ||
      !largestTroughPriceEntry
    ) {
      return null;
    }

    return calculatePercentage(
      parseFloat(newestPriceEntry.price),
      parseFloat(largestTroughPriceEntry.price)
    );
  }

  _getAssetPairPrice(assetPair: AssetPair): ExchangeAssetPairInterface {
    return this.session.exchange.assetPairs.get(
      assetPair.getKey()
    );
  }
}
