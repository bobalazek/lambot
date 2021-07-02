import chalk from 'chalk';

import { AssetPair } from '../Asset/AssetPair';
import {
  ExchangeAssetPairPriceChangeInterface,
  ExchangeAssetPairPriceEntryInterface,
  ExchangeAssetPairPriceTrendStatusEnum,
  ExchangeAssetPairTrendIconMap,
} from './ExchangeAssetPairPrice';
import { ExchangeAssetPairCandlestickInterface } from './ExchangeAssetPairCandlestick';
import { calculatePercentage, colorTextPercentageByValue } from '../../Utils/Helpers';

export interface ExchangeAssetPairInterface {
  assetPair: AssetPair;
  indicators: Map<string, number>;
  shouldBuyLong: boolean;
  shouldBuyShort: boolean;
  shouldSellLong: boolean;
  shouldSellShort: boolean;
  metadata: any;
  getCandlesticks(): ExchangeAssetPairCandlestickInterface[];
  getNewestCandlestick(): ExchangeAssetPairCandlestickInterface;
  addCandlestick(candlestick: ExchangeAssetPairCandlestickInterface): ExchangeAssetPairCandlestickInterface;
  setCandlesticks(candlesticks: ExchangeAssetPairCandlestickInterface[]): ExchangeAssetPairCandlestickInterface[];
  getPriceEntries(): ExchangeAssetPairPriceEntryInterface[];
  getPriceEntriesPeakIndexes(): number[];
  getPriceEntriesTroughIndexes(): number[];
  getNewestPriceEntry(): ExchangeAssetPairPriceEntryInterface;
  getLastPeakPriceEntry(): ExchangeAssetPairPriceEntryInterface;
  getLastTroughPriceEntry(): ExchangeAssetPairPriceEntryInterface;
  getLargestPeakPriceEntry(maximumAge: number): ExchangeAssetPairPriceEntryInterface; // How far back (in milliseconds) should we ho to find the max peak/trough?
  getLargestTroughPriceEntry(maximumAge: number): ExchangeAssetPairPriceEntryInterface;
  addPriceEntry(priceEntry: ExchangeAssetPairPriceEntryInterface): ExchangeAssetPairPriceEntryInterface;
  getPriceChanges(): ExchangeAssetPairPriceChangeInterface[];
  getNewestPriceChange(): ExchangeAssetPairPriceChangeInterface;
  processPriceEntries(): void;
  cleanupPriceEntries(ratio: number): void; // How many entries (percentage; 1 = 100%) should it remove from the start?
  getPriceText(): string;
}


export class ExchangeAssetPair implements ExchangeAssetPairInterface {
  assetPair: AssetPair;
  indicators: Map<string, number>;
  shouldBuyLong: boolean;
  shouldBuyShort: boolean;
  shouldSellLong: boolean;
  shouldSellShort: boolean;
  metadata: any;

  private _candlesticks: ExchangeAssetPairCandlestickInterface[];
  private _priceEntries: ExchangeAssetPairPriceEntryInterface[];
  private _priceEntriesPeakIndexes: Array<number>;
  private _priceEntriesTroughIndexes: Array<number>;
  private _priceChanges: ExchangeAssetPairPriceChangeInterface[];

  constructor(assetPair: AssetPair) {
    this.assetPair = assetPair;
    this.indicators = new Map<string, number>();
    this.shouldBuyLong = false;
    this.shouldBuyShort = false;
    this.shouldSellLong = false;
    this.shouldSellShort = false;

    this._candlesticks = [];
    this._priceChanges = [];
    this._priceEntries = [];
    this._priceEntriesPeakIndexes = [];
    this._priceEntriesTroughIndexes = [];
  }

  getCandlesticks(): ExchangeAssetPairCandlestickInterface[] {
    return this._candlesticks;
  }

  getNewestCandlestick(): ExchangeAssetPairCandlestickInterface {
    if (this._candlesticks.length === 0) {
      return null;
    }

    return this._candlesticks[this._candlesticks.length - 1];
  }

  addCandlestick(candlestick: ExchangeAssetPairCandlestickInterface): ExchangeAssetPairCandlestickInterface {
    this._candlesticks.push(candlestick);

    return candlestick;
  }

  setCandlesticks(candlesticks: ExchangeAssetPairCandlestickInterface[]): ExchangeAssetPairCandlestickInterface[] {
    return this._candlesticks = candlesticks;
  }

  /***** Price entries *****/
  getPriceEntries(): ExchangeAssetPairPriceEntryInterface[] {
    return this._priceEntries;
  }

  getPriceEntriesPeakIndexes(): number[] {
    return this._priceEntriesPeakIndexes;
  }

  getPriceEntriesTroughIndexes(): number[] {
    return this._priceEntriesTroughIndexes;
  }

  getNewestPriceEntry(): ExchangeAssetPairPriceEntryInterface {
    if (this._priceEntries.length === 0) {
      return null;
    }

    return this._priceEntries[this._priceEntries.length - 1];
  }

  getLastPeakPriceEntry(): ExchangeAssetPairPriceEntryInterface {
    if (this._priceEntriesPeakIndexes.length === 0) {
      return null;
    }

    return this._priceEntries[this._priceEntriesPeakIndexes[this._priceEntriesPeakIndexes.length - 1]];
  }

  getLastTroughPriceEntry(): ExchangeAssetPairPriceEntryInterface {
    if (this._priceEntriesTroughIndexes.length === 0) {
      return null;
    }

    return this._priceEntries[this._priceEntriesTroughIndexes[this._priceEntriesTroughIndexes.length - 1]];
  }

  getLargestPeakPriceEntry(maximumAge: number = -1): ExchangeAssetPairPriceEntryInterface {
    if (this._priceEntriesPeakIndexes.length === 0) {
      return null;
    }

    const now = Date.now();
    let largestPeakEntry: ExchangeAssetPairPriceEntryInterface = null;
    for (let i = this._priceEntriesPeakIndexes.length - 1; i >= 0; i--) {
      const entry = this._priceEntries[this._priceEntriesPeakIndexes[i]];
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

  getLargestTroughPriceEntry(maximumAge: number = -1): ExchangeAssetPairPriceEntryInterface {
    if (this._priceEntriesTroughIndexes.length === 0) {
      return null;
    }

    const now = Date.now();
    let largestTroughEntry: ExchangeAssetPairPriceEntryInterface = null;
    for (let i = this._priceEntriesTroughIndexes.length - 1; i >= 0; i--) {
      const entry = this._priceEntries[this._priceEntriesTroughIndexes[i]];
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

  addPriceEntry(priceEntry: ExchangeAssetPairPriceEntryInterface): ExchangeAssetPairPriceEntryInterface {
    this._priceEntries.push(priceEntry);

    return priceEntry;
  }

  getPriceChanges(): ExchangeAssetPairPriceChangeInterface[] {
    return this._priceChanges;
  }

  getNewestPriceChange(): ExchangeAssetPairPriceChangeInterface {
    if (this._priceChanges.length === 0) {
      return null;
    }

    return this._priceChanges[this._priceChanges.length - 1];
  }

  processPriceEntries(): void {
    const entriesCount = this._priceEntries.length;
    if (entriesCount < 2) {
      return;
    }

    const initialEntry = this._priceEntries[0];
    const initialPrice = parseFloat(initialEntry.price);

    this._priceEntriesPeakIndexes = [];
    this._priceEntriesTroughIndexes = [];

    const changes: ExchangeAssetPairPriceChangeInterface[] = [];
    for (let i = 0; i < entriesCount; i++) {
      const entry = this._priceEntries[i];
      const prevEntry = i > 0
        ? this._priceEntries[i - 1]
        : null;
      const nextEntry = i < entriesCount - 1
        ? this._priceEntries[i + 1]
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
            const loopEntry = this._priceEntries[loopIndex];
            if (
              !loopEntry ||
              parseFloat(loopEntry.price) !== prevPrice
            ) {
              break;
            }
            additionalIndexes.push(loopIndex);
          }

          if (additionalIndexes.length) {
            this._priceEntriesPeakIndexes.push(...additionalIndexes.reverse());
          }

          this._priceEntriesPeakIndexes.push(baseIndex);
        }

        if (
          price < nextPrice &&
          relativePricePercentage <= 0
        ) {
          if (
            price === initialPrice &&
            this._priceEntriesTroughIndexes.length === 0
          ) {
            continue;
          }

          const baseIndex = i;
          // Previous entries could also be troughs, so let's see how far back they go!
          const additionalIndexes: number[] = [];
          let loopIndex = baseIndex;
          while (loopIndex >= 0) {
            loopIndex--;
            const loopEntry = this._priceEntries[loopIndex];
            if (
              !loopEntry ||
              parseFloat(loopEntry.price) !== price
            ) {
              break;
            }
            additionalIndexes.push(loopIndex);
          }

          if (additionalIndexes.length) {
            this._priceEntriesTroughIndexes.push(...additionalIndexes.reverse());
          }

          this._priceEntriesTroughIndexes.push(baseIndex);
        }
      }

      // If the last item, add the peak/trough if the last item is less/more than the last one
      if (i === entriesCount - 1) {
        const newestEntry = this.getNewestPriceEntry();
        const lastPeakEntry = this.getLastPeakPriceEntry();
        const lastTroughEntry = this.getLastTroughPriceEntry();

        if (
          lastPeakEntry &&
          parseFloat(lastPeakEntry.price) <= parseFloat(newestEntry.price)
        ) {
          this._priceEntriesPeakIndexes.push(i);
        }

        if (
          lastTroughEntry &&
          parseFloat(lastTroughEntry.price) >= parseFloat(newestEntry.price)
        ) {
          this._priceEntriesTroughIndexes.push(i);
        }
      }
    }

    this._priceChanges = changes;
  }

  cleanupPriceEntries(ratio: number = 0.5): void {
    this._priceEntries.splice(0, Math.ceil(this._priceEntries.length * ratio));

    this.processPriceEntries();
  }

  getPriceText(): string {
    const entryNewest = this.getNewestPriceEntry();
    if (!entryNewest) {
      return chalk.italic('no price set yet');
    }

    const now = Date.now();
    const entryNewestPrice = entryNewest.price;
    const entryNewestTimeAgo = now - entryNewest.timestamp;
    const entryLastPeak = this.getLastPeakPriceEntry();
    const entryLastTrough = this.getLastTroughPriceEntry();
    const changesNewest = this.getNewestPriceChange();

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

      string += ' ' + ExchangeAssetPairTrendIconMap.get(status);

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
