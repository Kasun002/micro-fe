# Crypto Dashboard — Micro Frontend

React 19 · Tailwind CSS · Webpack Module Federation · CoinGecko API

| App | Port | Exposes |
|---|---|---|
| `shell` | 3000 | Host — lazy-loads all remotes |
| `mf-market` | 3001 | `./MarketList` — top-20 coins table |
| `mf-chart` | 3002 | `./CoinChart` — SVG price chart + stats |
| `mf-portfolio` | 3003 | `./Portfolio` — holdings tracker |

---

## Setup & Run

```bash
npm run install:all   # install deps for all 4 apps
npm start             # start all dev servers
```

Open **http://localhost:3000**

Individual apps:
```bash
npm run start:market      # :3001  standalone
npm run start:chart       # :3002  standalone
npm run start:portfolio   # :3003  standalone
npm run start:shell       # :3000
```

---

## Cross-MF Communication

MFs talk via native `CustomEvent` on `window` — no shared state library needed.

```js
// mf-market emits when a coin is clicked
window.dispatchEvent(new CustomEvent('COIN_SELECTED', {
  detail: { coinId, symbol, name, price, image }
}));

// mf-chart & mf-portfolio listen
window.addEventListener('COIN_SELECTED', (e) => { ... });
```

---

## Adding a New Feature

Edit the MF component directly — the shell hot-reloads automatically. Example: add search to `mf-market/src/MarketList.jsx`, filter the `coins` array, no shell changes needed.

---

## Plugging In a New MF

1. **Copy** any existing MF folder → rename to `mf-news`
2. **Update** `webpack.config.js` — set `name: 'mfNews'`, `port: 3004`, expose your component
3. **Register** in `shell/webpack.config.js` remotes:
```js
const MF_NEWS_URL = VERCEL_BASE ? `${VERCEL_BASE}/mf-news` : 'http://localhost:3004';
// remotes: { mfNews: `mfNews@${MF_NEWS_URL}/remoteEntry.js` }
```
4. **Mount** in `shell/src/App.jsx`:
```jsx
const NewsFeed = lazy(() => import('mfNews/NewsFeed'));
<Slot name="mf-news"><NewsFeed /></Slot>
```
5. **Add** to root `package.json` `start` and `build:remotes` scripts

---

## Deploy to Vercel

One repo → one Vercel project. Build merges all MFs into a single `public/` folder.

```
public/                            ← shell
public/mf-market/remoteEntry.js    ← remote
public/mf-chart/remoteEntry.js     ← remote
public/mf-portfolio/remoteEntry.js ← remote
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
