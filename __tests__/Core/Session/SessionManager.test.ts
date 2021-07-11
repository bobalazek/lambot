/// <reference types="jest" />

import { SessionManager } from '../../../src/Core/Session/SessionManager';
import { Trader } from '../../../src/Core/Trader';
import { exchangeTrades } from '../../__fixtures__/SessionFixtures';
import { createMockTrader } from '../../__fixtures__/TraderFixtures';
import logger from '../../../src/Utils/Logger';

logger.isEnabled = false;

jest.useFakeTimers();

describe('SessionManager', () => {
  let trader: Trader;

  beforeEach(async () => {
    jest.useFakeTimers();

    trader = await createMockTrader();

    trader.session.trades = exchangeTrades;
  });

  it('should return the correct trades summary', async () => {
    const tradesSummary = SessionManager.getTradesSummary(trader.session);

    expect(tradesSummary.totalCount).toBe(5);
    expect(tradesSummary.openCount).toBe(3);
    expect(tradesSummary.openProfitAveragePercentage).toBe(9.006734006734);
    expect(tradesSummary.openProfitIncludingFeesAveragePercentage).toBe(8.996734006734);
    expect(tradesSummary.openProfitAmount).toBe(0.19999999999999984);
    expect(tradesSummary.openProfitIncludingFeesAmount).toBe(0.17199999999999982);
    expect(tradesSummary.closedCount).toBe(2);
    expect(tradesSummary.closedProfitAveragePercentage).toBe(-14.999999999999996);
    expect(tradesSummary.closedProfitIncludingFeesAveragePercentage).toBe(-15.02);
    expect(tradesSummary.closedProfitAmount).toBe(-0.29999999999999993);
    expect(tradesSummary.closedProfitIncludingFeesAmount).toBe(-0.33699999999999997);
  });
});
