import { Asset } from './Asset/Asset';
import { AssetPair } from './Asset/AssetPair';
import { ExchangesEnum } from './Exchange/ExchangesFactory';
import { SessionOrderTypes, SessionTradingTypeEnum } from './Session/Session';
import { SessionConfig } from './Session/SessionConfig';
import { Strategy } from './Strategy/Strategy';

export interface ConfigInterface {
  sessionConfig: SessionConfig;
  sessionExchange: ExchangesEnum;
  sessionAsset: Asset;
  sessionAssetPairs: AssetPair[];
  sessionStrategy: Strategy;
  sessionTradingTypes: SessionTradingTypeEnum[];
  sessionOrderTypes: SessionOrderTypes;
}
