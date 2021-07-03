import { AssetPair } from './AssetPair';

export interface AssetPairStringConverterInterface {
  convert(assetPair: AssetPair): string;
}

export class AssetPairStringConverterDefault implements AssetPairStringConverterInterface {
  convert(assetPair: AssetPair): string {
    if (assetPair.symbol) {
      return assetPair.symbol;
    }

    return (
      assetPair.assetBase.symbol +
      assetPair.assetQuote.symbol
    );
  }
}
