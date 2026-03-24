// zone.js MUST be the first static import — it patches browser globals
// (Promise, setTimeout, etc.) before Angular's platform boots.
import 'zone.js';
import '@angular/compiler'; // JIT compiler required when not using @ngtools/webpack AOT

import { mountMarketStats } from './market-stats.element';

// Standalone dev-server: register the custom element and inject it into #root.
mountMarketStats().then(() => {
  const root = document.getElementById('root');
  if (root) root.innerHTML = '<crypto-market-stats></crypto-market-stats>';
});
