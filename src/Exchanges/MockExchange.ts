import { AssetPairStringConverterDefault } from '../Core/Asset/AssetPairStringConverter';
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
      new AssetPairStringConverterDefault()
    );
  }
}
