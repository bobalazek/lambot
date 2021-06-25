import axios, { AxiosResponse } from 'axios';
import qs from 'qs';
import crypto from 'crypto';
import chalk from 'chalk';

import { ExchangeApiCredentialsInterface } from '../Core/Exchange/ExchangeApiCredentials';
import { AssetPair } from '../Core/Asset/AssetPair';
import { AssetPairStringConverterInterface } from '../Core/Asset/AssetPairStringConverter';
import { Assets } from '../Core/Asset/Assets';
import { Exchange } from '../Core/Exchange/Exchange';
import { ExchangeAccountTypeEnum } from '../Core/Exchange/ExchangeAccount';
import { ExchangeOrder, ExchangeOrderTimeInForceEnum, ExchangeOrderTypeEnum } from '../Core/Exchange/ExchangeOrder';
import { ExchangeResponseAccountAssetInterface } from '../Core/Exchange/Response/ExchangeResponseAccountAsset';
import { ExchangeResponseOrderFeesInterface } from '../Core/Exchange/Response/ExchangeResponseOrderFees';
import { ExchangeResponseAssetPairInterface } from '../Core/Exchange/Response/ExchangeResponseAssetPair';
import { ExchangeResponseAssetPairPriceEntryInterface } from '../Core/Exchange/Response/ExchangeResponseAssetPairPriceEntry';
import { ExchangeResponseAssetPairCandlestickInterface } from '../Core/Exchange/Response/ExchangeResponseAssetPairCandlestick';
import { ExchangeOrderFeesTypeEnum } from '../Core/Exchange/ExchangeOrderFees';
import { Session } from '../Core/Session/Session';
import { SessionAssetTradingTypeEnum } from '../Core/Session/SessionAsset';
import logger from '../Utils/Logger';

enum RequestMethodEnum {
  GET = 'GET',
  POST = 'POST',
}

const BinanceExchangeCandlestickTimeframesMap = new Map([
  [60, '1m'],
  [180, '3m'],
  [300, '5m'],
  [900, '15m'],
  [1800, '30m'],
  [3600, '1h'],
  [7200, '2h'],
  [14400, '4h'],
  [21600, '6h'],
  [28800, '8h'],
  [43200, '12h'],
  [86400, '1d'],
  [259200, '3d'],
  [604800, '1w'],
  [2419200, '1M'],
]);

export class BinanceExchange extends Exchange {
  private _timeOffset: number;
  private _symbolAssetPairsMap: Map<string, [string, string]>;

  constructor(apiCredentials: ExchangeApiCredentialsInterface) {
    super(
      'binance',
      'Binance',
      apiCredentials,
      new AssetPairStringConverterBinance()
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

    const dataOrParams = symbol
      ? {
        symbol,
      }
      : {};

    const response = await this._doRequest(
      RequestMethodEnum.GET,
      'https://api.binance.com/api/v3/openOrders',
      dataOrParams,
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
  }

  async addAccountOrder(type: ExchangeAccountTypeEnum, order: ExchangeOrder): Promise<ExchangeOrder> {
    logger.debug(chalk.italic(
      'Adding account order ...'
    ));

    if (type !== ExchangeAccountTypeEnum.SPOT) {
      logger.critical(chalk.red.bold('Currently only the SPOT account is implemented.'));

      process.exit(1);
    }

    const orderSymbol = order.assetPair.getExchangeSymbolString(this.assetPairConverter);
    const orderType = order.type;

    const data: any = {
      symbol: orderSymbol,
      side: order.side,
      type: orderType,
      newClientOrderId: order.id,
    };

    if (orderType === ExchangeOrderTypeEnum.LIMIT) {
      data.quantity = order.amount;
      data.price = order.price;
      data.timeInForce = ExchangeOrderTimeInForceEnum.GTC;
    } else if (orderType === ExchangeOrderTypeEnum.MARKET) {
      data.quantity = order.amount;
    }

    const response = await this._doRequest(
      RequestMethodEnum.POST,
      'https://api.binance.com/api/v3/order',
      data
    );

    order.price = response.data.price;
    order.exchangeResponse = response.data;

    return order;
  }

  async getAccountAssets(type: ExchangeAccountTypeEnum): Promise<ExchangeResponseAccountAssetInterface[]> {
    logger.debug(chalk.italic('Fetching account assets ...'));

    if (type !== ExchangeAccountTypeEnum.SPOT) {
      logger.critical(chalk.red.bold('Currently only the SPOT account is implemented.'));

      process.exit(1);
    }

    const response = await this._doRequest(
      RequestMethodEnum.GET,
      'https://api.binance.com/api/v3/account',
      {},
      true
    );

    const accountAssets: ExchangeResponseAccountAssetInterface[] = [];
    for (let i = 0; i < response.data.balances.length; i++) {
      const balanceData = response.data.balances[i];

      accountAssets.push({
        asset: Assets.getBySymbol(balanceData.asset),
        amountFree: balanceData.free,
        amountLocked: balanceData.locked,
      });
    }

    return accountAssets;
  }

  async getAssetPairs(): Promise<ExchangeResponseAssetPairInterface[]> {
    logger.debug(chalk.italic('Fetching asset pairs ...'));

    const response = await this._doRequest(
      RequestMethodEnum.GET,
      'https://api.binance.com/api/v3/exchangeInfo'
    );

    // TODO: split that into a separate call (getInfo() or something)
    // and cache those pairs locally when we need them.

    const assetPairs: ExchangeResponseAssetPairInterface[] = [];
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

      let tradingTypes: SessionAssetTradingTypeEnum[] = [];
      if (
        symbolData.isSpotTradingAllowed &&
        symbolData.permissions.includes('SPOT')
      ) {
        tradingTypes.push(SessionAssetTradingTypeEnum.SPOT);
      }

      if (
        symbolData.isMarginTradingAllowed &&
        symbolData.permissions.includes('MARGIN')
      ) {
        tradingTypes.push(SessionAssetTradingTypeEnum.MARGIN);
      }

      assetPairs.push({
        assetBase: Assets.getBySymbol(symbolData.baseAsset),
        assetQuote: Assets.getBySymbol(symbolData.quoteAsset),
        amountMinimum,
        amountMaximum,
        priceMinimum,
        priceMaximum,
        tradingTypes
      });

      this._symbolAssetPairsMap.set(
        symbolData.symbol,
        [symbolData.baseAsset, symbolData.quoteAsset]
      );
    }

    return assetPairs;
  }

  async getAssetPairPrices(): Promise<ExchangeResponseAssetPairPriceEntryInterface[]> {
    logger.debug(chalk.italic(
      'Fetching asset pair prices ...'
    ));

    const response = await this._doRequest(
      RequestMethodEnum.GET,
      'https://api.binance.com/api/v3/ticker/price'
    );
    const now = Date.now();

    const assetPairPrices: ExchangeResponseAssetPairPriceEntryInterface[] = [];
    for (let i = 0; i < response.data.length; i++) {
      const data = response.data[i];

      assetPairPrices.push({
        symbol: data.symbol,
        price: data.price,
        timestamp: now,
      });
    }

    return assetPairPrices;
  }

  async getAssetPairCandlesticks(
    symbol: string,
    timeframeSeconds: number,
    startTime?: number,
    endTime?: number,
    limit?: number
  ): Promise<ExchangeResponseAssetPairCandlestickInterface[]> {
    logger.debug(chalk.italic(
      'Fetching asset pair candlesticks ...'
    ));

    if (!BinanceExchangeCandlestickTimeframesMap.has(timeframeSeconds)) {
      logger.critical(chalk.red.bold('Invalid timeframeSeconds provided.'));

      process.exit(1);
    }

    const interval = BinanceExchangeCandlestickTimeframesMap.get(timeframeSeconds);

    const dataOrParams = {
      symbol,
      interval,
    };

    if (startTime) {
      dataOrParams[startTime] = startTime;
    }

    if (endTime) {
      dataOrParams[endTime] = endTime;
    }

    if (limit) {
      dataOrParams[limit] = limit;
    }

    const response = await this._doRequest(
      RequestMethodEnum.GET,
      'https://api.binance.com/api/v3/klines',
      dataOrParams
    );

    const assetPairCandlesticks: ExchangeResponseAssetPairCandlestickInterface[] = [];
    for (let i = 0; i < response.data.length; i++) {
      const data = response.data[i];

      assetPairCandlesticks.push({
        symbol,
        openTime: data[0],
        closeTime: data[6],
        openPrice: data[1],
        highPrice: data[2],
        lowPrice: data[3],
        closePrice: data[4],
        volume: data[5],
        tradesCount: data[8],
      });
    }

    return assetPairCandlesticks;
  }

  async getAssetFees(
    symbol: string,
    amount: string,
    orderFeesType: ExchangeOrderFeesTypeEnum
  ): Promise<ExchangeResponseOrderFeesInterface> {
    // TODO: check if we have any BNB in our account,
    // because only then the fee is 0.075%, else it's 0.1%.
    // You will also need to enable it in the dashboard
    // https://www.binance.com/en/fee/trading

    return {
      amountPercentage: 0.075,
    };
  }

  /***** Helpers *****/
  async _setTimeOffset(): Promise<void> {
    const response = await this._doRequest(
      RequestMethodEnum.GET,
      'https://api.binance.com/api/v3/time',
    );

    this._timeOffset = response.data.serverTime - Date.now();
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
      const timestamp = Date.now() + this._timeOffset;

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

export class AssetPairStringConverterBinance implements AssetPairStringConverterInterface {
  convert(assetPair: AssetPair): string {
    return (
      assetPair.assetBase.symbol +
      assetPair.assetQuote.symbol
    );
  }
}
