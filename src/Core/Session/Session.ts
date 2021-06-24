import chalk from 'chalk';

import { AssetPair } from '../Asset/AssetPair';
import { Exchange } from '../Exchange/Exchange';
import { ExchangeAssetPair } from '../Exchange/ExchangeAssetPair';
import { SessionAsset } from './SessionAsset';
import { SessionConfig } from './SessionConfig';
import logger from '../../Utils/Logger';

export interface SessionInterface {
  id: string;
  exchange: Exchange;
  config: SessionConfig;
  assets: SessionAsset[];
  status: SessionStatusEnum;
  createdAt: number;
  startedAt: number;
  endedAt: number;
  isLoadedFromPersistence: boolean;
  addAsset(sessionAsset: SessionAsset): SessionAsset;
  addAssetPair(assetPair: AssetPair): AssetPair;
  clearAssets(): void;
  getAllAssetPairs(): Set<string>;
  getKey(): string;
}

export enum SessionStatusEnum {
  PENDING = 'PENDING',
  STARTED = 'STARTED',
  ENDED = 'ENDED',
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
  isLoadedFromPersistence: boolean;

  constructor(
    id: string,
    exchange: Exchange,
    config: SessionConfig
  ) {
    this.id = id;
    this.exchange = exchange;
    this.config = config;
    this.assets = [];
    this.status = SessionStatusEnum.STARTED;
    this.createdAt = Date.now();
    this.startedAt = Date.now();
    this.isLoadedFromPersistence = false;
  }

  addAsset(sessionAsset: SessionAsset) {
    this.assets.push(sessionAsset);

    sessionAsset.assetPairs.forEach((assetPair) => {
      this.addAssetPair(assetPair);
    });

    return sessionAsset;
  }

  addAssetPair(assetPair: AssetPair) {
    this.exchange.assetPairPrices.set(
      assetPair.getKey(),
      new ExchangeAssetPair(assetPair)
    );

    return assetPair;
  }

  clearAssets() {
    this.assets = [];
    this.exchange.assetPairPrices.clear();
  }

  getAllAssetPairs(): Set<string> {
    const assetPairs = new Set<string>();

    this.assets.forEach((sessionAsset) => {
      sessionAsset.getAssetPairs().forEach((assetPair) => {
        assetPairs.add(assetPair);
      });
    });

    return assetPairs;
  }

  getKey() {
    return JSON.stringify({
      id: this.id,
      exchange: this.exchange.key,
      createdAt: this.createdAt,
      assets: this.assets.map((sessionAsset) => {
        return sessionAsset.getKey();
      }),
    });
  }

  /***** Export/Import *****/
  toExport() {
    return {
      id: this.id,
      assets: this.assets.map((sessionAsset) => {
        return sessionAsset.toExport();
      }),
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

    const exchange = Exchange.fromImport(sessionData.exchange);
    const config = SessionConfig.fromImport(sessionData.config);
    const session = new Session(
      sessionData.id,
      exchange,
      config
    );

    sessionData.assets.forEach((assetData) => {
      const sessionAsset = SessionAsset.fromImport(assetData);
      session.addAsset(sessionAsset);
    });

    session.status = sessionData.status;
    session.createdAt = sessionData.createdAt;
    session.endedAt = sessionData.endedAt;

    return session;
  }
}
