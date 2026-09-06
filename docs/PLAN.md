# Ubuntu Desktop Portfolio — Plan & Architecture

> Living document. Updated alongside the code — if this and the code disagree,
> the code is right and this file is a bug.
>
> Last synced: 2026-09-04

## Context

A portfolio that demonstrates ability rather than describing it. The reference,
[roeyzalta.com](https://www.roeyzalta.com/), is a macOS desktop simulated in the
browser — menu bar, dock, draggable windows, projects pulled live from the GitHub
API. The concept works because the site *is* the demo: you cannot fake a working
window manager.

This is the same idea as **Ubuntu 24.04 / GNOME with the Yaru dark theme**, which
suits Yoni's Linux, security and low-level background and differentiates from the
macOS reference.

Prior art exists (`vivek9patel/personal-portfolio`, ubuntu.vivek.dev). The
differentiators here are the **shared virtual filesystem** behind Terminal and
Files, live GitHub data with an offline fallback, and an unusually varied project
set (police cyber unit → USB driver reverse engineering → AI tooling).

The older flat portfolio at `../Portfolio/index.html` was the source of the bio
copy and voice. It is content, not code — nothing was carried over structurally.

### Decisions

| | |
|---|---|
| Look | Ubuntu 24.04 GNOME, Yaru dark, with a light toggle |
| Stack | Vite 6 + React 18 + TypeScript + Tailwind 4 + Zustand |
| Hosting | Cloudflare Pages, at shieber.net/yoni/portfolio/ |
| Apps | Terminal, Files, About, Settings, Reader |
| Dock links | Privasee, GitHub, LinkedIn, Email (open real tabs) |
| Out of scope for v1 | AI chat, VS Code viewer, resume PDF, in-desktop browser |

## Build status

| Phase | Scope | Status |
|---|---|---|
| 0 | Scaffold, Yaru tokens, Ubuntu fonts, wallpapers | **Done** |
| 1 | Window manager: drag, resize, snap, z-order, dock, top bar | **Done** |
| 2 | Content layer: VFS, profile, projects, GitHub snapshot | **Done** |
| 3 | Apps: Terminal, Files, About, Settings, Reader | **Done** |
| 4 | Polish: boot/login, overview, quick settings, mobile, SEO, deep links | **Done** |
| 5 | Deploy: Cloudflare Pages, custom domain, OG image | **Done** — live at shieber.net/yoni/portfolio/ |

## Architecture

```
src/
  os/
    store.ts          Zustand: windows, z-order, focus, theme, viewport
    types.ts          AppId, WindowState, AppDefinition, Rect
  components/
    Desktop.tsx       Composition root + Activities overview
    Window.tsx        Chrome, drag, resize, snap, z-order
    TopBar.tsx        Activities, clock, quick-settings menu
    Dock.tsx          Left dock (bottom bar on phones)
    Wallpaper.tsx     The Noble bitmap + CSS-gradient alternatives
    BootScreen.tsx    Boot splash + GDM login
    Markdown.tsx      Small purpose-built Markdown renderer
    icons.tsx         Yaru PNG app icons + inline-SVG brand marks
  apps/
    registry.tsx      App manifest; every app is React.lazy
    terminal/         Terminal.tsx + commands.ts (one table drives
                      dispatch, `help` and Tab completion)
    files/            Files.tsx (Nautilus)
    about/ settings/ reader/
  data/
    profile.ts        Bio, experience, skills, certifications, links
    projects.ts       Curated project metadata (15 entries)
    filesystem.ts     The VFS — shared by Terminal and Files
    github.ts         Repo type + the one place the API response is flattened
    repos.generated.json   Build-time GitHub snapshot
  hooks/
    useGitHubRepos.ts useClock.ts useIsMobile.ts
scripts/
  fetch-repos.ts      Regenerates the GitHub snapshot
```

### Window manager — `src/os/store.ts`

One Zustand store owns all window state. Windows are
`{ id, appId, title, z, minimized, snap, rect, restoreRect }`.

- **Dragging and resizing write directly to the DOM node** during the gesture and
  only commit to the store on `pointerup`. Re-rendering React on every
  `pointermove` makes dragging feel heavy once several windows are open.
- **Edge snapping** matches GNOME: top edge maximises, left/right snap to half
  the work area, with a translucent preview before drop. Dragging a snapped
  window tears it loose and re-centres it under the cursor.
- **Work area** is the viewport minus the 32px top bar and the 72px dock (or the
  64px bottom bar on phones). All snap geometry derives from it.
- `viewport` is tracked in the store so resizes actually re-render snapped
  windows — `window.innerWidth` read during render would go stale.

### The virtual filesystem — `src/data/filesystem.ts`

The piece that makes it feel real, and built before either app that consumes it.
A plain tree describing `/home/yoni`:

```
~/projects/<slug>/README.md     one directory per project
~/documents/{experience,certifications,skills}
~/about.txt  ~/contact.txt  ~/.secret
```

`ls ~/projects` in the Terminal and the Files window at `~/projects` read the
**same tree**, and opening a README from either surface opens the same Reader
window. `about.txt`, `experience.txt` and `skills.json` are generated from
`profile.ts`, so the shell can never drift from the About app.

### GitHub data

`projects.ts` holds hand-written metadata because the API alone cannot convey
that `fingerprintDriver` is USB protocol reverse engineering. `useGitHubRepos`
layers live stats on top, matched on `repoName`. The fetch is cached as a
module-level promise, so a second window costs no extra request against the
60/hour budget, and `github.ts` holds the response mapping the runtime hook and
the snapshot script share.

The committed snapshot is the **permanent fallback, not a placeholder**: the
unauthenticated API allows 60 requests/hour per IP, so a live-only fetch would
empty the Files window during exactly the traffic spike you want. The snapshot
renders immediately; a successful fetch upgrades it. The Files sidebar shows
which source is in use.

Regenerate with `npm run fetch-repos` (honours `GITHUB_TOKEN` if set).

### SEO

The desktop is client-rendered, so a crawler that does not execute JavaScript
would see an empty page. The `seo-prerender` plugin in `vite.config.ts` injects
the bio, experience, all projects, skills and contact links as real, visually
hidden markup into `index.html` **at build time**. Verified: the built HTML
carries an `<h1>` and 19 `<h3>` headings with no JS executed.

### Visual assets — the real thing, not approximations

Hand-drawn icon approximations looked wrong beside a real Ubuntu desktop, so the
assets are the genuine ones, taken from a 24.04 machine:

- **App icons** — the Yaru icon theme (`yaru-theme-icon` package), copied from
  `/usr/share/icons/Yaru/256x256/` into `public/icons/`. CC BY-SA 4.0,
  © Sam Hewitt and the Ubuntu community.
- **Wallpaper** — an original 1920×1080 gradient (18KB WebP) reproducing the
  Ubuntu 24.04 colour and light: aubergine field, soft diagonal band, warm glow
  bottom-right. The crown emblem is deliberately omitted — the palette is what
  makes it read as Ubuntu, and leaving the artwork out keeps the asset wholly
  ours. (The wallpaper shipped in `ubuntu-wallpapers` is greyscale and nearly
  flat, luminance 17–94, so it was no use for colour anyway.)
- **Privasee** — the real company mark from the Privasee LinkedIn page
  (`linkedin.com/company/yourprivasee`), cropped to the arcs-and-dot symbol
  because the wordmark is illegible at dock size. Only a 100×100 source is
  available; a vector original would be better if one exists.
- **Brand marks** — GitHub and LinkedIn stay as inline SVG, since they are not
  part of the icon theme.

Yaru attribution appears in the About app's Credits section and in the README,
with an explicit note that this is a personal portfolio unaffiliated with
Canonical.

### Deployment

Hosted on **Cloudflare Pages** (project `shieber-net`, account
`jonishei100@gmail.com`), served from **https://shieber.net/yoni/portfolio/**.

Because the site lives at a subpath rather than a domain root, three things have
to agree:

1. `base: '/yoni/portfolio/'` in `vite.config.ts`, so emitted asset URLs carry
   the prefix.
2. Runtime asset URLs use `import.meta.env.BASE_URL` rather than a leading
   slash — see `icons.tsx` and `Wallpaper.tsx`. A leading slash 404s here.
3. `scripts/assemble-site.mjs` copies `dist/` into `site/yoni/portfolio/` so the
   directory structure mirrors the URL, and writes `_redirects` at the deploy
   **root** — Pages only reads it there.

`npm run build` does all three; `npm run deploy` builds and pushes.

Full write-up — why the site first appeared only at `shieber-net.pages.dev`, the
DNS fix, and the deploy pipeline — is in [DEPLOYMENT.md](DEPLOYMENT.md).

`_redirects` sends the bare domain to the portfolio, adds the trailing slash,
and 200-rewrites the app path. Unknown deep paths under the app return 404,
which is correct: the app routes on `?app=`, never on path segments.

### Mobile

Below 768px the window manager is bypassed: apps open full-screen and
non-draggable, the dock becomes a bottom bar, the Files sidebar is hidden, and a
single tap opens instead of a double-click. Windows already floating when the
viewport crosses the breakpoint stay floating — only newly opened ones go
full-screen.

## Content notes

- **Optimove is the current role** (confirmed). Vim Healthcare moved to a past
  position. Both date ranges are marked `TODO(yoni)` in `profile.ts` and need
  confirming.
- The old page described **LiLimit** as a LinkedIn connection limiter; the repo
  README says it limits time and daily visits per website. The README is right.
- `nanoclaw` is explicitly labelled **Contributor** — it is a qwibit.ai project
  with 1,000+ commits, and the README says so in the first line.
- Projects with no public repo show a "private repository, happy to walk through
  it" line rather than a dead link.

## Security

Sibling directories (`../CrossLetters/`, `../Groups_Cleaner/`, various `.env`
files) contain live keys and an SSH key. **The git root must stay at
`MyPortfolio/` and never widen above it.**

## Verification

Everything below has been run against this build.

- **Typecheck / build** — `npm run typecheck`, `npm run build`. Clean, with each
  app emitted as its own chunk.
- **Window manager** — a 220×120 drag moved the window exactly 220×120; the
  left-edge snap preview armed and the window landed at `x=72, y=32,
  w=684, h=868` on a 1440×900 viewport, which is exactly half the work area.
- **Terminal** — `neofetch` renders the ASCII logo beside the stat block;
  `ls ~/projects` lists the same 15 directories the Files window shows.
- **Files** — live stars appear (★11 claude-quota-tracker, ★7 Quicker,
  ★3 LiLimit); double-click navigates into a project and shows its detail header.
- **GitHub fallback** — with `api.github.com` blocked at the network layer, the
  sidebar reads "GitHub: cached" and all 15 projects still render with stars.
- **Mobile at 390×844** — the app window's bottom edge sits at 780px and the dock
  starts at 780px: flush, no overlap, no horizontal body scroll. The Files
  sidebar is hidden and the min/maximise buttons are gone.
- **External links** — all 10 verified 200: both extension listings, Open VSX,
  every public GitHub repo, and nanoclaw.dev.
- **Keyboard** — desktop icons and Files entries are double-click surfaces, so
  they also open on Enter; verified for both.
- **Console** — no errors or warnings beyond React's DevTools notice.

Still to check before launch: Lighthouse (target performance ≥ 90,
accessibility ≥ 95).

## Open items

1. **OG image** — `/og.png` is referenced by the meta tags but not yet created.
   A screenshot of the desktop would do; until then link previews show no image.
2. **Optimove start date** and a one-line role description for the timeline.
3. **Profile photo** for the login screen, About app and dock avatar. Currently
   falls back to an "YS" initials avatar.
4. **OG image** — a screenshot of the desktop, referenced as `/og.png`.
5. **`Quicker` and `nampy`** are public and unreviewed by Yoni for this site.
   `nampy` ("optional poisoned numpy") is a supply-chain research artefact and is
   deliberately **not** featured — it needs framing before it goes anywhere.
6. **The Privasee link is broken.** `privaseeai.com` currently 301-redirects to
   `app--product-manual-4545b174.base44.app`, an unrelated page titled
   "ProductManual"; `www.privaseeai.com` does not resolve at all. The dock entry
   points at `privaseeai.com` as requested, so visitors land somewhere confusing
   until the domain is fixed. The icon itself is the real mark from LinkedIn.
7. **A vector Privasee logo** would beat the 100×100 raster currently in
   `public/icons/privasee.png`, if one exists.
