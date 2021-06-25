import { Assets } from '../../src/Core/Asset/Assets';
import { ExchangeResponseAccountAssetInterface } from '../../src/Core/Exchange/Response/ExchangeResponseAccountAsset';
import { ExchangeResponseAssetPairInterface } from '../../src/Core/Exchange/Response/ExchangeResponseAssetPair';
import { ExchangeResponseAssetPairPriceEntryInterface } from '../../src/Core/Exchange/Response/ExchangeResponseAssetPairPriceEntry';
import { SessionTradingTypeEnum } from '../../src/Core/Session/Session';

export const assetPairPricesResponses: ExchangeResponseAssetPairPriceEntryInterface[][] = [
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
