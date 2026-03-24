import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { NgIf, DecimalPipe } from '@angular/common';

interface FngData {
  value: string;
  value_classification: string;
}

interface GlobalData {
  total_market_cap: { usd: number };
  total_volume: { usd: number };
  market_cap_percentage: { btc: number; eth: number };
  active_cryptocurrencies: number;
  market_cap_change_percentage_24h_usd: number;
}

interface SelectedCoin {
  coinId: string;
  name: string;
  symbol: string;
  price: number;
  image: string;
}

// Tailwind CDN is loaded in the shell's index.html (and in this app's index.html
// for standalone dev). Angular's default ViewEncapsulation.Emulated does NOT use
// Shadow DOM, so the CDN's utility classes apply normally to this component's DOM.
@Component({
  selector: 'app-market-stats',
  standalone: true,
  imports: [NgIf, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Outer bar -->
    <div class="flex flex-wrap items-center gap-5 px-5 py-2.5 min-h-12 bg-gray-950">

      <!-- Loading -->
      <span *ngIf="loading" class="text-xs text-gray-600 animate-pulse">
        Loading market data…
      </span>

      <ng-container *ngIf="!loading">

        <!-- Framework badge -->
        <div class="flex flex-col gap-0.5">
          <span class="text-[9px] uppercase tracking-widest text-gray-500">Framework</span>
          <span class="text-[11px] font-bold px-2 py-0.5 rounded"
                style="background:#880e4f; color:#fce4ec;">
            Angular v17
          </span>
        </div>

        <div class="w-px h-7 bg-gray-800 shrink-0"></div>

        <!-- Fear & Greed Index -->
        <div *ngIf="fng" class="flex flex-col gap-0.5">
          <span class="text-[9px] uppercase tracking-widest text-gray-500">Sentiment</span>
          <span class="text-[11px] font-bold px-2 py-0.5 rounded"
                [style.background]="fngBg"
                [style.color]="fngText">
            {{ fng.value_classification }} · {{ fng.value }}
          </span>
        </div>

        <!-- Global Market Cap -->
        <div *ngIf="global" class="flex flex-col gap-0.5">
          <span class="text-[9px] uppercase tracking-widest text-gray-500">Market Cap</span>
          <span class="text-xs text-gray-200 font-mono flex items-center gap-1">
            {{ formatLarge(global.total_market_cap.usd) }}
            <span [class]="global.market_cap_change_percentage_24h_usd >= 0
                            ? 'text-[11px] text-emerald-400'
                            : 'text-[11px] text-red-400'">
              {{ global.market_cap_change_percentage_24h_usd >= 0 ? '▲' : '▼' }}{{ abs(global.market_cap_change_percentage_24h_usd) | number:'1.2-2' }}%
            </span>
          </span>
        </div>

        <!-- 24h Volume -->
        <div *ngIf="global" class="flex flex-col gap-0.5">
          <span class="text-[9px] uppercase tracking-widest text-gray-500">24h Volume</span>
          <span class="text-xs text-gray-200 font-mono">
            {{ formatLarge(global.total_volume.usd) }}
          </span>
        </div>

        <!-- BTC Dominance -->
        <div *ngIf="global" class="flex flex-col gap-0.5">
          <span class="text-[9px] uppercase tracking-widest text-gray-500">BTC Dom</span>
          <span class="text-xs text-gray-200 font-mono">
            {{ global.market_cap_percentage.btc | number:'1.1-1' }}%
          </span>
        </div>

        <!-- ETH Dominance -->
        <div *ngIf="global" class="flex flex-col gap-0.5">
          <span class="text-[9px] uppercase tracking-widest text-gray-500">ETH Dom</span>
          <span class="text-xs text-gray-200 font-mono">
            {{ global.market_cap_percentage.eth | number:'1.1-1' }}%
          </span>
        </div>

        <!-- Active Cryptocurrencies -->
        <div *ngIf="global" class="flex flex-col gap-0.5">
          <span class="text-[9px] uppercase tracking-widest text-gray-500">Active Coins</span>
          <span class="text-xs text-gray-200 font-mono">
            {{ global.active_cryptocurrencies | number }}
          </span>
        </div>

        <!-- Selected coin chip — updated by React's COIN_SELECTED CustomEvent -->
        <ng-container *ngIf="selectedCoin">
          <div class="w-px h-7 bg-gray-800 shrink-0"></div>
          <div class="flex items-center gap-2 bg-blue-950 border border-blue-800 rounded-md px-2.5 py-1">
            <img [src]="selectedCoin.image" [alt]="selectedCoin.name"
                 class="w-5 h-5 rounded-full shrink-0" />
            <div class="flex flex-col gap-0">
              <span class="text-[11px] text-blue-300 font-semibold">{{ selectedCoin.name }}</span>
              <span class="text-[11px] text-gray-200 font-mono">
                \${{ selectedCoin.price | number:'1.2-6' }}
              </span>
            </div>
          </div>
        </ng-container>

      </ng-container>
    </div>
  `,
})
export class MarketStatsComponent implements OnInit, OnDestroy {
  loading = true;
  fng: FngData | null = null;
  global: GlobalData | null = null;
  selectedCoin: SelectedCoin | null = null;

  abs = Math.abs;

  private readonly coinHandler = (e: Event): void => {
    this.selectedCoin = (e as CustomEvent<SelectedCoin>).detail;
    this.cdr.markForCheck();
  };

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    window.addEventListener('COIN_SELECTED', this.coinHandler);
    this.fetchData();
  }

  ngOnDestroy(): void {
    window.removeEventListener('COIN_SELECTED', this.coinHandler);
  }

  formatLarge(value: number): string {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9)  return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6)  return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toLocaleString()}`;
  }

  get fngBg(): string {
    const v = parseInt(this.fng?.value ?? '50', 10);
    if (v <= 24) return '#7f1d1d';
    if (v <= 44) return '#7c2d12';
    if (v <= 55) return '#713f12';
    if (v <= 74) return '#14532d';
    return '#052e16';
  }

  get fngText(): string {
    const v = parseInt(this.fng?.value ?? '50', 10);
    if (v <= 24) return '#fca5a5';
    if (v <= 44) return '#fdba74';
    if (v <= 55) return '#fde047';
    if (v <= 74) return '#86efac';
    return '#4ade80';
  }

  private async fetchData(): Promise<void> {
    try {
      const [fngRes, globalRes] = await Promise.all([
        fetch('https://api.alternative.me/fng/'),
        fetch('https://api.coingecko.com/api/v3/global'),
      ]);
      if (fngRes.ok) {
        const json = await fngRes.json();
        this.fng = { value: json.data[0].value, value_classification: json.data[0].value_classification };
      }
      if (globalRes.ok) {
        const json = await globalRes.json();
        this.global = json.data as GlobalData;
      }
    } catch (err) {
      console.warn('[mf-angular] Market data fetch failed:', err);
    }
    this.loading = false;
    this.cdr.markForCheck();
  }
}
