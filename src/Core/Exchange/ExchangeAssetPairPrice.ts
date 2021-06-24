import chalk from 'chalk';

import { AssetPair } from '../Asset/AssetPair';
import { calculatePercentage, colorTextPercentageByValue } from '../../Utils/Helpers';

export interface ExchangeAssetPairPriceInterface {
  assetPair: AssetPair;
  getEntries(): ExchangeAssetPairPriceEntryInterface[];
  getEntriesPeakIndexes(): number[];
  getEntriesTroughIndexes(): number[];
  getNewestEntry(): ExchangeAssetPairPriceEntryInterface;
  getLastPeakEntry(): ExchangeAssetPairPriceEntryInterface;
  getLastTroughEntry(): ExchangeAssetPairPriceEntryInterface;
  getLargestPeakEntry(maximumAge: number): ExchangeAssetPairPriceEntryInterface; // How far back (in milliseconds) should we ho to find the max peak/trough?
  getLargestTroughEntry(maximumAge: number): ExchangeAssetPairPriceEntryInterface;
  addEntry(entry: ExchangeAssetPairPriceEntryInterface): ExchangeAssetPairPriceEntryInterface;
  getChanges(): ExchangeAssetPairPriceChangeInterface[];
  getNewestChange(): ExchangeAssetPairPriceChangeInterface;
  processEntries(): void;
  cleanupEntries(ratio: number): void; // How many entries (percentage; 1 = 100%) should it remove from the start?
  getStatistics(): ExchangeAssetPairPriceStatisticsInterface[];
  getNewestStatistics(): ExchangeAssetPairPriceStatisticsInterface;
  addStatistics(entry: ExchangeAssetPairPriceStatisticsInterface): ExchangeAssetPairPriceStatisticsInterface;
  getPriceText(): string;
}

export interface ExchangeAssetPairPriceChangeInterface {
  relativePricePercentage: number; // relative to the previous entry - ((price - prevPrice) / prevPrice) * 100
  price: number;
  prevPrice: number;
  timestamp: number;
}

export interface ExchangeAssetPairPriceEntryInterface {
  timestamp: number;
  price: string;
}

export interface ExchangeAssetPairPriceStatisticsInterface {
  volume: string;
  tradesCount: number;
  timestamp: number;
}

export interface ExchangeAssetPairPriceTrend {
  status: ExchangeAssetPairPriceTrendStatusEnum;
  trendPercentage: number;
}

export enum ExchangeAssetPairPriceTrendStatusEnum {
  UPTREND = 'UPTREND',
  DOWNTREND = 'DOWNTREND',
  SIDEWAYS_TREND  = 'SIDEWAYS_TREND',
}

export const ExchangeAssetTrendIconMap = new Map<ExchangeAssetPairPriceTrendStatusEnum, string>([
  [ExchangeAssetPairPriceTrendStatusEnum.UPTREND, '🟢'],
  [ExchangeAssetPairPriceTrendStatusEnum.DOWNTREND, '🔴'],
  [ExchangeAssetPairPriceTrendStatusEnum.SIDEWAYS_TREND, '🔵'],
]);

export type ExchangeAssetPairPricesMap = Map<string, ExchangeAssetPairPriceInterface>;

export class ExchangeAssetPairPrice implements ExchangeAssetPairPriceInterface {
  assetPair: AssetPair;

  private _entries: ExchangeAssetPairPriceEntryInterface[];
  private _entriesPeakIndexes: Array<number>;
  private _entriesTroughIndexes: Array<number>;
  private _changes: ExchangeAssetPairPriceChangeInterface[];
  private _statistics: ExchangeAssetPairPriceStatisticsInterface[];

  constructor(assetPair: AssetPair) {
    this.assetPair = assetPair;

    this._entries = [];
    this._entriesPeakIndexes = [];
    this._entriesTroughIndexes = [];
    this._changes = [];
    this._statistics = [];
  }

  getEntries(): ExchangeAssetPairPriceEntryInterface[] {
    return this._entries;
  }

  getEntriesPeakIndexes(): number[] {
    return this._entriesPeakIndexes;
  }

  getEntriesTroughIndexes(): number[] {
    return this._entriesTroughIndexes;
  }

  getNewestEntry(): ExchangeAssetPairPriceEntryInterface {
    if (this._entries.length === 0) {
      return null;
    }

    return this._entries[this._entries.length - 1];
  }

  getLastPeakEntry(): ExchangeAssetPairPriceEntryInterface {
    if (this._entriesPeakIndexes.length === 0) {
      return null;
    }

    return this._entries[this._entriesPeakIndexes[this._entriesPeakIndexes.length - 1]];
  }

  getLastTroughEntry(): ExchangeAssetPairPriceEntryInterface {
    if (this._entriesTroughIndexes.length === 0) {
      return null;
    }

    return this._entries[this._entriesTroughIndexes[this._entriesTroughIndexes.length - 1]];
  }

  getLargestPeakEntry(maximumAge: number = -1): ExchangeAssetPairPriceEntryInterface {
    if (this._entriesPeakIndexes.length === 0) {
      return null;
    }

    const now = Date.now();
    let largestPeakEntry: ExchangeAssetPairPriceEntryInterface = null;
    for (let i = this._entriesPeakIndexes.length - 1; i >= 0; i--) {
      const entry = this._entries[this._entriesPeakIndexes[i]];
      if (
        maximumAge !== -1 &&
        now - entry.timestamp > maximumAge
      ) {
        break;
      }

      if (
        !largestPeakEntry ||
        parseFloat(largestPeakEntry.price) < parseFloat(entry.price)
      ) {
        largestPeakEntry = entry;
      }
    }

    return largestPeakEntry;
  }

  getLargestTroughEntry(maximumAge: number = -1): ExchangeAssetPairPriceEntryInterface {
    if (this._entriesTroughIndexes.length === 0) {
      return null;
    }

    const now = Date.now();
    let largestTroughEntry: ExchangeAssetPairPriceEntryInterface = null;
    for (let i = this._entriesTroughIndexes.length - 1; i >= 0; i--) {
      const entry = this._entries[this._entriesTroughIndexes[i]];
      if (
        maximumAge !== -1 &&
        now - entry.timestamp > maximumAge
      ) {
        break;
      }

      if (
        !largestTroughEntry ||
        parseFloat(largestTroughEntry.price) > parseFloat(entry.price)
      ) {
        largestTroughEntry = entry;
      }
    }

    return largestTroughEntry;
  }

  addEntry(entry: ExchangeAssetPairPriceEntryInterface): ExchangeAssetPairPriceEntryInterface {
    this._entries.push(entry);

    return entry;
  }

  getChanges(): ExchangeAssetPairPriceChangeInterface[] {
    return this._changes;
  }

  getNewestChange(): ExchangeAssetPairPriceChangeInterface {
    if (this._changes.length === 0) {
      return null;
    }

    return this._changes[this._changes.length - 1];
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

    const changes: ExchangeAssetPairPriceChangeInterface[] = [];
    for (let i = 0; i < entriesCount; i++) {
      const entry = this._entries[i];
      const prevEntry = i > 0
        ? this._entries[i - 1]
        : null;
      const nextEntry = i < entriesCount - 1
        ? this._entries[i + 1]
        : null;

      const price = parseFloat(entry.price);
      const prevPrice = prevEntry
        ? parseFloat(prevEntry.price)
        : null;
      const nextPrice = nextEntry
        ? parseFloat(nextEntry?.price)
        : null;

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

  getStatistics(): ExchangeAssetPairPriceStatisticsInterface[] {
    return this._statistics;
  }

  getNewestStatistics(): ExchangeAssetPairPriceStatisticsInterface {
    if (this._statistics.length === 0) {
      return null;
    }

    return this._statistics[this._statistics.length - 1];
  }

  addStatistics(statistics: ExchangeAssetPairPriceStatisticsInterface): ExchangeAssetPairPriceStatisticsInterface {
    this._statistics.push(statistics);

    return statistics;
  }

  getPriceText(): string {
    const entryNewest = this.getNewestEntry();
    if (!entryNewest) {
      return chalk.italic('no price set yet');
    }

    const now = Date.now();
    const entryNewestPrice = entryNewest.price;
    const entryNewestTimeAgo = now - entryNewest.timestamp;
    const entryLastPeak = this.getLastPeakEntry();
    const entryLastTrough = this.getLastTroughEntry();
    const changesNewest = this.getNewestChange();

    let string = chalk.bold(entryNewestPrice);

    if (entryNewestTimeAgo) {
      string += ` (${Math.round(entryNewestTimeAgo / 1000)}s ago)`;
    }

    if (changesNewest) {
      const percentage = changesNewest.relativePricePercentage;
      const status = percentage > 0
        ? ExchangeAssetPairPriceTrendStatusEnum.UPTREND
        : (percentage < 0
          ? ExchangeAssetPairPriceTrendStatusEnum.DOWNTREND
          : ExchangeAssetPairPriceTrendStatusEnum.SIDEWAYS_TREND
        );

      string += ' ' + ExchangeAssetTrendIconMap.get(status);

      if (percentage) {
        string += ' ' + colorTextPercentageByValue(percentage);
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
