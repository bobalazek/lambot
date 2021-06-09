import { Asset } from '../Asset/Asset';

export interface ExchangeAccountAssetInterface {
  asset: Asset;
  amountFree: string;
  amountLocked: string;
}

export type ExchangeAccountAssetsMap = Map<string, ExchangeAccountAssetInterface>;

export class ExchangeAccountAsset implements ExchangeAccountAssetInterface {
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
