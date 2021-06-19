/// <reference types="jest" />

import { ExchangeAssetPrice } from '../../../src/Core/Exchange/ExchangeAssetPrice';
import {
  entries,
  entriesPriceTexts,
} from '../../__fixtures__/ExchangeAssetPriceFixtures';

describe('ExchangeAssetPrice', () => {
  let exchangeAssetPrice: ExchangeAssetPrice;

  beforeEach(() => {
    exchangeAssetPrice = new ExchangeAssetPrice();
  });

  it('should add a new entry correctly', () => {
    const timestamp = 1000;
    const price = '0.1';

    exchangeAssetPrice.addEntry({ timestamp, price });

    const exchangeAssetPriceEntries = exchangeAssetPrice.getEntries();
    expect(exchangeAssetPriceEntries).toHaveLength(1);
    expect(exchangeAssetPriceEntries[0].timestamp).toBe(timestamp);
    expect(exchangeAssetPriceEntries[0].price).toBe(price);
  });

  it('should process the entries correctly', () => {
    entries.forEach((entry) => {
      exchangeAssetPrice.addEntry(entry);
    });

    expect(exchangeAssetPrice.getEntries()).toHaveLength(entries.length);
    exchangeAssetPrice.processEntries();

    // Check if the correct indexes were found
    expect(exchangeAssetPrice.getEntriesPeakIndexes()).toEqual([5, 8, 9, 10, 14, 15]);
    expect(exchangeAssetPrice.getEntriesTroughIndexes()).toEqual([7, 12, 13, 17, 18, 19]);

    // Newest entry
    const newestEntry = exchangeAssetPrice.getNewestEntry();
    expect(newestEntry.timestamp).toBe(20000);
    expect(newestEntry.price).toBe('1.1');

    jest.spyOn(Date, 'now').mockImplementation(() => newestEntry.timestamp);

    // Last peak entry
    const lastPeakEntry = exchangeAssetPrice.getLastPeakEntry();
    expect(lastPeakEntry.timestamp).toBe(15000);
    expect(lastPeakEntry.price).toBe('1.4');

    // Largest peak entry
    const largestPeakEntry = exchangeAssetPrice.getLargestPeakEntry();
    expect(largestPeakEntry.timestamp).toBe(10000);
    expect(largestPeakEntry.price).toBe('1.6');

    // Last trough entry
    const lastTroughEntry = exchangeAssetPrice.getLastTroughEntry();
    expect(lastTroughEntry.timestamp).toBe(19000);
    expect(lastTroughEntry.price).toBe('0.9');

    // Largest trough entry
    const largestTroughEntry = exchangeAssetPrice.getLargestTroughEntry();
    expect(largestTroughEntry.timestamp).toBe(7000);
    expect(largestTroughEntry.price).toBe('0.8');
  });

  it('should return the correct peak if last item is a peak', () => {
    entries.forEach((entry) => {
      exchangeAssetPrice.addEntry(entry);
    });

    const timestamp = 21000;
    const price = '2.0';

    exchangeAssetPrice.addEntry({ timestamp, price });
    exchangeAssetPrice.processEntries();

    // Last peak entry
    const lastPeakEntry = exchangeAssetPrice.getLastPeakEntry();
    expect(lastPeakEntry.timestamp).toBe(timestamp);
    expect(lastPeakEntry.price).toBe(price);
  });

  it('should return the correct trough if last item is a trough', () => {
    entries.forEach((entry) => {
      exchangeAssetPrice.addEntry(entry);
    });

    const timestamp = 21000;
    const price = '0.1';

    exchangeAssetPrice.addEntry({ timestamp, price });
    exchangeAssetPrice.processEntries();

    // Last trough entry
    const lastTroughEntry = exchangeAssetPrice.getLastTroughEntry();
    expect(lastTroughEntry.timestamp).toBe(timestamp);
    expect(lastTroughEntry.price).toBe(price);
  });

  it('should process and return the price text correctly', () => {
    entries.forEach((entry, index) => {
      exchangeAssetPrice.addEntry(entry);
      exchangeAssetPrice.processEntries();

      const newestEntry = exchangeAssetPrice.getNewestEntry();

      jest.spyOn(Date, 'now').mockImplementation(() => newestEntry.timestamp);

      const priceText = exchangeAssetPrice.getPriceText();

      expect(priceText).toBe(entriesPriceTexts[index]);
    });
  });

  it('should cleanup the entries correctly', () => {
    entries.forEach((entry) => {
      exchangeAssetPrice.addEntry(entry);
    });

    expect(exchangeAssetPrice.getEntries()).toHaveLength(entries.length);
    exchangeAssetPrice.cleanupEntries(0.5);
    expect(exchangeAssetPrice.getEntries()).toHaveLength(10);

    exchangeAssetPrice.addEntry({ timestamp: 21000, price: '1.5' });
    exchangeAssetPrice.cleanupEntries(0.5);
    expect(exchangeAssetPrice.getEntries()).toHaveLength(5);
  });
});
