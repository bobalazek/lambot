import chalk from 'chalk';

import { calculatePercentage } from '../../Utils/Helpers';

export interface ExchangeAssetPriceInterface {
  getEntries(): ExchangeAssetPriceEntryInterface[];
  getEntry(type: ExchangeAssetPriceEntryTypeEnum): ExchangeAssetPriceEntryInterface;
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

export enum ExchangeAssetPriceEntryTypeEnum {
  NEWEST,
  LAST_PEAK,
  LAST_TROUGH,
}

export interface ExchangeAssetPriceWithSymbolEntryInterface extends ExchangeAssetPriceEntryInterface {
  symbol: string;
}

export class ExchangeAssetPrice implements ExchangeAssetPriceInterface {
  private _entries: ExchangeAssetPriceEntryInterface[];
  private _changes: ExchangeAssetPriceChangeInterface[];
  private _lastPeakEntryIndex: number;
  private _lastTroughEntryIndex: number;

  constructor() {
    this._entries = [];
    this._lastPeakEntryIndex = -1;
    this._lastTroughEntryIndex = -1;
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
    } else if (type === ExchangeAssetPriceEntryTypeEnum.LAST_TROUGH) {
      return this._lastTroughEntryIndex !== -1
        ? this._entries[this._lastTroughEntryIndex]
        : null;
    }

    return null;
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

    const newestEntryIndex = entriesCount - 1;

    let peakEntryIndex = -1;
    let peakEntryPrice = 0;
    let troughEntryIndex = -1;
    let troughEntryPrice = 0;

    const changes: ExchangeAssetPriceChangeInterface[] = [];
    // We don't need the newest one because that's the one we are comparing against
    for (let i = 0; i < newestEntryIndex; i++) {
      const entry = this._entries[i];
      const prevEntryIndex = i - 1;
      const prevEntry = i > 0
        ? this._entries[prevEntryIndex]
        : null;

      const price = parseFloat(entry.price);
      const prevPrice = parseFloat(prevEntry?.price);

      const relativePricePercentage = prevEntry
        ? calculatePercentage(price, prevPrice)
        : 0;

      changes.push({
        relativePricePercentage,
        price,
        prevPrice,
      });

      if (prevEntry) {
        // TODO: can we optimize this mess?
        const prevDirection = Math.sign(changes[i - 1].relativePricePercentage);
        const direction = Math.sign(relativePricePercentage);
        if (direction !== prevDirection) {
          if (direction < 0 && prevDirection > 0) {
            peakEntryIndex = -1;
            peakEntryPrice = 0;
          } else if (direction > 0 && prevDirection < 0) {
            troughEntryIndex = -1;
            troughEntryPrice = 0;
          }
        }

        if (
          direction >= 0 &&
          price >= peakEntryPrice
        ) {
          peakEntryIndex = i;
          peakEntryPrice = price;
        }

        if (
          direction <= 0 &&
          (
            troughEntryIndex === -1 ||
            (
              troughEntryIndex !== -1 &&
              price <= troughEntryPrice
            )
          )
        ) {
          troughEntryIndex = i;
          troughEntryPrice = price;
        }
      }
    }

    this._changes = changes;
    this._lastPeakEntryIndex = peakEntryIndex;
    this._lastTroughEntryIndex = troughEntryIndex;
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
    const entryLastPeak = this.getEntry(ExchangeAssetPriceEntryTypeEnum.LAST_PEAK);
    const entryLastTrough = this.getEntry(ExchangeAssetPriceEntryTypeEnum.LAST_TROUGH);

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
      string += entryLastPeakPercentage === 0
        ? ` (📈 ${chalk.green('we are going up!')})`
        : ` (📈 ${chalk.red(entryLastPeakPercentage.toPrecision(3) + '%')}; ${Math.round(entryLastPeakTimeAgo / 1000)}s ago)`;
    }

    if (entryLastTrough) {
      const entryLastTroughTimeAgo = time - entryLastTrough.timestamp;
      const entryLastTroughPercentage = calculatePercentage(
        parseFloat(entryNewestPrice),
        parseFloat(entryLastTrough.price)
      );
      string += entryLastTroughPercentage === 0
        ? ` (📉 ${chalk.red('we are going down!')})`
        : ` (📉 ${chalk.green('+' + entryLastTroughPercentage.toPrecision(3) + '%')}; ${Math.round(entryLastTroughTimeAgo / 1000)}s ago)`;
    }

    return string;
  }
}
