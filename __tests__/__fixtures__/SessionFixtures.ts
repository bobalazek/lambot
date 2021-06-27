import { AssetPair } from '../../src/Core/Asset/AssetPair';
import { Assets } from '../../src/Core/Asset/Assets';
import { ExchangeTrade, ExchangeTradeStatusEnum, ExchangeTradeTypeEnum } from '../../src/Core/Exchange/ExchangeTrade';

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
})

export {
  exchangeTrades,
};
