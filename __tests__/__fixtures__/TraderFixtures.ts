import { AssetPair } from '../../src/Core/Asset/AssetPair';
import { Assets } from '../../src/Core/Asset/Assets';
import { ExchangesEnum, ExchangesFactory } from '../../src/Core/Exchange/ExchangesFactory';
import { ExchangeResponseAccountAssetInterface } from '../../src/Core/Exchange/Response/ExchangeResponseAccountAsset';
import { ExchangeResponseAssetPairInterface } from '../../src/Core/Exchange/Response/ExchangeResponseAssetPair';
import { ExchangeResponseAssetPairPriceEntryInterface } from '../../src/Core/Exchange/Response/ExchangeResponseAssetPairPriceEntry';
import { ExchangeResponseAssetPairStatisticsInterface } from '../../src/Core/Exchange/Response/ExchangeResponseAssetPairStatistics';
import { Manager } from '../../src/Core/Manager';
import { SessionTradingTypeEnum } from '../../src/Core/Session/SessionTradingType';
import { createMockSession } from './SessionFixtures';

export const assetPairStatisticsResponse: ExchangeResponseAssetPairStatisticsInterface[] = [
  {
    assetPair: new AssetPair(Assets.ETH, Assets.USDT),
    openPrice: '1',
    highPrice: '1',
    lowPrice: '1',
    closePrice: '1',
    volume: '1',
    volumeQuote: '1',
    openTime: 0,
    closeTime: 1000,
  },
  {
    assetPair: new AssetPair(Assets.BTC, Assets.USDT),
    openPrice: '1',
    highPrice: '1',
    lowPrice: '1',
    closePrice: '1',
    volume: '1',
    volumeQuote: '1',
    openTime: 0,
    closeTime: 1000,
  },
  {
    assetPair: new AssetPair(Assets.BNB, Assets.USDT),
    openPrice: '1',
    highPrice: '1',
    lowPrice: '1',
    closePrice: '1',
    volume: '1',
    volumeQuote: '1',
    openTime: 0,
    closeTime: 1000,
  },
  {
    assetPair: new AssetPair(Assets.BCH, Assets.USDT),
    openPrice: '1',
    highPrice: '1',
    lowPrice: '1',
    closePrice: '1',
    volume: '1',
    volumeQuote: '1',
    openTime: 0,
    closeTime: 1000,
  },
];

export const assetPairPricesResponses: ExchangeResponseAssetPairPriceEntryInterface[][] = [
  [
    {
      assetPair: new AssetPair(Assets.ETH, Assets.USDT),
      timestamp: 0,
      price: '1.000',
    },
    {
      assetPair: new AssetPair(Assets.BTC, Assets.USDT),
      timestamp: 0,
      price: '1.000',
    },
    {
      assetPair: new AssetPair(Assets.BNB, Assets.USDT),
      timestamp: 0,
      price: '1.000',
    },
    {
      assetPair: new AssetPair(Assets.BCH, Assets.USDT),
      timestamp: 0,
      price: '1.000',
    },
  ],
  [
    {
      assetPair: new AssetPair(Assets.ETH, Assets.USDT),
      timestamp: 1000,
      price: '0.500',
    },
    {
      assetPair: new AssetPair(Assets.BTC, Assets.USDT),
      timestamp: 1000,
      price: '2.500',
    },
    {
      assetPair: new AssetPair(Assets.BNB, Assets.USDT),
      timestamp: 1000,
      price: '1.000',
    },
    {
      assetPair: new AssetPair(Assets.BCH, Assets.USDT),
      timestamp: 1000,
      price: '3.000',
    },
  ],
  [
    {
      assetPair: new AssetPair(Assets.ETH, Assets.USDT),
      timestamp: 2000,
      price: '1.500',
    },
    {
      assetPair: new AssetPair(Assets.BTC, Assets.USDT),
      timestamp: 2000,
      price: '0.800',
    },
    {
      assetPair: new AssetPair(Assets.BNB, Assets.USDT),
      timestamp: 2000,
      price: '1.000',
    },
    {
      assetPair: new AssetPair(Assets.BCH, Assets.USDT),
      timestamp: 2000,
      price: '0.200',
    },
  ],
  [
    {
      assetPair: new AssetPair(Assets.ETH, Assets.USDT),
      timestamp: 2000,
      price: '1.000',
    },
    {
      assetPair: new AssetPair(Assets.BTC, Assets.USDT),
      timestamp: 2000,
      price: '1.200',
    },
    {
      assetPair: new AssetPair(Assets.BNB, Assets.USDT),
      timestamp: 2000,
      price: '1.000',
    },
    {
      assetPair: new AssetPair(Assets.BCH, Assets.USDT),
      timestamp: 2000,
      price: '1.300',
    },
  ],
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
      SessionTradingTypeEnum.SPOT,
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
      SessionTradingTypeEnum.SPOT,
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
      SessionTradingTypeEnum.SPOT,
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
      SessionTradingTypeEnum.SPOT,
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

export const createMockTrader = async () => {
  const exchange = ExchangesFactory.get(ExchangesEnum.MOCK);
  exchange.getAssetPairStatistics = jest.fn().mockReturnValue(assetPairStatisticsResponse);
  exchange.getAssetPairPrices = jest.fn().mockReturnValue(assetPairPricesResponses[0]);
  exchange.getAssetPairs = jest.fn().mockReturnValue(assetPairsResponse);
  exchange.getAccountAssets = jest.fn().mockReturnValue(accountAssetsResponse);

  const session = createMockSession(exchange);

  return await Manager.boot(session);
}
