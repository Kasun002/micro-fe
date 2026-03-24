# Crypto Dashboard — Micro Frontend

React 19 · Angular 17 · Tailwind CSS · Webpack Module Federation · CoinGecko API

| App | Port | Framework | Exposes |
|---|---|---|---|
| `shell` | 3000 | React 19 | Host — lazy-loads all remotes |
| `mf-market` | 3001 | React 19 | `./MarketList` — top-20 coins table |
| `mf-chart` | 3002 | React 19 | `./CoinChart` — SVG price chart + stats |
| `mf-portfolio` | 3003 | React 19 | `./Portfolio` — holdings tracker |
| `mf-angular` | 3004 | Angular 17 | `./MarketStats` — global market stats bar |

---

## Setup & Run

```bash
npm run install:all   # install deps for all 5 apps
npm start             # start all dev servers
```

Open **http://localhost:3000**

Individual apps:
```bash
npm run start:market      # :3001  standalone
npm run start:chart       # :3002  standalone
npm run start:portfolio   # :3003  standalone
npm run start:angular     # :3004  standalone
npm run start:shell       # :3000
```

---

## Angular Micro Frontend (`mf-angular`)

The Angular remote is built with **Angular 17 standalone components** and exposed as a native **Web Component** (Custom Element) via `@angular/elements`. This lets the React shell consume it without any framework adapter.

### Architecture

```
mf-angular/src/
├── index.ts                      # Async boundary entry (import('./bootstrap'))
├── bootstrap.ts                  # Dev server bootstrap — zone.js must be first import
├── market-stats.element.ts       # MF exposed module — registers <crypto-market-stats>
├── market-stats.component.ts     # Angular 17 standalone component class
├── market-stats.component.html   # External template (loaded via raw-loader)
├── market-stats.interfaces.ts    # FngData, GlobalData, SelectedCoin interfaces
└── index.html                    # Dev server HTML (Tailwind CDN included)
```

### How the Shell Consumes It

The shell uses a React wrapper that:
1. Calls `mountMarketStats()` once — registers the `<crypto-market-stats>` custom element
2. Renders `React.createElement('crypto-market-stats')` — the browser handles the rest

```jsx
const AngularMarketStats = lazy(() =>
  import('mfAngular/MarketStats').then(mod => ({
    default: function MarketStatsWrapper() {
      const mounted = useRef(false);
      useEffect(() => {
        if (mounted.current) return;
        mounted.current = true;
        mod.mountMarketStats();
      }, []);
      return React.createElement('crypto-market-stats', { style: { display: 'block', width: '100%' } });
    },
  }))
);
```

### What It Displays

A full-width stats bar at the bottom of the shell with:

| Stat | Source |
|---|---|
| Fear & Greed Index | `alternative.me/fng` |
| Global Market Cap + 24h change | CoinGecko `/global` |
| 24h Volume | CoinGecko `/global` |
| BTC & ETH Dominance | CoinGecko `/global` |
| Active Cryptocurrencies | CoinGecko `/global` |
| Selected Coin Price | `COIN_SELECTED` CustomEvent from `mf-market` |

### Key Build Notes

| Setting | Reason |
|---|---|
| `babel-loader` instead of `ts-loader` | Avoids child compilation failures on Vercel |
| `minimize: false` | Terser class-name mangling breaks Angular JIT component registry |
| `concatenateModules: false` | Scope hoisting breaks Angular decorator patterns |
| `sideEffects: false` | Prevents tree-shaking `zone.js` and `@angular/compiler` |
| `ViewEncapsulation.Emulated` (default) | No Shadow DOM — Tailwind CDN classes apply normally |
| `output.path: path.resolve(__dirname, 'dist')` | Explicit path prevents CWD-dependent output on Vercel |

---

## Cross-MF Communication

MFs talk via native `CustomEvent` on `window` — no shared state library needed.

```js
// mf-market emits when a coin is clicked
window.dispatchEvent(new CustomEvent('COIN_SELECTED', {
  detail: { coinId, symbol, name, price, image }
}));

// mf-chart, mf-portfolio, and mf-angular listen
window.addEventListener('COIN_SELECTED', (e) => { ... });
```

---

## Adding a New Feature

Edit the MF component directly — the shell hot-reloads automatically. Example: add search to `mf-market/src/MarketList.jsx`, filter the `coins` array, no shell changes needed.

---

## Plugging In a New MF

1. **Copy** any existing MF folder → rename to `mf-news`
2. **Update** `webpack.config.js` — set `name: 'mfNews'`, `port: 3005`, expose your component
3. **Register** in `shell/webpack.config.js` remotes:
```js
const MF_NEWS_URL = VERCEL_BASE ? `${VERCEL_BASE}/mf-news` : 'http://localhost:3005';
// remotes: { mfNews: `mfNews@${MF_NEWS_URL}/remoteEntry.js` }
```
4. **Mount** in `shell/src/App.jsx`:
```jsx
const NewsFeed = lazy(() => import('mfNews/NewsFeed'));
<Slot name="mf-news"><NewsFeed /></Slot>
```
5. **Add** to root `package.json` `start` and `build:remotes` scripts
6. **Add** the MF name to `scripts/merge-dist.js` copy loop

---

## Deploy to Vercel

One repo → one Vercel project. Build merges all MFs into a single `public/` folder.

```
public/                             ← shell
public/mf-market/remoteEntry.js     ← React remote
public/mf-chart/remoteEntry.js      ← React remote
public/mf-portfolio/remoteEntry.js  ← React remote
public/mf-angular/remoteEntry.js    ← Angular remote
```

**Vercel settings** (root `vercel.json` handles everything automatically):

| Setting | Value |
|---|---|
| Root Directory | _(blank)_ |
| Framework | Other |
| Install Command | `npm run install:all` |
| Build Command | `npm run build:all` |
| Output Directory | `public` |

No env vars needed. `VERCEL_URL` is injected by Vercel automatically — the shell webpack config uses it to wire up remote URLs at build time.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Failed to load mf-*` | Start all remotes before the shell |
| `Shared module not available for eager consumption` | `index.js` must only contain `import('./bootstrap')` |
| CoinGecko 429 error | Free tier rate limit — wait and reload |
| Two React instances warning | All apps need `react: { singleton: true }` in webpack shared config |
| `Failed to load mf-angular` | Check that `zone.js` is the first import in `bootstrap.ts` and `market-stats.element.ts` |
| Angular component not rendering | Ensure `minimize`, `concatenateModules`, and `sideEffects` are all `false` in webpack `optimization` |
