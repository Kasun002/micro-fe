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
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          // We use inject() so emitDecoratorMetadata is not required.
          // transpileOnly:true skips full type-checking, which avoids ts-loader
          // issues inside webpack's child compilation for the remote entry.
          transpileOnly: true,
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
      // No shared section — the React shell offers no Angular packages so sharing
      // is a no-op, but the shared-module analysis pass in webpack's child
      // compilation was the source of the build error. Omitting it lets Angular
      // packages bundle directly into the remote chunk without any negotiation.
    }),
    new HtmlWebpackPlugin({ template: './public/index.html' }),
  ],
  stats: { children: true },
  devServer: {
    port: 3004,
    historyApiFallback: true,
    hot: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
};
