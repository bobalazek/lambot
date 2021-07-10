/// <reference types="jest" />

import { AssetPair } from '../../../src/Core/Asset/AssetPair';
import { Assets } from '../../../src/Core/Asset/Assets';
import { ExchangeAssetPair } from '../../../src/Core/Exchange/ExchangeAssetPair';
import { ExchangeTrade, ExchangeTradeTypeEnum } from '../../../src/Core/Exchange/ExchangeTrade';
import { entries, entriesPriceTexts, } from '../../__fixtures__/ExchangeAssetPairPriceFixtures';
import { createMockSession } from '../../__fixtures__/SessionFixtures';

describe('ExchangeAssetPair', () => {
  let exchangeAssetPair: ExchangeAssetPair;

  beforeEach(() => {
    exchangeAssetPair = new ExchangeAssetPair(
      new AssetPair(Assets.USDT, Assets.BTC)
    );
  });

  it('should add a new entry correctly', () => {
    const timestamp = 1000;
    const price = '0.1';

    exchangeAssetPair.addPriceEntry({ timestamp, price });

    const exchangeAssetPairPriceEntries = exchangeAssetPair.getPriceEntries();
    expect(exchangeAssetPairPriceEntries).toHaveLength(1);
    expect(exchangeAssetPairPriceEntries[0].timestamp).toBe(timestamp);
    expect(exchangeAssetPairPriceEntries[0].price).toBe(price);
  });

  it('should process the entries correctly', () => {
    entries.forEach((entry) => {
      exchangeAssetPair.addPriceEntry(entry);
    });

    expect(exchangeAssetPair.getPriceEntries()).toHaveLength(entries.length);
    exchangeAssetPair.processPriceEntries();

    // Check if the correct indexes were found
    expect(exchangeAssetPair.getPriceEntriesPeakIndexes()).toEqual([5, 8, 9, 10, 14, 15]);
    expect(exchangeAssetPair.getPriceEntriesTroughIndexes()).toEqual([7, 12, 13, 17, 18, 19]);

    // Newest entry
    const newestEntry = exchangeAssetPair.getNewestPriceEntry();
    expect(newestEntry.timestamp).toBe(20000);
    expect(newestEntry.price).toBe('1.1');

    jest.spyOn(Date, 'now').mockImplementation(() => newestEntry.timestamp);

    // Last peak entry
    const lastPeakEntry = exchangeAssetPair.getLastPeakPriceEntry();
    expect(lastPeakEntry.timestamp).toBe(15000);
    expect(lastPeakEntry.price).toBe('1.4');

    // Largest peak entry
    const largestPeakEntry = exchangeAssetPair.getLargestPeakPriceEntry();
    expect(largestPeakEntry.timestamp).toBe(10000);
    expect(largestPeakEntry.price).toBe('1.6');

    // Last trough entry
    const lastTroughEntry = exchangeAssetPair.getLastTroughPriceEntry();
    expect(lastTroughEntry.timestamp).toBe(19000);
    expect(lastTroughEntry.price).toBe('0.9');

    // Largest trough entry
    const largestTroughEntry = exchangeAssetPair.getLargestTroughPriceEntry();
    expect(largestTroughEntry.timestamp).toBe(7000);
    expect(largestTroughEntry.price).toBe('0.8');
  });

  it('should return the correct peak if last item is a peak', () => {
    entries.forEach((entry) => {
      exchangeAssetPair.addPriceEntry(entry);
    });

    const timestamp = 21000;
    const price = '2.0';

    exchangeAssetPair.addPriceEntry({ timestamp, price });
    exchangeAssetPair.processPriceEntries();

    // Last peak entry
    const lastPeakEntry = exchangeAssetPair.getLastPeakPriceEntry();
    expect(lastPeakEntry.timestamp).toBe(timestamp);
    expect(lastPeakEntry.price).toBe(price);
  });

  it('should return the correct trough if last item is a trough', () => {
    entries.forEach((entry) => {
      exchangeAssetPair.addPriceEntry(entry);
    });

    const timestamp = 21000;
    const price = '0.1';

    exchangeAssetPair.addPriceEntry({ timestamp, price });
    exchangeAssetPair.processPriceEntries();

    // Last trough entry
    const lastTroughEntry = exchangeAssetPair.getLastTroughPriceEntry();
    expect(lastTroughEntry.timestamp).toBe(timestamp);
    expect(lastTroughEntry.price).toBe(price);
  });

  it('should process and return the price text correctly', () => {
    entries.forEach((entry, index) => {
      exchangeAssetPair.addPriceEntry(entry);
      exchangeAssetPair.processPriceEntries();

      const newestEntry = exchangeAssetPair.getNewestPriceEntry();

      jest.spyOn(Date, 'now').mockImplementation(() => newestEntry.timestamp);

      const priceText = exchangeAssetPair.getPriceText();

      expect(priceText).toBe(entriesPriceTexts[index]);
    });
  });

  it('should cleanup the entries correctly', () => {
    entries.forEach((entry) => {
      exchangeAssetPair.addPriceEntry(entry);
    });

    expect(exchangeAssetPair.getPriceEntries()).toHaveLength(entries.length);
    exchangeAssetPair.cleanupPriceEntries(0.5);
    expect(exchangeAssetPair.getPriceEntries()).toHaveLength(10);

    exchangeAssetPair.addPriceEntry({ timestamp: 21000, price: '1.5' });
    exchangeAssetPair.cleanupPriceEntries(0.5);
    expect(exchangeAssetPair.getPriceEntries()).toHaveLength(5);
  });

  it('should correctly return shouldBuy', () => {
    const session = createMockSession();

    // Without any trades, it should work!
    expect(exchangeAssetPair.shouldBuy(session)).toBe(true);

    session.trades.push(new ExchangeTrade(
      'MOCK_TRADE_ID',
      Assets.USDT,
      new AssetPair(Assets.USDT, Assets.BTC),
      ExchangeTradeTypeEnum.LONG,
      '1'
    ));

    // Now that we got one trade already, we do not allow any more for this pair!
    expect(exchangeAssetPair.shouldBuy(session)).toBe(false);

    // Reset the trades, so we can check if allow 3 unique asset pairs (as specified by the session strategy config)
    session.trades = [];

    session.trades.push(new ExchangeTrade(
      'MOCK_TRADE_ID_2',
      Assets.USDT,
      new AssetPair(Assets.USDT, Assets.ETH),
      ExchangeTradeTypeEnum.LONG,
      '1'
    ));

    expect(exchangeAssetPair.shouldBuy(session)).toBe(true);

    session.trades.push(new ExchangeTrade(
      'MOCK_TRADE_ID_3',
      Assets.USDT,
      new AssetPair(Assets.USDT, Assets.BCH),
      ExchangeTradeTypeEnum.LONG,
      '1'
    ));

    expect(exchangeAssetPair.shouldBuy(session)).toBe(true);

    session.trades.push(new ExchangeTrade(
      'MOCK_TRADE_ID_4',
      Assets.USDT,
      new AssetPair(Assets.USDT, Assets.ETC),
      ExchangeTradeTypeEnum.LONG,
      '1'
    ));

    expect(exchangeAssetPair.shouldBuy(session)).toBe(false);
  });
});
