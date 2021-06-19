import { ExchangeApiCredentialsInterface } from './ExchangeApiCredentials';
import { Exchange } from './Exchange';
import { BinanceExchange } from '../../Exchanges/BinanceExchange';
import { MockExchange } from '../../Exchanges/MockExchange';

// Note: You will ALWAYS need to fetch the Exchange via the ExchangesFactory,
// else you can encounter circular dependency issues!

export enum ExchangesEnum {
  // Should be lowercase, the same as the key (in src/Exchanges/*Exchange.ts) for each exchange
  BINANCE = 'binance',
  MOCK = 'mock',
}

export class ExchangesFactory {
  static get(key: ExchangesEnum, apiCredentials?: ExchangeApiCredentialsInterface): Exchange {
    switch (key) {
      case ExchangesEnum.BINANCE:
        if (!apiCredentials) {
          apiCredentials = {
            key: process.env.BINANCE_API_KEY,
            secret: process.env.BINANCE_API_SECRET,
          };
        }

        return new BinanceExchange(apiCredentials);
      case ExchangesEnum.MOCK:
        return new MockExchange();
      default:
        new Error(`Exchange "${key}" does not exist.`);
    }
  }
}
