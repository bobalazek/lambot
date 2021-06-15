import { Asset } from '../../Asset/Asset';
import { SessionAssetTradingTypeEnum } from '../../Session/SessionAsset';

export interface ExchangeResponseAssetPairInterface {
  assetBase: Asset;
  assetQuote: Asset;
  amountMinimum: string;
  amountMaximum: string;
  priceMinimum: string;
  priceMaximum: string;
  tradingTypes: SessionAssetTradingTypeEnum[];
}
