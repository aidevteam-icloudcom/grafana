'use strict';

const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const getBabelConfig = require('./babel.config');

module.exports = merge(common, {
  mode: 'development',
  entry: {
    app: ['webpack-dev-server/client?http://localhost:3333', './public/app/dev.ts'],
  },

  output: {
    path: path.resolve(__dirname, '../../public/build'),
    filename: '[name].[hash].js',
    publicPath: '/public/build/',
    pathinfo: false,
  },

  resolve: {
    extensions: ['.scss', '.ts', '.tsx', '.es6', '.js', '.json', '.svg', '.woff2', '.png', '.html'],
  },

  devtool: 'eval-source-map',

  devServer: {
    publicPath: '/public/build/',
    hot: true,
    port: 3333,
    proxy: {
      '!/public/build': 'http://localhost:3000',
    },
    watchOptions: {
      ignored: /node_modules/,
    },
  },

  optimization: {
    removeAvailableModules: false,
    runtimeChunk: false,
    removeEmptyChunks: false,
    splitChunks: false,
  },

  module: {
    // Note: order is bottom-to-top and/or right-to-left
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: getBabelConfig(),
          },
        ],
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader', // creates style nodes from JS strings
          'css-loader', // translates CSS into CommonJS
          {
            loader: 'postcss-loader',
            options: {
              config: {
                config: path.resolve(__dirname),
              },
            },
          },
          {
            loader: 'sass-loader',
          },
        ],
      },
      {
        test: /\.(png|jpg|gif|ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
        loader: 'file-loader',
      },
    ],
  },

  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      filename: path.resolve(__dirname, '../../public/views/index.html'),
      template: path.resolve(__dirname, '../../public/views/index-template.html'),
      inject: 'body',
      alwaysWriteToDisk: true,
      chunksSortMode: 'none',
    }),
    new HtmlWebpackHarddiskPlugin(),
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      GRAFANA_THEME: JSON.stringify(process.env.GRAFANA_THEME || 'dark'),
      'process.env': {
        NODE_ENV: JSON.stringify('development'),
      },
    }),
  ],
});
