/**
 * Merges all MF dist outputs into a single /public folder for Vercel deployment.
 *
 * Output structure:
 *   public/                  ← shell (root)
 *   public/mf-market/        ← mf-market remote
 *   public/mf-chart/         ← mf-chart remote
 *   public/mf-portfolio/     ← mf-portfolio remote
 *   public/mf-angular/       ← mf-angular remote (Angular 17)
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUB  = path.join(ROOT, 'public');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

// Clean previous output
fs.rmSync(PUB, { recursive: true, force: true });

// Shell → public root
copyDir(path.join(ROOT, 'shell/dist'), PUB);

// Remotes → public/<name>/
for (const mf of ['mf-market', 'mf-chart', 'mf-portfolio', 'mf-angular']) {
  const distDir = path.join(ROOT, mf, 'dist');
  const remoteEntry = path.join(distDir, 'remoteEntry.js');
  if (!fs.existsSync(remoteEntry)) {
    throw new Error(`Build artifact missing: ${remoteEntry}\nDid "npm run build --prefix ${mf}" run successfully?`);
  }
  copyDir(distDir, path.join(PUB, mf));
}

console.log('✓ Merged dist outputs into /public');
