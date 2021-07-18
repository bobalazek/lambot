#!/usr/bin/env bash
#encoding=utf8

echo "Building the app with yarn ..."
yarn build

echo "Starting the app ..."
node build/bot.js "$@"

exit 0
