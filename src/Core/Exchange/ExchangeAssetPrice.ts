import chalk from 'chalk';

export interface ExchangeAssetPriceInterface {
  getEntries(): ExchangeAssetPriceEntryInterface[];
  getNewestEntry(): ExchangeAssetPriceEntryInterface;
  addEntry(entry: ExchangeAssetPriceEntryInterface): ExchangeAssetPriceEntryInterface;
  getChanges(): {[key: string]: ExchangeAssetPriceChangeInterface};
  getStatusText(time: number): string;
}

export type ExchangeAssetPricesMap = Map<string, ExchangeAssetPriceInterface>;

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

export interface ExchangeAssetPriceSymbolEntryInterface extends ExchangeAssetPriceEntryInterface {
  symbol: string;
}

export class ExchangeAssetPrice implements ExchangeAssetPriceInterface {
  private _entries: ExchangeAssetPriceEntryInterface[];

  constructor() {
    this._entries = [];
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

  addEntry(entry: ExchangeAssetPriceEntryInterface): ExchangeAssetPriceEntryInterface {
    this._entries.push(entry);

    return entry;
  }

  getChanges(): {[key: string]: ExchangeAssetPriceChangeInterface} {
    const entriesCount = this._entries.length;
    if (entriesCount < 2) {
      return null;
    }

    const baseEntry = this._entries[entriesCount - 1];

    let changes = {};
    // We don't need the base (in this case the newest) one, so add -1 to the loop
    for (let i = 0; i < entriesCount - 1; i++) {
      const entry = this._entries[i];
      const prevEntry = i > 0
        ? this._entries[i - 1]
        : null;
      const differenceSeconds = Math.round((baseEntry.timestamp - entry.timestamp) / 1000);

      const basePrice = parseFloat(baseEntry.price);
      const price = parseFloat(entry.price);
      const prevPrice = prevEntry
        ? parseFloat(prevEntry.price)
        : 0;

      const absolutePricePercentage = ((price - basePrice) / basePrice) * 100;
      const relativePricePercentage = prevEntry
        ? ((price - prevPrice) / prevPrice) * 100
        : 0;

      changes[differenceSeconds + 's'] = {
        absolutePricePercentage,
        relativePricePercentage,
        basePrice,
        price,
        prevPrice,
      };
    }

    return changes;
  }

  getStatusText(time: number = +new Date()): string {
    const newestEntry = this.getNewestEntry();
    if (!newestEntry) {
      return chalk.italic('no price set yet');
    }

    const changes = this.getChanges();
    const changesString = changes
      ? Object.keys(changes).splice(0, 1).map((key) => { // as a temporary workaround, we only show the last change
        return (
          key + ' - ' +
          'Absolute: ' + colorTextByPercentage(changes[key].absolutePricePercentage)  + '; ' +
          'Relative: ' + colorTextByPercentage(changes[key].relativePricePercentage)
        );
      }).join('; ')
      : null;

    return (
      chalk.bold(newestEntry.price) +
      ' (updated ' + ((time - newestEntry.timestamp) / 1000) + 's ago)' +
      (changesString ? ' (' + changesString + ')' : '')
    );
  }
}

/***** Helpers *****/
const colorTextByPercentage = (value: number) => {
  if (value > 0) {
    return chalk.green(value.toPrecision(3) + '%');
  } else if (value < 0) {
    return chalk.red(value.toPrecision(3) + '%');
  }

  return value.toPrecision(3) + '%';
}
