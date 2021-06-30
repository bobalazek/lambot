/// <reference types="jest" />

import { ExchangesEnum, ExchangesFactory } from '../../../src/Core/Exchange/ExchangesFactory';
import { SessionManager } from '../../../src/Core/Session/SessionManager';
import { Trader } from '../../../src/Core/Trader';
import { exchangeTrades } from '../../__fixtures__/SessionFixtures';
import {
  accountAssetsResponse,
  assetPairPricesResponses,
  assetPairsResponse,
  createMockTrader,
} from '../../__fixtures__/TraderFixtures';
import logger from '../../../src/Utils/Logger';

logger.isEnabled = false;

jest.useFakeTimers();

describe('SessionManager', () => {
  let trader: Trader;

  beforeEach(async () => {
    jest.useFakeTimers();

    const exchange = ExchangesFactory.get(ExchangesEnum.MOCK);
    exchange.getAssetPairPrices = jest.fn().mockReturnValue(assetPairPricesResponses[0]);
    exchange.getAssetPairs = jest.fn().mockReturnValue(assetPairsResponse);
    exchange.getAccountAssets = jest.fn().mockReturnValue(accountAssetsResponse);

    trader = await createMockTrader(exchange);

    await trader.priceTick();

    trader.session.trades = exchangeTrades;
  });

  it('should return the correct trades summary', async () => {
    const tradesSummary = SessionManager.getTradesSummary(trader.session);

    expect(tradesSummary.totalCount).toBe(5);
    expect(tradesSummary.closedCount).toBe(2);
    expect(tradesSummary.openCount).toBe(3);
    expect(tradesSummary.closedProfitPercentage).toBe(-14.999999999999996);
    expect(tradesSummary.closedProfitIncludingFeesPercentage).toBe(-16.683168316831683);
    expect(tradesSummary.openProfitPercentage).toBe(9.006734006734);
    expect(tradesSummary.openProfitIncludingFeesPercentage).toBe(7.927459412607924);
  });
});
