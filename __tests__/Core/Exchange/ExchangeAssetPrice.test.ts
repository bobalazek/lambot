/// <reference types="jest" />

import { ExchangeAssetPrice } from '../../../src/Core/Exchange/ExchangeAssetPrice';

const entries = [
  { timestamp: 0, price: '1.0' },
  { timestamp: 1000, price: '1.0' },
  { timestamp: 2000, price: '1.0' },
  { timestamp: 3000, price: '1.2' },
  { timestamp: 4000, price: '1.4' },
  { timestamp: 5000, price: '1.5' },
  { timestamp: 6000, price: '1.2' },
  { timestamp: 7000, price: '0.8' },
  { timestamp: 8000, price: '1.6' },
  { timestamp: 9000, price: '1.6' },
  { timestamp: 10000, price: '1.6' },
  { timestamp: 11000, price: '1.2' },
  { timestamp: 12000, price: '1.0' },
  { timestamp: 13000, price: '1.0' },
  { timestamp: 14000, price: '1.4' },
  { timestamp: 15000, price: '1.4' },
  { timestamp: 16000, price: '1.2' },
  { timestamp: 17000, price: '0.9' },
  { timestamp: 18000, price: '0.9' },
  { timestamp: 19000, price: '0.9' },
  { timestamp: 20000, price: '1.1' },
];

const entriesPriceTexts = [
  '1.0',
  '1.0 🔵',
  '1.0 🔵',
  '1.2 🟢 +20.0%',
  '1.4 🟢 +16.7%',
  '1.5 🟢 +7.14%',
  '1.2 🔴 -20.0% (⛰️ -20.0%; 1s ago)',
  '0.8 🔴 -33.3% (⛰️ -46.7%; 2s ago)',
  '1.6 🟢 +100% (⛰️ we are going up!) (🕳️ +100%; 1s ago)',
  '1.6 🔵 (⛰️ we are going up!) (🕳️ +100%; 2s ago)',
  '1.6 🔵 (⛰️ we are going up!) (🕳️ +100%; 3s ago)',
  '1.2 🔴 -25.0% (⛰️ -25.0%; 1s ago) (🕳️ +50.0%; 4s ago)',
  '1.0 🔴 -16.7% (⛰️ -37.5%; 2s ago) (🕳️ +25.0%; 5s ago)',
  '1.0 🔵 (⛰️ -37.5%; 3s ago) (🕳️ +25.0%; 6s ago)',
  '1.4 🟢 +40.0% (⛰️ -12.5%; 4s ago) (🕳️ +40.0%; 1s ago)',
  '1.4 🔵 (⛰️ -12.5%; 5s ago) (🕳️ +40.0%; 2s ago)',
  '1.2 🔴 -14.3% (⛰️ -14.3%; 1s ago) (🕳️ +20.0%; 3s ago)',
  '0.9 🔴 -25.0% (⛰️ -35.7%; 2s ago) (🕳️ we are going down!)',
  '0.9 🔵 (⛰️ -35.7%; 3s ago) (🕳️ we are going down!)',
  '0.9 🔵 (⛰️ -35.7%; 4s ago) (🕳️ we are going down!)',
  '1.1 🟢 +22.2% (⛰️ -21.4%; 5s ago) (🕳️ +22.2%; 1s ago)',
];

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

      const now = newestEntry.timestamp;

      jest.spyOn(Date, 'now').mockImplementation(() => now);

      const priceText = exchangeAssetPrice.getPriceText(now);

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
