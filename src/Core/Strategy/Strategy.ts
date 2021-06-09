export interface StrategyInterface {
  // How much of the base asset do we want to use per order?
  orderAmount: string;

  // How many open positions are we allowed to have for this asset?
  maximumOpenPositions: number;

  // How much do we want to get profit, until we trigger a sell?
  takeProfitPercentage: number;

  // If we have a sudden dip when we are are ready to take profit,
  // should we wait for it to be stable, or sell anyway?
  takeProfitDipTimeoutSeconds: number;

  // Should we enable trailing take profit?
  trailingTakeProfitEnabled: boolean;

  // How much can the value dip (from the highest point) until we actually sell?
  trailingTakeProfitSlipPercentage: number;

  // Should we enable stop loss?
  stopLossEnabled: boolean;

  // How much can we lose until we trigger a sell?
  stopLossPercentage: number;

  // How long should we wait until we actually sell if it dips below a certain value?
  // Usefull with suden large dips!
  stopLossTimeoutSeconds: number;

  // How much percentage can the price rise after a dip, until we want to trigger a buy order?
  // This is mostly used so we follow the dip down, and once it starts getting back up, we buy!
  buyDipSlipPercentage: number;

  toExport(): unknown;
}

export class Strategy implements StrategyInterface {
  orderAmount: string;
  maximumOpenPositions: number;
  takeProfitPercentage: number;
  takeProfitDipTimeoutSeconds: number;
  trailingTakeProfitEnabled: boolean;
  trailingTakeProfitSlipPercentage: number;
  stopLossEnabled: boolean;
  stopLossPercentage: number;
  stopLossTimeoutSeconds: number;
  buyDipSlipPercentage: number;

  constructor({
    orderAmount = '1',
    maximumOpenPositions = 1,
    takeProfitPercentage = 5,
    takeProfitDipTimeoutSeconds = 0,
    trailingTakeProfitEnabled = true,
    trailingTakeProfitSlipPercentage = 0.25,
    stopLossEnabled = true,
    stopLossPercentage = 3,
    stopLossTimeoutSeconds = 30,
    buyDipSlipPercentage = 0.25,
  }) {
    this.orderAmount = orderAmount;
    this.maximumOpenPositions = maximumOpenPositions;
    this.takeProfitPercentage = takeProfitPercentage;
    this.takeProfitDipTimeoutSeconds = takeProfitDipTimeoutSeconds;
    this.trailingTakeProfitEnabled = trailingTakeProfitEnabled;
    this.trailingTakeProfitSlipPercentage = trailingTakeProfitSlipPercentage;
    this.stopLossEnabled = stopLossEnabled;
    this.stopLossPercentage = stopLossPercentage;
    this.stopLossTimeoutSeconds = stopLossTimeoutSeconds;
    this.buyDipSlipPercentage = buyDipSlipPercentage;
  }

  toExport() {
    return {
      orderAmount: this.orderAmount,
      maximumOpenPositions: this.maximumOpenPositions,
      takeProfitPercentage: this.takeProfitPercentage,
      takeProfitDipTimeoutSeconds: this.takeProfitDipTimeoutSeconds,
      trailingTakeProfitEnabled: this.trailingTakeProfitEnabled,
      trailingTakeProfitSlipPercentage: this.trailingTakeProfitSlipPercentage,
      stopLossEnabled: this.stopLossEnabled,
      stopLossPercentage: this.stopLossPercentage,
      stopLossTimeoutSeconds: this.stopLossTimeoutSeconds,
      buyDipSlipPercentage: this.buyDipSlipPercentage,
    };
  }

  static fromImport(data: any): Strategy {
    return new Strategy({
      orderAmount: data.orderAmount,
      maximumOpenPositions: data.maximumOpenPositions,
      takeProfitPercentage: data.takeProfitPercentage,
      takeProfitDipTimeoutSeconds: data.takeProfitDipTimeoutSeconds,
      trailingTakeProfitEnabled: data.trailingTakeProfitEnabled,
      trailingTakeProfitSlipPercentage: data.trailingTakeProfitSlipPercentage,
      stopLossEnabled: data.stopLossEnabled,
      stopLossPercentage: data.stopLossPercentage,
      stopLossTimeoutSeconds: data.stopLossTimeoutSeconds,
      buyDipSlipPercentage: data.buyDipSlipPercentage,
    });
  }
}
