import { Asset } from '../../Asset/Asset';

export interface ExchangeResponseAccountAssetInterface {
  asset: Asset;
  amountFree: string;
  amountLocked: string;
}
