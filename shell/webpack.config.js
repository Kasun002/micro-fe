const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

// Local dev defaults — override via environment variables for production
const MF_MARKET_URL    = process.env.MF_MARKET_URL    || 'http://localhost:3001';
const MF_CHART_URL     = process.env.MF_CHART_URL     || 'http://localhost:3002';
const MF_PORTFOLIO_URL = process.env.MF_PORTFOLIO_URL || 'http://localhost:3003';

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
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
      name: 'shell',
      remotes: {
        mfMarket:    `mfMarket@${MF_MARKET_URL}/remoteEntry.js`,
        mfChart:     `mfChart@${MF_CHART_URL}/remoteEntry.js`,
        mfPortfolio: `mfPortfolio@${MF_PORTFOLIO_URL}/remoteEntry.js`,
      },
      shared: {
        react:       { singleton: true, requiredVersion: '^19.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
      },
    }),
    new HtmlWebpackPlugin({ template: './public/index.html' }),
  ],
  devServer: { port: 3000, historyApiFallback: true, hot: true },
};
