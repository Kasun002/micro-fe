import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'crypto_mfe_portfolio';

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function Portfolio() {
  const [holdings, setHoldings]       = useState(load);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [inputAmt, setInputAmt]       = useState('');

  useEffect(() => {
    const handler = (e) => {
      const coin = e.detail;
      setSelectedCoin(coin);
      setInputAmt(holdings[coin.coinId]?.amount?.toString() || '');
    };
    window.addEventListener('COIN_SELECTED', handler);
    return () => window.removeEventListener('COIN_SELECTED', handler);
  }, [holdings]);

  const saveHolding = () => {
    const amt = parseFloat(inputAmt);
    if (!selectedCoin || isNaN(amt) || amt < 0) return;
    const updated = {
      ...holdings,
      [selectedCoin.coinId]: {
        amount: amt,
        symbol: selectedCoin.symbol,
        name:   selectedCoin.name,
        price:  selectedCoin.price,
        image:  selectedCoin.image,
      },
    };
    setHoldings(updated);
    save(updated);
  };

  const remove = (id) => {
    const updated = { ...holdings };
    delete updated[id];
    setHoldings(updated);
    save(updated);
  };

  const totalValue = Object.values(holdings)
    .reduce((sum, h) => sum + h.amount * h.price, 0);

  const fmt = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <div className="p-4 flex flex-col gap-3">
      {/* Top row: add holding + total */}
      <div className="flex items-center gap-3 flex-wrap">
        {selectedCoin ? (
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 flex-1 min-w-0">
            {selectedCoin.image && (
              <img src={selectedCoin.image} className="w-5 h-5 rounded-full flex-shrink-0" alt="" />
            )}
            <span className="text-white text-sm font-medium truncate">{selectedCoin.name}</span>
            <span className="text-gray-500 text-xs ml-1 flex-shrink-0">${selectedCoin.price?.toLocaleString()}</span>
            <input
              type="number"
              min="0"
              value={inputAmt}
              onChange={e => setInputAmt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveHolding()}
              placeholder="Amount"
              className="ml-auto bg-gray-700 text-white rounded px-2 py-1 w-24 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={saveHolding}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex-shrink-0"
            >
              Save
            </button>
          </div>
        ) : (
          <div className="text-gray-600 text-sm flex-1">Click a coin in the market list to track it</div>
        )}

        {/* Total */}
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-gray-500">Total Value</div>
          <div className="text-lg font-bold text-green-400 font-mono">${fmt(totalValue)}</div>
        </div>
      </div>

      {/* Holdings chips */}
      {Object.keys(holdings).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(holdings).map(([id, h]) => {
            const val = h.amount * h.price;
            const isSelected = selectedCoin?.coinId === id;
            return (
              <div
                key={id}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm border transition-colors
                  ${isSelected
                    ? 'bg-blue-900/30 border-blue-700'
                    : 'bg-gray-800 border-gray-700 hover:border-gray-600'}`}
              >
                {h.image && <img src={h.image} className="w-4 h-4 rounded-full" alt="" />}
                <span className="text-gray-400 uppercase text-xs font-medium">{h.symbol}</span>
                <span className="text-white font-mono">{h.amount}</span>
                <span className="text-gray-600">≈</span>
                <span className="text-green-400 font-mono">${fmt(val)}</span>
                <button
                  onClick={() => remove(id)}
                  className="text-gray-600 hover:text-red-400 ml-1 leading-none transition-colors"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
