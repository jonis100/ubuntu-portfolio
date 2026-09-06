/**
 * Hand-written project metadata. The GitHub API alone is too thin to sell this
 * work — it can't tell you that fingerprintDriver is USB protocol reverse
 * engineering. Live repo stats (stars, forks, last push) are layered on top at
 * runtime by useGitHubRepos, matched on `repoName`.
 */

export type ProjectLink = { label: string; href: string };

export type Project = {
  /** Directory name under ~/projects in the virtual filesystem. */
  slug: string;
  name: string;
  /** One line — shown in the Files grid. */
  blurb: string;
  /** Markdown-ish body shown in the detail window and as README.md. */
  readme: string;
  stack: string[];
  language: string;
  year: string;
  highlights: string[];
  links: ProjectLink[];
  /** Matches a repo in repos.generated.json / the live GitHub API. */
  repoName?: string;
  /** Set when the work is not solo, so the role is never overstated. */
  role?: string;
  featured: boolean;
};

export const projects: Project[] = [
  {
    slug: 'lilimit',
    name: 'LiLimit',
    blurb: 'Chrome extension that caps how long — and how often — you visit a site.',
    language: 'TypeScript',
    year: '2023 — 2026',
    repoName: 'LiLimit',
    stack: ['TypeScript', 'Chrome MV3', 'Jest', 'Webpack', 'GitHub Actions'],
    highlights: [
      'Published on the Chrome Web Store and actively maintained across 52 commits.',
      'Per-site time budgets and daily visit counts, enforced by a background service worker.',
      'Unit-tested with Jest and gated by a GitHub Actions CI pipeline with Husky pre-commit hooks.',
    ],
    links: [
      { label: 'Source', href: 'https://github.com/jonis100/LiLimit' },
      {
        label: 'Chrome Web Store',
        href: 'https://chromewebstore.google.com/detail/opbckjpgnijalnbanlpgaolmegdmajob',
      },
    ],
    featured: true,
    readme: `# LiLimit

A Chrome extension for people who know exactly how they lose an afternoon.

LiLimit lets you set a **time budget** and a **daily visit cap** per website. When
you cross either one, the tab is blocked for the rest of the day. The rules live
in a background service worker so they survive tab churn and browser restarts.

## Why it exists

Every "block distracting sites" extension I tried was all-or-nothing. I wanted
something that let me spend twenty minutes somewhere without letting me spend
two hours there.

## Engineering notes

- Written in TypeScript against Chrome Manifest V3.
- State in \`chrome.storage.sync\`, so limits follow you between machines.
- Jest unit tests around the limit-evaluation logic, run in CI on every push.
- Husky pre-commit hooks keep lint and types clean before anything lands.`,
  },
  {
    slug: 'claude-quota-tracker',
    name: 'Claude Quota Tracker',
    blurb: 'VS Code extension showing live Claude usage in the status bar.',
    language: 'TypeScript',
    year: '2026',
    repoName: 'claude-quota-tracker',
    stack: ['TypeScript', 'VS Code API', 'ESLint'],
    highlights: [
      'Published to both the VS Marketplace and Open VSX — two distribution pipelines, one codebase.',
      'Polls and caches quota state without blocking the editor, surfacing it in the status bar.',
      'Shipped through 1.0.3 → 1.0.5 with a maintained changelog.',
    ],
    links: [
      { label: 'Source', href: 'https://github.com/jonis100/claude-quota-tracker' },
      {
        label: 'VS Marketplace',
        href: 'https://marketplace.visualstudio.com/items?itemName=yonis.claude-quota-tracker',
      },
      { label: 'Open VSX', href: 'https://open-vsx.org/extension/yonis/claude-quota-tracker' },
    ],
    featured: true,
    readme: `# Claude Quota Tracker

A VS Code extension that puts your Claude subscription usage in the status bar,
because the first step to recovery is admitting you have a problem.

## What it does

Tracks how much of your Claude quota you have burned through and renders it as a
compact status-bar item that turns from calm to alarming as you approach the
limit. Click it for a breakdown.

## Engineering notes

- Polling is debounced and cached so the editor never stalls on a network call.
- Ships to the VS Marketplace **and** Open VSX, so VSCodium and Cursor users get
  it too — two publishing pipelines from one build.`,
  },
  {
    slug: 'bounty-catcher',
    name: 'bounty-catcher',
    blurb: 'Recovers live secrets from deleted Git objects across bug-bounty orgs.',
    language: 'Python',
    year: '2026',
    stack: ['Python', 'TruffleHog', 'SQLite', 'GitHub API', 'Telegram'],
    highlights: [
      'Mirrors bounty-scoped repositories and walks unreachable Git objects that ordinary clones never fetch.',
      'Recovers blobs from deleted commits, then verifies candidate secrets rather than only pattern-matching them.',
      'Checkpointed in SQLite so a multi-hour scan resumes exactly where it stopped; alerts land in Telegram.',
    ],
    links: [],
    featured: true,
    readme: `# bounty-catcher

A pipeline that hunts **verified** secrets in the parts of a Git repository
people assume are gone.

## The idea

Force-pushing over a commit that contained an API key does not delete the blob —
it only makes it unreachable. Clone normally and you will never see it. Mirror
the repository and walk the object database directly, and it is still sitting
there.

bounty-catcher automates that across every repository in a bug-bounty programme's
scope:

1. Enumerate in-scope GitHub orgs and mirror each repository.
2. Walk unreachable objects and recover deleted blobs.
3. Run TruffleHog in verification mode — a candidate only counts once it is
   confirmed live, which is what separates a report from noise.
4. Checkpoint progress in SQLite and push confirmed findings to Telegram.

## Engineering notes

The restartability matters more than it sounds. Scans run for hours across
thousands of repositories, and network failures are routine — every stage
records its position so a crash costs minutes rather than a full re-run.`,
  },
  {
    slug: 'fingerprint-driver',
    name: 'fingerprintDriver',
    blurb: 'Reverse-engineering a Goodix USB fingerprint sensor into a Linux driver.',
    language: 'C',
    year: '2026',
    stack: ['C', 'libfprint', 'Python', 'pyusb', 'pycryptodome', 'USB protocol RE'],
    highlights: [
      'Captured and decoded the USB protocol of an unsupported Goodix 27c6:55a4 sensor from scratch.',
      'Built Python tooling to dump, replay and diff USB traffic while mapping the command set.',
      'Extended a libfprint fork in C toward a working driver for hardware with no Linux support.',
    ],
    links: [],
    featured: true,
    readme: `# fingerprintDriver

My laptop's fingerprint reader — a Goodix \`27c6:55a4\` — has no Linux driver.
So I started writing one.

## The work

There is no datasheet. The only description of the protocol is the traffic the
Windows driver produces, so the process is:

- Capture USB traffic between the Windows driver and the sensor.
- Build Python tooling on top of \`pyusb\` to replay captured exchanges and diff
  responses, isolating what each command byte does.
- Work out the initialisation handshake, including the encrypted portions, with
  \`pycryptodome\`.
- Port the understood command set into C against a \`libfprint\` fork.

## Status

In progress, and honest about it: initialisation and several command families are
mapped, image capture is partially working. It is the hardest thing here and the
one I have learned the most from — nothing teaches you a bus like having no
documentation for it.`,
  },
  {
    slug: 'koi',
    name: 'koi',
    blurb: 'Privacy extension that flags network anomalies and risky extensions locally.',
    language: 'TypeScript',
    year: '2026',
    stack: ['TypeScript', 'Chrome MV3', 'Jest', 'Playwright', 'Webpack'],
    highlights: [
      'All analysis runs on-device — a privacy tool that phones home is not a privacy tool.',
      'Scores your other installed extensions by the risk their permission sets imply.',
      'Covered by Jest unit tests and Playwright end-to-end tests.',
    ],
    links: [],
    featured: true,
    readme: `# koi

A browser-security extension that watches for network anomalies and audits the
other extensions you have installed — without sending anything anywhere.

## Design constraint

Everything is processed locally. A privacy tool that ships your browsing history
to a server to analyse it has missed the point, so all detection runs in the
extension itself.

## What it checks

- Unexpected outbound request patterns from pages you are not interacting with.
- The permission surface of every installed extension, scored by what that
  combination of permissions would let a malicious update do.

## Engineering notes

Jest covers the scoring logic; Playwright drives the real extension in a real
browser for end-to-end coverage.`,
  },
  {
    slug: 'epsiclaw',
    name: 'epsiclaw',
    blurb: 'An LLM agent loop rebuilt in ~515 lines — "nanoGPT for agents".',
    language: 'Python',
    year: '2026',
    repoName: 'epsiclaw',
    stack: ['Python', 'OpenAI-compatible API', 'Telegram'],
    highlights: [
      'Strips a production personal-assistant agent down to the ~515 lines that actually matter.',
      'Implements the full loop end to end: tool dispatch, memory, scheduled tasks, chat transport.',
      'Written as a teaching artefact — readable start to finish in one sitting.',
    ],
    links: [{ label: 'Source', href: 'https://github.com/jonis100/epsiclaw' }],
    featured: true,
    readme: `# epsiclaw

A minimal reimplementation of a personal-assistant agent — the nanoGPT treatment
applied to agent frameworks.

## Why

Agent frameworks are large, and the size hides how simple the core actually is.
Underneath the abstraction layers there is a loop: send context to a model, read
back a tool call, execute it, append the result, repeat.

epsiclaw is that loop and nothing else, in about 515 lines of Python — LLM calls,
tool dispatch, a memory store, cron-style scheduled tasks, and a Telegram front
end. You can read the whole thing in one sitting and come away actually knowing
how an agent works.`,
  },
  {
    slug: 'ghosts-tracker',
    name: 'ghosts-tracker',
    blurb: 'Scores Israeli R&D job postings by how long they have been haunting the board.',
    language: 'TypeScript',
    year: '2026',
    stack: ['TypeScript', 'Next.js', 'Node.js', 'Docker Compose', 'npm workspaces'],
    highlights: [
      'Monorepo with five workspaces: web, API, data, scheduler and scraper.',
      'Scheduled scrapers track how long each posting has stayed open and derive a "ghost level".',
      'Containerised end to end with Docker Compose.',
    ],
    links: [],
    featured: true,
    readme: `# ghosts-tracker

Some job postings are real. Some have been open for eleven months and are there
to collect résumés. This tells them apart.

## How it works

Scrapers collect R&D postings from Israeli tech companies on a schedule. Because
the history is retained, each posting accumulates a **ghost level** — a score
derived from how long it has stayed open, how often it has been reposted, and
how little the description has changed between repostings.

## Architecture

A TypeScript monorepo on npm workspaces: \`web\` (Next.js), \`api\`, \`data\`,
\`scheduler\` and \`scraper\`, wired together with Docker Compose.`,
  },
  {
    slug: 'chaos-system',
    name: 'chaosSystem',
    blurb: 'A URL shortener built as an excuse to instrument everything properly.',
    language: 'TypeScript',
    year: '2026',
    repoName: 'chaos-system-ts',
    stack: ['NestJS', 'TypeScript', 'TypeORM', 'PostgreSQL', 'OpenTelemetry', 'Prometheus', 'Grafana'],
    highlights: [
      'Full observability stack: OpenTelemetry traces, Prometheus metrics and Grafana dashboards.',
      'Deliberately rewritten from Python/FastAPI to NestJS to compare the two under identical instrumentation.',
      'One-command Docker Compose bring-up of app, database, collector and dashboards.',
    ],
    links: [{ label: 'Source', href: 'https://github.com/jonis100/chaos-system-ts' }],
    featured: true,
    readme: `# chaosSystem

A URL shortener, which is the boring part. The interesting part is that it is
instrumented the way a production service should be.

## What is actually in here

- **Traces** via OpenTelemetry, through the API into the database layer.
- **Metrics** exported to Prometheus.
- **Dashboards** in Grafana, provisioned as code rather than clicked together.
- The whole stack — app, Postgres, collector, Prometheus, Grafana — comes up with
  one \`docker compose up\`.

## The rewrite

It exists twice: once in Python with FastAPI and SQLAlchemy, once in TypeScript
with NestJS and TypeORM. Same feature set, same instrumentation, so the
comparison between the two is about the ergonomics rather than the benchmark.`,
  },
  {
    slug: 'tiny-browser',
    name: 'tinyBrowser',
    blurb: 'A web browser written from scratch in Python: parser, DOM, layout, paint.',
    language: 'Python',
    year: '2025',
    stack: ['Python', 'tkinter', 'requests', 'PIL'],
    highlights: [
      'Hand-written HTML tokeniser and parser producing a real DOM tree.',
      'Own layout engine computing box positions, then painting to a tkinter canvas.',
      'No browser engine, no HTML parsing library — the whole pipeline from bytes to pixels.',
    ],
    links: [],
    featured: true,
    readme: `# tinyBrowser

A small web browser in Python, built to answer "what actually happens between
typing a URL and seeing a page".

## The pipeline

1. **Fetch** — HTTP by hand, so the request and response are visible.
2. **Tokenise and parse** — a hand-written HTML parser producing a DOM tree,
   including the parts of the spec that exist purely to cope with malformed
   markup, which is most of it.
3. **Layout** — walk the tree and compute a box for every node.
4. **Paint** — draw the boxes to a tkinter canvas.

No engine, no \`html.parser\`, no shortcuts through the interesting parts. It
renders simple pages, and more importantly it made every browser bug I have hit
since make sense.`,
  },
  {
    slug: 'nanoclaw',
    name: 'nanoclaw',
    blurb: 'Contributor — an AI assistant that runs each agent in its own container.',
    language: 'TypeScript',
    year: '2026',
    role: 'Contributor',
    stack: ['TypeScript', 'Docker', 'pnpm workspaces', 'Vitest'],
    highlights: [
      'Contributor to a 1,000+ commit production codebase at qwibit.ai, not a solo project.',
      'Each agent is sandboxed in its own container — a security-first take on agent runtimes.',
      'Multi-package TypeScript monorepo on pnpm workspaces with Vitest coverage.',
    ],
    links: [
      { label: 'Source', href: 'https://github.com/qwibitai/nanoclaw' },
      { label: 'nanoclaw.dev', href: 'https://nanoclaw.dev' },
    ],
    featured: true,
    readme: `# nanoclaw

> **My role:** contributor. This is a team project owned by qwibit.ai, with over
> a thousand commits — I am not its author, and it is here because working in
> someone else's large codebase is a different skill from starting your own.

A personal AI assistant that runs each agent **inside its own container**, so a
misbehaving or prompt-injected agent is contained by the sandbox rather than by
good intentions.

A multi-package TypeScript monorepo on pnpm workspaces, tested with Vitest.`,
  },
  {
    slug: 'weather-mcp',
    name: 'weather-mcp',
    blurb: 'A Model Context Protocol server exposing live weather as an agent tool.',
    language: 'TypeScript',
    year: '2026',
    stack: ['TypeScript', 'MCP SDK', 'Docker'],
    highlights: [
      'Implements the MCP stdio transport so Claude Desktop can call it directly.',
      'Documented well past its size — architecture, setup, testing and troubleshooting guides.',
    ],
    links: [],
    featured: false,
    readme: `# weather-mcp

A Model Context Protocol server exposing a \`show_current_weather\` tool, so an
agent can answer weather questions with real data instead of guessing.

Small on purpose — it is a clean reference for how an MCP server is put together,
with the stdio transport wired up for Claude Desktop and a Docker image for
everything else.`,
  },
  {
    slug: 'dforce',
    name: 'DForce',
    blurb: 'Anti-phishing tool that poisons stolen-credential databases with junk.',
    language: 'Python',
    year: '2023',
    repoName: 'DForce',
    stack: ['Python', 'Selenium', 'selenium-wire', 'Tor'],
    highlights: [
      'Floods phishing kits with plausible fake credentials so the real ones lose their value.',
      'Rotates identity through Tor so submissions are not trivially filtered by source.',
      'The write-up passed 100K views on LinkedIn.',
    ],
    links: [{ label: 'Source', href: 'https://github.com/jonis100/DForce' }],
    featured: false,
    readme: `# DForce

Phishing kits collect credentials into a database. That database is only worth
something if the entries in it are real.

DForce submits large volumes of plausible fake credentials to a phishing page,
rotating identity through Tor so the submissions cannot be filtered out by source
address. The victim's real credentials are still in there — but so are thousands
of indistinguishable fake ones, and sorting them costs more than the set is worth.

Built while I was investigating this kind of fraud for a living, which is where
the appetite for it came from.`,
  },
  {
    slug: 'cs-analyst-agent',
    name: 'Customer Service Analyst Agent',
    blurb: 'A LangGraph ReAct agent that answers questions about a support dataset.',
    language: 'Python',
    year: '2026',
    repoName: 'Customer-Service-Data-Analyst-Agent',
    stack: ['Python', 'LangGraph', 'MCP', 'Streamlit', 'LLM'],
    highlights: [
      'ReAct agent built on LangGraph with persistent memory across turns.',
      'Ships its own MCP server, so the same tools are callable from any MCP client.',
      'Streamlit front end for asking questions of the Bitext support dataset in plain English.',
    ],
    links: [
      { label: 'Source', href: 'https://github.com/jonis100/Customer-Service-Data-Analyst-Agent' },
    ],
    featured: true,
    readme: `# Customer Service Analyst Agent

An agent that answers analytical questions about a customer-service dataset —
"what are people most often angry about?" — without anyone writing the query.

## How it is built

- **LangGraph** drives a ReAct loop: reason, pick a tool, observe, repeat.
- **Persistent memory** carries context between turns, so follow-up questions
  work the way people actually ask them.
- **An MCP server** exposes the same tools over Model Context Protocol, so the
  agent's capabilities are reusable from any MCP client rather than locked
  inside this app.
- **Streamlit** provides the UI.

Built against the Bitext customer-service dataset.`,
  },
  {
    slug: 'multiple-paste',
    name: 'GNOME Multiple Paste',
    blurb: 'A clipboard history manager for the GNOME Shell — the real desktop.',
    language: 'JavaScript',
    year: '2026',
    repoName: 'gnome-multiple-paste',
    stack: ['JavaScript', 'GJS', 'GNOME Shell', 'GSettings'],
    highlights: [
      'A real GNOME Shell extension in GJS, packaged for GNOME 46 through 48.',
      'Keeps a searchable clipboard history in the top bar with keyboard-driven recall.',
      'Preferences persisted through GSettings schemas, as the platform expects.',
    ],
    links: [{ label: 'Source', href: 'https://github.com/jonis100/gnome-multiple-paste' }],
    featured: true,
    readme: `# GNOME Multiple Paste

A lightweight clipboard history manager for the GNOME Shell.

You are currently looking at a browser imitation of this desktop. This one is
the real thing — a GJS extension that runs inside GNOME Shell itself, keeping a
searchable history of what you have copied and putting it one shortcut away.

## Notes

- Written in GJS against the GNOME Shell extension API.
- Packaged for GNOME 46, 47 and 48.
- Settings stored in GSettings schemas rather than a config file, so they behave
  like every other GNOME preference.`,
  },
  {
    slug: 'quicker',
    name: 'Quicker',
    blurb: 'The precursor to DForce — a targeted strike on a single phishing site.',
    language: 'Python',
    year: '2023',
    repoName: 'Quicker',
    stack: ['Python', 'Automation'],
    highlights: [
      'Focused counter-phishing tooling aimed at one live campaign.',
      'The idea that generalised into DForce.',
    ],
    links: [{ label: 'Source', href: 'https://github.com/jonis100/Quicker' }],
    featured: false,
    readme: `# Quicker

A targeted counter-phishing script written against one specific live campaign,
during the period I was investigating this kind of fraud professionally.

It is narrower than [DForce](https://github.com/jonis100/DForce) — one site, one
purpose — and it is the thing that generalised into it.`,
  },
];

export function projectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
