import Websocket from 'ws';

import { ApiCredentials } from '../Core/ApiCredentials';
import { Exchange } from '../Core/Exchange';
import { Session } from '../Core/Session';
import logger from '../Utils/Logger';

const ASSET_PRICING_UPDATE_INTERVAL: number = 1000;

export class BinanceExchange extends Exchange {
  constructor(apiCredentials: ApiCredentials) {
    super('binance', 'Binance', apiCredentials);

    if (!apiCredentials.key || !apiCredentials.secret) {
      console.error('Please set BINANCE_API_KEY and BINANCE_API_SECRET in your .env file!');

      process.exit(1);
    }
  }

  async boot(session: Session): Promise<boolean> {
    this._session = session;

    await this._prepareWebsocket('btcusdt@aggTrade');

    return true;
  }

  async _prepareWebsocket(streams: string) {
    return new Promise((resolve, reject) => {
      logger.info('Starting binance websocket ...');

      const ws = new Websocket(`wss://stream.binance.com:9443/ws/!bookTicker`);
      const watchedAssetPairs = new Set<string>();
      this._session.assets.forEach((asset) => {
        asset.assetPairs.forEach((assetPair) => {
          watchedAssetPairs.add(assetPair.toString());
        });
      });

      ws.on('open', () => {
        logger.info('Binance Websocket open');

        resolve(true);
      });

      ws.on('close', (error) => {
        logger.info('Binance Websocket closed');

        reject(error);
      });

      ws.on('error', (error) => {
        logger.error('Binance Websocket error: ' + error.message);

        reject(error);
      });

      ws.on('message', (data) => {
        // logger.debug('Binance Websocket message: ' + data);

        const parsedData = JSON.parse(data.toString());
        const asset = parsedData.s;
        if (!watchedAssetPairs.has(asset)) {
          return;
        }

        const assetAskPrice = parsedData.a;
        const assetBidPrice = parsedData.b;

        const now = +new Date();

        if (!this._assetPrices.has(asset)) {
          this._assetPrices.set(asset, []);
        } else {
          const assetPrices = this._assetPrices.get(asset);

          if (assetPrices.length > 0) {
            const assetPricesLast = assetPrices[assetPrices.length - 1];
            if (now - assetPricesLast.timestamp < ASSET_PRICING_UPDATE_INTERVAL) {
              return;
            }
          }

          assetPrices.push({
            timestamp: now,
            value: assetAskPrice,
          });
        }
      });

      setInterval(() => {
        // TODO: possibly do some garbage collection and only save the last XX entries
        // console.log(this._assetPrices);
      }, ASSET_PRICING_UPDATE_INTERVAL);
    });
  }
}
