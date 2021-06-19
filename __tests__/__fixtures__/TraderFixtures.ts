import { AssetPair } from '../../src/Core/Asset/AssetPair';
import { Assets } from '../../src/Core/Asset/Assets';
import { ExchangeResponseAssetPriceEntryInterface } from '../../src/Core/Exchange/Response/ExchangeResponseAssetPriceEntry';
import { ExchangeResponseAssetPriceStatisticsInterface } from '../../src/Core/Exchange/Response/ExchangeResponseAssetPriceStatistics';
import { SessionAsset, SessionAssetTradingTypeEnum } from '../../src/Core/Session/SessionAsset';
import { DefaultStrategy } from '../../src/Strategies/DefaultStrategy';

export const sessionAssets = [
  new SessionAsset(
    Assets.USDT,
    [
      new AssetPair(Assets.ETH, Assets.USDT),
      new AssetPair(Assets.BTC, Assets.USDT),
      new AssetPair(Assets.BNB, Assets.USDT),
      new AssetPair(Assets.BCH, Assets.USDT),
      new AssetPair(Assets.ETC, Assets.USDT),
      new AssetPair(Assets.LTC, Assets.USDT),
      new AssetPair(Assets.DOGE, Assets.USDT),
    ],
    new DefaultStrategy({}),
    SessionAssetTradingTypeEnum.SPOT
  ),
];

export const assetPricesResponse: ExchangeResponseAssetPriceEntryInterface[] = [
  {
    symbol: 'ETHUSDT',
    timestamp: 0,
    price: '1.000',
  },
  {
    symbol: 'BTCUSDT',
    timestamp: 0,
    price: '1.000',
  },
  {
    symbol: 'BNBUSDT',
    timestamp: 0,
    price: '1.000',
  },
  {
    symbol: 'BCHUSDT',
    timestamp: 0,
    price: '1.000',
  },
  {
    symbol: 'ETCUSDT',
    timestamp: 0,
    price: '1.000',
  },
  {
    symbol: 'LTCUSDT',
    timestamp: 0,
    price: '1.000',
  },
  {
    symbol: 'DOGEUSDT',
    timestamp: 0,
    price: '1.000',
  },
];

export const assetStatisticsResponse: ExchangeResponseAssetPriceStatisticsInterface[] = [
  {
    symbol: 'ETHUSDT',
    timestamp: 0,
    volume: '10000',
    tradesCount: 1000,
  },
  {
    symbol: 'BTCUSDT',
    timestamp: 0,
    volume: '10000',
    tradesCount: 1000,
  },
  {
    symbol: 'BNBUSDT',
    timestamp: 0,
    volume: '10000',
    tradesCount: 1000,
  },
  {
    symbol: 'BCHUSDT',
    timestamp: 0,
    volume: '10000',
    tradesCount: 1000,
  },
  {
    symbol: 'ETCUSDT',
    timestamp: 0,
    volume: '10000',
    tradesCount: 1000,
  },
  {
    symbol: 'LTCUSDT',
    timestamp: 0,
    volume: '10000',
    tradesCount: 1000,
  },
  {
    symbol: 'DOGEUSDT',
    timestamp: 0,
    volume: '10000',
    tradesCount: 1000,
  },
];
