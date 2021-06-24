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

  getKey(): string {
    return this.symbol;
  }

  toExport() {
    return {
      symbol: this.symbol,
      name: this.name,
    };
  }

  static fromImport(data: any): Asset {
    return new Asset(
      data.symbol,
      data.name
    );
  }
}
