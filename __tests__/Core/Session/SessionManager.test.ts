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

    expect(tradesSummary.total.count).toBe(5);
    expect(tradesSummary.open.count).toBe(3);
    expect(tradesSummary.open.profitAveragePercentage.withoutFees).toBe(9.006734006734);
    expect(tradesSummary.open.profitAveragePercentage.withFees).toBe(8.986734006733998);
    expect(tradesSummary.open.profitAmount.withoutFees).toBe(2.999999999999997);
    expect(tradesSummary.open.profitAmount.withFees).toBe(2.991299999999997);
    expect(tradesSummary.closed.count).toBe(2);
    expect(tradesSummary.closed.profitAveragePercentage.withoutFees).toBe(-14.999999999999996);
    expect(tradesSummary.closed.profitAveragePercentage.withFees).toBe(-15.02);
    expect(tradesSummary.closed.profitAmount.withoutFees).toBe(-4.499999999999998);
    expect(tradesSummary.closed.profitAmount.withFees).toBe(-4.505549999999999);
  });
});
