/// <reference types="jest" />

import { ExchangesEnum, ExchangesFactory } from '../../../src/Core/Exchange/ExchangesFactory';
import { Session } from '../../../src/Core/Session/Session';
import { SessionConfig } from '../../../src/Core/Session/SessionConfig';
import { Trader } from '../../../src/Core/Trader/Trader';

// Mocks
jest.mock('../../../src/Exchanges/MockExchange', () => {
  return {
    MockExchange: jest.fn().mockImplementation(() => {
      return {
        // TODO
      };
    }),
  };
});

describe('Trader', () => {
  let trader: Trader;

  beforeEach(() => {
    const session = new Session(
      'TEST_SESSION',
      ExchangesFactory.get(ExchangesEnum.MOCK),
      new SessionConfig({})
    );

    trader = new Trader(session);
  });

  it.skip('should correctly sort the asset pairs', () => {
    // TODO
  });
});
