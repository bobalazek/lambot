import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import chalk from 'chalk';
import Websocket from 'ws';

import { ApiCredentials } from '../Core/Api/ApiCredentials';
import { AssetPair, AssetPairStringConverterDefault } from '../Core/Asset/AssetPair';
import { Assets } from '../Core/Asset/Assets';
import { Exchange } from '../Core/Exchange/Exchange';
import { ExchangeAssetPriceWithSymbolEntryInterface } from '../Core/Exchange/ExchangeAssetPrice';
import { OrderFees } from '../Core/Order/Order';
import { Session } from '../Core/Session/Session';
import logger from '../Utils/Logger';

export class BinanceExchange extends Exchange {
  constructor(apiCredentials: ApiCredentials) {
    super(
      'binance',
      'Binance',
      apiCredentials,
      new AssetPairStringConverterDefault()
    );

    if (!apiCredentials.key || !apiCredentials.secret) {
      logger.critical(chalk.red.bold(
        'Please set BINANCE_API_KEY and BINANCE_API_SECRET in your .env file!'
      ));

      process.exit(1);
    }
  }

  async boot(session: Session): Promise<boolean> {
    await super.boot(session);

    const updateInterval = this._session.config.assetPriceUpdateIntervalSeconds * 1000;

    // await this._prepareWebsocket(updateInterval);
    this._startAssetPriceUpdating(updateInterval);

    return true;
  }

  async getAssetPairs(): Promise<AssetPair[]> {
    logger.debug(chalk.italic('Fetching asset pairs ...'));

    try {
      const response = await this._doRequest({
        method: 'GET',
        url: 'https://api.binance.com/api/v3/exchangeInfo',
      });

      // TODO: split that into a separate call (getInfo() or something)
      // and cache those pairs locally when we need them.

      const assetPairs: AssetPair[] = [];
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
    } catch (error) {
      logger.error(chalk.red(error));

      return error;
    }
  }

  async getAssetPrices(): Promise<ExchangeAssetPriceWithSymbolEntryInterface[]> {
    logger.debug(chalk.italic('Fetching asset prices ...'));

    try {
      const response = await this._doRequest({
        method: 'GET',
        url: 'https://api.binance.com/api/v3/ticker/price',
      });
      const now = +new Date();

      const assetPrices: ExchangeAssetPriceWithSymbolEntryInterface[] = [];
      for (let i = 0; i < response.data.length; i++) {
        const assetData = response.data[i];

        assetPrices.push({
          symbol: assetData.symbol,
          price: assetData.price,
          timestamp: now,
        });
      }

      return assetPrices;
    } catch (error) {
      logger.error(chalk.red(error));

      return error;
    }
  }

  async getAssetFees(symbol: string, amount: string): Promise<OrderFees> {
    // TODO: check if we have any BNB in our account,
    // because only then the fee is 0.075%.
    // You will also need to enable it in the dashboard

    return new OrderFees(
      '0.075',
      '0.075',
      Assets.BNB
    );
  }

  _startAssetPriceUpdating(updateInterval: number) {
    const allAssetPairs = this.getSession().getAllAssetPairsSet();

    return setInterval(async () => {
      const assetPrices = await this.getAssetPrices();
      const now = +new Date();

      for (let i = 0; i < assetPrices.length; i++) {
        const assetData = assetPrices[i];
        if (!allAssetPairs.has(assetData.symbol)) {
          continue;
        }

        this.addSessionAssetPairPriceEntry(assetData.symbol, {
          timestamp: now,
          price: assetData.price,
        });
      }
    }, updateInterval);
  }

  async _prepareWebsocket(updateInterval: number) {
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
        logger.error(chalk.red('Binance Websocket error: ' + error.message));

        reject(error);
      });

      ws.on('message', (data) => {
        const parsedData = JSON.parse(data.toString());
        const asset = parsedData.s;
        if (!allAssetPairs.has(asset)) {
          return;
        }

        const now = +new Date();
        const price = parsedData.b; // Bid price; parsedData.a is Ask price

        // Only add a new entry if the newest one was added more then the interval ago ...
        const newestAssetPairPriceEntry = this.getSessionAssetPairPriceEntryNewest(asset);
        if (
          !newestAssetPairPriceEntry ||
          (
            newestAssetPairPriceEntry &&
            now - newestAssetPairPriceEntry.timestamp > updateInterval
          )
        ) {
          this.addSessionAssetPairPriceEntry(asset, {
            timestamp: now,
            price: price,
          });
        }
      });
    });
  }

  async _doRequest(config: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    logger.log(chalk.italic(
      `Making a ${config.method} request to ${config.url}`
    ));

    const response = await axios(config);

    const rateLimitWeightTotal = 1200;
    const rateLimitWeightUsed = parseInt(response.headers['x-mbx-used-weight-1m']);

    logger.log(chalk.italic(
      `You used ${rateLimitWeightUsed} request weight points out of ${rateLimitWeightTotal}`
    ));

    return response;
  }
}
