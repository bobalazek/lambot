/// <reference types="jest" />

import { Assets } from '../../../src/Core/Asset/Assets';
import { ExchangesEnum, ExchangesFactory } from '../../../src/Core/Exchange/ExchangesFactory';
import { SessionTradingTypeEnum } from '../../../src/Core/Session/Session';
import { Trader } from '../../../src/Core/Trader';
import {
  assetPairPricesResponses,
  assetPairsResponse,
  accountAssetsResponse,
  createMockTrader,
} from '../../__fixtures__/TraderFixtures';
import logger from '../../../src/Utils/Logger';

logger.isEnabled = false;

describe('Trader', () => {
  let trader: Trader;

  beforeEach(async () => {
    jest.useFakeTimers();

    const exchange = ExchangesFactory.get(ExchangesEnum.MOCK);
    exchange.getAssetPairPrices = jest.fn().mockReturnValue(assetPairPricesResponses[0]);
    exchange.getAssetPairs = jest.fn().mockReturnValue(assetPairsResponse);
    exchange.getAccountAssets = jest.fn().mockReturnValue(accountAssetsResponse);

    trader = await createMockTrader(exchange);
  });

  afterEach(() => {
    // Sometimes it only works with that, sometimes only without ...
    //jest.runOnlyPendingTimers();
    //jest.useRealTimers();
  });

  it('should have set all the correct data', async () => {
    jest.spyOn(Date, 'now').mockImplementation(() => 0);

    // Initial tick
    await trader.priceTick();

    const session = trader.session;
    expect(session.asset).toBe(Assets.USDT);
    expect(session.assetPairs).toHaveLength(4);
    expect(session.tradingType).toBe(SessionTradingTypeEnum.SPOT);
    expect(session.trades).toHaveLength(0);

    const assetPairPrice = trader.session.exchange.assetPairs.get('ETHUSDT');
    const assetPairPriceEntries = assetPairPrice.getPriceEntries();
    const assetPairPriceChanges = assetPairPrice.getPriceChanges();

    expect(assetPairPriceEntries).toHaveLength(1);
    expect(assetPairPriceChanges).toHaveLength(0);

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

    const assetPairPriceSecondary = trader.session.exchange.assetPairs.get('ETHUSDT');
    const assetPairPriceSecondaryEntries = assetPairPriceSecondary.getPriceEntries();
    const assetPairPriceSecondaryChanges = assetPairPriceSecondary.getPriceChanges();

    expect(assetPairPriceSecondaryEntries).toHaveLength(assetPairPricesResponses.length);
    expect(assetPairPriceSecondaryChanges).toHaveLength(assetPairPricesResponses.length);

    const sortedAssetPairs = session.strategy.getSortedAssetPairs();

    expect(sortedAssetPairs[0].assetBase).toBe(Assets.BCH);
    expect(sortedAssetPairs[1].assetBase).toBe(Assets.ETH);
    expect(sortedAssetPairs[2].assetBase).toBe(Assets.BTC);
    expect(sortedAssetPairs[3].assetBase).toBe(Assets.BNB);
  });
});
