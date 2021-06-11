/// <reference types="jest" />

import { ExchangeAssetPrice } from '../../../src/Core/Exchange/ExchangeAssetPrice';

const entries = [
  { timestamp: 0, price: '1.0' },
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
  { timestamp: 16000, price: '0.9' },
  { timestamp: 17000, price: '1.1' },
];

const entriesPriceTexts = [
  '1.0',
  '1.0',
  '1.2 (🕳️ +20.0%; 1s ago)',
  '1.4 (🕳️ +40.0%; 2s ago)',
  '1.5 (🕳️ +50.0%; 3s ago)',
  '1.2 (⛰️ -20.0%; 1s ago) (🕳️ +20.0%; 4s ago)',
  '0.8 (🕳️ -20.0%; 5s ago)',
  '1.6 (🕳️ +100%; 1s ago)',
  '1.2 (⛰️ -25.0%; 1s ago)',
  '1.0 (🕳️ -16.7%; 1s ago)',
  '1.0 (🕳️ we are going down!)',
  '1.4 (⛰️ 40.0%; 1s ago) (🕳️ +40.0%; 1s ago)',
  '1.4 (⛰️ we are going up!) (🕳️ +40.0%; 2s ago)',
  '1.2 (⛰️ -14.3%; 1s ago) (🕳️ +20.0%; 3s ago)',
  '0.9 (⛰️ -35.7%; 2s ago) (🕳️ -10.0%; 4s ago)',
  '0.9 (⛰️ -35.7%; 3s ago) (🕳️ we are going down!)',
  '0.9 (⛰️ -35.7%; 4s ago) (🕳️ we are going down!)',
  '1.1 (⛰️ -21.4%; 5s ago) (🕳️ +22.2%; 1s ago)',
];

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

  it('should process and return the entry types (newest/last peak/trough) correctly', () => {
    entries.forEach((entry) => {
      exchangeAssetPrice.addEntry(entry);
    });

    expect(exchangeAssetPrice.getEntries()).toHaveLength(entries.length);

    exchangeAssetPrice.processEntries();

    // Newest entry
    const newestEntry = exchangeAssetPrice.getNewestEntry();
    expect(newestEntry.timestamp).toBe(17000);
    expect(newestEntry.price).toBe('1.1');

    // Last peak entry
    const lastPeakEntry = exchangeAssetPrice.getLastPeakEntry();
    expect(lastPeakEntry.timestamp).toBe(12000);
    expect(lastPeakEntry.price).toBe('1.4');

    // Last trough entry
    const lastTroughEntry = exchangeAssetPrice.getLastTroughEntry();
    expect(lastTroughEntry.timestamp).toBe(16000);
    expect(lastTroughEntry.price).toBe('0.9');
  });

  it('should process and return the price text correctly', () => {
    entries.forEach((entry, index) => {
      exchangeAssetPrice.addEntry(entry);
      exchangeAssetPrice.processEntries();

      const newestEntry = exchangeAssetPrice.getNewestEntry();

      const priceText = exchangeAssetPrice.getPriceText(newestEntry.timestamp);

      expect(priceText).toBe(entriesPriceTexts[index]);
    });
  });

  it('should cleanup the entries correctly', () => {
    entries.forEach((entry) => {
      exchangeAssetPrice.addEntry(entry);
    });

    expect(exchangeAssetPrice.getEntries()).toHaveLength(entries.length);

    exchangeAssetPrice.cleanupEntries(0.5);

    expect(exchangeAssetPrice.getEntries()).toHaveLength(9);

    exchangeAssetPrice.addEntry({ timestamp: 18000, price: '1.5' });

    exchangeAssetPrice.cleanupEntries(0.5);

    expect(exchangeAssetPrice.getEntries()).toHaveLength(5);
  });
});
