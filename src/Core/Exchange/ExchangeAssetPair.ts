import chalk from 'chalk';

import { AssetPair } from '../Asset/AssetPair';
import {
  ExchangeAssetPairPriceEntryInterface,
  ExchangeAssetPairPriceTrendStatusEnum,
  ExchangeAssetPairTrendIconMap,
} from './ExchangeAssetPairPrice';
import { ExchangeTradeStatusEnum } from './ExchangeTrade';
import { ExchangeAssetPairOHLCInterface } from './ExchangeAssetPairOHLC';
import { Session } from '../Session/Session';
import { calculatePercentage, colorTextPercentageByValue } from '../../Utils/Helpers';

export interface ExchangeAssetPairInterface {
  assetPair: AssetPair;
  indicators: Map<string, number>;
  statistics24Hours: ExchangeAssetPairOHLCInterface | null;
  metadata: any;
  shouldBuy(session: Session): boolean;
  getCandlesticks(): ExchangeAssetPairOHLCInterface[];
  getNewestCandlestick(): ExchangeAssetPairOHLCInterface | null;
  addCandlestick(candlestick: ExchangeAssetPairOHLCInterface): ExchangeAssetPairOHLCInterface;
  setCandlesticks(candlesticks: ExchangeAssetPairOHLCInterface[]): ExchangeAssetPairOHLCInterface[];
  getPriceEntries(): ExchangeAssetPairPriceEntryInterface[];
  getPriceEntriesPeakIndexes(): number[];
  getPriceEntriesTroughIndexes(): number[];
  getNewestPriceEntry(): ExchangeAssetPairPriceEntryInterface | null;
  getLastPeakPriceEntry(): ExchangeAssetPairPriceEntryInterface | null;
  getLastTroughPriceEntry(): ExchangeAssetPairPriceEntryInterface | null;
  getLargestPeakPriceEntry(maximumAge: number): ExchangeAssetPairPriceEntryInterface | null; // How far back (in milliseconds) should we ho to find the max peak/trough?
  getLargestTroughPriceEntry(maximumAge: number): ExchangeAssetPairPriceEntryInterface | null;
  addPriceEntry(priceEntry: ExchangeAssetPairPriceEntryInterface): ExchangeAssetPairPriceEntryInterface;
  processPriceEntries(): void;
  cleanupPriceEntries(ratio: number): void; // How many entries (percentage; 1 = 100%) should it remove from the start?
  getPriceText(): string;
}


export class ExchangeAssetPair implements ExchangeAssetPairInterface {
  assetPair: AssetPair;
  indicators: Map<string, number>;
  statistics24Hours: ExchangeAssetPairOHLCInterface | null;
  metadata: any;

  private _candlesticks: ExchangeAssetPairOHLCInterface[];
  private _priceEntries: ExchangeAssetPairPriceEntryInterface[];
  private _priceEntriesPeakIndexes: Array<number>;
  private _priceEntriesTroughIndexes: Array<number>;

  constructor(assetPair: AssetPair) {
    this.assetPair = assetPair;
    this.indicators = new Map();
    this.statistics24Hours = null;

    this._candlesticks = [];
    this._priceEntries = [];
    this._priceEntriesPeakIndexes = [];
    this._priceEntriesTroughIndexes = [];
  }

  shouldBuy(session: Session): boolean {
    const {
      strategy,
      trades,
    } = session;

    const openTrades = session.getOpenTrades();
    if (
      strategy.parameters.maximumOpenTrades !== -1 &&
      openTrades.length >= strategy.parameters.maximumOpenTrades
    ) {
      return false;
    }

    const assetPairTrades = trades.filter((exchangeTrade) => {
      return (
        exchangeTrade.assetPair.getKey() === this.assetPair.getKey() &&
        (
          exchangeTrade.status === ExchangeTradeStatusEnum.OPEN ||
          exchangeTrade.status === ExchangeTradeStatusEnum.BUY_PENDING
        )
      );
    });

    if (
      strategy.parameters.maximumOpenTradesPerAssetPair !== -1 &&
      assetPairTrades.length >= strategy.parameters.maximumOpenTradesPerAssetPair
    ) {
      return false;
    }

    if (
      strategy.parameters.minimumDailyVolume !== -1 &&
      (
        !this.statistics24Hours ||
        (
          this.statistics24Hours &&
          parseFloat(this.statistics24Hours.volumeQuote) < strategy.parameters.minimumDailyVolume
        )
      )
    ) {
      return false;
    }

    return true
  }

  getCandlesticks(): ExchangeAssetPairOHLCInterface[] {
    return this._candlesticks;
  }

  getNewestCandlestick(): ExchangeAssetPairOHLCInterface | null {
    if (this._candlesticks.length === 0) {
      return null;
    }

    return this._candlesticks[this._candlesticks.length - 1];
  }

  addCandlestick(candlestick: ExchangeAssetPairOHLCInterface): ExchangeAssetPairOHLCInterface {
    this._candlesticks.push(candlestick);

    return candlestick;
  }

  setCandlesticks(candlesticks: ExchangeAssetPairOHLCInterface[]): ExchangeAssetPairOHLCInterface[] {
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

  getNewestPriceEntry(): ExchangeAssetPairPriceEntryInterface | null {
    if (this._priceEntries.length === 0) {
      return null;
    }

    return this._priceEntries[this._priceEntries.length - 1];
  }

  getLastPeakPriceEntry(): ExchangeAssetPairPriceEntryInterface | null {
    if (this._priceEntriesPeakIndexes.length === 0) {
      return null;
    }

    return this._priceEntries[this._priceEntriesPeakIndexes[this._priceEntriesPeakIndexes.length - 1]];
  }

  getLastTroughPriceEntry(): ExchangeAssetPairPriceEntryInterface | null {
    if (this._priceEntriesTroughIndexes.length === 0) {
      return null;
    }

    return this._priceEntries[this._priceEntriesTroughIndexes[this._priceEntriesTroughIndexes.length - 1]];
  }

  getLargestPeakPriceEntry(maximumAge: number = -1): ExchangeAssetPairPriceEntryInterface | null {
    if (this._priceEntriesPeakIndexes.length === 0) {
      return null;
    }

    const now = Date.now();
    let largestPeakEntry: ExchangeAssetPairPriceEntryInterface | null = null;
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

  getLargestTroughPriceEntry(maximumAge: number = -1): ExchangeAssetPairPriceEntryInterface | null {
    if (this._priceEntriesTroughIndexes.length === 0) {
      return null;
    }

    const now = Date.now();
    let largestTroughEntry: ExchangeAssetPairPriceEntryInterface | null = null;
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

  processPriceEntries(): void {
    const entriesCount = this._priceEntries.length;
    if (entriesCount < 2) {
      return;
    }

    const initialEntry = this._priceEntries[0];
    const initialPrice = parseFloat(initialEntry.price);

    this._priceEntriesPeakIndexes = [];
    this._priceEntriesTroughIndexes = [];

    const changes: number[] = [];
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

      const relativePricePercentage = prevPrice !== null
        ? calculatePercentage(price, prevPrice)
        : 0;

      changes.push(relativePricePercentage);

      if (prevPrice !== null) {
        // TODO: figure out a better way to do this
        // I'm aware that the performance is rather terrible,
        // but will need a good idea on how to fix it
        const prevRelativePricePercentage = changes[i - 1];
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
          nextPrice !== null &&
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
          newestEntry &&
          lastPeakEntry &&
          parseFloat(lastPeakEntry.price) <= parseFloat(newestEntry.price)
        ) {
          this._priceEntriesPeakIndexes.push(i);
        }

        if (
          newestEntry &&
          lastTroughEntry &&
          parseFloat(lastTroughEntry.price) >= parseFloat(newestEntry.price)
        ) {
          this._priceEntriesTroughIndexes.push(i);
        }
      }
    }
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

    let string = chalk.bold(entryNewestPrice);

    if (entryNewestTimeAgo) {
      string += ` (${Math.round(entryNewestTimeAgo / 1000)}s ago)`;
    }

    const entrySecondNewest = this._priceEntries[this._priceEntries.length - 2] ?? null;
    if (entrySecondNewest) {
      const percentage = calculatePercentage(
        parseFloat(entryNewestPrice),
        parseFloat(entrySecondNewest.price)
      );
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
