import { AssetInterface } from './Asset';

export interface AccountInterface {
  name: string;
  assets: AccountAssetInterface[];
}

export interface AccountAssetInterface {
  account: AccountInterface;
  asset: AssetInterface;
  quantityFree: string;
  quantityLocked: string;
}

export class Account implements AccountInterface {
  name: string;
  assets: AccountAssetInterface[];

  constructor(name: string, assets?: AccountAssetInterface[]) {
    this.name = name;
    this.assets = assets;
  }
}

export class AccountAsset implements AccountAssetInterface {
  account: AccountInterface;
  asset: AssetInterface;
  quantityFree: string;
  quantityLocked: string;

  constructor(
    account: AccountInterface,
    asset: AssetInterface,
    quantityFree: string = '0',
    quantityLocked: string = '0'
  ) {
    this.account = account;
    this.asset = asset;
    this.quantityFree = quantityFree;
    this.quantityLocked = quantityLocked;
  }
}
