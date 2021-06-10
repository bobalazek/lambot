import axios, { AxiosResponse } from 'axios';
import qs from 'qs';
import crypto from 'crypto';
import chalk from 'chalk';

import { ApiCredentials } from '../Core/Api/ApiCredentials';
import { AssetPair, AssetPairStringConverterDefault } from '../Core/Asset/AssetPair';
import { Assets } from '../Core/Asset/Assets';
import { Exchange } from '../Core/Exchange/Exchange';
import { ExchangeAccountAsset, ExchangeAccountAssetInterface } from '../Core/Exchange/ExchangeAccountAsset';
import { ExchangeAssetPair } from '../Core/Exchange/ExchangeAssetPair';
import { ExchangeAssetPriceWithSymbolEntryInterface } from '../Core/Exchange/ExchangeAssetPrice';
import { ExchangeOrderFees, ExchangeOrderFeesTypeEnum } from '../Core/Exchange/ExchangeOrderFees';
import { ExchangeAccountTypeEnum } from '../Core/Exchange/ExchangeAccount';
import { ExchangeOrder } from '../Core/Exchange/ExchangeOrder';
import logger from '../Utils/Logger';
import { Session } from '../Core/Session/Session';

enum RequestMethodEnum {
  GET = 'GET',
  POST = 'POST',
};

export class BinanceExchange extends Exchange {
  private _timeOffset: number;
  private _symbolAssetPairsMap: Map<string, [string, string]>;

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

    this._timeOffset = 0;
    this._symbolAssetPairsMap = new Map();
  }

  async boot(session: Session): Promise<boolean> {
    super.boot(session);

    await this._setTimeOffset();

    return true;
  }

  /***** API Data fetching ******/
  async getAccountOrders(type: ExchangeAccountTypeEnum, symbol: string = null): Promise<ExchangeOrder[]> {
    logger.debug(chalk.italic('Fetching account orders ...'));

    if (type !== ExchangeAccountTypeEnum.SPOT) {
      logger.critical(chalk.red.bold('Currently only the SPOT account is implemented.'));

      process.exit(1);
    }

    // TODO: we will probably want to cache the orders somewhere?

    try {
      const response = await this._doRequest(
        RequestMethodEnum.GET,
        // 'https://api.binance.com/api/v3/allOrders', // rather all? That one then does require the symbol
        'https://api.binance.com/api/v3/openOrders',
        {
          symbol,
          // limit: 1000, in case we want to use the allOrders endpoint
          // startTime: 0,
          // endTime: 0,
        },
        true
      );

      const orders: ExchangeOrder[] = [];
      for (let i = 0; i < response.data.length; i++) {
        const orderData = response.data[i];

        if (!this._symbolAssetPairsMap.has(orderData.symbol)) {
          logger.critical(chalk.red.bold(
            'Could not find the symbol in the asset pairs array. ' +
            'Make sure getAssetPairs() was called before.'
          ));

          process.exit(1);
        }

        const assetPairArray = this._symbolAssetPairsMap.get(orderData.symbol);

        orders.push(
          new ExchangeOrder(
            orderData.clientOrderId ?? orderData.orderId,
            new AssetPair(
              Assets.getBySymbol(assetPairArray[0]),
              Assets.getBySymbol(assetPairArray[1])
            ),
            orderData.side,
            orderData.origQty,
            orderData.price,
            orderData.type,
            type,
            orderData
          )
        );
      }

      return orders;
    } catch (error) {
      logger.error(chalk.red(error.response.data.msg));

      throw new Error(error);
    }
  }

  async getAccountAssets(type: ExchangeAccountTypeEnum): Promise<ExchangeAccountAssetInterface[]> {
    logger.debug(chalk.italic('Fetching account assets ...'));

    if (type !== ExchangeAccountTypeEnum.SPOT) {
      logger.critical(chalk.red.bold('Currently only the SPOT account is implemented.'));

      process.exit(1);
    }

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
      logger.error(chalk.red(error.response.data.msg));

      throw new Error(error);
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

        this._symbolAssetPairsMap.set(
          symbolData.symbol,
          [symbolData.baseAsset, symbolData.quoteAsset]
        );
      }

      return assetPairs;
    } catch (error) {
      logger.error(chalk.red(error.response.data.msg));

      throw new Error(error);
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
      logger.error(chalk.red(error.response.data.msg));

      throw new Error(error);
    }
  }

  async getAssetFees(
    symbol: string,
    amount: string,
    orderFeesType: ExchangeOrderFeesTypeEnum
  ): Promise<ExchangeOrderFees> {
    // TODO: check if we have any BNB in our account,
    // because only then the fee is 0.075%, else it's 0.1%.
    // You will also need to enable it in the dashboard
    // https://www.binance.com/en/fee/trading

    return new ExchangeOrderFees(0.075);
  }

  /***** Helpers *****/
  async _setTimeOffset(): Promise<void> {
    const response = await this._doRequest(
      RequestMethodEnum.GET,
      'https://api.binance.com/api/v3/time',
    );

    this._timeOffset = response.data.serverTime - +new Date();
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
      const timestamp = +new Date() + this._timeOffset;

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
