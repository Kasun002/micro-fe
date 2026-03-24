const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

// VERCEL_URL is deployment-specific and unreliable for baking remote URLs.
// VERCEL_PROJECT_PRODUCTION_URL is the stable production domain (no protocol).
// All MFs are deployed as subpaths of the same domain, so we just need the origin.
// In local dev both vars are absent and we fall back to localhost ports.
const VERCEL_BASE = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : null;

const MF_MARKET_URL    = VERCEL_BASE ? `${VERCEL_BASE}/mf-market`    : (process.env.MF_MARKET_URL    || 'http://localhost:3001');
const MF_CHART_URL     = VERCEL_BASE ? `${VERCEL_BASE}/mf-chart`     : (process.env.MF_CHART_URL     || 'http://localhost:3002');
const MF_PORTFOLIO_URL = VERCEL_BASE ? `${VERCEL_BASE}/mf-portfolio` : (process.env.MF_PORTFOLIO_URL || 'http://localhost:3003');
const MF_ANGULAR_URL   = VERCEL_BASE ? `${VERCEL_BASE}/mf-angular`   : (process.env.MF_ANGULAR_URL   || 'http://localhost:3004');

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
        mfAngular:   `mfAngular@${MF_ANGULAR_URL}/remoteEntry.js`,
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
