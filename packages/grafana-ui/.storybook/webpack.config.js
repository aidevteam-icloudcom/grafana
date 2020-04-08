const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
module.exports = ({ config, mode }) => {
  config.module.rules = [
    ...(config.module.rules || []),
    {
      test: /\.tsx?$/,
      use: [
        {
          loader: require.resolve('ts-loader'),
          options: {
            // transpileOnly: true,
            configFile: path.resolve(__dirname, 'tsconfig.json'),
          },
        },
        {
          loader: require.resolve('react-docgen-typescript-loader'),
          options: {
            tsconfigPath: path.resolve(__dirname, 'tsconfig.json'),
            // https://github.com/styleguidist/react-docgen-typescript#parseroptions
            // @ts-ignore
            propFilter: prop => {
              if (prop.parent) {
                return !prop.parent.fileName.includes('node_modules/@types/react/');
              }

              return true;
            },
          },
        },
      ],
    },
  ];

  config.module.rules.push({
    test: /\.scss$/,
    use: [
      {
        loader: 'style-loader',
        options: { injectType: 'lazyStyleTag' }
      },
      {
        loader: 'css-loader',
        options: {
          importLoaders: 2,
        },
      },
      {
        loader: 'postcss-loader',
        options: {
          sourceMap: false,
          config: { path: __dirname + '../../../../scripts/webpack/postcss.config.js' },
        },
      },
      {
        loader: 'sass-loader',
        options: {
          sourceMap: false,
        },
      },
    ],
  });

  config.module.rules.push({
    test: require.resolve('jquery'),
    use: [
      {
        loader: 'expose-loader',
        query: 'jQuery',
      },
      {
        loader: 'expose-loader',
        query: '$',
      },
    ],
  });

  config.optimization = {
    nodeEnv: 'production',
    minimizer: [
      new TerserPlugin({
        cache: false,
        parallel: false,
        sourceMap: false,
      }),
      new OptimizeCSSAssetsPlugin({}),
    ],
  },

  config.resolve.extensions.push('.ts', '.tsx', '.mdx');
  config.stats = {
    warningsFilter: /export .* was not found in/,
  };

  return config;
};
