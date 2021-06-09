import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import qs from 'qs';
import crypto from 'crypto';
import chalk from 'chalk';

import { ApiCredentials } from '../Core/Api/ApiCredentials';
import { AssetPairStringConverterDefault } from '../Core/Asset/AssetPair';
import { Assets } from '../Core/Asset/Assets';
import { Exchange } from '../Core/Exchange/Exchange';
import { ExchangeAccountAsset, ExchangeAccountAssetInterface } from '../Core/Exchange/ExchangeAccountAsset';
import { ExchangeAssetPair } from '../Core/Exchange/ExchangeAssetPair';
import { ExchangeAssetPriceWithSymbolEntryInterface } from '../Core/Exchange/ExchangeAssetPrice';
import { OrderFees, OrderFeesTypeEnum } from '../Core/Order/OrderFees';
import logger from '../Utils/Logger';

enum RequestMethodEnum {
  GET = 'GET',
  POST = 'POST',
};

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

  async getAccountAssets(): Promise<ExchangeAccountAssetInterface[]> {
    logger.debug(chalk.italic('Fetching account assets ...'));

    try {
      const response = await this._doRequest(
        RequestMethodEnum.GET,
        'https://api.binance.com/api/v3/account',
        {},
        true
      );

      const accountAssets: ExchangeAccountAsset[] = [];
      for (let i = 0; i < response.data.balances.length; i++) {
        const balanceData = response.data.balances[i];

        accountAssets.push(
          new ExchangeAccountAsset(
            Assets.getBySymbol(balanceData.asset),
            balanceData.free,
            balanceData.locked
          )
        );
      }

      return accountAssets;
    } catch (error) {
      logger.error(chalk.red(error));

      return error;
    }
  }

  async getAssetPairs(): Promise<ExchangeAssetPair[]> {
    logger.debug(chalk.italic('Fetching asset pairs ...'));

    try {
      const response = await this._doRequest(
        RequestMethodEnum.GET,
        'https://api.binance.com/api/v3/exchangeInfo'
      );

      // TODO: split that into a separate call (getInfo() or something)
      // and cache those pairs locally when we need them.

      const assetPairs: ExchangeAssetPair[] = [];
      for (let i = 0; i < response.data.symbols.length; i++) {
        const symbolData = response.data.symbols[i];

        let amountMinimum = '0';
        let amountMaximum = '0';
        let priceMinimum = '0';
        let priceMaximum = '0';

        symbolData.filters.forEach((symbolFilterData) => {
          if (symbolFilterData.filterType === 'MARKET_LOT_SIZE') { // or LOT_SIZE rather?
            amountMinimum = symbolFilterData.minQty;
            amountMaximum = symbolFilterData.maxQty;
          } else if (symbolFilterData.filterType === 'PRICE_FILTER') {
            priceMinimum = symbolFilterData.minPrice;
            priceMaximum = symbolFilterData.maxPrice;
          }
        });

        assetPairs.push(
          new ExchangeAssetPair(
            Assets.getBySymbol(symbolData.baseAsset),
            Assets.getBySymbol(symbolData.quoteAsset),
            amountMinimum,
            amountMaximum,
            priceMinimum,
            priceMaximum
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
    logger.debug(chalk.italic(
      'Fetching asset prices ...'
    ));

    try {
      const response = await this._doRequest(
        RequestMethodEnum.GET,
        'https://api.binance.com/api/v3/ticker/price'
      );
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

  async getAssetFees(symbol: string, amount: string, orderFeesType: OrderFeesTypeEnum): Promise<OrderFees> {
    // TODO: check if we have any BNB in our account,
    // because only then the fee is 0.075%, else it's 0.1%.
    // You will also need to enable it in the dashboard
    // https://www.binance.com/en/fee/trading

    return new OrderFees(0.075);
  }

  async _doRequest(
    method: RequestMethodEnum,
    url: string,
    dataOrParams: any = null,
    signed: boolean = false
  ): Promise<AxiosResponse<any>> {
    logger.log(chalk.italic(
      `Making a ${method} request to ${url}`
    ));

    let params: any = {};
    let data: any = {};
    let headers: any = {};

    if (dataOrParams && method === RequestMethodEnum.GET) {
      params = dataOrParams;
    } else if (dataOrParams && method === RequestMethodEnum.POST) {
      data = dataOrParams;
    }

    if (signed) {
      const timestamp = +new Date();

      headers['X-MBX-APIKEY'] = this.apiCredentials.key;

      params.recvWindow = 5000;
      params.timestamp = timestamp;

      const signatureData = method === RequestMethodEnum.POST
        ? qs.stringify(data)
        : qs.stringify(params);

      const signature = crypto
        .createHmac('sha256', this.apiCredentials.secret)
        .update(signatureData)
        .digest('hex');

      if (method === RequestMethodEnum.POST) {
        data.signature = signature;
      } else {
        params.signature = signature;
      }
    }

    const config: any = {
      method,
      url,
    };

    if (Object.keys(params).length !== 0) {
      config.params = params;
    }

    if (Object.keys(data).length !== 0) {
      config.data = data;
    }

    if (Object.keys(headers).length !== 0) {
      config.headers = headers;
    }

    const response = await axios(config);

    const rateLimitWeightTotal = 1200;
    const rateLimitWeightUsed = parseInt(response.headers['x-mbx-used-weight-1m']);

    logger.log(chalk.italic(
      `You used ${rateLimitWeightUsed} request weight points out of ${rateLimitWeightTotal}`
    ));

    return response;
  }
}
