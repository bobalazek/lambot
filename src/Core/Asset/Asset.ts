export interface AssetInterface {
  symbol: string;
  name: string;
  additionalData?: AssetAdditionalDataInterface;
}

export interface AssetAdditionalDataInterface {
  eth20TokenAddress?: string;
  bsc20TokenAddress?: string;
}

export class Asset implements AssetInterface {
  symbol: string;
  name: string;
  additionalData?: AssetAdditionalDataInterface;

  constructor(symbol: string, name: string, additionalData?: AssetAdditionalDataInterface) {
    this.symbol = symbol;
    this.name = name;
    this.additionalData = additionalData;
  }

  getKey(): string {
    return this.symbol;
  }

  toExport() {
    return {
      symbol: this.symbol,
      name: this.name,
      additionalData: this.additionalData,
    };
  }

  static fromImport(data: any): Asset {
    return new Asset(
      data.symbol,
      data.name,
      data.additionalData
    );
  }
}
