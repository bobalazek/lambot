import { AssetPair } from '../Asset/AssetPair';
import { ExchangeAssetPair } from '../Exchange/ExchangeAssetPair';
import { ExchangeTrade } from '../Exchange/ExchangeTrade';
import { Session } from '../Session/Session';
import { StrategyParametersInterface } from './StrategyParameters';

export interface StrategyInterface {
  name: string;
  parameters: StrategyParametersInterface;
  session: Session;
  boot(session: Session): Promise<boolean>;
  getSortedAssetPairs(): AssetPair[];
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

  /***** Export/Import *****/
  toExport() {
    const parameters = {
      tradeAmount: this.parameters.tradeAmount,
      maximumOpenTrades: this.parameters.maximumOpenTrades,
      maximumOpenTradesPerAssetPair: this.parameters.maximumOpenTradesPerAssetPair,
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
