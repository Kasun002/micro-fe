export interface FngData {
  value: string;
  value_classification: string;
}

export interface GlobalData {
  total_market_cap: { usd: number };
  total_volume: { usd: number };
  market_cap_percentage: { btc: number; eth: number };
  active_cryptocurrencies: number;
  market_cap_change_percentage_24h_usd: number;
}

export interface SelectedCoin {
  coinId: string;
  name: string;
  symbol: string;
  price: number;
  image: string;
}
