import { Asset } from '../../Asset/Asset';

export interface ExchangeResponseAccountAssetInterface {
  asset: Asset;
  amountFree: string;
  amountLocked: string;
}

export class ExchangeResponseAccountAsset implements ExchangeResponseAccountAssetInterface {
  asset: Asset;
  amountFree: string;
  amountLocked: string;

  constructor(
    asset: Asset,
    amountFree: string,
    amountLocked: string
  ) {
    this.asset = asset;
    this.amountFree = amountFree;
    this.amountLocked = amountLocked;
  }
}
