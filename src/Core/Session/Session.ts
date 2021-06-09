import chalk from 'chalk';

import { Asset } from '../Asset/Asset';
import { AssetPair } from '../Asset/AssetPair';
import { Assets } from '../Asset/Assets';
import { Exchange } from '../Exchange/Exchange';
import { SessionAsset } from './SessionAsset';
import { SessionConfig } from './SessionConfig';
import { Strategy } from '../Strategy/Strategy';
import {
  ExchangeAssetPrice,
  ExchangeAssetPriceEntryInterface,
  ExchangeAssetPriceInterface,
  ExchangeAssetPricesMap,
} from '../Exchange/ExchangeAssetPrice';
import logger from '../../Utils/Logger';

export enum SessionStatusEnum {
  PENDING = 'PENDING',
  STARTED = 'STARTED',
  ENDED = 'ENDED',
}

export interface SessionInterface {
  id: string;
  exchange: Exchange;
  config: SessionConfig;
  assets: SessionAsset[];
  status: SessionStatusEnum;
  createdAt: number;
  startedAt: number;
  endedAt: number;
  assetPairPrices: ExchangeAssetPricesMap;
  getAssetPairsList(): Set<string>;
  addAssetPairPrice(
    symbol: string,
    assetPairPrice: ExchangeAssetPriceInterface
  ): ExchangeAssetPriceInterface;
  addAssetPairPriceEntry(
    symbol: string,
    assetPriceDataEntry: ExchangeAssetPriceEntryInterface
  ): ExchangeAssetPriceEntryInterface;
  toExport(): unknown;
}

export class Session implements SessionInterface {
  id: string;
  exchange: Exchange;
  config: SessionConfig;
  assets: SessionAsset[];
  status: SessionStatusEnum;
  createdAt: number;
  startedAt: number;
  endedAt: number;
  assetPairPrices: ExchangeAssetPricesMap;

  constructor(id: string, exchange: Exchange, config: SessionConfig) {
    this.id = id;
    this.exchange = exchange;
    this.config = config;
    this.assets = [];
    this.status = SessionStatusEnum.STARTED;
    this.createdAt = +new Date();
    this.startedAt = +new Date();
    this.assetPairPrices = new Map();
  }

  /**
   * Add a asset to this session.
   *
   * @param asset Which is the base asset we want to do all the trades with?
   * @param assetPairs Which pairs do we want to trade with?
   * @param strategy What strategy do we want to use?
   */
  addAsset(
    asset: Asset,
    assetPairs: AssetPair[],
    strategy: Strategy
  ) {
    this.assets.push(
      new SessionAsset(
        asset,
        assetPairs,
        strategy
      )
    );

    assetPairs.forEach((assetPair) => {
      this.addAssetPairPrice(
        assetPair.toString(this.exchange.assetPairConverter)
      );
    });
  }

  getAssetPairsList(): Set<string> {
    const assetPairs = new Set<string>();

    this.assets.forEach((sessionAsset) => {
      sessionAsset.getAssetPairsSet(this.exchange.assetPairConverter).forEach((assetPair) => {
        assetPairs.add(assetPair);
      });
    });

    return assetPairs;
  }

  addAssetPairPrice(
    symbol: string,
    assetPairPrice: ExchangeAssetPrice = new ExchangeAssetPrice()
  ): ExchangeAssetPrice {
    this.assetPairPrices.set(symbol, assetPairPrice);

    return assetPairPrice;
  }

  addAssetPairPriceEntry(
    symbol: string,
    assetPriceDataEntry: ExchangeAssetPriceEntryInterface
  ): ExchangeAssetPriceEntryInterface {
    const symbolAssetPrice = this.assetPairPrices.get(symbol);
    if (!symbolAssetPrice) {
      return null;
    }

    return symbolAssetPrice.addEntry(assetPriceDataEntry);
  }

  toExport() {
    const assets = this.assets.map((sessionAsset) => {
      return {
        asset: sessionAsset.asset.toString(),
        assetPairs: sessionAsset.assetPairs.map((assetPair) => {
          return [
            assetPair.assetBase.toString(),
            assetPair.assetQuote.toString(),
          ];
        }),
        strategy: sessionAsset.strategy.toExport(),
      };
    });

    return {
      id: this.id,
      assets,
      status: this.status,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      exchange: this.exchange.toExport(),
      config: this.config.toExport(),
    };
  }

  static async fromImport(data: any): Promise<Session> {
    const sessionData = data.session;
    if (sessionData.status === SessionStatusEnum.ENDED) {
      logger.critical(chalk.red.bold(
        'The session you are trying to import has already ended. Please create a new one instead.'
      ));

      process.exit(1);
    }

    const exchange = await Exchange.fromImport(sessionData.exchange);
    const config = SessionConfig.fromImport(sessionData.config);
    const session = new Session(
      sessionData.id,
      exchange,
      config
    );

    sessionData.assets.forEach((assetData) => {
      session.addAsset(
        Assets.getBySymbol(assetData.asset),
        assetData.assetPairs.map((assetPair) => {
          return new AssetPair(
            Assets.getBySymbol(assetPair[0]),
            Assets.getBySymbol(assetPair[1])
          );
        }),
        Strategy.fromImport(assetData.strategy)
      );
    });

    session.status = sessionData.status;
    session.createdAt = sessionData.createdAt;
    session.endedAt = sessionData.endedAt;

    return session;
  }
}
