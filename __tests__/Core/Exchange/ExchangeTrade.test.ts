/// <reference types="jest" />

import { AssetPair } from '../../../src/Core/Asset/AssetPair';
import { Assets } from '../../../src/Core/Asset/Assets';
import { ExchangesEnum, ExchangesFactory } from '../../../src/Core/Exchange/ExchangesFactory';
import {
  ExchangeTrade,
  ExchangeTradeStatusEnum,
  ExchangeTradeTypeEnum,
} from '../../../src/Core/Exchange/ExchangeTrade';
import { createMockSession } from '../../__fixtures__/SessionFixtures';

describe('ExchangeTrade', () => {
  let exchangeTrade: ExchangeTrade;

  beforeEach(() => {
    exchangeTrade = new ExchangeTrade(
      'MOCK_TRADE',
      Assets.USDT,
      new AssetPair(Assets.USDT, Assets.BTC),
      ExchangeTradeTypeEnum.LONG,
      ExchangeTradeStatusEnum.OPEN
    );
    exchangeTrade.buyPrice = 1.0;
    exchangeTrade.buyFeesPercentage = 0.01;
  });

  it('should return the correct profit percentage correctly', () => {
    // Long
    expect(exchangeTrade.getCurrentProfitPercentage(1.05)).toBe(5.000000000000004);
    expect(exchangeTrade.getCurrentProfitPercentage(1.05, true)).toBe(3.960396039603964);

    exchangeTrade.sellPrice = 1.05;
    exchangeTrade.sellFeesPercentage = 0.01;

    expect(exchangeTrade.getProfitPercentage()).toBe(5.000000000000004);
    expect(exchangeTrade.getProfitPercentage(true)).toBe(2.9207920792079287);

    // Short
    exchangeTrade.type = ExchangeTradeTypeEnum.SHORT;

    expect(exchangeTrade.getCurrentProfitPercentage(1.05)).toBe(-5.000000000000004);
    expect(exchangeTrade.getCurrentProfitPercentage(1.05, true)).toBe(-3.960396039603964);
    expect(exchangeTrade.getProfitPercentage()).toBe(-5.000000000000004);
    expect(exchangeTrade.getProfitPercentage(true)).toBe(-2.9207920792079287);
  });

  it('should correctly return shouldSell', () => {
    const session = createMockSession(
      ExchangesFactory.get(ExchangesEnum.MOCK)
    );

    const assetPair = exchangeTrade.assetPair;
    const exchangeAssetPair = session.addAssetPair(assetPair);

    // By default, without any relevant data, we should not be able to sell!
    expect(exchangeTrade.shouldSell(session)).toBe(false);

    exchangeTrade.prepareData(session);

    // TODO
  });
});
