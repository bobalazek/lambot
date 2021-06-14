import { Asset } from '../Asset/Asset';
import { AssetPair } from '../Asset/AssetPair';
import { Assets } from '../Asset/Assets';
import { StrategyInterface } from '../Strategy/Strategy';
import { ExchangeAssetPriceInterface } from './ExchangeAssetPrice';
import { ExchangeOrder, ExchangeOrderInterface } from './ExchangeOrder';

export interface ExchangeTradeInterface {
  id: string; // Prefix each order with the session id, so we know where it came from.
  asset: Asset;
  assetPair: AssetPair;
  type: ExchangeTradeTypeEnum;
  status: ExchangeTradeStatusEnum;
  timestamp: number;
  buyPrice: number; // At which price did we buy the asset?
  sellPrice: number; // At which price did we sell the asset?
  triggerSellPrice: number; // At which price should we trigger a sell? This can be floating, if we have a trailing take profit
  buyOrder: ExchangeOrderInterface;
  sellOrder: ExchangeOrderInterface;
  toExport(): unknown;
}

export enum ExchangeTradeTypeEnum {
  LONG = 'LONG',
  SHORT = 'SHORT',
  NEUTRAL = 'NEUTRAL',
}

export enum ExchangeTradeStatusEnum {
  BUY_PENDING = 'BUY_PENDING',
  OPEN = 'OPEN',
  SELL_PENDING = 'SELL_PENDING',
  CLOSED = 'CLOSED',
}

export class ExchangeTrade {
  id: string;
  asset: Asset;
  assetPair: AssetPair;
  type: ExchangeTradeTypeEnum;
  status: ExchangeTradeStatusEnum;
  timestamp: number;
  buyPrice: number;
  sellPrice: number;
  triggerSellPrice: number;
  buyOrder: ExchangeOrder;
  sellOrder: ExchangeOrder;

  constructor(
    id: string,
    asset: Asset,
    assetPair: AssetPair,
    type: ExchangeTradeTypeEnum,
    status: ExchangeTradeStatusEnum,
    timestamp: number = Date.now()
  ) {
    this.id = id;
    this.asset = asset;
    this.assetPair = assetPair;
    this.type = type;
    this.status = status;
    this.timestamp = timestamp;
  }

  /***** Export/Import *****/
  toExport() {
    return {
      id: this.id,
      asset: this.asset.symbol,
      assetPair: this.assetPair.toExport(),
      type: this.type,
      status: this.status,
      timestamp: this.timestamp,
      buyPrice: this.buyPrice,
      sellPrice: this.sellPrice,
      triggerSellPrice: this.triggerSellPrice,
      buyOrder: this.buyOrder?.toExport(),
      sellOrder: this.sellOrder?.toExport(),
    };
  }

  static fromImport(data: any): ExchangeTrade {
    const exchangeTrade = new ExchangeTrade(
      data.id,
      Assets.getBySymbol(data.asset),
      data.type,
      data.status,
      data.timestamp
    );

    if (data.buyPrice) {
      exchangeTrade.buyPrice = data.buyPrice;
    }

    if (data.sellPrice) {
      exchangeTrade.sellPrice = data.sellPrice;
    }

    if (data.triggerSellPrice) {
      exchangeTrade.sellPrice = data.triggerSellPrice;
    }

    if (data.buyOrder) {
      exchangeTrade.buyOrder = ExchangeOrder.fromImport(data.buyOrder);
    }

    if (data.sellOrder) {
      exchangeTrade.sellOrder = ExchangeOrder.fromImport(data.sellOrder);
    }

    return exchangeTrade;
  }
}
