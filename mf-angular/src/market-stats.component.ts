import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { NgIf, DecimalPipe } from '@angular/common';
import { FngData, GlobalData, SelectedCoin } from './market-stats.interfaces';

// Tailwind CDN is loaded in the shell's index.html (and in this app's index.html
// for standalone dev). Angular's default ViewEncapsulation.Emulated does NOT use
// Shadow DOM, so the CDN's utility classes apply normally to this component's DOM.
@Component({
  selector: 'app-market-stats',
  standalone: true,
  imports: [NgIf, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './market-stats.component.html',
})
export class MarketStatsComponent implements OnInit, OnDestroy {
  loading = true;
  fng: FngData | null = null;
  global: GlobalData | null = null;
  selectedCoin: SelectedCoin | null = null;

  abs = Math.abs;

  // inject() — Angular 17 functional DI, no constructor needed, no reflect-metadata required
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly coinHandler = (e: Event): void => {
    this.selectedCoin = (e as CustomEvent<SelectedCoin>).detail;
    this.cdr.markForCheck();
  };

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
