import { AssetPairDataInterface } from '../../Asset/AssetPair';
import { SessionAssetTradingTypeEnum } from '../../Session/SessionAsset';

export interface ExchangeResponseAssetPairInterface extends AssetPairDataInterface {
  amountMinimum: string;
  amountMaximum: string;
  priceMinimum: string;
  priceMaximum: string;
  tradingTypes: SessionAssetTradingTypeEnum[];
}
