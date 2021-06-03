import { ApiCredentials } from '../Core/ApiCredentials';
import { Exchange } from '../Core/Exchange';

export class BinanceExchange extends Exchange {
  constructor(apiCredentials: ApiCredentials) {
    super('binance', 'Binance', apiCredentials);
  }
}
