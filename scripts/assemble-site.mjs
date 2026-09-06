/**
 * Assembles the Cloudflare Pages deploy directory.
 *
 * The site is served from https://shieber.net/yoni/portfolio/, and Pages maps
 * the deploy directory onto the domain root. So the built app has to sit at
 * `site/yoni/portfolio/` for its URL to line up with `base` in vite.config.ts,
 * while `_redirects` must stay at the deploy ROOT — Pages only reads it there.
 */
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const SITE = path.join(ROOT, 'site');
const BASE = 'yoni/portfolio';

const APP_DIR = path.join(SITE, ...BASE.split('/'));

await rm(SITE, { recursive: true, force: true });
await mkdir(APP_DIR, { recursive: true });
await cp(DIST, APP_DIR, { recursive: true });

// Cloudflare matches these top-down and stops at the first hit, so the exact
// paths must precede the splat.
//
// Client-side deep links (?app=terminal) must resolve to the app's index.html
// with a 200, not a redirect. Every shorter form of the path — /yoni, /yoni/,
// /yoni/portfolio — is sent to the canonical /yoni/portfolio/.
const redirects = [
  // /yoni is a section, not a page: the portfolio is what lives under it.
  `/yoni       /${BASE}/    301`,
  `/yoni/      /${BASE}/    301`,
  `/${BASE}    /${BASE}/    301`,
  `/${BASE}/*  /${BASE}/index.html  200`,
  // Nothing else lives on this domain yet, so send the root to the portfolio.
  // Delete this line the moment shieber.net gets its own landing page.
  `/          /${BASE}/    302`,
  '',
].join('\n');
await writeFile(path.join(SITE, '_redirects'), redirects, 'utf8');

console.log(`Assembled site/ -> /${BASE}/ (deploy the "site" directory)`);
