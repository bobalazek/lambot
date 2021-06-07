import chalk from 'chalk';

import { Asset } from '../Asset/Asset';
import { AssetPair } from '../Asset/AssetPair';
import { Assets } from '../Asset/Assets';
import { Exchange } from '../Exchange/Exchange';
import logger from '../../Utils/Logger';
import { SessionAsset } from './SessionAsset';
import { SessionConfig } from './SessionConfig';

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
  getAllAssetPairsSet(): Set<string>;
  toExport(): Object;
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

  constructor(id: string, exchange: Exchange, config: SessionConfig) {
    this.id = id;
    this.exchange = exchange;
    this.config = config;
    this.assets = [];
    this.status = SessionStatusEnum.STARTED;
    this.createdAt = +new Date();
    this.startedAt = +new Date();
  }

  /**
   * Add a asset to this session.
   *
   * @param asset Which is the base asset we want to do all the trades with?
   * @param assetPairs Which pairs do we want to trade with?
   */
  addAsset(
    asset: Asset,
    assetPairs: AssetPair[]
  ) {
    this.assets.push(
      new SessionAsset(
        asset,
        assetPairs
      )
    );

    assetPairs.forEach((assetPair) => {
      this.exchange.addSessionAssetPairPrice(
        assetPair.toString(this.exchange.assetPairConverter)
      );
    });
  }

  getAllAssetPairsSet(): Set<string> {
    const assetPairs = new Set<string>();

    this.assets.forEach((sessionAsset) => {
      sessionAsset.getAssetPairsSet(this.exchange.assetPairConverter).forEach((assetPair) => {
        assetPairs.add(assetPair);
      });
    });

    return assetPairs;
  }

  toExport(): Object {
    const assets = this.assets.map((sessionAsset) => {
      return {
        asset: sessionAsset.asset.toString(),
        assetPairs: sessionAsset.assetPairs.map((assetPair) => {
          return [
            assetPair.assetBase.toString(),
            assetPair.assetQuote.toString(),
          ];
        }),
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
    const config = await SessionConfig.fromImport(sessionData.config);
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
      );
    });

    session.status = sessionData.status;
    session.createdAt = sessionData.createdAt;
    session.endedAt = sessionData.endedAt;

    return session;
  }
}
