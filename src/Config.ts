import { Asset } from './Core/Asset/Asset';
import { AssetPair } from './Core/Asset/AssetPair';
import { ExchangesEnum } from './Core/Exchange/ExchangesFactory';
import { SessionOrderTypes } from './Core/Session/Session';
import { SessionConfig } from './Core/Session/SessionConfig';
import { SessionTradingTypeEnum } from './Core/Session/SessionTradingType';
import { Strategy } from './Core/Strategy/Strategy';

export interface ConfigInterface {
  sessionId: string;
  sessionConfig: SessionConfig;
  sessionExchange: ExchangesEnum;
  sessionAsset: Asset;
  sessionAssetPairs: AssetPair[];
  sessionStrategy: Strategy;
  sessionTradingTypes: SessionTradingTypeEnum[];
  sessionOrderTypes: SessionOrderTypes;
}
