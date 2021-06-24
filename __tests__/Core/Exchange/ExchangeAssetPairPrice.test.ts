/// <reference types="jest" />

import { AssetPair } from '../../../src/Core/Asset/AssetPair';
import { Assets } from '../../../src/Core/Asset/Assets';
import { ExchangeAssetPairPrice } from '../../../src/Core/Exchange/ExchangeAssetPairPrice';
import {
  entries,
  entriesPriceTexts,
} from '../../__fixtures__/ExchangeAssetPairPriceFixtures';

describe('ExchangeAssetPairPrice', () => {
  let exchangeAssetPairPrice: ExchangeAssetPairPrice;

  beforeEach(() => {
    exchangeAssetPairPrice = new ExchangeAssetPairPrice(
      new AssetPair(Assets.USDT, Assets.BTC)
    );
  });

  it('should add a new entry correctly', () => {
    const timestamp = 1000;
    const price = '0.1';

    exchangeAssetPairPrice.addEntry({ timestamp, price });

    const exchangeAssetPairPriceEntries = exchangeAssetPairPrice.getEntries();
    expect(exchangeAssetPairPriceEntries).toHaveLength(1);
    expect(exchangeAssetPairPriceEntries[0].timestamp).toBe(timestamp);
    expect(exchangeAssetPairPriceEntries[0].price).toBe(price);
  });

  it('should process the entries correctly', () => {
    entries.forEach((entry) => {
      exchangeAssetPairPrice.addEntry(entry);
    });

    expect(exchangeAssetPairPrice.getEntries()).toHaveLength(entries.length);
    exchangeAssetPairPrice.processEntries();

    // Check if the correct indexes were found
    expect(exchangeAssetPairPrice.getEntriesPeakIndexes()).toEqual([5, 8, 9, 10, 14, 15]);
    expect(exchangeAssetPairPrice.getEntriesTroughIndexes()).toEqual([7, 12, 13, 17, 18, 19]);

    // Newest entry
    const newestEntry = exchangeAssetPairPrice.getNewestEntry();
    expect(newestEntry.timestamp).toBe(20000);
    expect(newestEntry.price).toBe('1.1');

    jest.spyOn(Date, 'now').mockImplementation(() => newestEntry.timestamp);

    // Last peak entry
    const lastPeakEntry = exchangeAssetPairPrice.getLastPeakEntry();
    expect(lastPeakEntry.timestamp).toBe(15000);
    expect(lastPeakEntry.price).toBe('1.4');

    // Largest peak entry
    const largestPeakEntry = exchangeAssetPairPrice.getLargestPeakEntry();
    expect(largestPeakEntry.timestamp).toBe(10000);
    expect(largestPeakEntry.price).toBe('1.6');

    // Last trough entry
    const lastTroughEntry = exchangeAssetPairPrice.getLastTroughEntry();
    expect(lastTroughEntry.timestamp).toBe(19000);
    expect(lastTroughEntry.price).toBe('0.9');

    // Largest trough entry
    const largestTroughEntry = exchangeAssetPairPrice.getLargestTroughEntry();
    expect(largestTroughEntry.timestamp).toBe(7000);
    expect(largestTroughEntry.price).toBe('0.8');
  });

  it('should return the correct peak if last item is a peak', () => {
    entries.forEach((entry) => {
      exchangeAssetPairPrice.addEntry(entry);
    });

    const timestamp = 21000;
    const price = '2.0';

    exchangeAssetPairPrice.addEntry({ timestamp, price });
    exchangeAssetPairPrice.processEntries();

    // Last peak entry
    const lastPeakEntry = exchangeAssetPairPrice.getLastPeakEntry();
    expect(lastPeakEntry.timestamp).toBe(timestamp);
    expect(lastPeakEntry.price).toBe(price);
  });

  it('should return the correct trough if last item is a trough', () => {
    entries.forEach((entry) => {
      exchangeAssetPairPrice.addEntry(entry);
    });

    const timestamp = 21000;
    const price = '0.1';

    exchangeAssetPairPrice.addEntry({ timestamp, price });
    exchangeAssetPairPrice.processEntries();

    // Last trough entry
    const lastTroughEntry = exchangeAssetPairPrice.getLastTroughEntry();
    expect(lastTroughEntry.timestamp).toBe(timestamp);
    expect(lastTroughEntry.price).toBe(price);
  });

  it('should process and return the price text correctly', () => {
    entries.forEach((entry, index) => {
      exchangeAssetPairPrice.addEntry(entry);
      exchangeAssetPairPrice.processEntries();

      const newestEntry = exchangeAssetPairPrice.getNewestEntry();

      jest.spyOn(Date, 'now').mockImplementation(() => newestEntry.timestamp);

      const priceText = exchangeAssetPairPrice.getPriceText();

      expect(priceText).toBe(entriesPriceTexts[index]);
    });
  });

  it('should cleanup the entries correctly', () => {
    entries.forEach((entry) => {
      exchangeAssetPairPrice.addEntry(entry);
    });

    expect(exchangeAssetPairPrice.getEntries()).toHaveLength(entries.length);
    exchangeAssetPairPrice.cleanupEntries(0.5);
    expect(exchangeAssetPairPrice.getEntries()).toHaveLength(10);

    exchangeAssetPairPrice.addEntry({ timestamp: 21000, price: '1.5' });
    exchangeAssetPairPrice.cleanupEntries(0.5);
    expect(exchangeAssetPairPrice.getEntries()).toHaveLength(5);
  });
});
