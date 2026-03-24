const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/index.ts',
  output: {
    publicPath: 'auto',
    uniqueName: 'mfAngular',
  },
  resolve: { extensions: ['.ts', '.js'] },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            // Decorators MUST be listed before preset-typescript so Babel
            // transforms them before stripping TypeScript syntax.
            plugins: [
              ['@babel/plugin-proposal-decorators', { legacy: true }],
            ],
            presets: [
              ['@babel/preset-env', { targets: 'last 2 Chrome versions' }],
              ['@babel/preset-typescript'],
            ],
            // Angular decorators rely on assignment-style class fields
            // (equivalent to TypeScript's useDefineForClassFields:false).
            assumptions: { setPublicClassFields: true },
          },
        },
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'mfAngular',
      filename: 'remoteEntry.js',
      exposes: {
        './MarketStats': './src/market-stats.element.ts',
      },
    }),
    new HtmlWebpackPlugin({ template: './src/index.html' }),
  ],
  stats: { children: true },
  devServer: {
    port: 3004,
    historyApiFallback: true,
    hot: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
};
