import { ExchangeOrderInterface } from '../Exchange/ExchangeOrder';

export enum PositionTypeEnum {
  LONG = 'LONG',
  SHORT = 'SHORT',
  NEUTRAL = 'NEUTRAL',
}

export enum PositionStatusEnum {
  PENDING = 'PENDING',
  BOUGHT = 'BOUGHT',
  COMPLETED = 'COMPLETED',
}

export interface PositionInterface {
  id: string; // Prefix each order with the session id, so we know where it came from.
  type: PositionTypeEnum;
  status: PositionStatusEnum;
  buyOrder: ExchangeOrderInterface;
  sellOrder: ExchangeOrderInterface;
}

export class Position {
  id: string;
  type: PositionTypeEnum;
  status: PositionStatusEnum;
  buyOrder: ExchangeOrderInterface;
  sellOrder: ExchangeOrderInterface;

  constructor(id: string, type: PositionTypeEnum, status: PositionStatusEnum) {
    this.id = id;
    this.type = type;
    this.status = status;
  }
}
