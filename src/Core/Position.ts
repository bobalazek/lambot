import { OrderInterface } from './Order';

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
  buyOrder: OrderInterface;
  sellOrder: OrderInterface;
}

export class Position {
  id: string;
  type: PositionTypeEnum;
  status: PositionStatusEnum;
  buyOrder: OrderInterface;
  sellOrder: OrderInterface;

  constructor(id: string, type: PositionTypeEnum, status: PositionStatusEnum) {
    this.id = id;
    this.type = type;
    this.status = status;
  }
}
