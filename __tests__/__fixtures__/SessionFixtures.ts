import { AssetPair } from '../../src/Core/Asset/AssetPair';
import { Assets } from '../../src/Core/Asset/Assets';
import { Exchange } from '../../src/Core/Exchange/Exchange';
import { ExchangeFee, ExchangeFeeTypeEnum } from '../../src/Core/Exchange/ExchangeFee';
import { ExchangeOrderTypeEnum } from '../../src/Core/Exchange/ExchangeOrderType';
import { ExchangesEnum, ExchangesFactory } from '../../src/Core/Exchange/ExchangesFactory';
import { ExchangeTrade, ExchangeTradeStatusEnum, ExchangeTradeTypeEnum } from '../../src/Core/Exchange/ExchangeTrade';
import { Session } from '../../src/Core/Session/Session';
import { SessionConfig } from '../../src/Core/Session/SessionConfig';
import { SessionTradingTypeEnum } from '../../src/Core/Session/SessionTradingType';
import { Strategy } from '../../src/Core/Strategy/Strategy';

const exchangeTrades: ExchangeTrade[] = [];
[
  {
    status: ExchangeTradeStatusEnum.OPEN,
    entryPrice: 0.8,
    entryFeesPercentage: 0.01,
    entryAt: 0,
    exitPrice: null,
    exitFeesPercentage: null,
    exitAt: null,
  },
  {
    status: ExchangeTradeStatusEnum.OPEN,
    entryPrice: 0.9,
    entryFeesPercentage: 0.01,
    entryAt: 0,
    exitPrice: null,
    exitFeesPercentage: null,
    exitAt: null,
  },
  {
    status: ExchangeTradeStatusEnum.OPEN,
    entryPrice: 1.1,
    entryFeesPercentage: 0.01,
    entryAt: 0,
    exitPrice: 1.4,
    exitFeesPercentage: 0.01,
    exitAt: 1000,
  },
  {
    status: ExchangeTradeStatusEnum.CLOSED,
    entryPrice: 1,
    entryFeesPercentage: 0.01,
    entryAt: 0,
    exitPrice: 0.9,
    exitFeesPercentage: 0.01,
    exitAt: 1000,
  },
  {
    status: ExchangeTradeStatusEnum.CLOSED,
    entryPrice: 1,
    entryFeesPercentage: 0.01,
    entryAt: 0,
    exitPrice: 0.8,
    exitFeesPercentage: 0.01,
    exitAt: 1000,
  },
].forEach((object, index) => {
  const exchangeTrade = new ExchangeTrade(
    'MOCK_TRADE_' + (index + 1),
    new AssetPair(Assets.BTC, Assets.USDT),
    ExchangeTradeTypeEnum.LONG,
    '15',
    '1',
    Date.now(),
    object.status
  );

  if (object.entryPrice) {
    exchangeTrade.entryPrice = object.entryPrice;
  }

  if (object.entryFeesPercentage) {
    exchangeTrade.entryFees = [
      new ExchangeFee(ExchangeFeeTypeEnum.PERCENTAGE, object.entryFeesPercentage),
    ];
  }

  if (object.entryAt !== null) {
    exchangeTrade.entryAt = object.entryAt;
  }

  if (object.exitPrice) {
    exchangeTrade.exitPrice = object.exitPrice;
  }

  if (object.exitFeesPercentage) {
    exchangeTrade.exitFees = [
      new ExchangeFee(ExchangeFeeTypeEnum.PERCENTAGE, object.exitFeesPercentage),
    ];
  }

  if (object.exitAt !== null) {
    exchangeTrade.exitAt = object.exitAt;
  }

  exchangeTrades.push(exchangeTrade);
});

export const createMockSession = (exchange: Exchange = ExchangesFactory.get(ExchangesEnum.MOCK)) => {
  const baseAsset = Assets.USDT;

  return new Session(
    'MOCK_SESSION',
    exchange,
    new SessionConfig({
      memoryUsageMonitoringIntervalSeconds: 0,
      webServerApiEnabled: false,
    }),
    baseAsset,
    [
      new AssetPair(Assets.ETH, baseAsset),
      new AssetPair(Assets.BTC, baseAsset),
      new AssetPair(Assets.BNB, baseAsset),
      new AssetPair(Assets.BCH, baseAsset),
    ],
    new Strategy('MOCK_STRATEGY', {
      tradeAmount: '15',
      maximumOpenTrades: 3,
      maximumOpenTradesPerAssetPair: 1,
      minimumDailyVolume: -1,
      takeProfitPercentage: 2,
      trailingTakeProfitEnabled: true,
      trailingTakeProfitSlipPercentage: 0.1,
      stopLossEnabled: true,
      stopLossPercentage: 2,
      stopLossTimeoutSeconds: 0,
      trailingStopLossEnabled: true,
      trailingStopLossPercentage: 2,
    }),
    {
      buy: ExchangeOrderTypeEnum.MARKET,
      sell: ExchangeOrderTypeEnum.MARKET,
    },
    [
      SessionTradingTypeEnum.SPOT,
    ]
  );
}


export {
  exchangeTrades,
};
