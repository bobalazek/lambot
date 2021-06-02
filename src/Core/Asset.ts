export interface AssetInterface {
  symbol: string;
  name: string;
}

export interface AssetFeeInterface {
  takerFeePercentage: string;
  makerFeePercentage: string;
}

export class Asset implements AssetInterface {
  symbol: string;
  name: string;

  constructor(symbol: string, name: string) {
    this.symbol = symbol;
    this.name = name;
  }
}

export class AssetFee implements AssetFeeInterface {
  takerFeePercentage: string;
  makerFeePercentage: string;

  constructor(takerFeePercentage: string, makerFeePercentage: string) {
    this.takerFeePercentage = takerFeePercentage;
    this.makerFeePercentage = makerFeePercentage;
  }
}
