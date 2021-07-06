import { AssetPair } from '../Core/Asset/AssetPair';
import { Exchange } from '../Core/Exchange/Exchange';

export class MockExchange extends Exchange {
  constructor() {
    super(
      'mock',
      'Mock',
      {
        key: '',
        secret: '',
      }
    );
  }

  convertAssetPairToString(assetPair: AssetPair): string {
    return (
      assetPair.assetBase.symbol +
      assetPair.assetQuote.symbol
    );
  }
}
