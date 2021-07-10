import { AssetPair } from '../../Asset/AssetPair';
import { ExchangeAssetPairPriceEntryInterface } from '../ExchangeAssetPairPrice';

export interface ExchangeResponseAssetPairPriceEntryInterface extends ExchangeAssetPairPriceEntryInterface {
  assetPair: AssetPair;
}
