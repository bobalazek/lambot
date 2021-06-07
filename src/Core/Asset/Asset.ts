export interface AssetInterface {
  symbol: string;
  name: string;
}

export class Asset implements AssetInterface {
  symbol: string;
  name: string;

  constructor(symbol: string, name: string) {
    this.symbol = symbol;
    this.name = name;
  }

  toString(): string {
    return this.symbol;
  }
}
