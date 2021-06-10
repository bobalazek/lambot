/// <reference types="jest" />

import { ExchangeAssetPrice, ExchangeAssetPriceEntryTypeEnum } from '../../../src/Core/Exchange/ExchangeAssetPrice';

describe('ExchangePosition', () => {
  let exchangeAssetPrice: ExchangeAssetPrice;

  beforeAll(() => {
    exchangeAssetPrice = new ExchangeAssetPrice()
  });

  it('should add a new entry correctly', () => {
    const timestamp = +new Date();
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

  it('should processes and returns the entries correctly', () => {
    const entries = [
      {timestamp: 1000, price: '1.0'},
      {timestamp: 1001, price: '1.2'},
      {timestamp: 1002, price: '1.4'},
      {timestamp: 1003, price: '1.5'},
      {timestamp: 1004, price: '1.2'},
      {timestamp: 1005, price: '0.8'},
      {timestamp: 1006, price: '1.6'},
      {timestamp: 1007, price: '1.2'},
      {timestamp: 1008, price: '1.0'},
      {timestamp: 1009, price: '1.0'},
      {timestamp: 1010, price: '1.4'},
      {timestamp: 1011, price: '1.4'},
      {timestamp: 1012, price: '1.2'},
      {timestamp: 1013, price: '0.9'},
      {timestamp: 1014, price: '0.9'},
      {timestamp: 1015, price: '1.1'},
    ];

    entries.forEach((entry) => {
      exchangeAssetPrice.addEntry(entry);
    });

    exchangeAssetPrice.processEntries();

    // Newest entry
    const newestEntry = exchangeAssetPrice.getEntry(ExchangeAssetPriceEntryTypeEnum.NEWEST);
    expect(newestEntry.timestamp).toBe(1015);
    expect(newestEntry.price).toBe('1.1');

    // Last peak entry
    const lastPeakEntry = exchangeAssetPrice.getEntry(ExchangeAssetPriceEntryTypeEnum.LAST_PEAK);
    expect(lastPeakEntry.timestamp).toBe(1011);
    expect(lastPeakEntry.price).toBe('1.4');

    // Last valley entry
    const lastValleyEntry = exchangeAssetPrice.getEntry(ExchangeAssetPriceEntryTypeEnum.LAST_VALLEY);
    expect(lastValleyEntry.timestamp).toBe(1014);
    expect(lastValleyEntry.price).toBe('0.9');
  });
});
