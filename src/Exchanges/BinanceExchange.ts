import axios from 'axios';
import Websocket from 'ws';

import { ApiCredentials } from '../Core/ApiCredentials';
import { AssetPair, Assets } from '../Core/Asset';
import { Exchange } from '../Core/Exchange';
import { Session } from '../Core/Session';
import logger from '../Utils/Logger';

export class BinanceExchange extends Exchange {
  private _assetPairPriceUpdateInterval: number = 5000;

  constructor(apiCredentials: ApiCredentials) {
    super('binance', 'Binance', apiCredentials ,'');

    if (!apiCredentials.key || !apiCredentials.secret) {
      logger.error('Please set BINANCE_API_KEY and BINANCE_API_SECRET in your .env file!');

      process.exit(1);
    }
  }

  async boot(session: Session): Promise<boolean> {
    await super.boot(session);

    await this._prepareWebsocket();

    setInterval(() => {
      console.log(this.getSessionAssetPairPrices());
    }, 5000);

    return true;
  }

  async getAssetPairs(): Promise<AssetPair[]> {
    logger.debug('Fetching asset pairs ...');

    const response = await axios.get('https://api.binance.com/api/v3/exchangeInfo');

    let assetPairs = [];
    for (let i = 0; i < response.data.symbols.length; i++) {
      const symbolData = response.data.symbols[i];

      assetPairs.push(
        new AssetPair(
          Assets.getBySymbol(symbolData.baseAsset),
          Assets.getBySymbol(symbolData.quoteAsset)
        )
      );
    }

    return assetPairs;
  }

  async _prepareWebsocket() {
    return new Promise((resolve, reject) => {
      logger.info('Starting binance websocket ...');

      const ws = new Websocket(`wss://stream.binance.com:9443/ws/!bookTicker`);
      const allAssetPairs = this.getSession().getAllAssetPairsSet();

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
        if (!allAssetPairs.has(asset)) {
          return;
        }

        const now = +new Date();
        const assetAskPrice = parsedData.a;
        const assetBidPrice = parsedData.b;

        // Only add a new entry if the last one was added more then the interval ago ...
        const lastAssetPairPriceEntry = this.getSessionAssetPairPriceEntryLast(asset);
        if (
          !lastAssetPairPriceEntry ||
          (
            lastAssetPairPriceEntry &&
            now - lastAssetPairPriceEntry.timestamp > this._assetPairPriceUpdateInterval
          )
        ) {
          this.addSessionAssetPairPriceEntry(asset, {
            timestamp: now,
            askPrice: assetAskPrice,
            bidPrice: assetBidPrice,
          });
        }
      });
    });
  }
}
