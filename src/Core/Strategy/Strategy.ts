import { AssetPair } from '../Asset/AssetPair';
import { ExchangeAssetPair } from '../Exchange/ExchangeAssetPair';
import { ExchangeTrade, ExchangeTradeTypeEnum } from '../Exchange/ExchangeTrade';
import { Session } from '../Session/Session';
import { StrategyParametersInterface } from './StrategyParameters';

export interface StrategyInterface {
  name: string;
  parameters: StrategyParametersInterface;
  session: Session;
  boot(session: Session): Promise<boolean>;
  getSortedAssetPairs(): AssetPair[];
  prepareIndicators(exchangeAssetPair: ExchangeAssetPair): ExchangeAssetPair;
  shouldBuy(exchangeAssetPair: ExchangeAssetPair): ExchangeTradeTypeEnum | false;
  shouldSell(exchangeTrade: ExchangeTrade): boolean;
}

export class Strategy implements StrategyInterface {
  name: string;
  parameters: StrategyParametersInterface;
  session!: Session;

  constructor(name: string, parameters: StrategyParametersInterface) {
    this.name = name;
    this.parameters = parameters;
  }

  async boot(session: Session): Promise<boolean> {
    this.session = session;

    return true;
  }

  getSortedAssetPairs(): AssetPair[] {
    return this.session.assetPairs;
  }

  prepareIndicators(exchangeAssetPair: ExchangeAssetPair): ExchangeAssetPair {
    exchangeAssetPair.indicators = new Map();

    return exchangeAssetPair;
  }

  shouldBuy(exchangeAssetPair: ExchangeAssetPair): ExchangeTradeTypeEnum | false {
    const shouldBuy = exchangeAssetPair.shouldBuy(this.session);
    if (shouldBuy) {
      return ExchangeTradeTypeEnum.LONG;
    }

    // TODO: also implement short?

    return false;
  }

  shouldSell(exchangeTrade: ExchangeTrade): boolean {
    return exchangeTrade.shouldSell(this.session);
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
    };

    return new Strategy(this.name, parameters);
  }
}
