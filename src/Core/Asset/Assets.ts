import { Asset } from './Asset';

export class Assets {
  static readonly EUR = new Asset('EUR', 'Euro');
  static readonly USD = new Asset('USD', 'United States Dollar');
  static readonly BTC = new Asset('BTC', 'Bitcoin');
  static readonly ETH = new Asset('ETH', 'Ethereum');
  static readonly BUSD = new Asset('BUSD', 'Binance USD');
  static readonly USDT = new Asset('USDT', 'Tether');
  static readonly BNB = new Asset('BNB', 'Binance Coin');
  static readonly ADA = new Asset('ADA', 'Cardano');
  static readonly DOGE = new Asset('DOGE', 'Dogecoin');
  static readonly XRP = new Asset('XRP', 'Ripple');
  static readonly DOT = new Asset('DOT', 'Polkadot');
  static readonly USDC = new Asset('USDC', 'USD Coin');
  static readonly UNI = new Asset('UNI', 'Uniswap');
  static readonly ICP = new Asset('ICP', 'Internet Computer');
  static readonly LINK = new Asset('LINK', 'Chainlink');
  static readonly BCH = new Asset('BCH', 'Bitcoin Cash');
  static readonly LTC = new Asset('LTC', 'Litecoin');
  static readonly MATIC = new Asset('MATIC', 'Polygon');
  static readonly SOL = new Asset('SOL', 'Solana');
  static readonly VET = new Asset('VET', 'VeChain');
  static readonly THETA = new Asset('THETA', 'THETA');
  static readonly ETC = new Asset('ETC', 'Ethereum Classic');
  static readonly WBTC = new Asset('WBTC', 'Wrapper Bitcoin');
  static readonly EOS = new Asset('EOS', 'EOS');
  static readonly FIL = new Asset('FIL', 'Filecoin');
  static readonly TRX = new Asset('TRX', 'TRON');
  static readonly XMR = new Asset('XMR', 'Monero');
  static readonly AAVE = new Asset('AAVE', 'Aave');
  static readonly DAI = new Asset('DAI', 'Dai');
  static readonly NEO = new Asset('NEO', 'Neo');
  static readonly MIOTA = new Asset('MIOTA', 'IOTA');
  static readonly KSM = new Asset('KSM', 'Kusama');
  static readonly SHIB = new Asset('SHIB', 'SHIBA INU');
  static readonly CAKE = new Asset('CAKE', 'PancakeSwap');
  static readonly ALGO = new Asset('ALGO', 'Algorand');
  static readonly LUNA = new Asset('LUNA', 'Terra');
  static readonly BTT = new Asset('BTT', 'BitTorrent');
  static readonly DASH = new Asset('DASH', 'Dash');
  static readonly ZEC = new Asset('ZEC', 'Zcash');
  static readonly AVAX = new Asset('AVAX', 'Avalanche');
  static readonly COMP = new Asset('COMP', 'Compound');
  static readonly CEL = new Asset('CEL', 'Celsius');
  static readonly TEL = new Asset('TEL', 'Telcoin');
  static readonly YFI = new Asset('YFI', 'yearn.finance');
  static readonly SUSHI = new Asset('SUSHI', 'SushiSwap');
  static readonly MANA = new Asset('MANA', 'Decrentraland');
  static readonly ENJ = new Asset('ENJ', 'Enjin Coin');
  static readonly XTZ = new Asset('XTZ', 'Tezos');
  static readonly MKR = new Asset('MKR', 'Maker');
  static readonly ATOM = new Asset('ATOM', 'Cosmos');
  static readonly SNX = new Asset('SNX', 'Synthetix Network Token');
  static readonly WAVES = new Asset('WAVES', 'Waves');
  static readonly XLM = new Asset('XLM', 'Stellar Lumens');
  static readonly MRK = new Asset('MRK', 'MARK.SPACE');
  static readonly FTT = new Asset('FTT', 'FTX Token');
  static readonly RUNE = new Asset('RUNE', 'ThorChain');
  static readonly HBAR = new Asset('HBAR', 'Hedera Hashgraph');
  static readonly TFUEL = new Asset('TFUEL', 'Theta Fuel');
  static readonly DCR = new Asset('DCR', 'Decred');
  static readonly AMP = new Asset('AMP', 'Amp');
  static readonly HT = new Asset('HT', 'Huobi Token');
  static readonly EGLD = new Asset('EGLD', 'Elrond');
  static readonly NU = new Asset('NU', 'NuCypher');
  static readonly BEAM = new Asset('BEAM', 'Beam');

  static getBySymbol(symbol: string): Asset {
    if (this[<keyof Assets>symbol]) {
      return this[<keyof Assets>symbol];
    }

    return new Asset(symbol, symbol);
  }
}
