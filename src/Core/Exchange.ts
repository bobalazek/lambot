import { ApiCredentials } from './ApiCredentials';

export interface ExchangeInterface {
  key: string;
  name: string;
  apiCredentials: ApiCredentials;
  useWebsockets: boolean;
  assetPrices: ExchangeAssetPriceInterface;
}

export interface ExchangeAssetPriceInterface {
  /**
   * BTC_ETH: {
   *   100000000: '0.00001',
   *   100000001: '0.00002',
   *   100000003: '0.00003',
   * },
   */
  [asset: string]: {
    [time: number]: string
  };
}

export class Exchange implements ExchangeInterface {
  key: string;
  name: string;
  apiCredentials: ApiCredentials;
  useWebsockets: boolean;
  assetPrices: ExchangeAssetPriceInterface;

  constructor(
    key: string,
    name: string,
    apiCredentials: ApiCredentials,
    useWebsockets: boolean = false
  ) {
    this.key = key;
    this.name = name;
    this.apiCredentials = apiCredentials;
    this.useWebsockets = useWebsockets;
  }
}
