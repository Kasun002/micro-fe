# Crypto Dashboard — Micro Frontend

A real-time crypto dashboard built with **React 19**, **Tailwind CSS**, and **Webpack Module Federation**. Three independent micro frontends communicate through browser-native Custom Events, hosted in a single shell application.

```
┌─────────────────────────────────────────────────────────┐
│                   Shell (Host) :3000                    │
│  ┌─────────────────┬───────────────────────────────┐   │
│  │  mf-market      │  mf-chart                     │   │
│  │  :3001          │  :3002                        │   │
│  │                 │                               │   │
│  │  [Coin List] ───────► [SVG Price Chart]         │   │
│  │  click emits    │  [Stats Grid]                 │   │
│  │  COIN_SELECTED  │                               │   │
│  └─────────────────┴───────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  mf-portfolio :3003                             │   │
│  │  [Holdings · Live Value · localStorage]         │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Apps at a Glance

| App | Port | Exposes | Role |
|---|---|---|---|
| `shell` | 3000 | — | Host / layout. Lazy-loads all remotes |
| `mf-market` | 3001 | `./MarketList` | Top-20 coins table from CoinGecko |
| `mf-chart` | 3002 | `./CoinChart` | 7-day SVG chart + stats, 1D/7D/1M/3M toggle |
| `mf-portfolio` | 3003 | `./Portfolio` | Track holdings, persists to localStorage |

**Data source:** [CoinGecko public API](https://api.coingecko.com/api/v3) — no API key required.

---

## Setup & Run

### Prerequisites

- Node.js 18+
- npm 9+

### 1. Install dependencies

```bash
# From the project root — installs all 4 apps
npm run install:all
```

Or install each app individually:

```bash
npm install --prefix shell
npm install --prefix mf-market
npm install --prefix mf-chart
npm install --prefix mf-portfolio
```

### 2. Start all dev servers

```bash
npm start
```

This runs all four webpack dev servers concurrently. Open **http://localhost:3000** in your browser.

> Remotes must be running before the shell loads. The `npm start` command starts them in the right order (remotes first, shell last) via `concurrently`.

### Start individual apps

```bash
npm run start:market     # http://localhost:3001
npm run start:chart      # http://localhost:3002
npm run start:portfolio  # http://localhost:3003
npm run start:shell      # http://localhost:3000
```

Each remote can also run standalone for isolated development.

---

## How Cross-MF Communication Works

Communication uses browser-native **CustomEvents** on `window`. No shared state library or prop-drilling needed.

### Event contract

```js
// Emitter — mf-market dispatches this when a coin is clicked
window.dispatchEvent(new CustomEvent('COIN_SELECTED', {
  detail: {
    coinId: 'bitcoin',      // CoinGecko coin ID
    symbol: 'btc',
    name:   'Bitcoin',
    price:  65000,
    image:  'https://...',
  },
}));

// Listener — mf-chart and mf-portfolio both subscribe
window.addEventListener('COIN_SELECTED', (e) => {
  const { coinId, symbol, name, price, image } = e.detail;
  // react to selection
});
```

### Current event map

| Event | Emitted by | Consumed by |
|---|---|---|
| `COIN_SELECTED` | `mf-market` | `mf-chart`, `mf-portfolio` |

To add a new event, define it in the emitting MF and subscribe in any listener MF — no changes to the shell required.

---

## How to Add a New Feature to an Existing MF

### Example: add a search filter to `mf-market`

1. Open `mf-market/src/MarketList.jsx`
2. Add a `useState` for the search query and filter the `coins` array before rendering:

```jsx
const [query, setQuery] = useState('');

const visible = coins.filter(c =>
  c.name.toLowerCase().includes(query.toLowerCase()) ||
  c.symbol.toLowerCase().includes(query.toLowerCase())
);
```

3. Add the input above the table:

```jsx
<input
  value={query}
  onChange={e => setQuery(e.target.value)}
  placeholder="Search coins..."
  className="w-full bg-gray-800 text-white px-4 py-2 text-sm focus:outline-none"
/>
```

4. Replace `coins.map(...)` with `visible.map(...)`.

The shell picks up the change automatically on next hot reload — no shell changes needed.

---

## How to Plug In a New Micro Frontend

Adding a new MF is a 5-step process. As an example, we'll add **`mf-news`** (a crypto news feed) on port **3004**.

### Step 1 — Scaffold the app

```
mf-news/
├── public/index.html
├── src/
│   ├── index.js
│   ├── bootstrap.jsx
│   └── NewsFeed.jsx       ← your new component
├── package.json
└── webpack.config.js
```

Copy any existing MF folder (e.g. `mf-portfolio`) and rename it. Then update the three key fields in the new files:

### Step 2 — `package.json`

```json
{
  "name": "mf-news",
  "scripts": {
    "start": "webpack serve",
    "build": "webpack --mode production"
  },
  "dependencies": { "react": "^19.0.0", "react-dom": "^19.0.0" },
  "devDependencies": { ... }
}
```

### Step 3 — `webpack.config.js`

```js
const { ModuleFederationPlugin } = require('webpack').container;

new ModuleFederationPlugin({
  name: 'mfNews',                           // unique name — no hyphens
  filename: 'remoteEntry.js',
  exposes: { './NewsFeed': './src/NewsFeed' },
  shared: {
    react:       { singleton: true, requiredVersion: '^19.0.0' },
    'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
  },
}),

devServer: { port: 3004, headers: { 'Access-Control-Allow-Origin': '*' } }
```

### Step 4 — Register the remote in `shell/webpack.config.js`

```js
remotes: {
  mfMarket:    'mfMarket@http://localhost:3001/remoteEntry.js',
  mfChart:     'mfChart@http://localhost:3002/remoteEntry.js',
  mfPortfolio: 'mfPortfolio@http://localhost:3003/remoteEntry.js',
  mfNews:      'mfNews@http://localhost:3004/remoteEntry.js',   // add this
},
```

### Step 5 — Mount the component in `shell/src/App.jsx`

```jsx
const NewsFeed = lazy(() => import('mfNews/NewsFeed'));

// Add to the layout wherever you want it:
<Slot name="mf-news">
  <NewsFeed />
</Slot>
```

### Step 6 — Add to root `package.json` scripts

```json
"start": "concurrently \"npm start --prefix mf-market\" \"npm start --prefix mf-chart\" \"npm start --prefix mf-portfolio\" \"npm start --prefix mf-news\" \"npm start --prefix shell\""
```

That's it. The new MF is fully isolated — it can be developed, deployed, and updated independently.

---

## Project Structure

```
micro-fe/
├── package.json          ← root: concurrently start script
├── .gitignore
├── README.md
├── plan.md               ← architecture reference
│
├── shell/                ← Host app (port 3000)
│   ├── public/index.html ← Tailwind CDN loaded here
│   ├── src/
│   │   ├── index.js      ← async boundary entry
│   │   ├── bootstrap.jsx ← createRoot
│   │   └── App.jsx       ← layout + lazy remote imports
│   └── webpack.config.js ← ModuleFederationPlugin (remotes)
│
├── mf-market/            ← Remote (port 3001)
│   ├── src/MarketList.jsx
│   └── webpack.config.js ← exposes ./MarketList
│
├── mf-chart/             ← Remote (port 3002)
│   ├── src/CoinChart.jsx
│   └── webpack.config.js ← exposes ./CoinChart
│
└── mf-portfolio/         ← Remote (port 3003)
    ├── src/Portfolio.jsx
    └── webpack.config.js ← exposes ./Portfolio
```

---

## Key Concepts

### `index.js` async boundary

Every app's entry point is a single import:

```js
// src/index.js
import('./bootstrap');
```

This defers module evaluation so Webpack can negotiate shared singletons (React, React-DOM) before any code runs. Skipping this causes the **"Shared module is not available for eager consumption"** error.

### `singleton: true` in shared config

Ensures only one copy of React runs on the page, regardless of how many remotes are loaded. Without this, each remote would bring its own React instance and hooks would break.

### ErrorBoundary in shell

Each remote is wrapped in an `ErrorBoundary + Suspense`. If a remote fails to load (e.g. its dev server is not running), the rest of the dashboard keeps working.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Failed to load mf-*` in shell (local) | Start the remote's dev server first |
| `Failed to load mf-*` in shell (Vercel) | Check env vars are set on the shell project and redeploy |
| `Shared module is not available for eager consumption` | Make sure `index.js` only contains `import('./bootstrap')` |
| CoinGecko returns 429 | Free tier rate limit (~30 req/min). Wait a moment and reload |
| Styles not applying | Shell's Tailwind CDN loads after remotes paint — add a `<script>` tag to the remote's standalone `index.html` too |
| Two React instances warning | Ensure all apps declare `react` as `singleton: true` with the same `requiredVersion` |
| Remote loads in dev but not on Vercel | Check CORS — `vercel.json` in each remote must have `Access-Control-Allow-Origin: *` |
| Shell shows old remote after remote redeploy | Hard-refresh browser — remote chunk URLs are CDN-cached |

---

## Deploying to Vercel

All four apps live in **one repo → one Vercel project**. The build script compiles every MF and merges the outputs into a single `public/` folder that Vercel serves as static files.

```
public/                           → shell  (served at /)
public/mf-market/remoteEntry.js   → mf-market remote
public/mf-chart/remoteEntry.js    → mf-chart remote
public/mf-portfolio/remoteEntry.js → mf-portfolio remote
```

No separate projects, no env vars to manage, no deployment ordering.

---

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/<you>/crypto-dashboard-mfe.git
git push -u origin main
```

---

### Step 2 — Create one Vercel project

In the Vercel dashboard: **Add New Project → Import your repo**

| Setting | Value |
|---|---|
| Root Directory | ` ` (leave blank — repo root) |
| Framework Preset | Other |
| Install Command | `npm run install:all` |
| Build Command | `npm run build:all` |
| Output Directory | `public` |

No environment variables needed. Click **Deploy**.

The root `vercel.json` already configures all of this, so Vercel will pick it up automatically on import.

---

### How it works

**`vercel.json` (root)**
```json
{
  "installCommand": "npm run install:all",
  "buildCommand":   "npm run build:all",
  "outputDirectory": "public",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**`npm run build:all`** runs 3 steps:
```
1. npm run build:remotes  → builds mf-market, mf-chart, mf-portfolio → each outputs to <app>/dist/
2. npm run build:shell    → builds shell → outputs to shell/dist/
3. node scripts/merge-dist.js → copies everything into public/
```

**`shell/webpack.config.js`** auto-detects Vercel via the `VERCEL_URL` system env var (injected by Vercel on every build — no manual setup):
```js
const VERCEL_BASE = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : null;

// On Vercel → same-domain subpaths
// In local dev → localhost ports
const MF_MARKET_URL = VERCEL_BASE
  ? `${VERCEL_BASE}/mf-market`
  : 'http://localhost:3001';
```

Vercel serves static files before applying rewrites, so `remoteEntry.js` files are served directly from their subpaths and the SPA rewrite only fires for unknown routes.

---

### Adding a new MF to this single-project setup

1. Scaffold `mf-news/` (see "Plug In a New MF" section)
2. Add its build to `package.json`:
```json
"build:remotes": "... && npm run build --prefix mf-news"
```
3. Add it to `scripts/merge-dist.js`:
```js
for (const mf of ['mf-market', 'mf-chart', 'mf-portfolio', 'mf-news']) {
```
4. Register it in `shell/webpack.config.js` remotes:
```js
const MF_NEWS_URL = VERCEL_BASE ? `${VERCEL_BASE}/mf-news` : 'http://localhost:3004';
```
5. Push — Vercel redeploys everything automatically.

---

### Vercel config files summary

| File | Purpose |
|---|---|
| `vercel.json` (root) | Single entry point — install, build, output dir, SPA rewrite |
| `scripts/merge-dist.js` | Merges all `dist/` outputs into `public/` after build |
| `mf-*/vercel.json` | Kept for standalone MF deployment reference — unused in monorepo mode |

---

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Webpack | 5 | Bundler + Module Federation host |
| Babel | 7 | JSX + ES module transpilation |
| Tailwind CSS | 3 (CDN) | Styling |
| CoinGecko API | v3 | Market data (no key required) |
| concurrently | 9 | Run all dev servers from one command |
