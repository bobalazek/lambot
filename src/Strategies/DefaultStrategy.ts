import chalk from 'chalk';

import { AssetPair } from '../Core/Asset/AssetPair';
import { ExchangeAccountTypeEnum } from '../Core/Exchange/ExchangeAccount';
import { ExchangeAssetPriceEntryInterface, ExchangeAssetPriceInterface } from '../Core/Exchange/ExchangeAssetPrice';
import { ExchangeOrder, ExchangeOrderSideEnum, ExchangeOrderTypeEnum } from '../Core/Exchange/ExchangeOrder';
import { ExchangeOrderFeesTypeEnum } from '../Core/Exchange/ExchangeOrderFees';
import { ExchangeTrade, ExchangeTradeStatusEnum, ExchangeTradeTypeEnum } from '../Core/Exchange/ExchangeTrade';
import { Manager } from '../Core/Manager';
import { SessionAsset } from '../Core/Session/SessionAsset';
import { SessionManager } from '../Core/Session/SessionManager';
import { Strategy } from '../Core/Strategy/Strategy';
import { calculatePercentage, colorTextPercentageByValue } from '../Utils/Helpers';
import { ID_PREFIX } from '../Constants';
import logger from '../Utils/Logger';

export class DefaultStrategy extends Strategy {
  constructor({
    tradeAmount = '15',
    maximumOpenTrades = 5,
    maximumOpenTradesPerAssetPair = 1,
    minimumDailyVolume = 10000,
    takeProfitPercentage = 2,
    trailingTakeProfitEnabled = true,
    trailingTakeProfitSlipPercentage = 0.1,
    stopLossEnabled = true,
    stopLossPercentage = 2,
    stopLossTimeoutSeconds = 0,
    trailingStopLossEnabled = true,
    trailingStopLossPercentage = 10,
    buyTroughUptrendPercentage = 0.1,
    buyTroughUptrendMaximumAgeSeconds = 90,
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
        buyTroughUptrendPercentage,
        buyTroughUptrendMaximumAgeSeconds,
      }
    );
  }

  async checkForBuySignal(assetPair: AssetPair, sessionAsset: SessionAsset): Promise<ExchangeTrade> {
    const {
      trades,
    } = sessionAsset;

    const now = Date.now();

    const openTrades = sessionAsset.getOpenTrades();
    if (
      this.parameters.maximumOpenTrades !== -1 &&
      openTrades.length >= this.parameters.maximumOpenTrades
    ) {
      return null;
    }

    const sessionAssetAssetPairTrades = trades.filter((exchangeTrade) => {
      return (
        AssetPair.toKey(exchangeTrade.assetPair) === AssetPair.toKey(assetPair) &&
        (
          exchangeTrade.status === ExchangeTradeStatusEnum.OPEN ||
          exchangeTrade.status === ExchangeTradeStatusEnum.BUY_PENDING
        )
      );
    });

    if (
      this.parameters.maximumOpenTradesPerAssetPair !== -1 &&
      sessionAssetAssetPairTrades.length >= this.parameters.maximumOpenTradesPerAssetPair
    ) {
      return null;
    }

    const assetPrice = this._getAssetPairPrice(assetPair);
    const assetPriceEntryNewest = assetPrice.getNewestEntry();
    const updateIntervalTime = this.session.config.assetPriceUpdateIntervalSeconds * 1000;
    if (now - assetPriceEntryNewest.timestamp > updateIntervalTime) {
      return null;
    }

    if (this.parameters.minimumDailyVolume !== -1) {
      const assetPriceStatisticsNewest = assetPrice.getNewestStatistics();
      if (
        !assetPriceStatisticsNewest ||
        parseFloat(assetPriceStatisticsNewest.volume) < this.parameters.minimumDailyVolume
      ) {
        return null;
      }
    }

    const uptrendMaximumAgeTime = this.parameters.buyTroughUptrendMaximumAgeSeconds * 1000;
    const profitPercentageSinceTrough = this._getLargestTroughPercentage(
      assetPair,
      uptrendMaximumAgeTime
    );

    if (
      !profitPercentageSinceTrough ||
      profitPercentageSinceTrough < this.parameters.buyTroughUptrendPercentage
    ) {
      return null;
    }

    // TODO: DO NOT BUY IF WE ARE CURRENTLY IN A DOWNTREND!

    return await this._executeBuy(
      assetPair,
      sessionAsset,
      assetPriceEntryNewest,
      profitPercentageSinceTrough
    );
  }

  async checkForSellSignal(exchangeTrade: ExchangeTrade, sessionAsset: SessionAsset): Promise<ExchangeTrade> {
    const now = Date.now();
    const assetPrice = this._getAssetPairPrice(exchangeTrade.assetPair);
    const assetPriceEntryNewest = assetPrice.getNewestEntry();
    const currentAssetPrice = parseFloat(assetPriceEntryNewest.price);
    const currentProfitPercentage = exchangeTrade.getCurrentProfitPercentage(currentAssetPrice);

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
        return this._executeSell(
          exchangeTrade,
          sessionAsset,
          assetPriceEntryNewest
        );
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
        return null;
      }

      if (
        this.parameters.trailingTakeProfitEnabled &&
        this.parameters.trailingTakeProfitSlipPercentage < slipSincePeakProfitPercentage
      ) {
        return this._executeSell(
          exchangeTrade,
          sessionAsset,
          assetPriceEntryNewest
        );
      }
    }

    // Just to make sure that we trigger a sell when the currentProfitPercentage is less than the trigger.
    // This basically covers the case when we have trailingTakeProfitEnabled,
    // and there we set the new triggerStopLossPercentage to the takeProfitPercentage,
    // so it doesn't every again fall below this value.
    if (currentProfitPercentage < exchangeTrade.triggerStopLossPercentage) {
      return this._executeSell(
        exchangeTrade,
        sessionAsset,
        assetPriceEntryNewest
      );
    }

    if (
      this.parameters.stopLossEnabled &&
      currentProfitPercentage < exchangeTrade.triggerStopLossPercentage
    ) {
      if (this.parameters.stopLossTimeoutSeconds === 0) {
        return this._executeSell(
          exchangeTrade,
          sessionAsset,
          assetPriceEntryNewest
        );
      }

      if (!exchangeTrade.triggerStopLossSellAt) {
        exchangeTrade.triggerStopLossSellAt = now;
      }

      const stopLossTimeoutTime = this.parameters.stopLossTimeoutSeconds * 1000;
      if (now - exchangeTrade.triggerStopLossSellAt > stopLossTimeoutTime) {
        return this._executeSell(
          exchangeTrade,
          sessionAsset,
          assetPriceEntryNewest
        );
      }
    } else if (
      this.parameters.stopLossEnabled &&
      currentProfitPercentage > exchangeTrade.triggerStopLossPercentage &&
      exchangeTrade.triggerStopLossSellAt
    ) {
      // We are out of the stop loss percentage loss, so let's reset the timer!
      exchangeTrade.triggerStopLossSellAt = null;
    }

    return null;
  }

  getSortedAssetPairs(sessionAsset: SessionAsset): AssetPair[] {
    const {
      assetPairs,
    } = sessionAsset;

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
    const assetPrice = this._getAssetPairPrice(assetPair);
    const newestPriceEntry = assetPrice.getNewestEntry();
    const largestTroughPriceEntry = assetPrice.getLargestTroughEntry(
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

  _getAssetPairPrice(assetPair: AssetPair): ExchangeAssetPriceInterface {
    return this.session.exchange.assetPairPrices.get(
      AssetPair.toKey(assetPair)
    );
  }

  async _executeBuy(
    assetPair: AssetPair,
    sessionAsset: SessionAsset,
    assetPriceEntryNewest: ExchangeAssetPriceEntryInterface,
    profitPercentageSinceTrough: number
  ): Promise<ExchangeTrade> {
    const exchangeTrade = await this.executeBuy(
      assetPair,
      sessionAsset,
      assetPriceEntryNewest.price,
      ExchangeTradeTypeEnum.LONG
    );

    logger.notice(chalk.green.bold(
      `I am buying "${assetPair.toString()}" @ ${exchangeTrade.buyPrice}, ` +
      `because there was a ${profitPercentageSinceTrough.toPrecision(3)}% profit since the trough!`
    ));

    return exchangeTrade;
  }

  async _executeSell(
    exchangeTrade: ExchangeTrade,
    sessionAsset: SessionAsset,
    assetPriceEntryNewest: ExchangeAssetPriceEntryInterface
  ): Promise<ExchangeTrade> {
    await this.executeSell(
      exchangeTrade,
      sessionAsset,
      assetPriceEntryNewest.price
    );

    logger.notice(chalk.green.bold(
      `I am selling "${exchangeTrade.assetPair.toString()}". ` +
      `I made (${colorTextPercentageByValue(exchangeTrade.getProfitPercentage())}) profit (excluding fees)!`
    ));

    return exchangeTrade;
  }
}
