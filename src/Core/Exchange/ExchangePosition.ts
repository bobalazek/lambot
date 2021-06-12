import { Asset } from '../Asset/Asset';
import { Assets } from '../Asset/Assets';
import { ExchangeOrder, ExchangeOrderInterface } from './ExchangeOrder';

export interface ExchangePositionInterface {
  id: string; // Prefix each order with the session id, so we know where it came from.
  asset: Asset;
  type: ExchangePositionTypeEnum;
  status: ExchangePositionStatusEnum;
  timestamp: number;
  buyOrder: ExchangeOrderInterface;
  sellOrder: ExchangeOrderInterface;
  toExport(): unknown;
}

export enum ExchangePositionTypeEnum {
  LONG = 'LONG',
  SHORT = 'SHORT',
  NEUTRAL = 'NEUTRAL',
}

export enum ExchangePositionStatusEnum {
  PENDING = 'PENDING',
  BOUGHT = 'BOUGHT',
  COMPLETED = 'COMPLETED',
}

export class ExchangePosition {
  id: string;
  asset: Asset;
  type: ExchangePositionTypeEnum;
  status: ExchangePositionStatusEnum;
  timestamp: number;
  buyOrder: ExchangeOrder;
  sellOrder: ExchangeOrder;

  constructor(
    id: string,
    asset: Asset,
    type: ExchangePositionTypeEnum,
    status: ExchangePositionStatusEnum,
    timestamp: number = Date.now()
  ) {
    this.id = id;
    this.asset = asset;
    this.type = type;
    this.status = status;
    this.timestamp = timestamp;
  }

  /***** Export/Import *****/
  toExport() {
    return {
      id: this.id,
      asset: this.asset.symbol,
      type: this.type,
      status: this.status,
      timestamp: this.timestamp,
      buyOrder: this.buyOrder?.toExport(),
      sellOrder: this.sellOrder?.toExport(),
    };
  }

  static fromImport(data: any): ExchangePosition {
    const exchangePosition = new ExchangePosition(
      data.id,
      Assets.getBySymbol(data.asset),
      data.type,
      data.status,
      data.timestamp
    );

    if (data.buyOrder) {
      exchangePosition.buyOrder = ExchangeOrder.fromImport(data.buyOrder);
    }

    if (data.sellOrder) {
      exchangePosition.sellOrder = ExchangeOrder.fromImport(data.sellOrder);
    }

    return exchangePosition;
  }
}
