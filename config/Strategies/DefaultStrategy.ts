import { AssetPair } from '../../src/Core/Asset/AssetPair';
import { ExchangeAssetPair } from '../../src/Core/Exchange/ExchangeAssetPair';
import { ExchangeTrade, ExchangeTradeTypeEnum } from '../../src/Core/Exchange/ExchangeTrade';
import { Strategy } from '../../src/Core/Strategy/Strategy';
import { calculatePercentage } from '../../src/Utils/Helpers';

export class DefaultStrategy extends Strategy {
  buyTroughUptrendPercentage: number;
  buyTroughUptrendMaximumAgeSeconds: number;

  constructor({
    tradeAmount = '15',
    maximumOpenTrades = 10,
    maximumOpenTradesPerAssetPair = 1,
    minimumDailyVolume = -1,
    takeProfitPercentage = 2,
    trailingTakeProfitEnabled = true,
    trailingTakeProfitSlipPercentage = 0.1,
    stopLossEnabled = true,
    stopLossPercentage = 2,
    stopLossTimeoutSeconds = 0,
    trailingStopLossEnabled = true,
    trailingStopLossPercentage = 2,
  }) {
    super(
      'Default',
      {
        tradeAmount,
        maximumOpenTrades,
        maximumOpenTradesPerAssetPair,
        minimumDailyVolume,
        takeProfitPercentage,
        trailingTakeProfitEnabled,
        trailingTakeProfitSlipPercentage,
        stopLossEnabled,
        stopLossPercentage,
        stopLossTimeoutSeconds,
        trailingStopLossEnabled,
        trailingStopLossPercentage,
      }
    );

    this.buyTroughUptrendPercentage = 0.1;
    this.buyTroughUptrendMaximumAgeSeconds = 90;
  }

  getSortedAssetPairs(): AssetPair[] {
    const {
      assetPairs,
    } = this.session;

    const uptrendMaximumAgeTime = this.buyTroughUptrendMaximumAgeSeconds * 1000;

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

  shouldBuy(exchangeAssetPair: ExchangeAssetPair): ExchangeTradeTypeEnum | false {
    const shouldBuy = super.shouldBuy(exchangeAssetPair);

    const uptrendMaximumAgeTime = this.buyTroughUptrendMaximumAgeSeconds * 1000;
    const profitPercentageSinceTrough = this._getLargestTroughPercentage(
      exchangeAssetPair.assetPair,
      uptrendMaximumAgeTime
    );

    if (
      !profitPercentageSinceTrough ||
      profitPercentageSinceTrough < this.buyTroughUptrendPercentage
    ) {
      return false;
    }

    return shouldBuy;
  }

  shouldSell(exchangeTrade: ExchangeTrade): boolean {
    const shouldSell = super.shouldSell(exchangeTrade);

    // TODO: your own logic here

    return shouldSell;
  }

  /***** Helpers ******/
  _getLargestTroughPercentage(
    assetPair: AssetPair,
    uptrendMaximumAgeTime: number
  ): number {
    const assetPairPrice = this.session.exchange.assetPairs.get(
      assetPair.getKey()
    );
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
}
