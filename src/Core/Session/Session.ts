import chalk from 'chalk';

import { Asset, AssetPair, Assets } from '../Asset/Asset';
import { Exchange } from '../Exchange/Exchange';
import logger from '../../Utils/Logger';
import { SessionAsset } from './SessionAsset';

export enum SessionStatusEnum {
  PENDING = 'PENDING',
  STARTED = 'STARTED',
  ENDED = 'ENDED',
}

export interface SessionInterface {
  id: string;
  exchange: Exchange;
  assets: SessionAsset[];
  status: SessionStatusEnum;
  createdAt: number;
  startedAt: number;
  endedAt: number;
  getAllAssetPairsSet(): Set<string>;
}

export class Session implements SessionInterface {
  id: string;
  exchange: Exchange;
  assets: SessionAsset[];
  status: SessionStatusEnum;
  createdAt: number;
  startedAt: number;
  endedAt: number;

  constructor(id: string, exchange: Exchange) {
    this.id = id;
    this.exchange = exchange;
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
   * @param amountTotal What is the total amount we want to spend of this asset from this session?
   * @param amountPerOrder How much of this asset do we want to spend of per order?
   */
  addAsset(
    asset: Asset,
    assetPairs: AssetPair[],
    amountTotal: string,
    amountPerOrder: string
  ) {
    this.assets.push(
      new SessionAsset(
        this,
        asset,
        assetPairs,
        amountTotal,
        amountPerOrder
      )
    );

    assetPairs.forEach((assetPair) => {
      this.exchange.addSessionAssetPairPrice(
        assetPair.toString(this.exchange.assetPairDelimiter)
      );
    });
  }

  getAllAssetPairsSet(): Set<string> {
    const assetPairs = new Set<string>();

    this.assets.forEach((sessionAsset) => {
      sessionAsset.getAssetPairsSet().forEach((assetPair) => {
        assetPairs.add(assetPair);
      });
    });

    return assetPairs;
  }

  toExport(): Object {
    const assets = [];

    this.assets.forEach((sessionAsset) => {
      assets.push({
        asset: sessionAsset.asset.toString(),
        assetPairs: sessionAsset.assetPairs.map((assetPair) => {
          return [
            assetPair.assetBase.toString(),
            assetPair.assetQuote.toString(),
          ];
        }),
        amountTotal: sessionAsset.amountTotal,
        amountPerOrder: sessionAsset.amountPerOrder,
      });
    });

    return {
      id: this.id,
      assets,
      status: this.status,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
    };
  }

  static async fromImport(data: any): Promise<Session> {
    const sessionData = data.session;
    const exchangeData = data.exchange;

    if (sessionData.status === SessionStatusEnum.ENDED) {
      logger.critical(chalk.red.bold(
        'The session you are trying to import has already ended. Please create a new one instead.'
      ));

      process.exit(1);
    }

    const exchange = await Exchange.fromImport(exchangeData);
    const session = new Session(
      sessionData.id,
      exchange
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
        assetData.amountTotal,
        assetData.amountPerOrder,
      );
    });

    session.status = sessionData.status;
    session.createdAt = sessionData.createdAt;
    session.endedAt = sessionData.endedAt;

    return session;
  }
}
