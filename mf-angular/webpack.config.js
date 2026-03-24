const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/index.ts',
  output: {
    publicPath: 'auto',
    // Prevents global __webpack_require__ collisions with the React remotes
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
          // transpileOnly MUST be false so emitDecoratorMetadata is honoured
          transpileOnly: false,
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
      shared: {
        // Angular packages must NOT be declared as singletons shared with the
        // React shell — the shell has no Angular in its shared scope, so
        // marking them singleton:false bundles them inside the remote's own
        // chunk instead of fighting the shell's shared scope negotiation.
        '@angular/core':                     { singleton: false, eager: false },
        '@angular/common':                   { singleton: false, eager: false },
        '@angular/elements':                 { singleton: false, eager: false },
        '@angular/platform-browser':         { singleton: false, eager: false },
        '@angular/platform-browser-dynamic': { singleton: false, eager: false },
        '@angular/compiler':                 { singleton: false, eager: false },
        'rxjs':                              { singleton: false, eager: false },
        'zone.js':                           { singleton: false, eager: false },
        'tslib':                             { singleton: false, eager: false },
      },
    }),
    new HtmlWebpackPlugin({ template: './public/index.html' }),
  ],
  devServer: {
    port: 3004,
    historyApiFallback: true,
    hot: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
};
