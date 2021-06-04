import Websocket from 'ws';

import { ApiCredentials } from '../Core/ApiCredentials';
import { Exchange } from '../Core/Exchange';
import { Session } from '../Core/Session';
import logger from '../Utils/Logger';

export class BinanceExchange extends Exchange {
  constructor(apiCredentials: ApiCredentials) {
    super('binance', 'Binance', apiCredentials);

    if (!apiCredentials.key || !apiCredentials.secret) {
      logger.error('Please set BINANCE_API_KEY and BINANCE_API_SECRET in your .env file!');

      process.exit(1);
    }
  }

  async boot(session: Session): Promise<boolean> {
    this._session = session;

    await this._prepareWebsocket();

    setInterval(() => {
      console.log(this.getAssetPairPrices());
    }, 5000);

    return true;
  }

  async _prepareWebsocket() {
    return new Promise((resolve, reject) => {
      logger.info('Starting binance websocket ...');

      const ws = new Websocket(`wss://stream.binance.com:9443/ws/!bookTicker`);
      const watchedAssetPairs = this.getAssetPairsSet();

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
        const parsedData = JSON.parse(data.toString());
        const asset = parsedData.s;
        if (!watchedAssetPairs.has(asset)) {
          return;
        }

        const now = +new Date();
        const assetAskPrice = parsedData.a;
        const assetBidPrice = parsedData.b;

        this.addAssetPairPriceEntry(asset, {
          timestamp: now,
          askPrice: assetAskPrice,
          bidPrice: assetBidPrice,
        });
      });
    });
  }
}
