import axios, { AxiosResponse } from 'axios';
import qs from 'qs';
import crypto from 'crypto';
import chalk from 'chalk';

import { AssetPair } from '../Core/Asset/AssetPair';
import { Assets } from '../Core/Asset/Assets';
import { Exchange } from '../Core/Exchange/Exchange';
import { ExchangeAccountTypeEnum } from '../Core/Exchange/ExchangeAccount';
import { ExchangeApiCredentialsInterface } from '../Core/Exchange/ExchangeApiCredentials';
import { ExchangeTradeTypeEnum } from '../Core/Exchange/ExchangeTrade';
import { ExchangeOrder, ExchangeOrderTimeInForceEnum, ExchangeOrderTypeEnum } from '../Core/Exchange/ExchangeOrder';
import { ExchangeResponseAccountAssetInterface } from '../Core/Exchange/Response/ExchangeResponseAccountAsset';
import { ExchangeResponseOrderFeesInterface } from '../Core/Exchange/Response/ExchangeResponseOrderFees';
import { ExchangeResponseAssetPairInterface } from '../Core/Exchange/Response/ExchangeResponseAssetPair';
import { ExchangeResponseAssetPairPriceEntryInterface } from '../Core/Exchange/Response/ExchangeResponseAssetPairPriceEntry';
import { ExchangeResponseAssetPairCandlestickInterface } from '../Core/Exchange/Response/ExchangeResponseAssetPairCandlestick';
import { ExchangeResponseAssetPairStatisticsInterface } from '../Core/Exchange/Response/ExchangeResponseAssetPairStatistics';
import { ExchangeOrderFeesTypeEnum } from '../Core/Exchange/ExchangeOrderFees';
import { Session } from '../Core/Session/Session';
import { SessionTradingTypeEnum } from '../Core/Session/SessionTradingType';
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
  private _assetPairs: ExchangeResponseAssetPairInterface[];
  private _symbolAssetPairsMap: Map<string, [string, string]>;

  constructor(apiCredentials: ExchangeApiCredentialsInterface) {
    super(
      'binance',
      'Binance',
      apiCredentials
    );

    if (!apiCredentials.key || !apiCredentials.secret) {
      logger.critical(chalk.red.bold(
        'Please set BINANCE_API_KEY and BINANCE_API_SECRET in your .env file!'
      ));
      process.exit(1);
    }

    this._timeOffset = 0;
    this._assetPairs = [];
    this._symbolAssetPairsMap = new Map();
  }

  async boot(session: Session): Promise<boolean> {
    await this._setTimeOffset();
    await this._prepareInfo();

    return super.boot(session);
  }

  convertAssetPairToString(assetPair: AssetPair): string {
    if (assetPair.symbol) {
      return assetPair.symbol;
    }

    return (
      assetPair.assetBase.symbol +
      assetPair.assetQuote.symbol
    );
  }

  /***** API Data fetching ******/
  async getAccountOrders(accountType: ExchangeAccountTypeEnum, assetPair: AssetPair = null): Promise<ExchangeOrder[]> {
    logger.debug(chalk.italic('Fetching account orders ...'));

    const orders: ExchangeOrder[] = [];
    const symbol = this.convertAssetPairToString(assetPair);
    const dataOrParams = symbol
      ? {
        symbol,
      }
      : {};

    let response: any = {};
    if (accountType === ExchangeAccountTypeEnum.SPOT) {
      response = await this._doRequest(
        RequestMethodEnum.GET,
        'https://api.binance.com/api/v3/openOrders',
        dataOrParams,
        true
      );
    } else if (accountType === ExchangeAccountTypeEnum.MARGIN) {
      response = await this._doRequest(
        RequestMethodEnum.GET,
        'https://api.binance.com/sapi/v1/margin/openOrders',
        dataOrParams,
        true
      );
    } else {
      logger.critical(chalk.red.bold(
        `Account type "${accountType}" is not supported.`
      ));
      process.exit(1);
    }

    for (let i = 0; i < response.data.length; i++) {
      const orderData = response.data[i];

      if (!this._symbolAssetPairsMap.has(orderData.symbol)) {
        logger.critical(chalk.red.bold(
          'Could not find the symbol in the asset pairs map.'
        ));
        continue;
      }

      const assetPair = this._getAssetPairBySymbol(orderData.symbol);
      if (!assetPair) {
        logger.error(chalk.red(
          `Symbol asset pair ${orderData.symbol} not found on this exchange!`
        ));

        continue;
      }

      orders.push(
        new ExchangeOrder(
          orderData.clientOrderId ?? orderData.orderId,
          assetPair,
          orderData.side,
          orderData.origQty,
          orderData.price,
          orderData.type,
          accountType,
          orderData
        )
      );
    }

    return orders;
  }

  async addAccountOrder(accountType: ExchangeAccountTypeEnum, order: ExchangeOrder): Promise<ExchangeOrder> {
    logger.debug(chalk.italic(
      'Adding account order ...'
    ));

    const orderSymbol = this.convertAssetPairToString(order.assetPair);
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

    let response: any = {};
    if (accountType === ExchangeAccountTypeEnum.SPOT) {
      response = await this._doRequest(
        RequestMethodEnum.POST,
        'https://api.binance.com/api/v3/order',
        data
      );
    } else if (accountType === ExchangeAccountTypeEnum.MARGIN) {
      response = await this._doRequest(
        RequestMethodEnum.POST,
        'https://api.binance.com/sapi/v1/margin/order',
        data
      );
    } else {
      logger.critical(chalk.red.bold(
        `Account type "${accountType}" is not supported.`
      ));
      process.exit(1);
    }

    order.exchangeResponse = response.data;
    order.price = response.data.price;
    order.amount = response.data.origQty;

    return order;
  }

  async getAccountAssets(accountType: ExchangeAccountTypeEnum): Promise<ExchangeResponseAccountAssetInterface[]> {
    logger.debug(chalk.italic('Fetching account assets ...'));

    const accountAssets: ExchangeResponseAccountAssetInterface[] = [];

    if (accountType === ExchangeAccountTypeEnum.SPOT) {
      const response = await this._doRequest(
        RequestMethodEnum.GET,
        'https://api.binance.com/api/v3/account',
        {},
        true
      );

      for (let i = 0; i < response.data.balances.length; i++) {
        const balanceData = response.data.balances[i];

        accountAssets.push({
          asset: Assets.getBySymbol(balanceData.asset),
          amountFree: balanceData.free,
          amountLocked: balanceData.locked,
        });
      }
    } else if (accountType === ExchangeAccountTypeEnum.MARGIN) {
      const response = await this._doRequest(
        RequestMethodEnum.GET,
        'https://api.binance.com/sapi/v1/margin/account',
        {},
        true
      );

      if (response.data.borrowEnabled) {
        logger.error(chalk.red.bold(
          `Seems that borrowing is not enabled for your margin account.`
        ));
        return [];
      }

      if (response.data.tradeEnabled) {
        logger.error(chalk.red.bold(
          `Seems that trading is not enabled for your margin account.`
        ));
        return [];
      }

      for (let i = 0; i < response.data.userAssets.length; i++) {
        const balanceData = response.data.userAssets[i];

        accountAssets.push({
          asset: Assets.getBySymbol(balanceData.asset),
          amountFree: balanceData.free,
          amountLocked: balanceData.locked,
        });
      }
    } else {
      logger.error(chalk.red.bold(
        `Type "${accountType}" is not supported.`
      ));
      return [];
    }

    return accountAssets;
  }

  async getAssetPairs(): Promise<ExchangeResponseAssetPairInterface[]> {
    logger.debug(chalk.italic('Fetching asset pairs ...'));

    return this._assetPairs;
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

      const assetPair = this._getAssetPairBySymbol(data.symbol);
      if (!assetPair) {
        logger.error(chalk.red(
          `Symbol asset pair ${data.symbol} not found on this exchange!`
        ));

        continue;
      }

      assetPairPrices.push({
        assetPair,
        price: data.price,
        timestamp: now,
      });
    }

    return assetPairPrices;
  }

  async getAssetPairStatistics(): Promise<ExchangeResponseAssetPairStatisticsInterface[]> {
    logger.debug(chalk.italic(
      'Fetching asset pair statistics ...'
    ));

    const response = await this._doRequest(
      RequestMethodEnum.GET,
      'https://api.binance.com/api/v3/ticker/24hr'
    );

    const assetPairStatistics: ExchangeResponseAssetPairStatisticsInterface[] = [];
    for (let i = 0; i < response.data.length; i++) {
      const data = response.data[i];

      const assetPair = this._getAssetPairBySymbol(data.symbol);
      if (!assetPair) {
        logger.error(chalk.red(
          `Symbol asset pair ${data.symbol} not found on this exchange!`
        ));

        continue;
      }

      assetPairStatistics.push({
        assetPair,
        open: data.openPrice,
        high: data.highPrice,
        low: data.lowPrice,
        close: data.lastPrice,
        volume: data.volume,
        volumeQuote: data.quoteVolume,
        openTime: data.openTime,
        closeTime: data.closeTime,
      });
    }

    return assetPairStatistics;
  }

  async getAssetPairCandlesticks(
    assetPair: AssetPair,
    timeframeSeconds: number,
    startTime?: number,
    endTime?: number,
    limit?: number
  ): Promise<ExchangeResponseAssetPairCandlestickInterface[]> {
    logger.debug(chalk.italic(
      'Fetching asset pair candlesticks ...'
    ));

    if (!BinanceExchangeCandlestickTimeframesMap.has(timeframeSeconds)) {
      logger.error(chalk.red.bold(
        'Invalid timeframeSeconds provided.'
      ));
      return [];
    }

    let dataOrParams: any = {
      symbol: this.convertAssetPairToString(assetPair),
      interval: BinanceExchangeCandlestickTimeframesMap.get(timeframeSeconds),
      limit: limit ?? 1000
    };
    if (startTime) {
      dataOrParams.startTime = startTime;
    }
    if (endTime) {
      dataOrParams.endTime = endTime;
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
        assetPair,
        open: data[1],
        high: data[2],
        low: data[3],
        close: data[4],
        volume: data[5],
        volumeQuote: data[7],
        tradesCount: data[8],
        openTime: data[0],
        closeTime: data[6],
      });
    }

    return assetPairCandlesticks;
  }

  async getAssetFees(
    assetPair: AssetPair,
    amount: string,
    orderFeesType: ExchangeOrderFeesTypeEnum,
    tradeType: ExchangeTradeTypeEnum
  ): Promise<ExchangeResponseOrderFeesInterface> {
    // TODO: check if we have any BNB in our account,
    // because only then the fee is 0.075%, else it's 0.1%.
    // You will also need to enable it in the dashboard
    // https://www.binance.com/en/fee/trading

    if (tradeType === ExchangeTradeTypeEnum.SHORT) {
      return {
        percentage: 0.09,
      };
    }

    return {
      percentage: 0.075,
    };
  }

  /***** Helpers *****/
  _getAssetPairBySymbol(symbol: string): AssetPair {
    if (!this._symbolAssetPairsMap.has(symbol)) {
      return null;
    }

    const assetPairArray = this._symbolAssetPairsMap.get(symbol);

    return new AssetPair(
      Assets.getBySymbol(assetPairArray[0]),
      Assets.getBySymbol(assetPairArray[1])
    );
  }

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
      `Making a ${method} request to ${url}, with parameters: ${JSON.stringify(dataOrParams)}`
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

  async _prepareInfo(): Promise<boolean> {
    logger.debug(chalk.italic('Fetching exchange info ...'));

    const response = await this._doRequest(
      RequestMethodEnum.GET,
      'https://api.binance.com/api/v3/exchangeInfo'
    );

    this._assetPairs = [];
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

      let tradingTypes: SessionTradingTypeEnum[] = [];
      if (
        symbolData.isSpotTradingAllowed &&
        symbolData.permissions.includes('SPOT')
      ) {
        tradingTypes.push(SessionTradingTypeEnum.SPOT);
      }

      if (
        symbolData.isMarginTradingAllowed &&
        symbolData.permissions.includes('MARGIN')
      ) {
        tradingTypes.push(SessionTradingTypeEnum.MARGIN);
      }

      this._assetPairs.push({
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

    return true;
  }
}
