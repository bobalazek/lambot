import chalk from 'chalk';

import { calculatePercentage } from '../../Utils/Helpers';

export interface ExchangeAssetPriceInterface {
  getEntries(): ExchangeAssetPriceEntryInterface[];
  getNewestEntry(): ExchangeAssetPriceEntryInterface;
  getLastPeakEntry(): ExchangeAssetPriceEntryInterface;
  getLastTroughEntry(): ExchangeAssetPriceEntryInterface;
  addEntry(entry: ExchangeAssetPriceEntryInterface): ExchangeAssetPriceEntryInterface;
  getChanges(): ExchangeAssetPriceChangeInterface[];
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

export interface ExchangeAssetPriceWithSymbolEntryInterface extends ExchangeAssetPriceEntryInterface {
  symbol: string;
}

export class ExchangeAssetPrice implements ExchangeAssetPriceInterface {
  private _entries: ExchangeAssetPriceEntryInterface[];
  private _changes: ExchangeAssetPriceChangeInterface[];
  private _entriesPeakIndexes: Array<number>;
  private _entriesTroughIndexes: Array<number>;

  constructor() {
    this._entries = [];
    this._entriesPeakIndexes = [];
    this._entriesTroughIndexes = [];
  }

  getEntries(): ExchangeAssetPriceEntryInterface[] {
    return this._entries;
  }

  getNewestEntry(): ExchangeAssetPriceEntryInterface {
    if (this._entries.length === 0) {
      return null;
    }

    return this._entries[this._entries.length - 1];
  }

  getLastPeakEntry(): ExchangeAssetPriceEntryInterface {
    if (this._entriesPeakIndexes.length === 0) {
      return null;
    }

    return this._entries[this._entriesPeakIndexes[this._entriesPeakIndexes.length - 1]];
  }

  getLastTroughEntry(): ExchangeAssetPriceEntryInterface {
    if (this._entriesTroughIndexes.length === 0) {
      return null;
    }

    return this._entries[this._entriesTroughIndexes[this._entriesTroughIndexes.length - 1]];
  }

  addEntry(entry: ExchangeAssetPriceEntryInterface): ExchangeAssetPriceEntryInterface {
    this._entries.push(entry);

    return entry;
  }

  getChanges(): ExchangeAssetPriceChangeInterface[] {
    return this._changes;
  }

  processEntries(): void {
    const entriesCount = this._entries.length;
    if (entriesCount < 2) {
      return;
    }

    this._entriesPeakIndexes = [];
    this._entriesTroughIndexes = [];

    const changes: ExchangeAssetPriceChangeInterface[] = [];
    for (let i = 0; i < entriesCount - 1; i++) {
      const entry = this._entries[i];
      const prevEntry = i > 0
        ? this._entries[i - 1]
        : null;
      const nextEntry = i < entriesCount - 1
        ? this._entries[i + 1]
        : null;

      const price = parseFloat(entry.price);
      const prevPrice = parseFloat(prevEntry?.price);
      const nextPrice = parseFloat(nextEntry?.price);

      const relativePricePercentage = prevEntry
        ? calculatePercentage(price, prevPrice)
        : 0;

      changes.push({
        relativePricePercentage,
        price,
        prevPrice,
      });

      if (prevEntry) {
        // TODO: figure out a better way to do this
        // I'm aware that the performance is rather terrible,
        // but will need a good idea on how to fix it
        const prevRelativePricePercentage = changes[i - 1].relativePricePercentage;
        if (
          price < prevPrice &&
          prevRelativePricePercentage >= 0
        ) {
          const baseIndex = i - 1;
          // Previous entries could also be peaks, so let's see how far back they go!
          const additionalIndexes: number[] = [];
          let loopIndex = baseIndex;
          while (loopIndex >= 0) {
            loopIndex--;
            const loopEntry = this._entries[loopIndex];
            if (
              !loopEntry ||
              parseFloat(loopEntry.price) !== prevPrice
            ) {
              break;
            }
            additionalIndexes.push(loopIndex);
          }

          if (additionalIndexes.length) {
            this._entriesPeakIndexes.push(...additionalIndexes.reverse());
          }

          this._entriesPeakIndexes.push(baseIndex);
        }

        if (
          price < nextPrice &&
          relativePricePercentage <= 0
        ) {
          const baseIndex = i;
          // Previous entries could also be troughs, so let's see how far back they go!
          const additionalIndexes: number[] = [];
          let loopIndex = baseIndex;
          while (loopIndex >= 0) {
            loopIndex--;
            const loopEntry = this._entries[loopIndex];
            if (
              !loopEntry ||
              parseFloat(loopEntry.price) !== price
            ) {
              break;
            }
            additionalIndexes.push(loopIndex);
          }

          if (additionalIndexes.length) {
            this._entriesTroughIndexes.push(...additionalIndexes.reverse());
          }

          this._entriesTroughIndexes.push(baseIndex);
        }
      }
    }

    this._changes = changes;
  }

  cleanupEntries(ratio: number = 0.5): void {
    this._entries.splice(0, Math.round(this._entries.length * ratio));

    this.processEntries();
  }

  getPriceText(time: number = +new Date()): string {
    const entryNewest = this.getNewestEntry();
    if (!entryNewest) {
      return chalk.italic('no price set yet');
    }

    const entryNewestPrice = entryNewest.price;
    const entryNewestTimeAgo = time - entryNewest.timestamp;
    const entryLastPeak = this.getLastPeakEntry();
    const entryLastTrough = this.getLastTroughEntry();

    let string = chalk.bold(entryNewestPrice);

    if (entryNewestTimeAgo) {
      string += ` (${Math.round(entryNewestTimeAgo / 1000)}s ago)`;
    }

    if (entryLastPeak) {
      const entryLastPeakTimeAgo = time - entryLastPeak.timestamp;
      const entryLastPeakPercentage = calculatePercentage(
        parseFloat(entryNewestPrice),
        parseFloat(entryLastPeak.price)
      );
      const percentage = entryLastPeakPercentage.toPrecision(3) + '%';
      string += entryLastPeakPercentage === 0
        ? ` (⛰️ ${chalk.green('we are going up!')})`
        : ` (⛰️ ${chalk.red(percentage)}; ${Math.round(entryLastPeakTimeAgo / 1000)}s ago)`;
    }

    if (entryLastTrough) {
      const entryLastTroughTimeAgo = time - entryLastTrough.timestamp;
      const entryLastTroughPercentage = calculatePercentage(
        parseFloat(entryNewestPrice),
        parseFloat(entryLastTrough.price)
      );
      const percentage = (entryLastTroughPercentage > 0 ? '+' : '') + entryLastTroughPercentage.toPrecision(3) + '%';
      string += entryLastTroughPercentage === 0
        ? ` (🕳️ ${chalk.red('we are going down!')})`
        : ` (🕳️ ${chalk.green(percentage)}; ${Math.round(entryLastTroughTimeAgo / 1000)}s ago)`;
    }

    return string;
  }
}
