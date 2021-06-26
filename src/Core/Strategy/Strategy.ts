import { AssetPair } from '../Asset/AssetPair';
import { ExchangeOrder, ExchangeOrderSideEnum, ExchangeOrderTypeEnum } from '../Exchange/ExchangeOrder';
import { ExchangeTrade, ExchangeTradeStatusEnum, ExchangeTradeTypeEnum } from '../Exchange/ExchangeTrade';
import { ExchangeOrderFeesTypeEnum } from '../Exchange/ExchangeOrderFees';
import { Manager } from '../Manager';
import { Session } from '../Session/Session';
import { StrategyParametersInterface } from './StrategyParameters';
import { SessionManager } from '../Session/SessionManager';
import { ID_PREFIX } from '../../Constants';

export interface StrategyInterface {
  name: string;
  parameters: StrategyParametersInterface;
  session: Session;
  boot(session: Session): Promise<boolean>;
  getSortedAssetPairs(): AssetPair[];
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

    const id = ID_PREFIX + this.session.id + '_' + assetPairSymbol + '_' + now;
    const order = this._createNewOrder(
      id,
      assetPair,
      ExchangeOrderSideEnum.BUY,
      this.parameters.tradeAmount,
      price
    );
    const orderFees = await this.session.exchange.getAssetFees(
      assetPairSymbol,
      this.parameters.tradeAmount,
      this.session.orderType === ExchangeOrderTypeEnum.LIMIT
        ? ExchangeOrderFeesTypeEnum.MAKER
        : ExchangeOrderFeesTypeEnum.TAKER,
      tradeType
    );

    const buyOrder: ExchangeOrder = !Manager.isTestMode
      ? await this.session.exchange.addAccountOrder(
        this.session.exchange.getAccountType(this.session.tradingType),
        order
      )
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

    return exchangeTrade;
  }

  async executeSell(exchangeTrade: ExchangeTrade, price: string): Promise<ExchangeTrade> {
    const assetPairSymbol = exchangeTrade.assetPair.getKey();

    const order = this._createNewOrder(
      exchangeTrade.id,
      exchangeTrade.assetPair,
      ExchangeOrderSideEnum.SELL,
      exchangeTrade.amount,
      price
    );
    const orderFees = await this.session.exchange.getAssetFees(
      assetPairSymbol,
      this.parameters.tradeAmount,
      this.session.orderType === ExchangeOrderTypeEnum.LIMIT
        ? ExchangeOrderFeesTypeEnum.MAKER
        : ExchangeOrderFeesTypeEnum.TAKER,
      exchangeTrade.type
    );

    const sellOrder: ExchangeOrder = !Manager.isTestMode
      ? await this.session.exchange.addAccountOrder(
        this.session.exchange.getAccountType(this.session.tradingType),
        order
      )
      : order;
    exchangeTrade.sellFeesPercentage = orderFees.amountPercentage;
    exchangeTrade.sellOrder = sellOrder;
    exchangeTrade.sellPrice = parseFloat(sellOrder.price);
    exchangeTrade.status = ExchangeTradeStatusEnum.CLOSED;

    SessionManager.save(this.session);

    return exchangeTrade;
  }

  /***** Export/Import *****/
  toExport() {
    const parameters = {
      tradeAmount: this.parameters.tradeAmount,
      maximumOpenTrades: this.parameters.maximumOpenTrades,
      maximumOpenTradesPerAssetPair: this.parameters.maximumOpenTradesPerAssetPair,
      priceIntervalSeconds: this.parameters.priceIntervalSeconds,
      candlesticksIntervalSeconds: this.parameters.candlesticksIntervalSeconds,
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
      candlesticksIntervalSeconds: data.parameters.candlesticksIntervalSeconds,
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

  /***** Helpers *****/
  _createNewOrder(
    idPrefix: string,
    assetPair: AssetPair,
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
      this.session.exchange.getAccountType(this.session.tradingType)
    );
  }
}
