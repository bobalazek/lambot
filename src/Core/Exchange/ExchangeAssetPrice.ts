import chalk from 'chalk';

import { calculatePercentage } from '../../Utils/Helpers';

export interface ExchangeAssetPriceInterface {
  getEntries(): ExchangeAssetPriceEntryInterface[];
  getEntry(type: ExchangeAssetPriceEntryTypeEnum): ExchangeAssetPriceEntryInterface;
  addEntry(entry: ExchangeAssetPriceEntryInterface): ExchangeAssetPriceEntryInterface;
  getChanges(): ExchangeAssetPriceChangeMap;
  processEntries(): void;
  getPriceText(time: number): string;
}

export interface ExchangeAssetPriceChangeInterface {
  absolutePricePercentage: number; // absolute to the currently newest/base entry - ((price - basePrice) / basePrice) * 100
  relativePricePercentage: number; // relative to the previous entry - ((price - prevPrice) / prevPrice) * 100
  basePrice: number;
  price: number;
  prevPrice: number;
}

export interface ExchangeAssetPriceEntryInterface {
  timestamp: number;
  price: string;
}

export type ExchangeAssetPricesMap = Map<string, ExchangeAssetPriceInterface>;

export type ExchangeAssetPriceChangeMap = Map<string, ExchangeAssetPriceChangeInterface>;

export enum ExchangeAssetPriceEntryTypeEnum {
  NEWEST,
  LAST_PEAK,
  LAST_DIP,
}

export interface ExchangeAssetPriceWithSymbolEntryInterface extends ExchangeAssetPriceEntryInterface {
  symbol: string;
}

export class ExchangeAssetPrice implements ExchangeAssetPriceInterface {
  private _entries: ExchangeAssetPriceEntryInterface[];
  private _changes: ExchangeAssetPriceChangeMap;
  private _lastPeakEntryIndex: number;
  private _lastDipEntryIndex: number;

  constructor() {
    this._entries = [];
    this._lastPeakEntryIndex = -1;
    this._lastDipEntryIndex = -1;
  }

  getEntries(): ExchangeAssetPriceEntryInterface[] {
    return this._entries;
  }

  getEntry(type: ExchangeAssetPriceEntryTypeEnum): ExchangeAssetPriceEntryInterface {
    if (this._entries.length === 0) {
      return null;
    }

    if (type === ExchangeAssetPriceEntryTypeEnum.NEWEST) {
      return this._entries[this._entries.length - 1];
    } else if (type === ExchangeAssetPriceEntryTypeEnum.LAST_PEAK) {
      return this._lastPeakEntryIndex !== -1
        ? this._entries[this._lastPeakEntryIndex]
        : null;
    } else if (type === ExchangeAssetPriceEntryTypeEnum.LAST_DIP) {
      return this._lastDipEntryIndex !== -1
        ? this._entries[this._lastDipEntryIndex]
        : null;
    }

    return null;
  }

  addEntry(entry: ExchangeAssetPriceEntryInterface): ExchangeAssetPriceEntryInterface {
    this._entries.push(entry);

    return entry;
  }

  getChanges(): ExchangeAssetPriceChangeMap {
    return this._changes;
  }

  processEntries(): void {
    const entriesCount = this._entries.length;
    if (entriesCount < 2) {
      return;
    }

    const baseEntryIndex = entriesCount - 1;
    const baseEntry = this._entries[baseEntryIndex];
    const basePrice = parseFloat(baseEntry.price);

    let peakEntryData = {
      index: -1,
      price: 0,
    };
    // Assume that we are currently in the dip. Should stabilize after an entry or two
    let dipEntryData = {
      index: baseEntryIndex,
      price: basePrice,
    };

    const changes = new Map<string, ExchangeAssetPriceChangeInterface>();
    // We don't need the base (in this case the newest) one,
    // because that's the one we are comparing against
    for (let i = 0; i < baseEntryIndex; i++) {
      const entry = this._entries[i];
      const prevEntryIndex = i - 1;
      const prevEntry = i > 0
        ? this._entries[prevEntryIndex]
        : null;
      const differenceSeconds = Math.round((baseEntry.timestamp - entry.timestamp) / 1000);

      const price = parseFloat(entry.price);
      const prevPrice = parseFloat(prevEntry?.price);

      const absolutePricePercentage = calculatePercentage(price, basePrice);
      const relativePricePercentage = prevEntry
        ? calculatePercentage(price, prevPrice)
        : 0;

      changes.set(differenceSeconds + 's', {
        absolutePricePercentage,
        relativePricePercentage,
        basePrice,
        price,
        prevPrice,
      });

      if (price > peakEntryData.price) {
        peakEntryData = {
          index: i,
          price,
        };
      }

      if (price < dipEntryData.price) {
        dipEntryData = {
          index: i,
          price,
        };
      }
    }

    this._changes = changes;
    this._lastPeakEntryIndex = peakEntryData.index;
    this._lastDipEntryIndex = dipEntryData.index;
  }

  getPriceText(time: number = +new Date()): string {
    const entryNewest = this.getEntry(ExchangeAssetPriceEntryTypeEnum.NEWEST);
    if (!entryNewest) {
      return chalk.italic('no price set yet');
    }

    const entryNewestPrice = entryNewest.price;
    const entryNewestTimeAgo = time - entryNewest.timestamp;
    const entyLastPeak = this.getEntry(ExchangeAssetPriceEntryTypeEnum.LAST_PEAK);
    const entyLastDip = this.getEntry(ExchangeAssetPriceEntryTypeEnum.LAST_DIP);

    let string = chalk.bold(entryNewestPrice);

    if (entryNewestTimeAgo) {
      string += ` (${Math.round(entryNewestTimeAgo / 1000)}s ago)`;
    }

    if (entyLastPeak) {
      const entryLastPeakTimeAgo = time - entyLastPeak.timestamp;
      const entryLastPeakPercentage = calculatePercentage(
        parseFloat(entryNewestPrice),
        parseFloat(entyLastPeak.price)
      );
      string += entryLastPeakPercentage === 0
        ? ` (📈 ${chalk.green('we are on the peak')})`
        : ` (📈 ${chalk.red(entryLastPeakPercentage.toPrecision(3))}; ${Math.round(entryLastPeakTimeAgo / 1000)}s ago)`;
    }

    if (entyLastDip) {
      const entryLastDipTimeAgo = time - entyLastDip.timestamp;
      const entryLastDipPercentage = calculatePercentage(
        parseFloat(entryNewestPrice),
        parseFloat(entyLastDip.price)
      );
      string += entryLastDipPercentage === 0
        ? ` (📉 ${chalk.red('we are in the dip')})`
        : ` (📉 ${chalk.green('+' + entryLastDipPercentage.toPrecision(3))}; ${Math.round(entryLastDipTimeAgo / 1000)}s ago)`;
    }

    return string;
  }
}
