import { AssetPair } from './AssetPair';

export interface AssetPairStringConverterInterface {
  convert(assetPair: AssetPair): string;
}
