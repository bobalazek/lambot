import chalk from 'chalk';

import { AssetPair } from '../Asset/AssetPair';
import { ExchangeAssetPriceEntryInterface, ExchangeAssetPriceInterface } from '../Exchange/ExchangeAssetPrice';
import { ExchangeTrade, ExchangeTradeStatusEnum, ExchangeTradeTypeEnum } from '../Exchange/ExchangeTrade';
import { Session } from '../Session/Session';
import { SessionAsset } from '../Session/SessionAsset';
import { StrategyParametersInterface } from './StrategyParameters';
import { calculatePercentage, colorTextPercentageByValue } from '../../Utils/Helpers';
import { SessionManager } from '../Session/SessionManager';
import { ExchangeAccountTypeEnum } from '../Exchange/ExchangeAccount';
import { ExchangeOrder, ExchangeOrderSideEnum, ExchangeOrderTypeEnum } from '../Exchange/ExchangeOrder';
import { ExchangeOrderFeesTypeEnum } from '../Exchange/ExchangeOrderFees';
import { Manager } from '../Manager';
import { ID_PREFIX } from '../../Constants';
import logger from '../../Utils/Logger';

export interface StrategyInterface {
  name: string;
  parameters: StrategyParametersInterface;
  session: Session;
  checkForBuySignal(assetPair: AssetPair, sessionAsset: SessionAsset): Promise<ExchangeTrade>;
  checkForSellSignal(exchangeTrade: ExchangeTrade, sessionAsset: SessionAsset): Promise<ExchangeTrade>;
  getSortedAssetPairs(sessionAsset: SessionAsset): AssetPair[];
  toExport(): unknown;
}

export class Strategy implements StrategyInterface {
  name: string;
  parameters: StrategyParametersInterface;
  session: Session;

  constructor(name: string, parameters: StrategyParametersInterface) {
    this.name = name;
    this.parameters = parameters;
  }

  async boot(session: Session): Promise<boolean> {
    this.session = session;

    return true;
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
    const profitPercentage = this._getLargestTroughPercentage(
      assetPair,
      uptrendMaximumAgeTime
    );

    if (
      !profitPercentage ||
      profitPercentage < this.parameters.buyTroughUptrendPercentage
    ) {
      return null;
    }

    // TODO: DO NOT BUY IF WE ARE CURRENTLY IN A DOWNTREND!

    return await this._executeBuy(
      now,
      assetPair,
      sessionAsset,
      assetPriceEntryNewest,
      profitPercentage
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
    if (
      this.parameters.trailingStopLossEnabled &&
      this.parameters.trailingStopLossPercentage < exchangeTrade.peakProfitPercentage - exchangeTrade.triggerStopLossPercentage &&
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

      if (
        this.parameters.trailingTakeProfitEnabled &&
        exchangeTrade.peakProfitPercentage - currentProfitPercentage < this.parameters.trailingTakeProfitSlipPercentage
      ) {
        return this._executeSell(
          exchangeTrade,
          sessionAsset,
          assetPriceEntryNewest
        );
      }
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
      // We are out of the stop loss percentage, so let's reset the timer!
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

  /***** Export/Import *****/
  toExport() {
    const parameters = {
      tradeAmount: this.parameters.tradeAmount,
      maximumOpenTrades: this.parameters.maximumOpenTrades,
      maximumOpenTradesPerAssetPair: this.parameters.maximumOpenTradesPerAssetPair,
      minimumDailyVolume: this.parameters.minimumDailyVolume,
      takeProfitPercentage: this.parameters.takeProfitPercentage,
      trailingTakeProfitEnabled: this.parameters.trailingTakeProfitEnabled,
      trailingTakeProfitSlipPercentage: this.parameters.trailingTakeProfitSlipPercentage,
      stopLossEnabled: this.parameters.stopLossEnabled,
      stopLossPercentage: this.parameters.stopLossPercentage,
      stopLossTimeoutSeconds: this.parameters.stopLossTimeoutSeconds,
      trailingStopLossEnabled: this.parameters.trailingStopLossEnabled,
      trailingStopLossPercentage: this.parameters.trailingStopLossPercentage,
      buyTroughUptrendPercentage: this.parameters.buyTroughUptrendPercentage,
      buyTroughUptrendMaximumAgeSeconds: this.parameters.buyTroughUptrendMaximumAgeSeconds,
    };

    return {
      parameters,
    };
  }

  static fromImport(data: any): Strategy {
    const parameters = {
      tradeAmount: data.parameters.tradeAmount,
      maximumOpenTrades: data.parameters.maximumOpenTrades,
      maximumOpenTradesPerAssetPair: data.parameters.maximumOpenTradesPerAssetPair,
      minimumDailyVolume: data.parameters.minimumDailyVolume,
      takeProfitPercentage: data.parameters.takeProfitPercentage,
      trailingTakeProfitEnabled: data.parameters.trailingTakeProfitEnabled,
      trailingTakeProfitSlipPercentage: data.parameters.trailingTakeProfitSlipPercentage,
      stopLossEnabled: data.parameters.stopLossEnabled,
      stopLossPercentage: data.parameters.stopLossPercentage,
      stopLossTimeoutSeconds: data.parameters.stopLossTimeoutSeconds,
      trailingStopLossEnabled: data.parameters.trailingStopLossEnabled,
      trailingStopLossPercentage: data.parameters.trailingStopLossPercentage,
      buyTroughUptrendPercentage: data.parameters.buyTroughUptrendPercentage,
      buyTroughUptrendMaximumAgeSeconds: data.parameters.buyTroughUptrendMaximumAgeSeconds,
    };

    return new Strategy(this.name, parameters);
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
    now: number,
    assetPair: AssetPair,
    sessionAsset: SessionAsset,
    assetPriceEntryNewest: ExchangeAssetPriceEntryInterface,
    profitPercentage: number
  ): Promise<ExchangeTrade> {
    const assetPairSymbol = AssetPair.toKey(assetPair);

    const id = ID_PREFIX + this.session.id + '_' + assetPairSymbol + '_' + now;
    const order = this._createNewOrder(
      id,
      assetPair,
      sessionAsset,
      ExchangeOrderSideEnum.BUY,
      this.parameters.tradeAmount,
      assetPriceEntryNewest.price
    );
    const orderFees = await this.session.exchange.getAssetFees(
      assetPairSymbol,
      this.parameters.tradeAmount,
      ExchangeOrderFeesTypeEnum.TAKER // It's a market buy, so we are a taker.
    );

    const buyOrder: ExchangeOrder = !Manager.isTestMode
      ? await this.session.exchange.addAccountOrder(
        ExchangeAccountTypeEnum.SPOT,
        order
      )
      : order;
    const exchangeTrade = new ExchangeTrade(
      id,
      assetPair.assetBase,
      assetPair,
      ExchangeTradeTypeEnum.LONG,
      ExchangeTradeStatusEnum.OPEN,
      now
    );
    exchangeTrade.buyFeesPercentage = orderFees.amountPercentage;
    exchangeTrade.buyOrder = buyOrder;
    exchangeTrade.buyPrice = parseFloat(buyOrder.price);
    exchangeTrade.amount = buyOrder.amount;

    sessionAsset.trades.push(exchangeTrade);

    SessionManager.save(this.session);

    logger.notice(chalk.green.bold(
      `I am buying "${assetPairSymbol}" @ ${exchangeTrade.buyPrice}, ` +
      `because there was a ${profitPercentage.toPrecision(3)}% profit since the trough!`
    ));

    return exchangeTrade;
  }

  async _executeSell(
    exchangeTrade: ExchangeTrade,
    sessionAsset: SessionAsset,
    assetPriceEntryNewest: ExchangeAssetPriceEntryInterface
  ): Promise<ExchangeTrade> {
    const assetPairSymbol = AssetPair.toKey(exchangeTrade.assetPair);

    const order = this._createNewOrder(
      exchangeTrade.id,
      exchangeTrade.assetPair,
      sessionAsset,
      ExchangeOrderSideEnum.SELL,
      exchangeTrade.amount,
      assetPriceEntryNewest.price
    );
    const orderFees = await this.session.exchange.getAssetFees(
      assetPairSymbol,
      this.parameters.tradeAmount,
      ExchangeOrderFeesTypeEnum.TAKER // It's a market buy, so we are a taker.
    );

    const sellOrder: ExchangeOrder = !Manager.isTestMode
      ? await this.session.exchange.addAccountOrder(
        ExchangeAccountTypeEnum.SPOT,
        order
      )
      : order;
    exchangeTrade.sellFeesPercentage = orderFees.amountPercentage;
    exchangeTrade.sellOrder = sellOrder;
    exchangeTrade.sellPrice = parseFloat(sellOrder.price);
    exchangeTrade.status = ExchangeTradeStatusEnum.CLOSED;

    SessionManager.save(this.session);

    logger.notice(chalk.green.bold(
      `I am selling "${assetPairSymbol}". ` +
      `I made (${colorTextPercentageByValue(exchangeTrade.getProfitPercentage())}) profit (excluding fees)!`
    ));

    return exchangeTrade;
  }

  _createNewOrder(
    idPrefix: string,
    assetPair: AssetPair,
    sessionAsset: SessionAsset,
    orderSide: ExchangeOrderSideEnum,
    amount: string,
    price: string
  ) {
    return new ExchangeOrder(
      idPrefix + '_' + orderSide,
      assetPair,
      orderSide,
      amount,
      price,
      ExchangeOrderTypeEnum.MARKET,
      this.session.exchange.getAccountType(sessionAsset.tradingType)
    );
  }
}
