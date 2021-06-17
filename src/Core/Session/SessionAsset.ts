import { Asset } from '../Asset/Asset';
import { AssetPair } from '../Asset/AssetPair';
import { AssetPairStringConverterInterface } from '../Asset/AssetPairStringConverter';
import { Assets } from '../Asset/Assets';
import { ExchangeTrade, ExchangeTradeStatusEnum } from '../Exchange/ExchangeTrade';
import { Strategy } from '../Strategy/Strategy';

export interface SessionAssetInterface {
  asset: Asset; // What is the default asset you want to trade in?
  assetPairs: AssetPair[]; // With which pairs do we want to trade? BTC_USDT, BTC_ETH, ...
  strategy: Strategy;
  tradingType: SessionAssetTradingTypeEnum;
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
  trades: ExchangeTrade[];

  constructor(
    asset: Asset,
    assetPairs: AssetPair[],
    strategy: Strategy,
    tradingType: SessionAssetTradingTypeEnum
  ) {
    this.asset = asset;
    this.assetPairs = assetPairs;
    this.strategy = strategy;
    this.tradingType = tradingType;
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
      return (
        trade.status === ExchangeTradeStatusEnum.OPEN ||
        trade.status === ExchangeTradeStatusEnum.BUY_PENDING
      );
    })
  }

  /***** Export/Import *****/
  toString(): string {
    return JSON.stringify({
      asset: this.asset.toExport(),
      assetPairs: this.assetPairs.map((assetPair) => {
        return assetPair.toExport();
      }),
    });
  }

  toExport() {
    return {
      asset: this.asset.toExport(),
      assetPairs: this.assetPairs.map((assetPair) => {
        return [
          assetPair.assetBase.toString(),
          assetPair.assetQuote.toString(),
        ];
      }),
      strategy: this.strategy.toExport(),
      tradingType: this.tradingType,
    };
  }

  static fromImport(data: any): SessionAsset {
    return new SessionAsset(
      Asset.fromImport(data.asset),
      data.assetPairs.map((assetPair) => {
        return new AssetPair(
          Assets.getBySymbol(assetPair[0]),
          Assets.getBySymbol(assetPair[1])
        );
      }),
      Strategy.fromImport(data.strategy),
      data.tradingType
    );
  }
}
