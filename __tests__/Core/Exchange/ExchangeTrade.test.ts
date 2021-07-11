/// <reference types="jest" />

import { AssetPair } from '../../../src/Core/Asset/AssetPair';
import { Assets } from '../../../src/Core/Asset/Assets';
import { ExchangeTrade, ExchangeTradeTypeEnum } from '../../../src/Core/Exchange/ExchangeTrade';
import { Session } from '../../../src/Core/Session/Session';
import { createMockSession } from '../../__fixtures__/SessionFixtures';

describe('ExchangeTrade', () => {
  let session: Session;
  let exchangeTrade: ExchangeTrade;

  beforeEach(() => {
    jest.useFakeTimers();

    jest.spyOn(Date, 'now').mockImplementation(() => 0);

    session = createMockSession();

    exchangeTrade = new ExchangeTrade(
      'MOCK_TRADE',
      Assets.USDT,
      new AssetPair(Assets.USDT, Assets.BTC),
      ExchangeTradeTypeEnum.LONG,
      '15'
    );
    exchangeTrade.buyPrice = 1.0;
    exchangeTrade.buyFeesPercentage = 0.01;
  });

  it('should correctly return the profit', () => {
    exchangeTrade.buyPrice = 5.0;
    exchangeTrade.buyFeesPercentage = 0.01;

    // Long
    expect(exchangeTrade.getCurrentProfitPercentage(5.1)).toBe(1.9999999999999927);
    expect(exchangeTrade.getCurrentProfitPercentage(5.1, true)).toBe(1.9799999999999927);
    expect(exchangeTrade.getCurrentProfitAmount(5.1)).toBe(1.4999999999999947);
    expect(exchangeTrade.getCurrentProfitAmount(5.1, true)).toBe(1.3989999999999947);

    exchangeTrade.sellPrice = 5.1;
    exchangeTrade.sellFeesPercentage = 0.01;

    expect(exchangeTrade.getProfitPercentage()).toBe(1.9999999999999927);
    expect(exchangeTrade.getProfitPercentage(true)).toBe(1.9799999999999927);
    expect(exchangeTrade.getProfitAmount()).toBe(1.4999999999999947);
    expect(exchangeTrade.getProfitAmount(true)).toBe(1.3989999999999947);

    // Short
    exchangeTrade.type = ExchangeTradeTypeEnum.SHORT;

    expect(exchangeTrade.getCurrentProfitPercentage(5.1)).toBe(-1.9999999999999927);
    expect(exchangeTrade.getCurrentProfitPercentage(5.1, true)).toBe(-1.9799999999999927);
    expect(exchangeTrade.getCurrentProfitAmount(5.1)).toBe(-1.4999999999999947);
    expect(exchangeTrade.getCurrentProfitAmount(5.1, true)).toBe(-1.3989999999999947);
    expect(exchangeTrade.getProfitPercentage()).toBe(-1.9999999999999927);
    expect(exchangeTrade.getProfitPercentage(true)).toBe(-1.9799999999999927);
    expect(exchangeTrade.getProfitAmount()).toBe(-1.4999999999999947);
    expect(exchangeTrade.getProfitAmount(true)).toBe(-1.3989999999999947);
  });

  it('should correctly return shouldSell for stopLoss', () => {
    const assetPair = exchangeTrade.assetPair;
    const exchangeAssetPair = session.addAssetPair(assetPair);

    // Tick
    exchangeTrade.prepareData(session);

    expect(exchangeTrade.shouldSell(session, false)).toBe(false);
    expect(exchangeTrade.peakProfitPercentage).toBe(null);
    expect(exchangeTrade.troughProfitPercentage).toBe(null);
    expect(exchangeTrade.triggerStopLossPercentage).toBe(null);
    expect(exchangeTrade.triggerStopLossSellAt).toBe(null);

    // Tick
    jest.spyOn(Date, 'now').mockImplementation(() => 1000);
    exchangeAssetPair.addPriceEntry({
      timestamp: 1000,
      price: '1.005',
    });
    exchangeTrade.prepareData(session);

    expect(exchangeTrade.peakProfitPercentage).toBe(0.49999999999998934);
    expect(exchangeTrade.troughProfitPercentage).toBe(0.49999999999998934);
    expect(exchangeTrade.triggerStopLossPercentage).toBe(-1.5000000000000107);
    expect(exchangeTrade.triggerStopLossSellAt).toBe(null);
    expect(exchangeTrade.shouldSell(session, false)).toBe(false);

    // Tick
    jest.spyOn(Date, 'now').mockImplementation(() => 2000);
    exchangeAssetPair.addPriceEntry({
      timestamp: 2000,
      price: '0.995',
    });
    exchangeTrade.prepareData(session);

    expect(exchangeTrade.peakProfitPercentage).toBe(0.49999999999998934);
    expect(exchangeTrade.troughProfitPercentage).toBe(-0.5000000000000004);
    expect(exchangeTrade.triggerStopLossPercentage).toBe(-1.5000000000000107);
    expect(exchangeTrade.triggerStopLossSellAt).toBe(null);
    expect(exchangeTrade.shouldSell(session, false)).toBe(false);

    // Tick
    jest.spyOn(Date, 'now').mockImplementation(() => 3000);
    exchangeAssetPair.addPriceEntry({
      timestamp: 3000,
      price: '0.975',
    });
    exchangeTrade.prepareData(session);

    expect(exchangeTrade.peakProfitPercentage).toBe(0.49999999999998934);
    expect(exchangeTrade.troughProfitPercentage).toBe(-2.500000000000002);
    expect(exchangeTrade.triggerStopLossPercentage).toBe(-1.5000000000000107);
    expect(exchangeTrade.triggerStopLossSellAt).toBe(3000);
    expect(exchangeTrade.shouldSell(session, false)).toBe(true);
  });

  it('should correctly return shouldSell for takeProfit', () => {
    const assetPair = exchangeTrade.assetPair;
    const exchangeAssetPair = session.addAssetPair(assetPair);

    // Tick
    exchangeTrade.prepareData(session);

    expect(exchangeTrade.shouldSell(session, false)).toBe(false);
    expect(exchangeTrade.peakProfitPercentage).toBe(null);
    expect(exchangeTrade.troughProfitPercentage).toBe(null);
    expect(exchangeTrade.triggerStopLossPercentage).toBe(null);
    expect(exchangeTrade.triggerStopLossSellAt).toBe(null);

    // Tick
    jest.spyOn(Date, 'now').mockImplementation(() => 1000);
    exchangeAssetPair.addPriceEntry({
      timestamp: 1000,
      price: '1.005',
    });
    exchangeTrade.prepareData(session);

    expect(exchangeTrade.peakProfitPercentage).toBe(0.49999999999998934);
    expect(exchangeTrade.troughProfitPercentage).toBe(0.49999999999998934);
    expect(exchangeTrade.triggerStopLossPercentage).toBe(-1.5000000000000107);
    expect(exchangeTrade.triggerStopLossSellAt).toBe(null);
    expect(exchangeTrade.shouldSell(session, false)).toBe(false);

    // Tick
    jest.spyOn(Date, 'now').mockImplementation(() => 2000);
    exchangeAssetPair.addPriceEntry({
      timestamp: 2000,
      price: '0.995',
    });
    exchangeTrade.prepareData(session);

    expect(exchangeTrade.peakProfitPercentage).toBe(0.49999999999998934);
    expect(exchangeTrade.troughProfitPercentage).toBe(-0.5000000000000004);
    expect(exchangeTrade.triggerStopLossPercentage).toBe(-1.5000000000000107);
    expect(exchangeTrade.triggerStopLossSellAt).toBe(null);
    expect(exchangeTrade.shouldSell(session, false)).toBe(false);

    // Tick
    jest.spyOn(Date, 'now').mockImplementation(() => 3000);
    exchangeAssetPair.addPriceEntry({
      timestamp: 3000,
      price: '1.025',
    });
    exchangeTrade.prepareData(session);

    expect(exchangeTrade.peakProfitPercentage).toBe(2.499999999999991);
    expect(exchangeTrade.troughProfitPercentage).toBe(-0.5000000000000004);
    expect(exchangeTrade.triggerStopLossPercentage).toBe(0.4999999999999911);
    expect(exchangeTrade.triggerStopLossSellAt).toBe(null);
    expect(exchangeTrade.shouldSell(session, false)).toBe(false);

    // Tick
    jest.spyOn(Date, 'now').mockImplementation(() => 4000);
    exchangeAssetPair.addPriceEntry({
      timestamp: 4000,
      price: '1.04',
    });
    exchangeTrade.prepareData(session);

    expect(exchangeTrade.peakProfitPercentage).toBe(4.0000000000000036);
    expect(exchangeTrade.troughProfitPercentage).toBe(-0.5000000000000004);
    expect(exchangeTrade.triggerStopLossPercentage).toBe(2.0000000000000036);
    expect(exchangeTrade.triggerStopLossSellAt).toBe(null);
    expect(exchangeTrade.shouldSell(session, false)).toBe(false);

    // Tick
    // Do not trigger the sell yet, because it still hasn't
    // reached the trailingTakeProfitSlipPercentage!
    jest.spyOn(Date, 'now').mockImplementation(() => 5000);
    exchangeAssetPair.addPriceEntry({
      timestamp: 5000,
      price: '1.0398',
    });
    exchangeTrade.prepareData(session);

    expect(exchangeTrade.peakProfitPercentage).toBe(4.0000000000000036);
    expect(exchangeTrade.troughProfitPercentage).toBe(-0.5000000000000004);
    expect(exchangeTrade.triggerStopLossPercentage).toBe(2.0000000000000036);
    expect(exchangeTrade.triggerStopLossSellAt).toBe(null);
    expect(exchangeTrade.shouldSell(session, false)).toBe(false);

    // Tick
    jest.spyOn(Date, 'now').mockImplementation(() => 6000);
    exchangeAssetPair.addPriceEntry({
      timestamp: 6000,
      price: '1.038',
    });
    exchangeTrade.prepareData(session);

    expect(exchangeTrade.peakProfitPercentage).toBe(4.0000000000000036);
    expect(exchangeTrade.troughProfitPercentage).toBe(-0.5000000000000004);
    expect(exchangeTrade.triggerStopLossPercentage).toBe(2.0000000000000036);
    expect(exchangeTrade.triggerStopLossSellAt).toBe(null);
    expect(exchangeTrade.shouldSell(session, false)).toBe(true);
  });
});
