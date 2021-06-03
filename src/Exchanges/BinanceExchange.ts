import { ApiCredentials } from '../Core/ApiCredentials';
import { Exchange } from '../Core/Exchange';

export class BinanceExchange extends Exchange {
  constructor(apiCredentials: ApiCredentials) {
    super('binance', 'Binance', apiCredentials);

    if (!apiCredentials.key || !apiCredentials.secret) {
      console.error('Please set BINANCE_API_KEY and BINANCE_API_SECRET in your .env file!');

      process.exit(1);
    }
  }
}
