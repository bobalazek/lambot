/// <reference types="jest" />

import { ExchangesEnum, ExchangesFactory } from '../../../src/Core/Exchange/ExchangesFactory';
import { Manager } from '../../../src/Core/Manager';
import { Session } from '../../../src/Core/Session/Session';
import { SessionConfig } from '../../../src/Core/Session/SessionConfig';
import { Trader } from '../../../src/Core/Trader/Trader';
import {
  sessionAssets,
  assetPricesResponse,
  assetStatisticsResponse,
} from '../../__fixtures__/TraderFixtures';

jest.useFakeTimers();

describe('Trader', () => {
  let trader: Trader;

  beforeEach(async () => {
    const exchange = ExchangesFactory.get(ExchangesEnum.MOCK);
    exchange.getAssetPrices = jest.fn().mockReturnValue(assetPricesResponse);
    exchange.getAssetStatistics = jest.fn().mockReturnValue(assetStatisticsResponse);

    const session = new Session(
      'TEST_SESSION',
      exchange,
      new SessionConfig({})
    );

    for (const sessionAsset of sessionAssets) {
      session.addAsset(sessionAsset);
    }

    trader = await Manager.boot(session, true);
  });

  it.skip('should correctly sort the asset pairs', () => {
    jest.spyOn(Date, 'now').mockImplementation(() => 10000);
    jest.runAllTicks();

    const sessionAsset = trader.session.assets[0];

    //console.log(trader.session.exchange.assetPairPrices)

    // TODO
  });
});
