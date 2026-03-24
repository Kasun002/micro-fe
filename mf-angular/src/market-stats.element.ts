// This is the file exposed via Module Federation as './MarketStats'.
// The React shell imports mountMarketStats(), calls it once, then renders
// <crypto-market-stats> as a native custom element.

import 'zone.js';
import '@angular/compiler'; // JIT — must be present when loaded as a remote

import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { MarketStatsComponent } from './market-stats.component';

/**
 * Registers the <crypto-market-stats> custom element backed by Angular 17.
 * Idempotent — safe to call from both the shell and the dev-server bootstrap.
 */
export async function mountMarketStats(): Promise<void> {
  if (customElements.get('crypto-market-stats')) return;

  const appRef = await createApplication({ providers: [] });
  const MarketStatsElement = createCustomElement(MarketStatsComponent, {
    injector: appRef.injector,
  });
  customElements.define('crypto-market-stats', MarketStatsElement);
}
