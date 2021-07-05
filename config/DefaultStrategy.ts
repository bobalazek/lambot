import { AssetPair } from '../src/Core/Asset/AssetPair';
import { ExchangeAssetPairInterface } from '../src/Core/Exchange/ExchangeAssetPair';
import { ExchangeTrade, ExchangeTradeStatusEnum } from '../src/Core/Exchange/ExchangeTrade';
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

  async checkForBuyAndSellSignals(assetPair: AssetPair): Promise<AssetPair> {
    // TODO

    return assetPair;
  }

  async checkForBuySignal(assetPair: AssetPair): Promise<boolean> {
    const {
      trades,
    } = this.session;

    const openTrades = this.session.getOpenTrades();
    if (
      this.parameters.maximumOpenTrades !== -1 &&
      openTrades.length >= this.parameters.maximumOpenTrades
    ) {
      return false;
    }

    const assetPairTrades = trades.filter((exchangeTrade) => {
      return (
        exchangeTrade.assetPair.getKey() === assetPair.getKey() &&
        (
          exchangeTrade.status === ExchangeTradeStatusEnum.OPEN ||
          exchangeTrade.status === ExchangeTradeStatusEnum.BUY_PENDING
        )
      );
    });

    if (
      this.parameters.maximumOpenTradesPerAssetPair !== -1 &&
      assetPairTrades.length >= this.parameters.maximumOpenTradesPerAssetPair
    ) {
      return false;
    }

    // TODO: implement minimum hourly/daily volume

    const uptrendMaximumAgeTime = this.parameters.buyTroughUptrendMaximumAgeSeconds * 1000;
    const profitPercentageSinceTrough = this._getLargestTroughPercentage(
      assetPair,
      uptrendMaximumAgeTime
    );

    if (
      !profitPercentageSinceTrough ||
      profitPercentageSinceTrough < this.parameters.buyTroughUptrendPercentage
    ) {
      return false;
    }

    // TODO: DO NOT BUY IF WE ARE CURRENTLY IN A DOWNTREND!

    return true;
  }

  async checkForSellSignal(exchangeTrade: ExchangeTrade): Promise<boolean> {
    const now = Date.now();
    const assetPairPrice = this._getAssetPairPrice(exchangeTrade.assetPair);
    const assetPairPriceEntryNewest = assetPairPrice.getNewestPriceEntry();
    const currentAssetPairPrice = parseFloat(assetPairPriceEntryNewest.price);
    const currentProfitPercentage = exchangeTrade.getCurrentProfitPercentage(currentAssetPairPrice);

    if (
      exchangeTrade.peakProfitPercentage === null ||
      exchangeTrade.peakProfitPercentage < currentProfitPercentage
    ) {
      exchangeTrade.peakProfitPercentage = currentProfitPercentage;
    }

    if (
      exchangeTrade.troughProfitPercentage === null ||
      exchangeTrade.troughProfitPercentage > currentProfitPercentage
    ) {
      exchangeTrade.troughProfitPercentage = currentProfitPercentage;
    }

    if (exchangeTrade.triggerStopLossPercentage === null) {
      exchangeTrade.triggerStopLossPercentage = -this.parameters.stopLossPercentage;
    }

    const expectedTriggerStopLossPercentage = exchangeTrade.peakProfitPercentage - this.parameters.trailingStopLossPercentage;
    const diffStopLossPercentage = exchangeTrade.peakProfitPercentage - exchangeTrade.triggerStopLossPercentage;
    if (
      this.parameters.trailingStopLossEnabled &&
      this.parameters.trailingStopLossPercentage < diffStopLossPercentage &&
      exchangeTrade.triggerStopLossPercentage < expectedTriggerStopLossPercentage
    ) {
      exchangeTrade.triggerStopLossPercentage = expectedTriggerStopLossPercentage;
    }

    if (currentProfitPercentage > this.parameters.takeProfitPercentage) {
      if (!this.parameters.trailingTakeProfitEnabled) {
        return true;
      }

      // Once we reach over this takeProfitPercentage threshold, we should set the stop loss percentage
      // to that value, to prevent dipping down again when the trigger doesn't execute
      // because of trailing take profit enabled.
      exchangeTrade.triggerStopLossPercentage = this.parameters.takeProfitPercentage;

      const slipSincePeakProfitPercentage = exchangeTrade.peakProfitPercentage - currentProfitPercentage;
      if (
        this.parameters.trailingTakeProfitEnabled &&
        slipSincePeakProfitPercentage === 0 // We are peaking right now!
      ) {
        return false;
      }

      if (
        this.parameters.trailingTakeProfitEnabled &&
        this.parameters.trailingTakeProfitSlipPercentage < slipSincePeakProfitPercentage
      ) {
        return true;
      }
    }

    // Just to make sure that we trigger a sell when the currentProfitPercentage is less than the trigger.
    // This basically covers the case when we have trailingTakeProfitEnabled,
    // and there we set the new triggerStopLossPercentage to the takeProfitPercentage,
    // so it doesn't every again fall below this value.
    if (currentProfitPercentage < exchangeTrade.triggerStopLossPercentage) {
      return true;
    }

    if (
      this.parameters.stopLossEnabled &&
      currentProfitPercentage < exchangeTrade.triggerStopLossPercentage
    ) {
      if (this.parameters.stopLossTimeoutSeconds === 0) {
        return true;
      }

      if (!exchangeTrade.triggerStopLossSellAt) {
        exchangeTrade.triggerStopLossSellAt = now;
      }

      const stopLossTimeoutTime = this.parameters.stopLossTimeoutSeconds * 1000;
      if (now - exchangeTrade.triggerStopLossSellAt > stopLossTimeoutTime) {
        return true;
      }
    } else if (
      this.parameters.stopLossEnabled &&
      currentProfitPercentage > exchangeTrade.triggerStopLossPercentage &&
      exchangeTrade.triggerStopLossSellAt
    ) {
      // We are out of the stop loss percentage loss, so let's reset the timer!
      exchangeTrade.triggerStopLossSellAt = null;
    }

    return false;
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
