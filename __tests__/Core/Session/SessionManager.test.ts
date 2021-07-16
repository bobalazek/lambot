/// <reference types="jest" />

import { SessionManager } from '../../../src/Core/Session/SessionManager';
import { Trader } from '../../../src/Trader';
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
    expect(tradesSummary.open.profitPercentages.withoutFees.sum).toBe(9.006734006734);
    expect(tradesSummary.open.profitPercentages.withoutFees.percentages).toStrictEqual([
      24.999999999999993,
      11.111111111111107,
      -9.090909090909099,
    ]);
    expect(tradesSummary.open.profitPercentages.withFees.sum).toBe(8.986734006733998);
    expect(tradesSummary.open.profitPercentages.withFees.percentages).toStrictEqual([
      24.97999999999999,
      11.091111111111108,
      -9.110909090909098,
    ]);

    expect(tradesSummary.open.profitAmounts.withoutFees.sum).toBe(2.999999999999997);
    expect(tradesSummary.open.profitAmounts.withoutFees.amounts).toStrictEqual([
      2.999999999999999,
      1.4999999999999995,
      -1.5000000000000013,
    ]);
    expect(tradesSummary.open.profitAmounts.withFees.sum).toBe(2.991299999999997);
    expect(tradesSummary.open.profitAmounts.withFees.amounts).toStrictEqual([
      2.997299999999999,
      1.4971499999999996,
      -1.5031500000000013,
    ]);
    expect(tradesSummary.closed.count).toBe(2);
    expect(tradesSummary.closed.profitPercentages.withoutFees.sum).toBe(-14.999999999999996);
    expect(tradesSummary.closed.profitPercentages.withoutFees.percentages).toStrictEqual([
      -9.999999999999998,
      -19.999999999999996,
    ]);
    expect(tradesSummary.closed.profitPercentages.withFees.sum).toBe(-15.02);
    expect(tradesSummary.closed.profitPercentages.withFees.percentages).toStrictEqual([
      -10.019999999999998,
      -20.02,
    ]);
    expect(tradesSummary.closed.profitAmounts.withoutFees.sum).toBe(-4.499999999999998);
    expect(tradesSummary.closed.profitAmounts.withoutFees.amounts).toStrictEqual([
      -1.4999999999999996,
      -2.999999999999999,
    ]);
    expect(tradesSummary.closed.profitAmounts.withFees.sum).toBe(-4.505549999999999);
    expect(tradesSummary.closed.profitAmounts.withFees.amounts).toStrictEqual([
      -1.5028499999999996,
      -3.002699999999999,
    ]);
  });
});
