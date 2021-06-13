import chalk from 'chalk';

import { Asset } from '../Asset/Asset';
import { AssetPair } from '../Asset/AssetPair';
import { Assets } from '../Asset/Assets';
import { Exchange } from '../Exchange/Exchange';
import { ExchangeAssetPrice } from '../Exchange/ExchangeAssetPrice';
import { SessionAsset, SessionAssetTradingTypeEnum } from './SessionAsset';
import { SessionConfig } from './SessionConfig';
import { Strategy } from '../Strategy/Strategy';
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
  getAssetPairsList(): Set<string>;
  toExport(): unknown;
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
  }

  addAsset(sessionAsset: SessionAsset) {
    this.assets.push(sessionAsset);

    sessionAsset.assetPairs.forEach((assetPair) => {
      this.exchange.assetPairPrices.set(
        assetPair.toString(this.exchange.assetPairConverter),
        new ExchangeAssetPrice()
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

    const exchange = await Exchange.fromImport(sessionData.exchange);
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
