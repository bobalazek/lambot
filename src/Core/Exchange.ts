import { ApiCredentials } from './ApiCredentials';

export interface ExchangeInterface {
  key: string;
  name: string;
  apiCredentials: ApiCredentials;
  useWebsockets: boolean;
}

export class Exchange implements ExchangeInterface {
  key: string;
  name: string;
  apiCredentials: ApiCredentials;
  useWebsockets: boolean;

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
