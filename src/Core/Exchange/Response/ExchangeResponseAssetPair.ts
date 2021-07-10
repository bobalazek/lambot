import { AssetPairDataInterface } from '../../Asset/AssetPair';
import { SessionTradingTypeEnum } from '../../Session/SessionTradingType';

export interface ExchangeResponseAssetPairInterface extends AssetPairDataInterface {
  amountMinimum: string;
  amountMaximum: string;
  priceMinimum: string;
  priceMaximum: string;
  tradingTypes: SessionTradingTypeEnum[];
}
