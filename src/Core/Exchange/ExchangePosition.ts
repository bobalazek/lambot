import { ExchangeOrderInterface } from './ExchangeOrder';

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

export interface ExchangePositionInterface {
  id: string; // Prefix each order with the session id, so we know where it came from.
  type: ExchangePositionTypeEnum;
  status: ExchangePositionStatusEnum;
  timestamp: number;
  buyOrder: ExchangeOrderInterface;
  sellOrder: ExchangeOrderInterface;
}

export class ExchangePosition {
  id: string;
  type: ExchangePositionTypeEnum;
  status: ExchangePositionStatusEnum;
  timestamp: number;
  buyOrder: ExchangeOrderInterface;
  sellOrder: ExchangeOrderInterface;

  constructor(
    id: string,
    type: ExchangePositionTypeEnum,
    status: ExchangePositionStatusEnum,
    timestamp: number = Date.now()
  ) {
    this.id = id;
    this.type = type;
    this.status = status;
    this.timestamp = timestamp;
  }
}
