import { AssetPair } from '../../src/Core/Asset/AssetPair';
import { Assets } from '../../src/Core/Asset/Assets';
import { ExchangeResponseAccountAssetInterface } from '../../src/Core/Exchange/Response/ExchangeResponseAccountAsset';
import { ExchangeResponseAssetPairInterface } from '../../src/Core/Exchange/Response/ExchangeResponseAssetPair';
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
    ],
    new DefaultStrategy({}),
    SessionAssetTradingTypeEnum.SPOT
  ),
];

export const assetPricesResponses: ExchangeResponseAssetPriceEntryInterface[][] = [
  [
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
  ],
  [
    {
      symbol: 'ETHUSDT',
      timestamp: 1000,
      price: '0.500',
    },
    {
      symbol: 'BTCUSDT',
      timestamp: 1000,
      price: '2.500',
    },
    {
      symbol: 'BNBUSDT',
      timestamp: 1000,
      price: '1.000',
    },
    {
      symbol: 'BCHUSDT',
      timestamp: 1000,
      price: '3.000',
    },
  ],
  [
    {
      symbol: 'ETHUSDT',
      timestamp: 2000,
      price: '1.500',
    },
    {
      symbol: 'BTCUSDT',
      timestamp: 2000,
      price: '0.800',
    },
    {
      symbol: 'BNBUSDT',
      timestamp: 2000,
      price: '1.000',
    },
    {
      symbol: 'BCHUSDT',
      timestamp: 2000,
      price: '0.200',
    },
  ],
  [
    {
      symbol: 'ETHUSDT',
      timestamp: 2000,
      price: '1.000',
    },
    {
      symbol: 'BTCUSDT',
      timestamp: 2000,
      price: '1.200',
    },
    {
      symbol: 'BNBUSDT',
      timestamp: 2000,
      price: '1.000',
    },
    {
      symbol: 'BCHUSDT',
      timestamp: 2000,
      price: '1.300',
    },
  ],
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
];

export const assetPairsResponse: ExchangeResponseAssetPairInterface[] = [
  {
    assetBase: Assets.ETH,
    assetQuote: Assets.USDT,
    amountMinimum: '10',
    amountMaximum: '100000',
    priceMinimum: '1',
    priceMaximum: '100000',
    tradingTypes: [
      SessionAssetTradingTypeEnum.SPOT,
    ],
  },
  {
    assetBase: Assets.BTC,
    assetQuote: Assets.USDT,
    amountMinimum: '10',
    amountMaximum: '100000',
    priceMinimum: '1',
    priceMaximum: '100000',
    tradingTypes: [
      SessionAssetTradingTypeEnum.SPOT,
    ],
  },
  {
    assetBase: Assets.BNB,
    assetQuote: Assets.USDT,
    amountMinimum: '10',
    amountMaximum: '100000',
    priceMinimum: '1',
    priceMaximum: '100000',
    tradingTypes: [
      SessionAssetTradingTypeEnum.SPOT,
    ],
  },
  {
    assetBase: Assets.BCH,
    assetQuote: Assets.USDT,
    amountMinimum: '10',
    amountMaximum: '100000',
    priceMinimum: '1',
    priceMaximum: '100000',
    tradingTypes: [
      SessionAssetTradingTypeEnum.SPOT,
    ],
  },
];

export const accountAssetsResponse: ExchangeResponseAccountAssetInterface[] = [
  {
    asset: Assets.USDT,
    amountFree: '0.0',
    amountLocked: '0.0',
  },
  {
    asset: Assets.ETH,
    amountFree: '0.0',
    amountLocked: '0.0',
  },
  {
    asset: Assets.BTC,
    amountFree: '0.0',
    amountLocked: '0.0',
  },
  {
    asset: Assets.BNB,
    amountFree: '0.0',
    amountLocked: '0.0',
  },
  {
    asset: Assets.BCH,
    amountFree: '0.0',
    amountLocked: '0.0',
  },
];
