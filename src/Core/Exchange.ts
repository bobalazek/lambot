import { ApiCredentials } from './ApiCredentials';

export interface ExchangeInterface {
  key: string;
  name: string;
  apiCredentials: ApiCredentials;
}

export class Exchange implements ExchangeInterface {
  key: string;
  name: string;
  apiCredentials: ApiCredentials;

  constructor(key: string, name: string, apiCredentials: ApiCredentials) {
    this.key = key;
    this.name = name;
    this.apiCredentials = apiCredentials;
  }
}
