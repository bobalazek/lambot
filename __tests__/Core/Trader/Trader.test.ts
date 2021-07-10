/// <reference types="jest" />

import { AssetPair } from '../../../src/Core/Asset/AssetPair';
import { Assets } from '../../../src/Core/Asset/Assets';
import { SessionTradingTypeEnum } from '../../../src/Core/Session/Session';
import { Trader } from '../../../src/Core/Trader';
import { assetPairPricesResponses, createMockTrader } from '../../__fixtures__/TraderFixtures';
import logger from '../../../src/Utils/Logger';

logger.isEnabled = false;

describe('Trader', () => {
  let trader: Trader;

  beforeEach(async () => {
    jest.useFakeTimers();

    trader = await createMockTrader();
  });

  afterEach(() => {
    // Sometimes it only works with that, sometimes only without ...
    //jest.runOnlyPendingTimers();
    //jest.useRealTimers();
  });

  it('should have set all the correct data', async () => {
    jest.spyOn(Date, 'now').mockImplementation(() => 0);

    // Initial tick
    const session = trader.session;
    expect(session.asset).toBe(Assets.USDT);
    expect(session.assetPairs).toHaveLength(4);
    expect(session.tradingTypes).toStrictEqual([
      SessionTradingTypeEnum.SPOT,
    ]);
    expect(session.trades).toHaveLength(0);

    const assetPairKey = (new AssetPair(Assets.ETH, Assets.USDT)).getKey();
    const assetPairPrice = trader.session.exchange.assetPairs.get(assetPairKey);
    const assetPairPriceEntries = assetPairPrice.getPriceEntries();

    expect(assetPairPriceEntries).toHaveLength(1);

    // Next ticks
    jest.spyOn(Date, 'now').mockImplementation(() => 1000);
    trader.session.exchange.getAssetPairPrices = jest.fn().mockReturnValue(assetPairPricesResponses[1]);
    await trader.priceTick();

    jest.spyOn(Date, 'now').mockImplementation(() => 2000);
    trader.session.exchange.getAssetPairPrices = jest.fn().mockReturnValue(assetPairPricesResponses[2]);
    await trader.priceTick();

    jest.spyOn(Date, 'now').mockImplementation(() => 3000);
    trader.session.exchange.getAssetPairPrices = jest.fn().mockReturnValue(assetPairPricesResponses[3]);
    await trader.priceTick();

    const assetPairPriceSecondary = trader.session.exchange.assetPairs.get(assetPairKey);
    const assetPairPriceSecondaryEntries = assetPairPriceSecondary.getPriceEntries();

    expect(assetPairPriceSecondaryEntries).toHaveLength(assetPairPricesResponses.length);

    const sortedAssetPairs = session.strategy.getSortedAssetPairs();

    expect(sortedAssetPairs[0].assetBase).toBe(Assets.ETH);
    expect(sortedAssetPairs[1].assetBase).toBe(Assets.BTC);
    expect(sortedAssetPairs[2].assetBase).toBe(Assets.BNB);
    expect(sortedAssetPairs[3].assetBase).toBe(Assets.BCH);
  });
});
