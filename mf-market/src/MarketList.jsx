import React, { useState, useEffect } from 'react';

const API = 'https://api.coingecko.com/api/v3';

export default function MarketList() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(`${API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false`)
      .then(r => {
        if (!r.ok) throw new Error(`API error ${r.status} — CoinGecko may be rate limiting. Try again in a moment.`);
        return r.json();
      })
      .then(data => { setCoins(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const selectCoin = (coin) => {
    setSelected(coin.id);
    window.dispatchEvent(new CustomEvent('COIN_SELECTED', {
      detail: {
        coinId: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        price: coin.current_price,
        image: coin.image,
      },
    }));
  };

  if (loading) return (
    <div className="flex flex-col gap-3 p-4">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />
      ))}
    </div>
  );

  if (error) return (
    <div className="p-4 text-red-400 text-sm">{error}</div>
  );

  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-gray-900 z-10">
        <tr className="text-gray-500 text-xs border-b border-gray-800">
          <th className="text-left px-4 py-2 font-medium">#</th>
          <th className="text-left px-2 py-2 font-medium">Coin</th>
          <th className="text-right px-4 py-2 font-medium">Price</th>
          <th className="text-right px-4 py-2 font-medium">24h</th>
          <th className="text-right px-4 py-2 font-medium">Mkt Cap</th>
        </tr>
      </thead>
      <tbody>
        {coins.map((coin, i) => {
          const change = coin.price_change_percentage_24h;
          const isUp = change >= 0;
          const isActive = selected === coin.id;
          return (
            <tr
              key={coin.id}
              onClick={() => selectCoin(coin)}
              className={`border-b border-gray-800 cursor-pointer transition-colors
                ${isActive ? 'bg-blue-900/30 border-l-2 border-l-blue-500' : 'hover:bg-gray-800/50'}`}
            >
              <td className="px-4 py-3 text-gray-600 text-xs">{i + 1}</td>
              <td className="px-2 py-3">
                <div className="flex items-center gap-2">
                  <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-white text-sm truncate">{coin.name}</div>
                    <div className="text-gray-500 text-xs uppercase">{coin.symbol}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-right text-white font-mono text-xs">
                ${coin.current_price >= 1
                  ? coin.current_price.toLocaleString()
                  : coin.current_price.toFixed(6)}
              </td>
              <td className={`px-4 py-3 text-right font-mono text-xs ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
              </td>
              <td className="px-4 py-3 text-right text-gray-400 font-mono text-xs">
                ${(coin.market_cap / 1e9).toFixed(1)}B
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
