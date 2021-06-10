export interface StrategyInterface {
  // How much of the base asset do we want to use per order?
  orderAmount: string;

  // How many open positions are we allowed to have for this asset?
  maximumOpenPositions: number;

  // At least how much volume does that asset need so we can consider a buy?
  minimumDailyVolume: number;

  // How much do we want to get profit, until we trigger a sell?
  takeProfitPercentage: number;

  // If we have a sudden valley when we are are ready to take profit,
  // should we wait for it to be stable, or sell anyway?
  takeProfitValleyTimeoutSeconds: number;

  // Should we enable trailing take profit?
  trailingTakeProfitEnabled: boolean;

  // How much can the value valley (from the highest point) until we actually sell?
  trailingTakeProfitSlipPercentage: number;

  // Should we enable stop loss?
  stopLossEnabled: boolean;

  // How much can we lose until we trigger a sell?
  stopLossPercentage: number;

  // How long should we wait until we actually sell if it valleys below a certain value?
  // Usefull with suden large valleys!
  stopLossTimeoutSeconds: number;

  // How much percentage can the price rise after a valley, until we want to trigger a buy order?
  // This is mostly used so we follow the valley down, and once it starts getting back up, we buy!
  buyValleySlipPercentage: number;

  toExport(): unknown;
}

export class Strategy implements StrategyInterface {
  orderAmount: string;
  maximumOpenPositions: number;
  minimumDailyVolume: number;
  takeProfitPercentage: number;
  takeProfitValleyTimeoutSeconds: number;
  trailingTakeProfitEnabled: boolean;
  trailingTakeProfitSlipPercentage: number;
  stopLossEnabled: boolean;
  stopLossPercentage: number;
  stopLossTimeoutSeconds: number;
  buyValleySlipPercentage: number;

  constructor({
    orderAmount = '1',
    maximumOpenPositions = 1,
    minimumDailyVolume = 0,
    takeProfitPercentage = 5,
    takeProfitValleyTimeoutSeconds = 0,
    trailingTakeProfitEnabled = true,
    trailingTakeProfitSlipPercentage = 0.25,
    stopLossEnabled = true,
    stopLossPercentage = 3,
    stopLossTimeoutSeconds = 30,
    buyValleySlipPercentage = 0.25,
  }) {
    this.orderAmount = orderAmount;
    this.maximumOpenPositions = maximumOpenPositions;
    this.minimumDailyVolume = minimumDailyVolume;
    this.takeProfitPercentage = takeProfitPercentage;
    this.takeProfitValleyTimeoutSeconds = takeProfitValleyTimeoutSeconds;
    this.trailingTakeProfitEnabled = trailingTakeProfitEnabled;
    this.trailingTakeProfitSlipPercentage = trailingTakeProfitSlipPercentage;
    this.stopLossEnabled = stopLossEnabled;
    this.stopLossPercentage = stopLossPercentage;
    this.stopLossTimeoutSeconds = stopLossTimeoutSeconds;
    this.buyValleySlipPercentage = buyValleySlipPercentage;
  }

  toExport() {
    return {
      orderAmount: this.orderAmount,
      maximumOpenPositions: this.maximumOpenPositions,
      minimumDailyVolume: this.minimumDailyVolume,
      takeProfitPercentage: this.takeProfitPercentage,
      takeProfitValleyTimeoutSeconds: this.takeProfitValleyTimeoutSeconds,
      trailingTakeProfitEnabled: this.trailingTakeProfitEnabled,
      trailingTakeProfitSlipPercentage: this.trailingTakeProfitSlipPercentage,
      stopLossEnabled: this.stopLossEnabled,
      stopLossPercentage: this.stopLossPercentage,
      stopLossTimeoutSeconds: this.stopLossTimeoutSeconds,
      buyValleySlipPercentage: this.buyValleySlipPercentage,
    };
  }

  static fromImport(data: any): Strategy {
    return new Strategy({
      orderAmount: data.orderAmount,
      maximumOpenPositions: data.maximumOpenPositions,
      minimumDailyVolume: data.minimumDailyVolume,
      takeProfitPercentage: data.takeProfitPercentage,
      takeProfitValleyTimeoutSeconds: data.takeProfitValleyTimeoutSeconds,
      trailingTakeProfitEnabled: data.trailingTakeProfitEnabled,
      trailingTakeProfitSlipPercentage: data.trailingTakeProfitSlipPercentage,
      stopLossEnabled: data.stopLossEnabled,
      stopLossPercentage: data.stopLossPercentage,
      stopLossTimeoutSeconds: data.stopLossTimeoutSeconds,
      buyValleySlipPercentage: data.buyValleySlipPercentage,
    });
  }
}
