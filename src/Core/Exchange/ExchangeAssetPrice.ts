import chalk from 'chalk';

import { calculatePercentage } from '../../Utils/Helpers';

export interface ExchangeAssetPriceInterface {
  getEntries(): ExchangeAssetPriceEntryInterface[];
  getEntry(type: ExchangeAssetPriceEntryTypeEnum): ExchangeAssetPriceEntryInterface;
  addEntry(entry: ExchangeAssetPriceEntryInterface): ExchangeAssetPriceEntryInterface;
  getChanges(): ExchangeAssetPriceChangeMap;
  processEntries(): void;
  cleanupEntries(ratio: number): void; // How many entries (percentage; 1 = 100%) should it remove from the start?
  getPriceText(time: number): string;
}

export interface ExchangeAssetPriceChangeInterface {
  relativePricePercentage: number; // relative to the previous entry - ((price - prevPrice) / prevPrice) * 100
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
  LAST_VALLEY,
}

export interface ExchangeAssetPriceWithSymbolEntryInterface extends ExchangeAssetPriceEntryInterface {
  symbol: string;
}

export class ExchangeAssetPrice implements ExchangeAssetPriceInterface {
  private _entries: ExchangeAssetPriceEntryInterface[];
  private _changes: ExchangeAssetPriceChangeMap;
  private _lastPeakEntryIndex: number;
  private _lastValleyEntryIndex: number;

  constructor() {
    this._entries = [];
    this._lastPeakEntryIndex = -1;
    this._lastValleyEntryIndex = -1;
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
    } else if (type === ExchangeAssetPriceEntryTypeEnum.LAST_VALLEY) {
      return this._lastValleyEntryIndex !== -1
        ? this._entries[this._lastValleyEntryIndex]
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

    const newestEntryIndex = entriesCount - 1;
    const newestEntry = this._entries[newestEntryIndex];
    const newestPrice = parseFloat(newestEntry.price);

    let peakEntryData = {
      index: -1,
      price: 0,
    };
    let valleyEntryData = {
      index: -1,
      price: 0,
    };

    const changes = new Map<string, ExchangeAssetPriceChangeInterface>();
    // We don't need the newest one because that's the one we are comparing against
    for (let i = 0; i < newestEntryIndex; i++) {
      const entry = this._entries[i];
      const prevEntryIndex = i - 1;
      const prevEntry = i > 0
        ? this._entries[prevEntryIndex]
        : null;
      const differenceSeconds = Math.round((newestEntry.timestamp - entry.timestamp) / 1000);

      const price = parseFloat(entry.price);
      const prevPrice = parseFloat(prevEntry?.price);

      const relativePricePercentage = prevEntry
        ? calculatePercentage(price, prevPrice)
        : 0;

      changes.set(differenceSeconds + 's', {
        relativePricePercentage,
        price,
        prevPrice,
      });

      if (relativePricePercentage) {
        // TODO: nor really taking the most recent peak/valley into account yet
        // only the peak/valley overall

        if (
          relativePricePercentage > 0 &&
          price >= peakEntryData.price
        ) {
          peakEntryData = {
            index: i,
            price,
          };
        }

        if (
          relativePricePercentage < 0 &&
          (
            valleyEntryData.index === -1 ||
            price <= valleyEntryData.price
          )
        ) {
          valleyEntryData = {
            index: i,
            price,
          };
        }
      }
    }

    this._changes = changes;
    this._lastPeakEntryIndex = peakEntryData.index;
    this._lastValleyEntryIndex = valleyEntryData.index;
  }

  cleanupEntries(ratio: number = 0.5): void {
    this._entries.splice(0, Math.round(this._entries.length * ratio));

    this.processEntries();
  }

  getPriceText(time: number = +new Date()): string {
    const entryNewest = this.getEntry(ExchangeAssetPriceEntryTypeEnum.NEWEST);
    if (!entryNewest) {
      return chalk.italic('no price set yet');
    }

    const entryNewestPrice = entryNewest.price;
    const entryNewestTimeAgo = time - entryNewest.timestamp;
    const entyLastPeak = this.getEntry(ExchangeAssetPriceEntryTypeEnum.LAST_PEAK);
    const entyLastValley = this.getEntry(ExchangeAssetPriceEntryTypeEnum.LAST_VALLEY);

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
        ? ` (📈 ${chalk.green('we are going up!')})`
        : ` (📈 ${chalk.red(entryLastPeakPercentage.toPrecision(3) + '%')}; ${Math.round(entryLastPeakTimeAgo / 1000)}s ago)`;
    }

    if (entyLastValley) {
      const entryLastValleyTimeAgo = time - entyLastValley.timestamp;
      const entryLastValleyPercentage = calculatePercentage(
        parseFloat(entryNewestPrice),
        parseFloat(entyLastValley.price)
      );
      string += entryLastValleyPercentage === 0
        ? ` (📉 ${chalk.red('we are going down!')})`
        : ` (📉 ${chalk.green('+' + entryLastValleyPercentage.toPrecision(3) + '%')}; ${Math.round(entryLastValleyTimeAgo / 1000)}s ago)`;
    }

    return string;
  }
}
