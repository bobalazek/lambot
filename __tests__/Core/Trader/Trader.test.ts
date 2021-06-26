/// <reference types="jest" />

import { Assets } from '../../../src/Core/Asset/Assets';
import { AssetPair } from '../../../src/Core/Asset/AssetPair';
import { DefaultStrategy } from '../../../src/Strategies/DefaultStrategy';
import { ExchangeOrderTypeEnum } from '../../../src/Core/Exchange/ExchangeOrder';
import { ExchangesEnum, ExchangesFactory } from '../../../src/Core/Exchange/ExchangesFactory';
import { Manager } from '../../../src/Core/Manager';
import { Session, SessionTradingTypeEnum } from '../../../src/Core/Session/Session';
import { SessionConfig } from '../../../src/Core/Session/SessionConfig';
import { Trader } from '../../../src/Core/Trader';
import {
  assetPairPricesResponses,
  assetPairsResponse,
  accountAssetsResponse,
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

    const session = new Session(
      'TEST_SESSION',
      exchange,
      new SessionConfig({
        memoryUsageMonitoringIntervalSeconds: 0,
      }),
      Assets.USDT,
      [
        new AssetPair(Assets.ETH, Assets.USDT),
        new AssetPair(Assets.BTC, Assets.USDT),
        new AssetPair(Assets.BNB, Assets.USDT),
        new AssetPair(Assets.BCH, Assets.USDT),
      ],
      new DefaultStrategy({}),
      SessionTradingTypeEnum.SPOT,
      ExchangeOrderTypeEnum.MARKET
    );

    trader = await Manager.boot(session, true);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should have set all the correct data', async () => {
    jest.spyOn(Date, 'now').mockImplementation(() => 0);

    // Initial tick
    await trader.tick();

    const session = trader.session;
    expect(session.asset).toBe(Assets.USDT);
    expect(session.assetPairs).toHaveLength(4);
    expect(session.tradingType).toBe(SessionTradingTypeEnum.SPOT);
    expect(session.trades).toHaveLength(0);

    const assetPairPrice = trader.session.exchange.assetPairPrices.get('ETHUSDT');
    const assetPairPriceEntries = assetPairPrice.getPriceEntries();
    const assetPairPriceChanges = assetPairPrice.getPriceChanges();

    expect(assetPairPriceEntries).toHaveLength(1);
    expect(assetPairPriceChanges).toHaveLength(0);

    // Next ticks
    jest.spyOn(Date, 'now').mockImplementation(() => 1000);
    trader.session.exchange.getAssetPairPrices = jest.fn().mockReturnValue(assetPairPricesResponses[1]);
    await trader.tick();

    jest.spyOn(Date, 'now').mockImplementation(() => 2000);
    trader.session.exchange.getAssetPairPrices = jest.fn().mockReturnValue(assetPairPricesResponses[2]);
    await trader.tick();

    jest.spyOn(Date, 'now').mockImplementation(() => 3000);
    trader.session.exchange.getAssetPairPrices = jest.fn().mockReturnValue(assetPairPricesResponses[3]);
    await trader.tick();

    const assetPairPriceSecondary = trader.session.exchange.assetPairPrices.get('ETHUSDT');
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
