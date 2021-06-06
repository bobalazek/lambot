import { ApiCredentials } from './ApiCredentials';
import { AssetPair } from './Asset';
import { Order, OrderFees } from './Order';
import { Session } from './Session';
import { ExchangesFactory } from './Exchanges';
import { SessionManager } from '../Manager/SessionManager';
import logger from '../Utils/Logger';

export interface ExchangeInterface {
  key: string;
  name: string;
  apiCredentials: ApiCredentials;
  assetPairDelimiter: string;
  boot(session: Session): Promise<boolean>;
  getAccountOrders(): Promise<Order[]>;
  addAccountOrder(order: Order): Promise<Order>;
  getAccountAssets(): Promise<ExchangeAccountAsset[]>;
  getAssetPairs(): Promise<AssetPair[]>;
  getAssetPrices(): Promise<ExchangeAssetPriceEntryInterface[]>;
  getAssetFees(symbol: string, amount: string): Promise<OrderFees>;
  getSession(): Session;
  getSessionAssetPairPrices(): ExchangeAssetPricesMap;
  getSessionAssetPairPrice(symbol: string): ExchangeAssetPriceInterface;
  addSessionAssetPairPrice(symbol: string, assetPairPrice: ExchangeAssetPriceInterface): ExchangeAssetPriceInterface;
  getSessionAssetPairPriceEntryNewest(symbol: string): ExchangeAssetPriceEntryInterface;
  addSessionAssetPairPriceEntry(
    symbol: string,
    assetPriceDataEntry: ExchangeAssetPriceEntryInterface,
    newestEntryInterval: number
  ): ExchangeAssetPriceEntryInterface;
}

export type ExchangeAssetPricesMap = Map<string, ExchangeAssetPriceInterface>;

export interface ExchangeAssetPriceChangeInterface {
  absolutePricePercentage: number; // absolute to the currently newest entry - ((price - newestPrice) / newestPrice) * 100
  relativePricePercentage: number; // relative to the previous entry - ((price - prevPrice) / prevPrice) * 100
  newestPrice: number;
  price: number;
  prevPrice: number;
}

export interface ExchangeAssetPriceInterface {
  getEntries(): ExchangeAssetPriceEntryInterface[];
  getNewestEntry(): ExchangeAssetPriceEntryInterface;
  addEntry(entry: ExchangeAssetPriceEntryInterface): ExchangeAssetPriceEntryInterface;
  getChanges(): {[key: string]: ExchangeAssetPriceChangeInterface};
  getStatusText(time: number): string;
}

export interface ExchangeAssetPriceEntryInterface {
  timestamp: number;
  price: string;
}

export interface ExchangeAssetPriceSymbolEntryInterface extends ExchangeAssetPriceEntryInterface {
  symbol: string;
}

export interface ExchangeAccountAssetInterface {
  exchange: Exchange;
  symbol: string;
  amountFree: string;
  amountLocked: string;
}

export class Exchange implements ExchangeInterface {
  key: string;
  name: string;
  apiCredentials: ApiCredentials;
  assetPairDelimiter: string;

  _session: Session;
  _sessionAssetPairPrices: ExchangeAssetPricesMap;

  constructor(
    key: string,
    name: string,
    apiCredentials: ApiCredentials,
    assetPairDelimiter: string = ''
  ) {
    this.key = key;
    this.name = name;
    this.apiCredentials = apiCredentials;
    this.assetPairDelimiter = assetPairDelimiter;

    this._sessionAssetPairPrices = new Map();
  }

  async boot(session: Session): Promise<boolean> {
    this._session = session;

    logger.info('Booting up the exchange ...');

    const sessionAssets = session.assets;
    if (sessionAssets.length === 0) {
      logger.critical('No assets found for this session!');

      process.exit(1);
    }

    const exhangeAssetPairs = await this.getAssetPairs();
    const exhangeAssetPairsSet = new Set(exhangeAssetPairs.map((assetPair) => {
      return assetPair.toString(this.assetPairDelimiter);
    }));

    logger.info('I will be trading with the following assets:');

    sessionAssets.forEach((sessionAsset) => {
      const sessionAssetAssetPairSet = sessionAsset.getAssetPairsSet();
      sessionAssetAssetPairSet.forEach((assetPairString) => {
        if (!exhangeAssetPairsSet.has(assetPairString)) {
          logger.critical(`Oh dear. We did not seem to have found the "${assetPairString}" asset pair on the exchange.`);

          process.exit(1);
        }
      });

      logger.info(sessionAsset.toString());
    });

    await SessionManager.save(session);

    return true;
  }

  async getAccountOrders(): Promise<Order[]> {
    throw new Error('getAccountOrders() not implemented yet.');
  }

  async addAccountOrder(order: Order): Promise<Order> {
    throw new Error('addAccountOrder() not implemented yet.');
  }

  async getAccountAssets(): Promise<ExchangeAccountAsset[]> {
    throw new Error('getAccountAssets() not implemented yet.');
  }

  async getAssetPairs(): Promise<AssetPair[]> {
    throw new Error('getAssetPairs() not implemented yet.');
  }

  async getAssetPrices(): Promise<ExchangeAssetPriceEntryInterface[]> {
    throw new Error('getAssetPrices() not implemented yet.');
  }

  async getAssetFees(symbol: string, amount: string): Promise<OrderFees> {
    throw new Error('getAssetFees() not implemented yet.');
  }

  getSession(): Session {
    return this._session;
  }

  getSessionAssetPairPrices(): ExchangeAssetPricesMap {
    return this._sessionAssetPairPrices;
  }

  getSessionAssetPairPrice(symbol: string): ExchangeAssetPriceInterface {
    return this._sessionAssetPairPrices.get(symbol);
  }

  addSessionAssetPairPrice(
    symbol: string,
    assetPairPrice: ExchangeAssetPrice = new ExchangeAssetPrice()
  ): ExchangeAssetPrice {
    this._sessionAssetPairPrices.set(symbol, assetPairPrice);

    return assetPairPrice;
  }

  getSessionAssetPairPriceEntryNewest(symbol: string): ExchangeAssetPriceEntryInterface {
    const symbolAssetPrice = <ExchangeAssetPrice>this.getSessionAssetPairPrice(symbol);
    if (!symbolAssetPrice) {
      return null;
    }

    return symbolAssetPrice.getNewestEntry();
  }

  addSessionAssetPairPriceEntry(
    symbol: string,
    assetPriceDataEntry: ExchangeAssetPriceEntryInterface
  ): ExchangeAssetPriceEntryInterface {
    const symbolAssetPrice = <ExchangeAssetPrice>this.getSessionAssetPairPrice(symbol);
    if (!symbolAssetPrice) {
      return null;
    }

    return symbolAssetPrice.addEntry(assetPriceDataEntry);
  }

  toExport(): Object {
    return {
      key: this.key,
      apiCredentials: {
        key: this.apiCredentials.key,
        secret: this.apiCredentials.secret,
      },
    };
  }

  static async fromImport(data: any): Promise<Exchange> {
    return ExchangesFactory.get(data.key, data.apiCredentials);
  }
}

export class ExchangeAccountAsset implements ExchangeAccountAssetInterface {
  exchange: Exchange;
  symbol: string;
  amountFree: string;
  amountLocked: string;

  constructor(
    exchange: Exchange,
    symbol: string,
    amountFree: string = '0',
    amountLocked: string = '0'
  ) {
    this.exchange = exchange;
    this.symbol = symbol;
    this.amountFree = amountFree;
    this.amountLocked = amountLocked;
  }
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

    const newestEntry = this._entries[entriesCount - 1];

    let changes = {};
    // We don't need the newest one, so add -1 to the loop
    for (let i = 0; i < entriesCount - 1; i++) {
      const entry = this._entries[i];
      const prevEntry = this._entries[i + 1];
      const differenceSeconds = Math.round((newestEntry.timestamp - entry.timestamp) / 1000);
      const newestPrice = parseFloat(newestEntry.price);
      const price = parseFloat(entry.price);
      const prevPrice = parseFloat(prevEntry.price);
      const absolutePricePercentage = ((price - newestPrice) / newestPrice) * 100;
      const relativePricePercentage = ((price - prevPrice) / prevPrice) * 100;

      changes[differenceSeconds + 's'] = {
        absolutePricePercentage,
        relativePricePercentage,
        newestPrice,
        price,
        prevPrice,
      };
    }

    return changes;
  }

  getStatusText(time: number = +new Date()): string {
    const newestEntry = this.getNewestEntry();
    if (!newestEntry) {
      return 'no price set yet';
    }

    const changes = this.getChanges();
    const changesString = changes
      ? Object.keys(changes).splice(0, 1).map((key) => {
        const change = changes[key];
        return (
          key + ' - ' +
          'ABS(' + change.absolutePricePercentage.toPrecision(3) + '%); ' +
          'REL(' + change.relativePricePercentage.toPrecision(3) + '%)'
        );
      }).join('; ')
      : null;

    return (
      newestEntry.price +
      ' (updated ' + ((time - newestEntry.timestamp) / 1000) + 's ago)' +
      (changesString ? ' (' + changesString + ')' : '')
    );
  }
}

