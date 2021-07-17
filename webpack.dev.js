const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './build',
    hot: true,
    host: '0.0.0.0',
    watchOptions: {
      ignored: /node_modules/,
      aggregateTimeout: 500,
      poll: 1000,
    },
  },
});
