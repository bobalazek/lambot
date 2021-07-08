import { AssetPair } from '../../src/Core/Asset/AssetPair';
import { Assets } from '../../src/Core/Asset/Assets';
import { Exchange } from '../../src/Core/Exchange/Exchange';
import { ExchangeOrderTypeEnum } from '../../src/Core/Exchange/ExchangeOrder';
import { ExchangeTrade, ExchangeTradeStatusEnum, ExchangeTradeTypeEnum } from '../../src/Core/Exchange/ExchangeTrade';
import { Session, SessionTradingTypeEnum } from '../../src/Core/Session/Session';
import { SessionConfig } from '../../src/Core/Session/SessionConfig';
import { Strategy } from '../../src/Core/Strategy/Strategy';

const exchangeTrades: ExchangeTrade[] = [];
[
  {
    status: ExchangeTradeStatusEnum.OPEN,
    buyPrice: 0.8,
    buyFeesPercentage: 0.01,
    sellPrice: null,
    sellFeesPercentage: null,
  },
  {
    status: ExchangeTradeStatusEnum.OPEN,
    buyPrice: 0.9,
    buyFeesPercentage: 0.01,
    sellPrice: null,
    sellFeesPercentage: null,
  },
  {
    status: ExchangeTradeStatusEnum.OPEN,
    buyPrice: 1.1,
    buyFeesPercentage: 0.01,
    sellPrice: 1.4,
    sellFeesPercentage: 0.01,
  },
  {
    status: ExchangeTradeStatusEnum.CLOSED,
    buyPrice: 1,
    buyFeesPercentage: 0.01,
    sellPrice: 0.9,
    sellFeesPercentage: 0.01,
  },
  {
    status: ExchangeTradeStatusEnum.CLOSED,
    buyPrice: 1,
    buyFeesPercentage: 0.01,
    sellPrice: 0.8,
    sellFeesPercentage: 0.01,
  },
].forEach((object) => {
  const exchangeTrade = new ExchangeTrade(
    'testTrade1',
    Assets.USDT,
    new AssetPair(Assets.BTC, Assets.USDT),
    ExchangeTradeTypeEnum.LONG,
    object.status
  );

  if (object.buyPrice) {
    exchangeTrade.buyPrice = object.buyPrice;
  }
  if (object.buyFeesPercentage) {
    exchangeTrade.buyFeesPercentage = object.buyFeesPercentage;
  }
  if (object.sellPrice) {
    exchangeTrade.sellPrice = object.sellPrice;
  }
  if (object.sellFeesPercentage) {
    exchangeTrade.sellFeesPercentage = object.sellFeesPercentage;
  }

  exchangeTrades.push(exchangeTrade);
});

export const createMockSession = (exchange: Exchange) => {
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
      takeProfitPercentage: 2,
      trailingTakeProfitEnabled: true,
      trailingTakeProfitSlipPercentage: 0.1,
      stopLossEnabled: true,
      stopLossPercentage: 2,
      stopLossTimeoutSeconds: 0,
      trailingStopLossEnabled: true,
      trailingStopLossPercentage: 2,
    }),
    [
      SessionTradingTypeEnum.SPOT,
    ],
    ExchangeOrderTypeEnum.MARKET
  );
}


export {
  exchangeTrades,
};
