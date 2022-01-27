# Lambot

Experimental crypto trading bot that may or may not bring you closer to your lambo lifestyle.

**Right now a v2 of this bot is being developed where I started from scratch, as I made some decisions at the begining that are hard to solve without a complete rewrite or were just plain wrong. Still, the repository will still stay online, so I can salvage bits from it. Do NOT use it in production, because it was only ever used on a paper trading account!**

Besides, it was mostly just a learning experience for me personally. If you want to use something in production, use [Freqtrade](https://www.freqtrade.io/en/stable/).

## Getting started

First you will need to copy the contents of `.env.example` to `.env` to setup your environment variables and exchange credentials.

Then you will need to set up some your config in the `./config/` folder. For now you can just edit the contents of `Config.ts` file inside and and set up the parameters. If this file doesn't exist yet, just create one by copying the `Config.example.ts` file.

The last thing you probably want to do is, to create your own strategy. There is a default strategy located in `./config/Strategies/DefaultStrategy.ts`, but you will probably want to create your own, which you can then link in the `./config/Config.ts` file.

After that, you'll just need to build the container with `docker-compose build` and run the bot with `docker-compose up`.

## Exchanges

Right now, Binance is the only supported exchange for this trading bot.

## Development

After you made your changes run `docker-compose build` to build and then `docker-compose up` to start the container. After that you'll need to manually run the bot with `docker exec -ti lambot_node trade`.

## TODO

* Fix persistance loading from JSON
* Indicators implementation
* Websocket exchange implementation for fetching prices and candlesticks data
* Backtesting
* Other exchanges besides Binance
* Separate repository:
  * Database persistance (prices, candlesticks, orders, trades, ...)
  * Web UI, where you can see current trades, asset pair prices, charts, ... also manually enter or exit trades

## Disclaimer

**All investment strategies and investments involve risk of loss. Nothing contained in this program, scripts, code or repository should be construed as investment advice. Any reference to an investment's past or potential performance is not, and should not be construed as, a recommendation or as a guarantee of any specific outcome or profit.**

**The developers of this repository expressly disclaims any liability or loss incurred by any person who acts on the information, ideas or strategies discussed herein.**
