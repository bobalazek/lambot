/// <reference types="jest" />

import { ExchangeAssetPrice } from '../../../src/Core/Exchange/ExchangeAssetPrice';

describe('ExchangePosition', () => {
  let exchangeAssetPrice: ExchangeAssetPrice;

  beforeEach(() => {
    exchangeAssetPrice = new ExchangeAssetPrice();
  });

  it('should add a new entry correctly', () => {
    const timestamp = 1000;
    const price = '0.1';

    exchangeAssetPrice.addEntry({
      timestamp,
      price,
    });

    const exchangeAssetPriceEntries = exchangeAssetPrice.getEntries();

    expect(exchangeAssetPriceEntries).toHaveLength(1);
    expect(exchangeAssetPriceEntries[0].timestamp).toBe(timestamp);
    expect(exchangeAssetPriceEntries[0].price).toBe(price);
  });

  it('should process and return the entry times (newest, last peak & trough) correctly', () => {
    const entries = [
      { timestamp: 1000, price: '1.0' },
      { timestamp: 2000, price: '1.2' },
      { timestamp: 3000, price: '1.4' },
      { timestamp: 4000, price: '1.5' },
      { timestamp: 5000, price: '1.2' },
      { timestamp: 6000, price: '0.8' },
      { timestamp: 7000, price: '1.6' },
      { timestamp: 8000, price: '1.2' },
      { timestamp: 9000, price: '1.0' },
      { timestamp: 10000, price: '1.0' },
      { timestamp: 11000, price: '1.4' },
      { timestamp: 12000, price: '1.4' },
      { timestamp: 13000, price: '1.2' },
      { timestamp: 14000, price: '0.9' },
      { timestamp: 15000, price: '0.9' },
      { timestamp: 16000, price: '1.1' },
    ];

    entries.forEach((entry) => {
      exchangeAssetPrice.addEntry(entry);
    });

    expect(exchangeAssetPrice.getEntries()).toHaveLength(entries.length);

    exchangeAssetPrice.processEntries();

    // Newest entry
    const newestEntry = exchangeAssetPrice.getNewestEntry();
    expect(newestEntry.timestamp).toBe(16000);
    expect(newestEntry.price).toBe('1.1');

    // Last peak entry
    const lastPeakEntry = exchangeAssetPrice.getLastPeakEntry();
    expect(lastPeakEntry.timestamp).toBe(12000);
    expect(lastPeakEntry.price).toBe('1.4');

    // Last trough entry
    const lastTroughEntry = exchangeAssetPrice.getLastTroughEntry();
    expect(lastTroughEntry.timestamp).toBe(15000);
    expect(lastTroughEntry.price).toBe('0.9');
  });

  it('should cleanup the entries correctly', () => {
    const entries = [
      { timestamp: 1000, price: '1.0' },
      { timestamp: 2000, price: '1.2' },
      { timestamp: 3000, price: '1.4' },
      { timestamp: 4000, price: '1.5' },
      { timestamp: 5000, price: '1.2' },
      { timestamp: 6000, price: '0.8' },
      { timestamp: 7000, price: '1.6' },
    ];

    entries.forEach((entry) => {
      exchangeAssetPrice.addEntry(entry);
    });

    expect(exchangeAssetPrice.getEntries()).toHaveLength(entries.length);

    exchangeAssetPrice.cleanupEntries(0.5);

    expect(exchangeAssetPrice.getEntries()).toHaveLength(3);

    exchangeAssetPrice.addEntry({ timestamp: 8000, price: '1.5' });

    exchangeAssetPrice.cleanupEntries(0.5);

    expect(exchangeAssetPrice.getEntries()).toHaveLength(2);
  });
});
