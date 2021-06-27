/// <reference types="jest" />

import { AssetPair } from '../../../src/Core/Asset/AssetPair';
import { Assets } from '../../../src/Core/Asset/Assets';
import {
  ExchangeTrade,
  ExchangeTradeStatusEnum,
  ExchangeTradeTypeEnum,
} from '../../../src/Core/Exchange/ExchangeTrade';

describe('ExchangeTrade', () => {
  it('should return the correct profit percentage correctly', () => {
    // Long
    const exchangeTrade = new ExchangeTrade(
      'testTrade123',
      Assets.USDT,
      new AssetPair(Assets.BTC, Assets.USDT),
      ExchangeTradeTypeEnum.LONG,
      ExchangeTradeStatusEnum.OPEN
    );
    exchangeTrade.buyPrice = 1.0;
    exchangeTrade.buyFeesPercentage = 0.01;

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
});
