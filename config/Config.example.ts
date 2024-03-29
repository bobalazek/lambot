import { AssetPair } from '../src/Core/Asset/AssetPair';
import { Assets } from '../src/Core/Asset/Assets';
import { ConfigInterface } from '../src/Config';
import { ExchangeOrderTypeEnum } from '../src/Core/Exchange/ExchangeOrderType';
import { ExchangesEnum } from '../src/Core/Exchange/ExchangesFactory';
import { SessionConfig } from '../src/Core/Session/SessionConfig';
import { SessionTradingTypeEnum } from '../src/Core/Session/SessionTradingType';
import { DefaultStrategy } from './Strategies/DefaultStrategy';

// Config
const sessionId = '1';
const sessionAssets = [
  Assets.ETH, Assets.ETC, Assets.BTC, Assets.BNB, Assets.BCH,
  Assets.LTC, Assets.DOGE, Assets.ADA, Assets.DOT, Assets.UNI,
  Assets.SOL, Assets.LINK, Assets.DAI, Assets.MATIC, Assets.ALGO,
  Assets.XRP, Assets.ICP, Assets.THETA, Assets.XLM, Assets.VET,
  Assets.TRX, Assets.FIL, Assets.XMR, Assets.EOS, Assets.SHIB,
  Assets.SUSHI, Assets.AAVE, Assets.KSM, Assets.LUNA, Assets.BTT,
];
const sessionConfig = new SessionConfig({
  assetPairPriceUpdateIntervalSeconds: 5,
  assetPairCandlestickUpdateIntervalSeconds: 60,
  memoryUsageMonitoringIntervalSeconds: 120,
  webServerApiEnabled: true,
});
const sessionExchange = ExchangesEnum.BINANCE;
const sessionAsset = Assets.USDT;
const sessionAssetPairs = sessionAssets.map((asset) => {
  return new AssetPair(asset, sessionAsset);
});
const sessionStrategy = new DefaultStrategy({});
const sessionTradingTypes = [
  SessionTradingTypeEnum.SPOT,
];
const sessionOrderTypes = {
  buy: ExchangeOrderTypeEnum.MARKET,
  sell: ExchangeOrderTypeEnum.MARKET,
};

const config: ConfigInterface = {
  sessionId,
  sessionConfig,
  sessionExchange,
  sessionAsset,
  sessionAssetPairs,
  sessionStrategy,
  sessionTradingTypes,
  sessionOrderTypes,
};

export default config;
