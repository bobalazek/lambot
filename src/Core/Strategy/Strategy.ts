import { AssetPair } from '../Asset/AssetPair';
import { ExchangeTrade } from '../Exchange/ExchangeTrade';
import { Session } from '../Session/Session';
import { SessionAsset } from '../Session/SessionAsset';
import { StrategyParametersInterface } from './StrategyParameters';

export interface StrategyInterface {
  name: string;
  parameters: StrategyParametersInterface;
  session: Session;
  boot(session: Session): Promise<boolean>;
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
    throw new Error('checkForBuySignal() not implemented yet.');
  }

  async checkForSellSignal(exchangeTrade: ExchangeTrade, sessionAsset: SessionAsset): Promise<ExchangeTrade> {
    throw new Error('checkForSellSignal() not implemented yet.');
  }

  getSortedAssetPairs(sessionAsset: SessionAsset): AssetPair[] {
    throw new Error('getSortedAssetPairs() not implemented yet.');
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
}
