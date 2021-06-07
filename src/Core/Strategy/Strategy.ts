export interface StrategyInterface {
  // How much of the base asset do we want to use per order?
  orderAmount: string;

  // How many open positions are we allowed to have for this asset?
  maximumOpenPositions: number;

  //How much do we want to get profit, until we trigger a sell?
  takeProfitPercentage: number;

  // Should we enable trailing take profit?
  trailingTakeProfitEnabled: boolean;

  // How much can the value dip (from the highest point) until we actually sell?
  trailingTakeProfitDipPercentage: number;

  // How much can we lose until we trigger a sell?
  stopLossPercentage: number;

  // How long should we wait until we actually sell if it dips below a certain value?
  // Usefull with suden large dips!
  stopLossDipTimeoutSeconds: number;

  toExport(): Object;
}

export class Strategy implements StrategyInterface {
  orderAmount: string;
  maximumOpenPositions: number;
  takeProfitPercentage: number;
  trailingTakeProfitEnabled: boolean;
  trailingTakeProfitDipPercentage: number;
  stopLossPercentage: number;
  stopLossDipTimeoutSeconds: number;

  constructor({
    orderAmount = '1',
    maximumOpenPositions = 1,
    takeProfitPercentage = 5,
    trailingTakeProfitEnabled = true,
    trailingTakeProfitDipPercentage = 0.5,
    stopLossPercentage = 3,
    stopLossDipTimeoutSeconds = 30
  }) {
    this.orderAmount = orderAmount;
    this.maximumOpenPositions = maximumOpenPositions;
    this.takeProfitPercentage = takeProfitPercentage;
    this.trailingTakeProfitEnabled = trailingTakeProfitEnabled;
    this.trailingTakeProfitDipPercentage = trailingTakeProfitDipPercentage;
    this.stopLossPercentage = stopLossPercentage;
    this.stopLossDipTimeoutSeconds = stopLossDipTimeoutSeconds;
  }

  toExport(): Object {
    return {
      orderAmount: this.orderAmount,
      maximumOpenPositions: this.maximumOpenPositions,
      takeProfitPercentage: this.takeProfitPercentage,
      trailingTakeProfitEnabled: this.trailingTakeProfitEnabled,
      trailingTakeProfitDipPercentage: this.trailingTakeProfitDipPercentage,
      stopLossPercentage: this.stopLossPercentage,
      stopLossDipTimeoutSeconds: this.stopLossDipTimeoutSeconds,
    };
  }

  static fromImport(data: any): Strategy {
    return new Strategy({
      orderAmount: data.orderAmount,
      maximumOpenPositions: data.maximumOpenPositions,
      takeProfitPercentage: data.takeProfitPercentage,
      trailingTakeProfitEnabled: data.trailingTakeProfitEnabled,
      trailingTakeProfitDipPercentage: data.trailingTakeProfitDipPercentage,
      stopLossPercentage: data.stopLossPercentage,
      stopLossDipTimeoutSeconds: data.stopLossDipTimeoutSeconds,
    });
  }
}
