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
            plugins: [
              ['@babel/plugin-proposal-decorators', { legacy: true }],
            ],
            presets: [
              ['@babel/preset-env', { targets: 'last 2 Chrome versions' }],
              ['@babel/preset-typescript'],
            ],
            assumptions: { setPublicClassFields: true },
          },
        },
      },
    ],
  },
  optimization: {
    // Angular's JIT runtime is incompatible with these three production-mode
    // optimizations when used without @ngtools/webpack (Angular's AOT plugin):
    //
    // minimize:false        — terser's class-name mangling breaks Angular's
    //                         JIT component registry which keys on constructor names.
    // concatenateModules:false — scope hoisting merges Angular module closures
    //                         in ways the JIT decorator system doesn't expect.
    // sideEffects:false     — prevents webpack from tree-shaking zone.js and
    //                         @angular/compiler, which are pure side-effect
    //                         imports with no JS return value.
    minimize: false,
    concatenateModules: false,
    sideEffects: false,
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
