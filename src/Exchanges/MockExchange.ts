import { AssetPair } from '../Core/Asset/AssetPair';
import { AssetPairStringConverterInterface } from '../Core/Asset/AssetPairStringConverter';
import { Exchange } from '../Core/Exchange/Exchange';

export class MockExchange extends Exchange {
  constructor() {
    super(
      'mock',
      'Mock',
      {
        key: '',
        secret: '',
      },
      new AssetPairStringConverterMock()
    );
  }
}

export class AssetPairStringConverterMock implements AssetPairStringConverterInterface {
  convert(assetPair: AssetPair): string {
    return (
      assetPair.assetBase.symbol +
      assetPair.assetQuote.symbol
    );
  }
}
