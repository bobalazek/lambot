import { Asset } from '../Asset/Asset';
import { AssetPair } from '../Asset/AssetPair';
import { AssetPairStringConverterInterface } from '../Asset/AssetPairStringConverter';
import { ExchangeOrderTypeEnum } from '../Exchange/ExchangeOrder';
import { ExchangeTrade, ExchangeTradeStatusEnum } from '../Exchange/ExchangeTrade';
import { Strategy } from '../Strategy/Strategy';

export interface SessionAssetInterface {
  asset: Asset; // What is the default asset you want to trade in?
  assetPairs: AssetPair[]; // With which pairs do we want to trade? BTC_USDT, BTC_ETH, ...
  strategy: Strategy;
  tradingType: SessionAssetTradingTypeEnum;
  orderType: ExchangeOrderTypeEnum;
  trades: ExchangeTrade[];
  getOpenTrades(): ExchangeTrade[];
  getAssetPairs(assetPairConverter: AssetPairStringConverterInterface): Set<string>;
  toString(assetPairConverter: AssetPairStringConverterInterface): string;
  toExport(): unknown;
}

export enum SessionAssetTradingTypeEnum {
  SPOT = 'SPOT',
  MARGIN = 'MARGIN',
  FUTURES = 'FUTURES',
}

export class SessionAsset implements SessionAssetInterface {
  asset: Asset;
  assetPairs: AssetPair[];
  strategy: Strategy;
  tradingType: SessionAssetTradingTypeEnum;
  orderType: ExchangeOrderTypeEnum;
  trades: ExchangeTrade[];

  constructor(
    asset: Asset,
    assetPairs: AssetPair[],
    strategy: Strategy,
    tradingType: SessionAssetTradingTypeEnum,
    orderType: ExchangeOrderTypeEnum
  ) {
    this.asset = asset;
    this.assetPairs = assetPairs;
    this.strategy = strategy;
    this.tradingType = tradingType;
    this.orderType = orderType;
    this.trades = [];
  }

  getAssetPairs(): Set<string> {
    const assetPairs = new Set<string>();

    this.assetPairs.forEach((assetPair) => {
      assetPairs.add(AssetPair.toKey(assetPair));
    });

    return assetPairs;
  }

  getOpenTrades(): ExchangeTrade[] {
    return this.trades.filter((trade) => {
      return trade.status === ExchangeTradeStatusEnum.OPEN;
    });
  }

  /***** Export/Import *****/
  toString(): string {
    const assetPairsString = this.assetPairs.map((assetPair) => {
      return assetPair.toString();
    }).join(', ');

    return `Base asset: ${this.asset.toString()}; Asset pairs: ${assetPairsString}`;
  }

  toExport() {
    return {
      asset: this.asset.toExport(),
      assetPairs: this.assetPairs.map((assetPair) => {
        return assetPair.toExport();
      }),
      strategy: this.strategy.toExport(),
      tradingType: this.tradingType,
      orderType: this.orderType,
      trades: this.trades.map((trade) => {
        return trade.toExport();
      }),
    };
  }

  static fromImport(data: any): SessionAsset {
    const sessionAsset = new SessionAsset(
      Asset.fromImport(data.asset),
      data.assetPairs.map((assetPairData) => {
        return AssetPair.fromImport(assetPairData);
      }),
      Strategy.fromImport(data.strategy),
      data.tradingType,
      data.orderType
    );

    if (data.trades) {
      sessionAsset.trades = data.trades.map((tradeData) => {
        return ExchangeTrade.fromImport(tradeData);
      });
    }

    return sessionAsset;
  }
}
