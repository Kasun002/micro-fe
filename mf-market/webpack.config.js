const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: { publicPath: 'auto' },
  resolve: { extensions: ['.js', '.jsx'] },
  module: {
    rules: [{
      test: /\.jsx?$/,
      loader: 'babel-loader',
      exclude: /node_modules/,
      options: { presets: ['@babel/preset-env', '@babel/preset-react'] },
    }],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'mfMarket',
      filename: 'remoteEntry.js',
      exposes: { './MarketList': './src/MarketList' },
      shared: {
        react:       { singleton: true, requiredVersion: '^19.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
      },
    }),
    new HtmlWebpackPlugin({ template: './public/index.html' }),
  ],
  devServer: { port: 3001, historyApiFallback: true, hot: true,
    headers: { 'Access-Control-Allow-Origin': '*' } },
};
