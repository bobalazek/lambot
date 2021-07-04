import { Asset } from './Asset/Asset';
import { AssetPair } from './Asset/AssetPair';
import { ExchangeOrderTypeEnum } from './Exchange/ExchangeOrder';
import { ExchangesEnum } from './Exchange/ExchangesFactory';
import { SessionTradingTypeEnum } from './Session/Session';
import { SessionConfig } from './Session/SessionConfig';
import { Strategy } from './Strategy/Strategy';

export interface ConfigInterface {
  sessionConfig: SessionConfig;
  sessionExchange: ExchangesEnum;
  sessionAsset: Asset;
  sessionAssetPairs: AssetPair[];
  sessionStrategy: Strategy;
  sessionTradingTypes: SessionTradingTypeEnum[];
  sessionOrderType: ExchangeOrderTypeEnum;
}
