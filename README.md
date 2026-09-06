# Yoni Shieber — Portfolio

A portfolio built as a working Ubuntu 24.04 desktop in the browser: a real
window manager, a terminal with a working shell, and a file manager whose
`~/projects` is backed by live GitHub data.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Typecheck and build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | Types only |
| `npm run fetch-repos` | Refresh the committed GitHub snapshot |
| `npm run deploy` | Build and publish to Cloudflare Pages |

## Where things live

Content is data, not markup — edit these rather than components:

- `src/data/profile.ts` — bio, experience, skills, links
- `src/data/projects.ts` — project metadata and READMEs
- `src/data/filesystem.ts` — the virtual filesystem the Terminal and Files share

## Live

**https://shieber.net/yoni/portfolio/** — Cloudflare Pages.

The site is served from a **subpath**, which constrains the build: asset URLs
must use `import.meta.env.BASE_URL` rather than a leading slash, or they 404 in
production while working fine in dev. See
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) before changing anything about paths,
redirects or hosting.

See [docs/PLAN.md](docs/PLAN.md) for the architecture and current build status,
and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for how deployment works.

## Credits

App icons are the [Yaru icon theme](https://github.com/ubuntu/yaru) by Sam
Hewitt and the Ubuntu community (CC BY-SA 4.0). The wallpaper is an original
gradient in the Ubuntu 24.04 palette. Ubuntu and the Ubuntu logo are trademarks
of Canonical Ltd.
This is a personal portfolio, not affiliated with or endorsed by Canonical.
