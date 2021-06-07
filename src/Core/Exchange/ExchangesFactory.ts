import { ApiCredentials } from '../Api/ApiCredentials';
import { Exchange } from './Exchange';
import { BinanceExchange } from '../../Exchanges/BinanceExchange';

export enum ExchangesEnum {
  // Should be lowercase, the same as the key (in src/Exchanges/*Exchange.ts) for each exchange
  BINANCE = 'binance',
}

export class ExchangesFactory {
  static get(key: ExchangesEnum | string, apiCredentials?: ApiCredentials): Exchange {
    switch (key) {
      case ExchangesEnum.BINANCE:
        if (!apiCredentials) {
          apiCredentials = {
            key: process.env.BINANCE_API_KEY,
            secret: process.env.BINANCE_API_SECRET,
          };
        }

        return new BinanceExchange(apiCredentials);
      default:
        new Error(`Exchange "${key}" does not exist.`);
    }
  }
}
