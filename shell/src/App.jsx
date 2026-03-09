import React, { Suspense, lazy, Component } from 'react';

const MarketList = lazy(() => import('mfMarket/MarketList'));
const CoinChart   = lazy(() => import('mfChart/CoinChart'));
const Portfolio   = lazy(() => import('mfPortfolio/Portfolio'));

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error)
      return <div className="text-red-400 p-4 text-sm">Failed to load {this.props.name}. Is the remote running?</div>;
    return this.props.children;
  }
}

function Slot({ name, children }) {
  return (
    <ErrorBoundary name={name}>
      <Suspense fallback={<div className="text-gray-500 p-6 text-sm animate-pulse">Loading {name}...</div>}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-800 px-6 py-4 flex items-center gap-3 flex-shrink-0 bg-gray-900">
        <span className="text-2xl">🪙</span>
        <h1 className="text-xl font-bold text-white">Crypto Dashboard</h1>
        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded ml-2 border border-gray-700">
          Module Federation
        </span>
        <div className="ml-auto flex gap-2 text-xs text-gray-600">
          <span className="border border-gray-700 px-2 py-1 rounded">mf-market :3001</span>
          <span className="border border-gray-700 px-2 py-1 rounded">mf-chart :3002</span>
          <span className="border border-gray-700 px-2 py-1 rounded">mf-portfolio :3003</span>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Market List — left column */}
        <div className="w-96 border-r border-gray-800 flex flex-col flex-shrink-0 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-800 bg-gray-900">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Markets</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Slot name="mf-market">
              <MarketList />
            </Slot>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chart — top right */}
          <div className="flex-1 overflow-hidden border-b border-gray-800">
            <div className="px-4 py-2 border-b border-gray-800 bg-gray-900">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Price Chart</span>
            </div>
            <div className="h-full overflow-y-auto">
              <Slot name="mf-chart">
                <CoinChart />
              </Slot>
            </div>
          </div>

          {/* Portfolio — bottom right */}
          <div className="flex-shrink-0" style={{ minHeight: '180px', maxHeight: '280px', overflowY: 'auto' }}>
            <div className="px-4 py-2 border-b border-gray-800 bg-gray-900 sticky top-0">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Portfolio Tracker</span>
            </div>
            <Slot name="mf-portfolio">
              <Portfolio />
            </Slot>
          </div>
        </div>
      </div>
    </div>
  );
}
