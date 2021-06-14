import chalk from 'chalk';

import { AssetPair } from '../Asset/AssetPair';
import { ExchangeAccountTypeEnum } from '../Exchange/ExchangeAccount';
import { ExchangeTrade } from '../Exchange/ExchangeTrade';
import { ExchangeOrder, ExchangeOrderSideEnum, ExchangeOrderTypeEnum } from '../Exchange/ExchangeOrder';
import { Session } from '../Session/Session';
import { SessionAsset } from '../Session/SessionAsset';
import logger from '../../Utils/Logger';

export interface TraderInterface {
  session: Session;
  status: TraderStatusEnum;
  start(): ReturnType<typeof setInterval>;
  processCurrentTrades(): Promise<void>;
  processPotentialTrades(): Promise<void>;
  shouldBuy(assetPair: AssetPair): boolean;
  shouldSell(exchangeTrade: ExchangeTrade): boolean;
  executeBuy(assetPair: AssetPair, sessionAsset: SessionAsset): Promise<ExchangeOrder>;
  executeSell(exchangeTrade: ExchangeTrade, sessionAsset: SessionAsset): Promise<ExchangeOrder>;
}

export enum TraderStatusEnum {
  STOPPED = 'STOPPED',
  RUNNING = 'RUNNING',
}

export class Trader implements TraderInterface {
  session: Session;
  status: TraderStatusEnum;

  constructor(session: Session) {
    this.session = session;
    this.status = TraderStatusEnum.STOPPED;

    this.start();
  }

  start() {
    const {
      session,
    } = this;
    const {
      assetPriceUpdateIntervalSeconds,
      trendIntervalSeconds,
    } = session.config;
    const updateInterval = assetPriceUpdateIntervalSeconds * 1000;
    const trendIntervalTime = trendIntervalSeconds * 1000;
    const assetPairs = session.getAssetPairs();

    this.status = TraderStatusEnum.RUNNING;

    return setInterval(async () => {
      // Update the current asset prices
      const assetPrices = await session.exchange.getAssetPrices();
      const now = Date.now();

      for (let i = 0; i < assetPrices.length; i++) {
        const assetData = assetPrices[i];
        if (!assetPairs.has(assetData.symbol)) {
          continue;
        }

        const assetPrice = session.exchange.assetPairPrices.get(assetData.symbol);
        if (!assetPrice) {
          logger.info(chalk.red.bold(
            `Assset price for symbol "${assetData.symbol}" not found.`
          ));

          process.exit(1);
        }

        assetPrice.addEntry({
          timestamp: now,
          price: assetData.price,
        });
      }

      // Now that we updated our prices, let's process the entries!
      logger.info(chalk.bold('Starting to process entries ...'));
      session.exchange.assetPairPrices.forEach((exchangeAssetPrice) => {
        exchangeAssetPrice.processEntries();
      });
      const processingTime = Date.now() - now;
      logger.debug(`Processing took ${processingTime}ms.`);

      // Return the price data
      logger.info(chalk.bold('Asset pair price updates:'));
      session.exchange.assetPairPrices.forEach((exchangeAssetPrice, key) => {
        const priceText = exchangeAssetPrice.getPriceText(now, trendIntervalTime);

        logger.info(chalk.bold(key) + ' - ' + priceText);
      });

      // Cleanup entries if processing time takes too long
      if (processingTime > updateInterval / 10) {
        session.exchange.assetPairPrices.forEach((exchangeAssetPrice) => {
          exchangeAssetPrice.cleanupEntries(0.5);
        });
      }

      // Actually start checking if we can do any trades
      await this.processCurrentTrades();
      await this.processPotentialTrades();
    }, updateInterval);
  }

  async processCurrentTrades(): Promise<void> {
    const {
      session,
    } = this;

    logger.debug('Starting to process trades ...');

    session.assets.forEach((sessionAsset) => {
      sessionAsset.trades.forEach((exchangeTrade) => {
        if (!this.shouldSell(exchangeTrade)) {
          return;
        }

        this.executeSell(exchangeTrade, sessionAsset);
      });
    });
  }

  async processPotentialTrades(): Promise<void> {
    logger.debug('Starting to process new potential trades ...');

    this.session.assets.forEach((sessionAsset) => {
      const assetPairs = sessionAsset.assetPairs;

      // TODO: order them (assetPairs) by the biggest relative profit percentage or something?
      // So we can prioritize the assets we may buy sooner.

      assetPairs.forEach((assetPair) => {
        if (!this.shouldBuy(assetPair)) {
          return;
        }

        this.executeBuy(assetPair, sessionAsset);
      });
    });
  }

  shouldBuy(assetPair: AssetPair): boolean {
    const assetPrice = this.session.exchange.assetPairPrices.get(
      assetPair.toString(this.session.exchange.assetPairConverter)
    );

    // TODO

    return false;
  }

  shouldSell(exchangeTrade: ExchangeTrade): boolean {
    const assetPrice = this.session.exchange.assetPairPrices.get(
      exchangeTrade.assetPair.toString(this.session.exchange.assetPairConverter)
    );

    // TODO

    return false;
  }

  async executeBuy(assetPair: AssetPair, sessionAsset: SessionAsset): Promise<ExchangeOrder> {
    const order = this._createNewOrder(
      assetPair,
      sessionAsset,
      ExchangeOrderSideEnum.BUY,
      sessionAsset.strategy.tradeAmount
    );

    // TODO: send to exchange

    return order;
  }

  async executeSell(exchangeTrade: ExchangeTrade, sessionAsset: SessionAsset): Promise<ExchangeOrder> {
    const order = this._createNewOrder(
      exchangeTrade.assetPair,
      sessionAsset,
      ExchangeOrderSideEnum.SELL,
      '1' // TODO
    );

    // TODO: send to exchange

    return order;
  }

  _createNewOrder(
    assetPair: AssetPair,
    sessionAsset: SessionAsset,
    orderSide: ExchangeOrderSideEnum,
    amount: string
  ) {
    const {
      session,
    } = this;

    const now = Date.now();
    const assetPairSymbol = assetPair.toString(session.exchange.assetPairConverter);
    const id = this.session.id + '_' + assetPairSymbol + '_' + orderSide + '_' + now;
    const accountType = session.exchange.getAccountType(sessionAsset.tradingType);

    return new ExchangeOrder(
      id,
      assetPair,
      orderSide,
      amount,
      null,
      ExchangeOrderTypeEnum.MARKET,
      accountType
    );
  }
}
