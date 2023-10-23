import CopyWebpackPlugin from 'copy-webpack-plugin';
import ESLintPlugin from 'eslint-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import path from 'path';
import ReplaceInFileWebpackPlugin from 'replace-in-file-webpack-plugin';
import { Configuration } from 'webpack';

import { DIST_DIR } from './constants';
import { getPackageJson, getPluginJson, getEntries, hasLicense } from './utils';

function skipFiles(f: string): boolean {
  if (f.includes('/dist/')) {
    // avoid copying files already in dist
    return false;
  }
  if (f.includes('/tsconfig.json')) {
    // avoid copying tsconfig.json
    return false;
  }
  return true;
}

const config = async (env: Record<string, unknown>): Promise<Configuration> => {
  const pluginJson = getPluginJson();
  const baseConfig: Configuration = {
    cache: {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
      cacheDirectory: path.resolve(__dirname, '../../.yarn/.cache/webpack', path.basename(process.cwd())),
      cacheLocation: path.resolve(
        __dirname,
        '../../.yarn/.cache/eslint-webpack-plugin',
        path.basename(process.cwd()),
        '.eslintcache'
      ),
    },

    context: process.cwd(),

    devtool: env.production ? 'source-map' : 'eval-source-map',

    entry: await getEntries(),

    externals: [
      'lodash',
      'jquery',
      'moment',
      'slate',
      'emotion',
      '@emotion/react',
      '@emotion/css',
      'prismjs',
      'slate-plain-serializer',
      '@grafana/slate-react',
      'react',
      'react-dom',
      'react-redux',
      'redux',
      'rxjs',
      'react-router',
      'react-router-dom',
      'd3',
      'angular',
      '@grafana/ui',
      '@grafana/runtime',
      '@grafana/data',

      // Mark legacy SDK imports as external if their name starts with the "grafana/" prefix
      ({ request }, callback) => {
        const prefix = 'grafana/';
        const hasPrefix = (request?: string) => request?.indexOf(prefix) === 0;
        const stripPrefix = (request?: string) => request?.substr(prefix.length);

        if (hasPrefix(request)) {
          return callback(undefined, stripPrefix(request));
        }

        callback();
      },
    ],

    mode: env.production ? 'production' : 'development',

    module: {
      rules: [
        {
          exclude: /(node_modules)/,
          test: /\.[tj]sx?$/,
          use: {
            loader: 'swc-loader',
            options: {
              jsc: {
                baseUrl: '.',
                target: 'es2015',
                loose: false,
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                  decorators: false,
                  dynamicImport: true,
                },
              },
            },
          },
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.s[ac]ss$/,
          use: ['style-loader', 'css-loader', 'sass-loader'],
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/,
          type: 'asset/resource',
          generator: {
            // Keep publicPath relative for host.com/grafana/ deployments
            publicPath: `public/plugins/${pluginJson.id}/img/`,
            outputPath: 'img/',
            filename: Boolean(env.production) ? '[hash][ext]' : '[name][ext]',
          },
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)(\?v=\d+\.\d+\.\d+)?$/,
          type: 'asset/resource',
          generator: {
            // Keep publicPath relative for host.com/grafana/ deployments
            publicPath: `public/plugins/${pluginJson.id}/fonts/`,
            outputPath: 'fonts/',
            filename: Boolean(env.production) ? '[hash][ext]' : '[name][ext]',
          },
        },
      ],
    },

    output: {
      clean: {
        keep: new RegExp(`(.*?_(amd64|arm(64)?)(.exe)?|go_plugin_build_manifest)`),
      },
      filename: '[name].js',
      library: {
        type: 'amd',
      },
      path: path.resolve(process.cwd(), DIST_DIR),
      publicPath: `public/plugins/${pluginJson.id}/`,
    },

    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          // To `compiler.options.output`
          { from: 'README.md', to: '.', force: true },
          { from: 'plugin.json', to: '.' },
          { from: hasLicense() ? 'LICENSE' : '../../../../../LICENSE', to: '.' }, // Point to Grafana License by default
          { from: 'CHANGELOG.md', to: '.', force: true },
          { from: '**/*.json', to: '.', filter: skipFiles }, // TODO<Add an error for checking the basic structure of the repo>
          { from: '**/*.svg', to: '.', noErrorOnMissing: true, filter: skipFiles }, // Optional
          { from: '**/*.png', to: '.', noErrorOnMissing: true, filter: skipFiles }, // Optional
          { from: '**/*.html', to: '.', noErrorOnMissing: true, filter: skipFiles }, // Optional
          { from: 'img/**/*', to: '.', noErrorOnMissing: true, filter: skipFiles }, // Optional
          { from: 'libs/**/*', to: '.', noErrorOnMissing: true, filter: skipFiles }, // Optional
          { from: 'static/**/*', to: '.', noErrorOnMissing: true, filter: skipFiles }, // Optional
        ],
      }),
      // Replace certain template-variables in the README and plugin.json
      new ReplaceInFileWebpackPlugin([
        {
          dir: path.resolve(DIST_DIR),
          files: ['plugin.json', 'README.md'],
          rules: [
            {
              search: /\%VERSION\%/g,
              replace: env.commit ? `${getPackageJson().version}-${env.commit}` : getPackageJson().version,
            },
            {
              search: /\%TODAY\%/g,
              replace: new Date().toISOString().substring(0, 10),
            },
            {
              search: /\%PLUGIN_ID\%/g,
              replace: pluginJson.id,
            },
          ],
        },
      ]),
      new ForkTsCheckerWebpackPlugin({
        async: Boolean(env.development),
        issue: {
          include: [{ file: '**/*.{ts,tsx}' }],
        },
        typescript: { configFile: path.join(process.cwd(), 'tsconfig.json') },
      }),
      new ESLintPlugin({
        extensions: ['.ts', '.tsx'],
        lintDirtyModulesOnly: Boolean(env.development), // don't lint on start, only lint changed files
      }),
    ],

    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      unsafeCache: true,
    },

    watchOptions: {
      ignored: ['**/node_modules', '**/dist', '**/.yarn'],
    },
  };

  return baseConfig;
};

export default config;
