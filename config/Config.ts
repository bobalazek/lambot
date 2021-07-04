import { AssetPair } from '../src/Core/Asset/AssetPair';
import { Assets } from '../src/Core/Asset/Assets';
import { ConfigInterface } from '../src/Core/Config';
import { ExchangeOrderTypeEnum } from '../src/Core/Exchange/ExchangeOrder';
import { ExchangesEnum } from '../src/Core/Exchange/ExchangesFactory';
import { SessionTradingTypeEnum } from '../src/Core/Session/Session';
import { SessionConfig } from '../src/Core/Session/SessionConfig';
import { DefaultStrategy } from './DefaultStrategy';

// Config
const assets = [
  Assets.ETH, Assets.ETC, Assets.BTC, Assets.BNB, Assets.BCH,
  Assets.LTC, Assets.DOGE, Assets.ADA, Assets.DOT, Assets.UNI,
  Assets.SOL, Assets.LINK, Assets.DAI, Assets.MATIC, Assets.ALGO,
  Assets.XRP, Assets.ICP, Assets.THETA, Assets.XLM, Assets.VET,
  Assets.TRX, Assets.FIL, Assets.XMR, Assets.EOS, Assets.SHIB,
  Assets.SUSHI, Assets.AAVE, Assets.KSM, Assets.LUNA, Assets.BTT,
];
const sessionConfig = new SessionConfig({});
const sessionExchange = ExchangesEnum.BINANCE;
const sessionAsset = Assets.USDT;
const sessionAssetPairs = assets.map((asset) => {
  return new AssetPair(asset, sessionAsset);
});
const sessionStrategy = new DefaultStrategy({});
const sessionTradingTypes = [
  SessionTradingTypeEnum.SPOT,
];
const sessionOrderType = ExchangeOrderTypeEnum.MARKET;

const config: ConfigInterface = {
  sessionConfig,
  sessionExchange,
  sessionAsset,
  sessionAssetPairs,
  sessionStrategy,
  sessionTradingTypes,
  sessionOrderType,
};

export default config;
