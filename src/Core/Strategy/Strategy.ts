import { AssetPair } from '../Asset/AssetPair';
import { Manager } from '../Manager';
import { ExchangeOrder, ExchangeOrderSideEnum, ExchangeOrderTypeEnum } from '../Exchange/ExchangeOrder';
import { ExchangeTrade, ExchangeTradeStatusEnum, ExchangeTradeTypeEnum } from '../Exchange/ExchangeTrade';
import { ExchangeOrderFeesTypeEnum } from '../Exchange/ExchangeOrderFees';
import { Session } from '../Session/Session';
import { SessionAsset } from '../Session/SessionAsset';
import { StrategyParametersInterface } from './StrategyParameters';
import { SessionManager } from '../Session/SessionManager';
import { ID_PREFIX } from '../../Constants';

export interface StrategyInterface {
  name: string;
  parameters: StrategyParametersInterface;
  session: Session;
  boot(session: Session): Promise<boolean>;
  getSortedAssetPairs(sessionAsset: SessionAsset): AssetPair[];
  checkForBuySignal(
    assetPair: AssetPair,
    sessionAsset: SessionAsset
  ): Promise<ExchangeTrade>;
  checkForSellSignal(
    exchangeTrade: ExchangeTrade,
    sessionAsset: SessionAsset
  ): Promise<ExchangeTrade>;
  executeBuy(
    assetPair: AssetPair,
    sessionAsset: SessionAsset,
    price: string,
    tradeType: ExchangeTradeTypeEnum
  ): Promise<ExchangeTrade>;
  executeSell(
    exchangeTrade: ExchangeTrade,
    sessionAsset: SessionAsset,
    price: string
  ): Promise<ExchangeTrade>;
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

  getSortedAssetPairs(sessionAsset: SessionAsset): AssetPair[] {
    throw new Error('getSortedAssetPairs() not implemented yet.');
  }

  async checkForBuySignal(assetPair: AssetPair, sessionAsset: SessionAsset): Promise<ExchangeTrade> {
    throw new Error('checkForBuySignal() not implemented yet.');
  }

  async checkForSellSignal(exchangeTrade: ExchangeTrade, sessionAsset: SessionAsset): Promise<ExchangeTrade> {
    throw new Error('checkForSellSignal() not implemented yet.');
  }

  async executeBuy(
    assetPair: AssetPair,
    sessionAsset: SessionAsset,
    price: string,
    tradeType: ExchangeTradeTypeEnum
  ): Promise<ExchangeTrade> {
    const now = Date.now();
    const assetPairSymbol = assetPair.getKey();

    const id = ID_PREFIX + this.session.id + '_' + assetPairSymbol + '_' + now;
    const order = this._createNewOrder(
      id,
      assetPair,
      sessionAsset,
      ExchangeOrderSideEnum.BUY,
      this.parameters.tradeAmount,
      price
    );
    const orderFees = await this.session.exchange.getAssetFees(
      assetPairSymbol,
      this.parameters.tradeAmount,
      sessionAsset.orderType === ExchangeOrderTypeEnum.LIMIT
        ? ExchangeOrderFeesTypeEnum.MAKER
        : ExchangeOrderFeesTypeEnum.TAKER
    );

    const buyOrder: ExchangeOrder = !Manager.isTestMode
      ? await this.session.exchange.addAccountOrder(
        this.session.exchange.getAccountType(sessionAsset.tradingType),
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

    sessionAsset.trades.push(exchangeTrade);

    SessionManager.save(this.session);

    return exchangeTrade;
  }

  async executeSell(
    exchangeTrade: ExchangeTrade,
    sessionAsset: SessionAsset,
    price: string
  ): Promise<ExchangeTrade> {
    const assetPairSymbol = exchangeTrade.assetPair.getKey();

    const order = this._createNewOrder(
      exchangeTrade.id,
      exchangeTrade.assetPair,
      sessionAsset,
      ExchangeOrderSideEnum.SELL,
      exchangeTrade.amount,
      price
    );
    const orderFees = await this.session.exchange.getAssetFees(
      assetPairSymbol,
      this.parameters.tradeAmount,
      sessionAsset.orderType === ExchangeOrderTypeEnum.LIMIT
        ? ExchangeOrderFeesTypeEnum.MAKER
        : ExchangeOrderFeesTypeEnum.TAKER
    );

    const sellOrder: ExchangeOrder = !Manager.isTestMode
      ? await this.session.exchange.addAccountOrder(
        this.session.exchange.getAccountType(sessionAsset.tradingType),
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

  /***** Helpers *****/
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
