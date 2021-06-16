import chalk from 'chalk';

import { calculatePercentage, colorTextByValue } from '../../Utils/Helpers';

export interface ExchangeAssetPriceInterface {
  getEntries(): ExchangeAssetPriceEntryInterface[];
  getEntriesPeakIndexes(): number[];
  getEntriesTroughIndexes(): number[];
  getNewestEntry(): ExchangeAssetPriceEntryInterface;
  getLastPeakEntry(): ExchangeAssetPriceEntryInterface;
  getLastTroughEntry(): ExchangeAssetPriceEntryInterface;
  addEntry(entry: ExchangeAssetPriceEntryInterface): ExchangeAssetPriceEntryInterface;
  getChanges(): ExchangeAssetPriceChangeInterface[];
  getTrend(now: number, intervalTime: number): ExchangeAssetPriceTrend;
  processEntries(): void;
  cleanupEntries(ratio: number): void; // How many entries (percentage; 1 = 100%) should it remove from the start?
  getPriceText(now: number, trendIntervalTime: number): string;
}

export interface ExchangeAssetPriceChangeInterface {
  relativePricePercentage: number; // relative to the previous entry - ((price - prevPrice) / prevPrice) * 100
  price: number;
  prevPrice: number;
  timestamp: number;
}

export interface ExchangeAssetPriceEntryInterface {
  timestamp: number;
  price: string;
}

export interface ExchangeAssetPriceTrend {
  status: ExchangeAssetPriceTrendStatusEnum;
  trendPercentage: number;
}

export enum ExchangeAssetPriceTrendStatusEnum {
  UPTREND = 'UPTREND',
  DOWNTREND = 'DOWNTREND',
  SIDEWAYS_TREND  = 'SIDEWAYS_TREND',
}

export const ExchangeAssetTrendIconMap = new Map<string, string>([
  [ExchangeAssetPriceTrendStatusEnum.UPTREND, '🟢'],
  [ExchangeAssetPriceTrendStatusEnum.DOWNTREND, '🔴'],
  [ExchangeAssetPriceTrendStatusEnum.SIDEWAYS_TREND, '🔵'],
]);

export type ExchangeAssetPricesMap = Map<string, ExchangeAssetPriceInterface>;

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

  getEntriesPeakIndexes(): number[] {
    return this._entriesPeakIndexes;
  }

  getEntriesTroughIndexes(): number[] {
    return this._entriesTroughIndexes;
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

  getTrend(
    now: number = Date.now(),
    intervalTime: number = 1000
  ): ExchangeAssetPriceTrend {
    const changes = this.getChanges();
    if (
      !changes ||
      changes.length === 0
    ) {
      return null;
    }

    const changesReversed = [...changes.reverse()];
    const percentages: number[] = [];
    for (let i = 0; i < changesReversed.length; i++) {
      const change = changesReversed[i];
      if (now - change.timestamp >= intervalTime) {
        break;
      }

      percentages.push(change.relativePricePercentage);
    }

    const percentagesCount = percentages.length;
    if (percentagesCount === 0) {
      return null;
    }

    const trendPercentage = percentages.reduce((a, b) => {
      return a + b;
    }, 0) / percentagesCount;

    let status = ExchangeAssetPriceTrendStatusEnum.SIDEWAYS_TREND;
    if (trendPercentage > 0) {
      status = ExchangeAssetPriceTrendStatusEnum.UPTREND;
    } else if (trendPercentage < 0) {
      status = ExchangeAssetPriceTrendStatusEnum.DOWNTREND;
    }

    return {
      status,
      trendPercentage,
    };
  }

  processEntries(): void {
    const entriesCount = this._entries.length;
    if (entriesCount < 2) {
      return;
    }

    const initialEntry = this._entries[0];
    const initialPrice = parseFloat(initialEntry.price);

    this._entriesPeakIndexes = [];
    this._entriesTroughIndexes = [];

    const changes: ExchangeAssetPriceChangeInterface[] = [];
    for (let i = 0; i < entriesCount; i++) {
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
        timestamp: entry.timestamp,
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
          if (
            price === initialPrice &&
            this._entriesTroughIndexes.length === 0
          ) {
            continue;
          }

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

      // If the last item, add the peak/trough if the last item is less/more than the last one
      if (i === entriesCount - 1) {
        const newestEntry = this.getNewestEntry();
        const lastPeakEntry = this.getLastPeakEntry();
        const lastTroughEntry = this.getLastTroughEntry();

        if (
          lastPeakEntry &&
          parseFloat(lastPeakEntry.price) <= parseFloat(newestEntry.price)
        ) {
          this._entriesPeakIndexes.push(i);
        }

        if (
          lastTroughEntry &&
          parseFloat(lastTroughEntry.price) >= parseFloat(newestEntry.price)
        ) {
          this._entriesTroughIndexes.push(i);
        }
      }
    }

    this._changes = changes;
  }

  cleanupEntries(ratio: number = 0.5): void {
    this._entries.splice(0, Math.ceil(this._entries.length * ratio));

    this.processEntries();
  }

  getPriceText(
    now: number = Date.now(),
    trendIntervalTime: number = 2000
  ): string {
    const entryNewest = this.getNewestEntry();
    if (!entryNewest) {
      return chalk.italic('no price set yet');
    }

    const entryNewestPrice = entryNewest.price;
    const entryNewestTimeAgo = now - entryNewest.timestamp;
    const entryLastPeak = this.getLastPeakEntry();
    const entryLastTrough = this.getLastTroughEntry();
    const trend = this.getTrend(
      now,
      trendIntervalTime
    );

    let string = chalk.bold(entryNewestPrice);

    if (entryNewestTimeAgo) {
      string += ` (${Math.round(entryNewestTimeAgo / 1000)}s ago)`;
    }

    if (trend) {
      string += ' ' + ExchangeAssetTrendIconMap.get(trend.status);

      const percentage = trend.trendPercentage;
      if (percentage) {
        string += ' ' + colorTextByValue(percentage);
      }
    }

    if (entryLastPeak) {
      const entryLastPeakTimeAgo = now - entryLastPeak.timestamp;
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
      const entryLastTroughTimeAgo = now - entryLastTrough.timestamp;
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
