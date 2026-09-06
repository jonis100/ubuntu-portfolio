# Deployment

How this site gets from your laptop to **https://shieber.net/yoni/portfolio/**,
why it briefly lived only at `shieber-net.pages.dev`, and what to do when
something breaks.

Last synced: 2026-09-06

---

## Who hosts and serves this

**Cloudflare — for everything.** It plays four roles here, which are easy to
conflate because they used to be separate concerns:

| Role | Provider | Since |
|---|---|---|
| Domain registrar | Cloudflare | the domain was bought |
| DNS / nameservers | Cloudflare | the domain was bought |
| **Hosting — stores and serves the files** | **Cloudflare Pages** | this deployment |
| CDN, TLS, caching | Cloudflare edge | this deployment |

Before this deployment, Cloudflare only answered the question *"where does
shieber.net live?"* — and had no answer, which is the whole of Part 1 below. It
now also holds the files and serves them.

### There is no origin server

This is the part that differs from traditional hosting. There is **no VPS, no
container, no machine of yours** anywhere in the path. The built files are
copied onto Cloudflare's edge network and served directly from whichever data
centre is closest to the visitor. Response headers show it:

```
server: cloudflare
cf-ray: a36ef8144c59b2ed-TLV     <- served from Tel Aviv
```

Two consequences worth internalising:

- **Your laptop is not involved.** `npm run deploy` uploads the built output to
  Cloudflare and finishes. The machine can be shut down; the site stays up.
- **GitHub is not involved either.** The repository is local-only and has never
  been pushed. Nothing about serving the site depends on it.

### What the browser actually contacts

Measured from the live page (document plus opening the Files app):

| Host | Requests | What for | If it fails |
|---|---|---|---|
| `shieber.net` | 15 | HTML, JS, CSS, icons, wallpaper — Cloudflare Pages | site is down |
| `fonts.gstatic.com` / `fonts.googleapis.com` | 4 | the Ubuntu typeface, from Google Fonts | falls back to system sans-serif |
| `api.github.com` | 1 | live star counts in the Files app | falls back to the committed snapshot |

So the site itself is entirely Cloudflare, with two *soft* runtime dependencies.
Neither can take it down — both degrade to something sensible, and the GitHub
fallback is deliberate (see the snapshot rationale in
[PLAN.md](PLAN.md#github-data)).

### What this buys, and what it costs

**Buys:** free tier with unlimited bandwidth, no server to patch or pay for,
automatic TLS issuance and renewal, global edge caching, and every past deploy
retained for one-click rollback.

**Costs:** Pages serves **static files only**. There is no backend, no database,
no server-side code. That is sufficient for this site — the desktop is a
client-side app, and the one piece of live data comes straight from GitHub's
public API in the browser.

If a backend is ever needed — the AI-chat app from the original plan is the
obvious candidate, since an API key must not ship to the browser — that would
mean adding **Cloudflare Workers** or **Pages Functions** alongside this. Both
live in the same account and deploy through the same wrangler CLI, so it is an
addition rather than a migration.

---

## Part 1 — Why the default was `shieber-net.pages.dev`

### Cloudflare Pages gives every project a hostname you didn't ask for

When a Pages project is created, Cloudflare immediately assigns it
`<project-name>.pages.dev`. The project here is named `shieber-net`, so it got
`shieber-net.pages.dev`. That is not a fallback or a placeholder — it is the
project's permanent built-in hostname, and it keeps working forever alongside
any custom domain you add later.

So the site was never "deployed to the wrong place". It was deployed correctly,
and `pages.dev` is simply the address Cloudflare hands out for free.

### A custom domain is a completely separate step

Owning `shieber.net` and having it on Cloudflare's nameservers does **not** mean
Cloudflare serves anything at it. Two independent things have to be true:

1. **Cloudflare Pages must accept the hostname.** The project needs
   `shieber.net` registered in its Custom Domains list, so it knows to answer
   for that name and can get a TLS certificate issued for it.
2. **DNS must point at the project.** The `shieber.net` zone needs a record
   sending visitors to `shieber-net.pages.dev`.

We had (1) but not (2), which is exactly why the domain appeared dead.

### What "nothing on shieber.net" actually meant

The zone used Cloudflare's nameservers (`carlane`/`kanye.ns.cloudflare.com`) but
contained **no `A` or `CNAME` record at the apex**. The name resolved to nothing
at all:

```
$ dig +short shieber.net A
(empty)
$ curl -I https://shieber.net/
curl: (7) Failed to connect
```

This is worth recognising because it looks alarming but is very specific: it was
not a 404, not a certificate error, not a broken build. A 404 would mean DNS
worked and a server answered. A connection failure with empty DNS means the
browser never found anywhere to send the request. **The site was fine; the
signpost was missing.**

Meanwhile the Pages project reported the domain as `pending` — Cloudflare's way
of saying "registered, but I'm waiting for DNS before I can validate it and
issue a certificate."

### Why the custom domain didn't wire up DNS automatically

Adding a custom domain through the **Cloudflare dashboard** creates the DNS
record for you as part of the same flow. Adding it through the **API**, which is
what was done here, does not — it only registers the hostname on the project.

The obvious fix would have been to create the DNS record over the API too, but
that was not possible with the credentials available. `wrangler login` performs
an OAuth flow that grants a fixed scope list:

```
account:read  user:read  workers:write  workers_kv:write  workers_routes:write
workers_scripts:write  workers_tail:read  d1:write  pages:write  zone:read
ssl_certs:write  ai:write  queues:write  pipelines:write  offline_access
```

There is no DNS scope in that list — not even read. Any DNS API call returns
`Authentication error` (code 10000). This is a property of the OAuth grant, not
a misconfiguration, and it cannot be worked around from the CLI.

> **If you want this automated in future**, create an API token at
> Cloudflare → My Profile → API Tokens with **Zone → DNS → Edit** on
> `shieber.net`, and export it as `CLOUDFLARE_API_TOKEN`. Wrangler and the API
> both prefer that token over the OAuth session.

---

## Part 2 — How it was fixed

A single DNS record, added by hand in the dashboard:

| Field | Value |
|---|---|
| Type | `CNAME` |
| Name | `@` (the apex, i.e. `shieber.net`) |
| Target | `shieber-net.pages.dev` |
| Proxy status | **Proxied** (orange cloud) |
| TTL | Auto |

**Proxied is not optional here**, for two reasons:

- *It makes an apex CNAME legal.* DNS forbids a `CNAME` at a zone apex. Cloudflare
  works around this with **CNAME flattening**: it resolves the target itself and
  answers with `A` records, so the outside world sees a legal apex. You can see
  the flattening in the result — the record is a `CNAME`, but public DNS returns
  addresses:

  ```
  $ dig +short shieber.net A
  104.21.14.51
  172.67.157.217
  ```

  Those are Cloudflare edge IPs, not the Pages origin.

- *Pages custom domains route through the proxy.* Grey-cloud (DNS-only) would
  resolve, but Cloudflare would never see the request and could not map the
  hostname to the Pages project.

Once the record existed, Cloudflare validated the domain and issued a
certificate — **Google Trust Services, 2026-09-06 13:56 GMT, valid to
2026-12-05**. Renewal is automatic.

There is a normal gap of a few minutes between the record appearing and the
certificate being live, during which the browser shows TLS warnings. That is
expected. The dashboard's "Visitors cannot reach shieber.net" recommendation is
cached and clears itself afterwards.

---

## Part 3 — How deployment works now

### The one-liner

```bash
npm run deploy
```

That runs typecheck → Vite build → site assembly → upload to Cloudflare Pages.

### The awkward part: serving from a subpath

Most sites live at a domain root. This one lives at `/yoni/portfolio/`, and that
single fact drives most of the build configuration. **Three things must agree**,
and changing one without the others breaks the site:

**1. Vite must emit prefixed asset URLs** — [`vite.config.ts`](../vite.config.ts)

```ts
base: '/yoni/portfolio/',
```

Without this, the built HTML asks for `/assets/index.js`, which does not exist
at that path.

**2. Runtime asset URLs must use `BASE_URL`, never a leading slash**

Anything Vite can see at build time it rewrites automatically. Strings built at
runtime it cannot. Those must use `import.meta.env.BASE_URL`, which Vite
replaces with the base at build time:

```tsx
// src/components/icons.tsx
src={`${import.meta.env.BASE_URL}icons/${file}`}

// src/components/Wallpaper.tsx
backgroundImage: `url(${import.meta.env.BASE_URL}${w.image})`
```

A literal `/icons/files.png` would 404 in production while working perfectly in
local dev at `localhost:5173`. **This is the single easiest way to break the
site**, because it fails only after deploying.

**3. The deploy directory must mirror the URL** —
[`scripts/assemble-site.mjs`](../scripts/assemble-site.mjs)

Cloudflare Pages maps the directory you upload onto the domain root. Uploading
`dist/` directly would serve the app at `shieber.net/`, contradicting `base`. So
the assembly step copies the build into a matching folder structure:

```
site/                          <- what gets uploaded (domain root)
├── _redirects                 <- must be HERE; Pages only reads it at the root
└── yoni/
    └── portfolio/             <- matches base: '/yoni/portfolio/'
        ├── index.html
        ├── assets/
        ├── icons/
        └── wallpapers/
```

Note where `_redirects` sits. It is a **deploy-root** file. Putting it inside
`yoni/portfolio/` — which is what happens if you leave it in `public/` — makes
Pages ignore it silently, with no error.

### The redirect rules

Generated by the assembly script, so they regenerate on every deploy:

```
/yoni       /yoni/portfolio/    301
/yoni/      /yoni/portfolio/    301
/yoni/portfolio    /yoni/portfolio/    301
/yoni/portfolio/*  /yoni/portfolio/index.html  200
/          /yoni/portfolio/    302
```

**Order matters.** Cloudflare evaluates top-down and stops at the first match,
so the exact paths must precede the `/*` splat. Moving the splat up would
swallow `/yoni` and break the shorthand.

Why each rule exists:

- **`/yoni` and `/yoni/`** — `/yoni` is a section, not a page; the portfolio is
  what lives under it. 301 (permanent), matching the other path normalisations.
- **`/yoni/portfolio`** — adds the missing trailing slash, so both forms work.
- **`/yoni/portfolio/*` → `index.html` with status 200** — a *rewrite*, not a
  redirect. The URL stays put while the app's HTML is served, which is what
  makes deep links like `?app=terminal` work.
- **`/` → 302** — deliberately **temporary**, unlike the others. Nothing else
  lives on this domain yet. Delete this line the moment `shieber.net` gets its
  own landing page; a 301 would be cached by browsers and hard to undo.

Unknown deep paths (e.g. `/yoni/portfolio/nope/nope`) correctly return 404. The
app routes on the `?app=` query string, never on path segments, so there is
nothing legitimate to catch there.

### Wrangler version — a live constraint

`npm run deploy` pins **wrangler 3**, on purpose:

```
wrangler 4 requires Node >= 22.0.0
this machine runs Node v20.19.6
```

Wrangler 4 refuses to start and the deploy fails outright. Wrangler 3.114.x
supports Node ≥ 16.13 and does everything needed here. It prints an
out-of-date warning on every run, which is safe to ignore.

`nvm` is installed, so if you'd rather run current wrangler:
`nvm install 22 && nvm use 22`, then change the script back to `wrangler@latest`.

### Authentication

Deploys use the OAuth session stored at `~/.config/.wrangler/config/default.toml`
from `wrangler login`. Tokens are short-lived but refresh automatically whenever
a wrangler command runs. If a deploy ever fails with `Authentication error`, run
`npx wrangler@3 login` again.

Run `npx wrangler@3 whoami` to see which account is active — the account ID is
deliberately not recorded here, since this repository is public.

Note this session **cannot touch DNS** (see Part 1) — it can deploy and manage
Pages, nothing more.

---

## Verifying a deploy

```bash
# every path resolves as intended
for p in / /yoni /yoni/ /yoni/portfolio /yoni/portfolio/ "/yoni/portfolio/?app=terminal"; do
  printf "%-32s " "$p"
  curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" "https://shieber.net$p"
done

# assets are reachable at the subpath — catches the BASE_URL mistake
curl -s -o /dev/null -w "%{http_code}\n" https://shieber.net/yoni/portfolio/wallpapers/noble.webp

# crawler-visible content is present without JavaScript (expect 19)
curl -s https://shieber.net/yoni/portfolio/ | grep -o '<h3>' | wc -l
```

Expected: `/` → 302, the three `/yoni*` forms → 301, `/yoni/portfolio/` → 200,
`?app=terminal` → 200, assets → 200, heading count → 19.

> Use `grep -o '<h3>' | wc -l`, not `grep -c '<h3>'`. The HTML is minified to a
> single line, so `grep -c` counts *lines* and always reports `1`.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Assets 404 in production, fine in dev | A literal `/path` instead of `import.meta.env.BASE_URL` | Grep for `"/icons` and `"/wallpapers` in `src/` |
| Redirects ignored entirely | `_redirects` ended up inside `yoni/portfolio/` | It must be at the root of `site/`; check `assemble-site.mjs` |
| `/yoni` serves the app instead of redirecting | Splat rule moved above the exact rules | Restore top-down order in `assemble-site.mjs` |
| Deploy fails on `Node >= 22.0.0` | Something invoked wrangler 4 | Pin `wrangler@3`, or `nvm use 22` |
| `Authentication error` on deploy | OAuth session expired or revoked | `npx wrangler@3 login` |
| Domain stuck `pending` | DNS record missing or grey-clouded | Proxied `CNAME @ -> shieber-net.pages.dev` |
| Domain dead after DNS is correct | Local negative DNS cache | `sudo resolvectl flush-caches` |

## Rollback

Every deploy is retained. Roll back from the Cloudflare dashboard under
**Workers & Pages → shieber-net → Deployments → Rollback**, or redeploy a known
good commit. `pages.dev` preview URLs (e.g. `9f37a164.shieber-net.pages.dev`)
stay live per deployment and are useful for comparing versions.
