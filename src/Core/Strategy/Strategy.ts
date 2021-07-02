import chalk from 'chalk';

import { AssetPair } from '../Asset/AssetPair';
import { ExchangeAccountTypeEnum } from '../Exchange/ExchangeAccount';
import { ExchangeOrder, ExchangeOrderSideEnum, ExchangeOrderTypeEnum } from '../Exchange/ExchangeOrder';
import { ExchangeTrade, ExchangeTradeStatusEnum, ExchangeTradeTypeEnum } from '../Exchange/ExchangeTrade';
import { ExchangeOrderFeesTypeEnum } from '../Exchange/ExchangeOrderFees';
import { Manager } from '../Manager';
import { Session } from '../Session/Session';
import { StrategyParametersInterface } from './StrategyParameters';
import { SessionManager } from '../Session/SessionManager';
import { ID_PREFIX } from '../../Constants';
import { colorTextPercentageByValue } from '../../Utils/Helpers';
import logger from '../../Utils/Logger';

export interface StrategyInterface {
  name: string;
  parameters: StrategyParametersInterface;
  session: Session;
  boot(session: Session): Promise<boolean>;
  getSortedAssetPairs(): AssetPair[];
  checkForBuyAndSellSignals(assetPair: AssetPair): Promise<AssetPair>;
  checkForBuySignal(assetPair: AssetPair): Promise<ExchangeTrade>;
  checkForSellSignal(exchangeTrade: ExchangeTrade): Promise<ExchangeTrade>;
  executeBuy(assetPair: AssetPair, price: string, tradeType: ExchangeTradeTypeEnum): Promise<ExchangeTrade>;
  executeSell(exchangeTrade: ExchangeTrade, price: string): Promise<ExchangeTrade>;
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

  getSortedAssetPairs(): AssetPair[] {
    throw new Error('getSortedAssetPairs() not implemented yet.');
  }

  async checkForBuyAndSellSignals(assetPair: AssetPair): Promise<AssetPair> {
    throw new Error('checkForBuyAndSellSignals() not implemented yet.');
  }

  async checkForBuySignal(assetPair: AssetPair): Promise<ExchangeTrade> {
    throw new Error('checkForBuySignal() not implemented yet.');
  }

  async checkForSellSignal(exchangeTrade: ExchangeTrade): Promise<ExchangeTrade> {
    throw new Error('checkForSellSignal() not implemented yet.');
  }

  async executeBuy(
    assetPair: AssetPair,
    price: string,
    tradeType: ExchangeTradeTypeEnum
  ): Promise<ExchangeTrade> {
    const now = Date.now();
    const assetPairSymbol = assetPair.getKey();
    const accountType = tradeType === ExchangeTradeTypeEnum.SHORT
      ? ExchangeAccountTypeEnum.MARGIN
      : ExchangeAccountTypeEnum.SPOT;
    const id = ID_PREFIX + this.session.id + '_' + assetPairSymbol + '_' + now;
    const order = new ExchangeOrder(
      id + '_' + ExchangeOrderSideEnum.BUY,
      assetPair,
      ExchangeOrderSideEnum.BUY,
      this.parameters.tradeAmount,
      price,
      ExchangeOrderTypeEnum.MARKET,
      accountType
    );
    const orderFees = await this.session.exchange.getAssetFees(
      assetPair,
      this.parameters.tradeAmount,
      this.session.orderType === ExchangeOrderTypeEnum.LIMIT
        ? ExchangeOrderFeesTypeEnum.MAKER
        : ExchangeOrderFeesTypeEnum.TAKER,
      tradeType
    );

    const buyOrder: ExchangeOrder = !Manager.isTestMode
      ? await this.session.exchange.addAccountOrder(accountType, order)
      : order;
    const exchangeTrade = new ExchangeTrade(
      id,
      assetPair.assetBase,
      assetPair,
      tradeType,
      ExchangeTradeStatusEnum.OPEN,
      now
    );
    exchangeTrade.buyFeesPercentage = orderFees.amountPercentage;
    exchangeTrade.buyOrder = buyOrder;
    exchangeTrade.buyPrice = parseFloat(buyOrder.price);
    exchangeTrade.amount = buyOrder.amount;

    this.session.trades.push(exchangeTrade);

    SessionManager.save(this.session);

    logger.notice(chalk.green.bold(
      `I am bought "${assetPair.getKey()}" @ ${exchangeTrade.buyPrice}!`
    ));

    return exchangeTrade;
  }

  async executeSell(exchangeTrade: ExchangeTrade, price: string): Promise<ExchangeTrade> {
    const accountType = exchangeTrade.type === ExchangeTradeTypeEnum.SHORT
      ? ExchangeAccountTypeEnum.MARGIN
      : ExchangeAccountTypeEnum.SPOT;
    const order = new ExchangeOrder(
      exchangeTrade.id + '_' + ExchangeOrderSideEnum.SELL,
      exchangeTrade.assetPair,
      ExchangeOrderSideEnum.SELL,
      exchangeTrade.amount,
      price,
      ExchangeOrderTypeEnum.MARKET,
      accountType
    );
    const orderFees = await this.session.exchange.getAssetFees(
      exchangeTrade.assetPair,
      this.parameters.tradeAmount,
      this.session.orderType === ExchangeOrderTypeEnum.LIMIT
        ? ExchangeOrderFeesTypeEnum.MAKER
        : ExchangeOrderFeesTypeEnum.TAKER,
      exchangeTrade.type
    );

    const sellOrder: ExchangeOrder = !Manager.isTestMode
      ? await this.session.exchange.addAccountOrder(accountType, order)
      : order;
    exchangeTrade.sellFeesPercentage = orderFees.amountPercentage;
    exchangeTrade.sellOrder = sellOrder;
    exchangeTrade.sellPrice = parseFloat(sellOrder.price);
    exchangeTrade.status = ExchangeTradeStatusEnum.CLOSED;

    SessionManager.save(this.session);

    logger.notice(chalk.green.bold(
      `I am selling "${exchangeTrade.assetPair.getKey()}". ` +
      `It made (${colorTextPercentageByValue(exchangeTrade.getProfitPercentage())}) profit (excluding fees)!`
    ));

    return exchangeTrade;
  }

  /***** Export/Import *****/
  toExport() {
    const parameters = {
      tradeAmount: this.parameters.tradeAmount,
      maximumOpenTrades: this.parameters.maximumOpenTrades,
      maximumOpenTradesPerAssetPair: this.parameters.maximumOpenTradesPerAssetPair,
      priceIntervalSeconds: this.parameters.priceIntervalSeconds,
      candlestickIntervalSeconds: this.parameters.candlestickIntervalSeconds,
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
      priceIntervalSeconds: data.parameters.priceIntervalSeconds,
      candlestickIntervalSeconds: data.parameters.candlestickIntervalSeconds,
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
}
