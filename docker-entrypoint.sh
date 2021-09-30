#!/usr/bin/env bash
#encoding=utf8

echo "Building the app with yarn ..."
yarn build

echo "Starting the app ..."
yarn do "$@"

exit 0
