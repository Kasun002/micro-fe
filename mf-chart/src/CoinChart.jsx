import React, { useState, useEffect } from 'react';

const API = 'https://api.coingecko.com/api/v3';

function LineChart({ prices }) {
  if (!prices.length) return null;

  const W = 600, H = 140, PAD = 8;
  const vals = prices.map(([, v]) => v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;

  const toX = (i) => PAD + (i / (vals.length - 1)) * (W - PAD * 2);
  const toY = (v) => PAD + (1 - (v - min) / range) * (H - PAD * 2);

  const pts = vals.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
  const isUp = vals[vals.length - 1] >= vals[0];
  const color = isUp ? '#4ade80' : '#f87171';
  const fillId = 'chartFill';

  // Build area fill path
  const first = `${toX(0)},${toY(vals[0])}`;
  const last  = `${toX(vals.length - 1)},${toY(vals[vals.length - 1])}`;
  const areaPath = `M ${first} ${vals.map((v, i) => `L ${toX(i)},${toY(v)}`).join(' ')} L ${toX(vals.length - 1)},${H} L ${toX(0)},${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${fillId})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <div className="text-gray-500 text-xs mb-1">{label}</div>
      <div className="text-white font-mono text-sm font-medium">{value}</div>
    </div>
  );
}

export default function CoinChart() {
  const [coin, setCoin]     = useState(null);
  const [prices, setPrices] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(7);

  const fetchChartData = (coinId, d) => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/coins/${coinId}/market_chart?vs_currency=usd&days=${d}`).then(r => r.json()),
      fetch(`${API}/coins/markets?vs_currency=usd&ids=${coinId}`).then(r => r.json()),
    ]).then(([chart, mkt]) => {
      setPrices(chart.prices || []);
      setDetail(mkt[0] || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    const handler = (e) => {
      setCoin(e.detail);
      fetchChartData(e.detail.coinId, days);
    };
    window.addEventListener('COIN_SELECTED', handler);
    return () => window.removeEventListener('COIN_SELECTED', handler);
  }, [days]);

  const handleDays = (d) => {
    setDays(d);
    if (coin) fetchChartData(coin.coinId, d);
  };

  if (!coin) return (
    <div className="flex items-center justify-center h-full text-gray-600 select-none">
      <div className="text-center">
        <div className="text-5xl mb-3">📈</div>
        <p className="text-sm">Select a coin from the market list</p>
      </div>
    </div>
  );

  const change = detail?.price_change_percentage_24h;
  const isUp = (change ?? 0) >= 0;

  return (
    <div className="p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        {detail?.image && <img src={detail.image} className="w-9 h-9 rounded-full" alt={coin.name} />}
        <div>
          <h2 className="text-xl font-bold text-white leading-none">{coin.name}</h2>
          <span className="text-gray-500 text-xs uppercase tracking-wider">{coin.symbol}</span>
        </div>
        {detail && (
          <>
            <div className="ml-2 text-2xl font-bold text-white font-mono">
              ${detail.current_price >= 1
                ? detail.current_price.toLocaleString()
                : detail.current_price.toFixed(6)}
            </div>
            <div className={`text-sm font-semibold px-2 py-1 rounded ${isUp ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
              {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
            </div>
          </>
        )}

        {/* Days selector */}
        <div className="ml-auto flex gap-1">
          {[1, 7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => handleDays(d)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors
                ${days === d ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              {d === 1 ? '1D' : d === 7 ? '7D' : d === 30 ? '1M' : '3M'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-800/50 rounded-xl p-3 relative" style={{ minHeight: 156 }}>
        {loading
          ? <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm animate-pulse">Loading chart...</div>
          : <LineChart prices={prices} />}
      </div>

      {/* Stats */}
      {detail && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Market Cap"   value={`$${(detail.market_cap / 1e9).toFixed(2)}B`} />
          <Stat label="24h Volume"   value={`$${(detail.total_volume / 1e6).toFixed(0)}M`} />
          <Stat label="All Time High" value={`$${detail.ath?.toLocaleString()}`} />
          <Stat label="Circulating"  value={`${(detail.circulating_supply / 1e6).toFixed(2)}M`} />
        </div>
      )}
    </div>
  );
}
