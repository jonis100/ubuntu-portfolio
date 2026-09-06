import {
  getNode,
  isDir,
  listDir,
  prettyPath,
  resolvePath,
} from '@/data/filesystem';
import { profile, systemInfo } from '@/data/profile';
import { projects } from '@/data/projects';
import { APPS } from '@/apps/registry';
import type { AppId } from '@/os/types';

export type Tone =
  | 'normal'
  | 'dim'
  | 'accent'
  | 'error'
  | 'success'
  /** Bright foreground — neofetch values and the logo's glyph shapes. */
  | 'white';

export type Span = {
  text: string;
  tone?: Tone;
  bold?: boolean;
  /** Background colour, for the ANSI palette swatches neofetch prints. */
  bg?: string;
};

/**
 * A line is either plain text in one tone, or a run of spans when it needs
 * more than one colour — which is most of neofetch.
 */
export type Line = { text?: string; tone?: Tone; spans?: Span[] };

export type CommandContext = {
  cwd: string;
  setCwd: (path: string) => void;
  /** Empties the scrollback; the caller decides what that means for its buffer. */
  clear: () => void;
  openApp: (id: AppId, payload?: unknown, title?: string) => void;
  /**
   * Hand the terminal into sudo's password prompt. Real sudo reads three
   * attempts before giving up, so the terminal has to actually collect them —
   * printing the failure without asking would be nonsense.
   */
  askPassword: (args: string[]) => void;
};

/**
 * One entry per command. This is the only list: `help` and Tab completion are
 * both derived from it, so a new command cannot be half-added.
 */
type Command = {
  name: string;
  /** Argument shape, shown in `help`. */
  usage?: string;
  /** One line for `help`. Commands without one are easter eggs and stay unlisted. */
  summary?: string;
  run: (args: string[], ctx: CommandContext) => Line[];
};

const ok = (text: string): Line => ({ text });
const dim = (text: string): Line => ({ text, tone: 'dim' });
const err = (text: string): Line => ({ text, tone: 'error' });
const accent = (text: string): Line => ({ text, tone: 'accent' });

/** Everything that is not a `-flag`, rejoined — paths may contain spaces. */
const operand = (args: string[]) => args.filter((a) => !a.startsWith('-')).join(' ');

/** Apps `open` will launch. Reader is excluded: it needs a file to show. */
const OPENABLE = APPS.filter((a) => a.id !== 'reader').map((a) => a.id);

/** Ubuntu's ASCII logo, drawn beside the neofetch stat block. */
const UBUNTU_ASCII = [
  '            .-/+oossssoo+/-.           ',
  '        `:+ssssssssssssssssss+:`       ',
  '      -+ssssssssssssssssssyyssss+-     ',
  '    .ossssssssssssssssssdMMMNysssso.   ',
  '   /ssssssssssshdmmNNmmyNMMMMhssssss/  ',
  '  +ssssssssshmydMMMMMMMNddddyssssssss+ ',
  ' /sssssssshNMMMyhhyyyyhmNMMMNhssssssss/',
  '.ssssssssdMMMNhsssssssssshNMMMdssssssss.',
  '+sssshhhyNMMNyssssssssssssyNMMMysssssss+',
  'ossyNMMMNyMMhsssssssssssssshmmmhssssssso',
  'ossyNMMMNyMMhsssssssssssssshmmmhssssssso',
  '+sssshhhyNMMNyssssssssssssyNMMMysssssss+',
  '.ssssssssdMMMNhsssssssssshNMMMdssssssss.',
  ' /sssssssshNMMMyhhyyyyhdNMMMNhssssssss/ ',
  '  +sssssssssdmydMMMMMMMMddddyssssssss+  ',
  '   /ssssssssssshdmNNNNmyNMMMMhssssss/   ',
  '    .ossssssssssssssssssdMMMNysssso.    ',
  '      -+sssssssssssssssssyyyssss+-      ',
  '        `:+ssssssssssssssssss+:`        ',
  '            .-/+oossssoo+/-.            ',
];

/**
 * The Ubuntu logo is drawn in two colours: an orange field of `s`/`o`/`+`
 * texture, with the "circle of friends" glyphs picked out in white. Those
 * glyphs are the runs of dMNymh characters — but only the long ones. A stray
 * pair like the `yy` on line three is field texture, not glyph, so the run has
 * to be at least three characters to count as white.
 */
const LOGO_GLYPH = /[dmMNyh]/;

function colourLogoLine(line: string): Span[] {
  const spans: Span[] = [];
  let pending = '';
  let i = 0;

  const flushField = () => {
    if (pending) {
      spans.push({ text: pending, tone: 'accent' });
      pending = '';
    }
  };

  while (i < line.length) {
    let j = i;
    while (j < line.length && LOGO_GLYPH.test(line[j])) j++;

    if (j - i >= 3) {
      flushField();
      spans.push({ text: line.slice(i, j), tone: 'white' });
      i = j;
    } else {
      pending += line[i];
      i += 1;
    }
  }

  flushField();
  return spans;
}

/**
 * neofetch prints bold coloured keys against plain white values. The width has
 * to clear the longest key ("Previously:", 11 chars) with a gap, or the value
 * butts straight up against the colon.
 */
const KEY_WIDTH = 12;
function kv(key: string, value: string): Span[] {
  return [
    { text: `${key}:`.padEnd(KEY_WIDTH), tone: 'accent', bold: true },
    { text: value, tone: 'white' },
  ];
}

/** The terminal's 16 ANSI colours, printed as swatches under the info block. */
const ANSI_NORMAL = ['#2e3436', '#cc0000', '#4e9a06', '#c4a000', '#3465a4', '#75507b', '#06989a', '#d3d7cf'];
const ANSI_BRIGHT = ['#555753', '#ef2929', '#8ae234', '#fce94f', '#729fcf', '#ad7fa8', '#34e2e2', '#eeeeec'];
const swatches = (row: string[]): Span[] => row.map((bg) => ({ text: '   ', bg }));

function neofetch(): Line[] {
  const handle = `${profile.username}@${profile.hostname}`;

  const info: (Span[] | null)[] = [
    [
      { text: profile.username, tone: 'accent', bold: true },
      { text: '@', tone: 'white' },
      { text: profile.hostname, tone: 'accent', bold: true },
    ],
    [{ text: '-'.repeat(handle.length), tone: 'white' }],
    kv('OS', systemInfo.os),
    kv('Kernel', systemInfo.kernel),
    kv('Shell', systemInfo.shell),
    kv('DE', systemInfo.de),
    kv('Theme', systemInfo.theme),
    kv('Terminal', systemInfo.terminal),
    null,
    kv('Role', profile.headline),
    kv('Previously', profile.subhead),
    kv('Location', profile.location),
    kv('Projects', `${projects.length} on disk`),
    null,
    kv('GitHub', profile.links.githubUser),
    kv('Email', profile.links.email),
    null,
    swatches(ANSI_NORMAL),
    swatches(ANSI_BRIGHT),
  ];

  const artWidth = Math.max(...UBUNTU_ASCII.map((l) => l.length));
  const rows = Math.max(UBUNTU_ASCII.length, info.length);

  const out: Line[] = [];
  for (let i = 0; i < rows; i++) {
    const art = (UBUNTU_ASCII[i] ?? '').padEnd(artWidth);
    out.push({
      spans: [...colourLogoLine(art), { text: '  ' }, ...(info[i] ?? [])],
    });
  }
  return out;
}

/** Render a directory tree, as `tree` does. */
function tree(path: string, prefix = '', depth = 0): Line[] {
  if (depth > 2) return [];
  const entries = listDir(path);
  const out: Line[] = [];
  entries.forEach((entry, i) => {
    const last = i === entries.length - 1;
    out.push({
      text: `${prefix}${last ? '└── ' : '├── '}${entry.name}${entry.type === 'dir' ? '/' : ''}`,
      tone: entry.type === 'dir' ? 'accent' : 'normal',
    });
    if (entry.type === 'dir') {
      out.push(...tree(`${path}/${entry.name}`, `${prefix}${last ? '    ' : '│   '}`, depth + 1));
    }
  });
  return out;
}

/** The listing `help` prints, padded so the descriptions line up. */
function helpLines(): Line[] {
  const listed = COMMANDS.filter((c) => c.summary);
  const invocations = listed.map((c) => (c.usage ? `${c.name} ${c.usage}` : c.name));
  const width = Math.max(...invocations.map((i) => i.length));

  return [
    accent('Available commands'),
    ok(''),
    ...listed.map((c, i) => ok(`  ${invocations[i].padEnd(width)}  ${c.summary}`)),
    ok(''),
    dim('  Tip: Tab completes paths, ↑/↓ walks history.'),
  ];
}

/**
 * What Ubuntu's command-not-found handler would suggest. These are the real
 * package names, so `ifconfig` correctly points at net-tools rather than a
 * package called ifconfig. Anything not listed gets a plain "command not
 * found".
 */
const APT_PACKAGES: Record<string, string> = {
  ifconfig: 'net-tools',
  netstat: 'net-tools',
  route: 'net-tools',
  arp: 'net-tools',
  dig: 'dnsutils',
  nslookup: 'dnsutils',
  traceroute: 'traceroute',
  tcpdump: 'tcpdump',
  nmap: 'nmap',
  ping: 'iputils-ping',
  ssh: 'openssh-client',
  curl: 'curl',
  wget: 'wget',
  git: 'git',
  vim: 'vim',
  nano: 'nano',
  emacs: 'emacs',
  htop: 'htop',
  jq: 'jq',
  gcc: 'gcc',
  make: 'make',
  docker: 'docker.io',
  python: 'python3',
  python3: 'python3',
  node: 'nodejs',
  npm: 'npm',
  cowsay: 'cowsay',
  fortune: 'fortune-mod',
  sl: 'sl',
  lolcat: 'lolcat',
};

const COMMANDS: Command[] = [
  {
    name: 'help',
    summary: 'show this message',
    run: () => helpLines(),
  },
  {
    name: 'whoami',
    summary: 'who you are talking to',
    run: () => [
      accent(profile.name),
      ok(`${profile.headline} · ${profile.subhead}`),
      ok(''),
      ok(profile.tagline),
      ok(''),
      dim(`Try 'cat about.txt' for the longer version.`),
    ],
  },
  {
    name: 'ls',
    usage: '[path]',
    summary: 'list directory contents  (-a for hidden)',
    run: (args, ctx) => {
      const arg = operand(args);
      const target = resolvePath(ctx.cwd, arg || '.');
      const node = getNode(target);
      if (!node) return [err(`ls: cannot access '${arg}': No such file or directory`)];
      if (!isDir(node)) return [ok(node.name)];

      return listDir(target, args.includes('-a')).map((e) => ({
        text: e.type === 'dir' ? `${e.name}/` : e.name,
        tone: e.type === 'dir' ? ('accent' as const) : ('normal' as const),
      }));
    },
  },
  {
    name: 'cd',
    usage: '<path>',
    summary: 'change directory',
    run: (args, ctx) => {
      const arg = operand(args);
      const target = resolvePath(ctx.cwd, arg || '~');
      const node = getNode(target);
      if (!node) return [err(`cd: no such file or directory: ${arg}`)];
      if (!isDir(node)) return [err(`cd: not a directory: ${arg}`)];
      ctx.setCwd(target);
      return [];
    },
  },
  {
    name: 'pwd',
    summary: 'print working directory',
    run: (_args, ctx) => [ok(ctx.cwd)],
  },
  {
    name: 'cat',
    usage: '<file>',
    summary: 'print a file',
    run: (args, ctx) => {
      const arg = operand(args);
      if (!arg) return [err('cat: missing operand')];
      const node = getNode(resolvePath(ctx.cwd, arg));
      if (!node) return [err(`cat: ${arg}: No such file or directory`)];
      if (isDir(node)) return [err(`cat: ${arg}: Is a directory`)];
      return node.content.split('\n').map(ok);
    },
  },
  {
    name: 'tree',
    summary: 'show the directory tree',
    run: (_args, ctx) => [accent(prettyPath(ctx.cwd)), ...tree(ctx.cwd)],
  },
  {
    name: 'projects',
    summary: 'list projects with a one-line summary',
    run: () => [
      accent(`${projects.length} projects`),
      ok(''),
      ...projects.flatMap((p) => [
        { text: `  ${p.name}`, tone: 'success' as const },
        dim(`    ${p.blurb}`),
        dim(`    ${p.stack.slice(0, 4).join(' · ')}`),
        ok(''),
      ]),
      dim(`Open the Files app for the full detail: 'open files'`),
    ],
  },
  {
    name: 'open',
    usage: '<app>',
    summary: `launch an app  (${OPENABLE.join(', ')})`,
    run: (args, ctx) => {
      const arg = operand(args);
      if (!arg) return [err(`open: missing app name. Try: ${OPENABLE.join(', ')}`)];
      if (!OPENABLE.includes(arg as AppId)) return [err(`open: unknown app '${arg}'`)];
      ctx.openApp(arg as AppId);
      return [{ text: `Opening ${arg}…`, tone: 'success' }];
    },
  },
  {
    name: 'neofetch',
    summary: 'system information',
    run: () => neofetch(),
  },
  {
    name: 'clear',
    summary: 'clear the screen',
    run: (_args, ctx) => {
      ctx.clear();
      return [];
    },
  },
  {
    name: 'exit',
    summary: 'close this terminal',
    run: () => [dim('Use the window close button — this shell has no parent to return to.')],
  },

  // Unlisted, for anyone who types them out of habit.
  {
    name: 'sudo',
    run: (args, ctx) => {
      if (args.length === 0) {
        return [
          dim('usage: sudo <command>'),
          dim('...though I think we both know how this ends.'),
        ];
      }
      ctx.askPassword(args);
      return [];
    },
  },
  {
    // Typing apt without sudo gives the real permission error, which is what
    // nudges people into trying sudo — where the actual joke lives.
    name: 'apt',
    run: () => [
      err('E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)'),
      err('E: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), are you root?'),
    ],
  },
  {
    name: 'apt-get',
    run: () => [
      err('E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)'),
      err('E: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), are you root?'),
    ],
  },
  { name: 'echo', run: (args) => [ok(args.join(' '))] },
  { name: 'date', run: () => [ok(new Date().toString())] },
  {
    name: 'uname',
    run: () => [ok(`Linux ${profile.hostname} ${systemInfo.kernel} x86_64 GNU/Linux`)],
  },
  { name: 'history', run: () => [dim('Use ↑ and ↓ to walk the history.')] },
];

/** The prompt sudo shows while collecting a password. */
export const sudoPrompt = () => `[sudo] password for ${profile.username}:`;

/** Printed after each of the first two failed attempts, as real sudo does. */
export const sudoRetry = (): Line => err('Sorry, try again.');

/** What sudo says once all three attempts are spent. */
export function sudoDenial(args: string[]): Line[] {
  const viaApt = args[0] === 'apt' || args[0] === 'apt-get';
  const target = viaApt ? (args[2] ?? 'that') : (args[0] ?? 'that');

  return [
    err('sudo: 3 incorrect password attempts'),
    ok(''),
    viaApt
      ? accent(`Ambitious — you are trying to apt-install ${target} into a browser tab.`)
      : accent("You just tried to escalate privileges on a stranger's portfolio."),
    ok(''),
    ok('There is no root here. No kernel, no dpkg, no filesystem to write to.'),
    ok('This entire "machine" is about half a megabyte of static files sitting'),
    ok('on a CDN edge node. The most privileged thing you can do is open a window.'),
    ok(''),
    dim('I spent three years investigating people who try exactly this.'),
    dim('Good instinct. Wrong box.'),
  ];
}

const byName = new Map(COMMANDS.map((c) => [c.name, c]));

export function runCommand(input: string, ctx: CommandContext): Line[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const [name, ...args] = trimmed.split(/\s+/);
  const command = byName.get(name);
  if (!command) {
    const pkg = APT_PACKAGES[name];
    if (pkg) {
      // Ubuntu's command-not-found handler, reproduced verbatim.
      return [
        ok(`Command '${name}' not found, but can be installed with:`),
        ok(''),
        ok(`sudo apt install ${pkg}`),
        ok(''),
      ];
    }
    return [
      err(`${name}: command not found`),
      dim(`Type 'help' for the list of commands.`),
    ];
  }
  return command.run(args, ctx);
}

/** Tab completion over commands and filesystem paths. */
export function complete(input: string, cwd: string): string | null {
  const parts = input.split(/\s+/);

  if (parts.length === 1) {
    const matches = COMMANDS.map((c) => c.name).filter((n) => n.startsWith(parts[0]));
    return matches.length === 1 ? matches[0] : null;
  }

  // Complete the final path segment against the directory it lives in.
  const fragment = parts[parts.length - 1];
  const slash = fragment.lastIndexOf('/');
  const dirPart = slash === -1 ? '.' : fragment.slice(0, slash + 1);
  const namePart = slash === -1 ? fragment : fragment.slice(slash + 1);

  const entries = listDir(resolvePath(cwd, dirPart), namePart.startsWith('.'));
  const matches = entries.filter((e) => e.name.startsWith(namePart));
  if (matches.length !== 1) return null;

  const completed = `${dirPart === '.' ? '' : dirPart}${matches[0].name}${
    matches[0].type === 'dir' ? '/' : ''
  }`;
  return [...parts.slice(0, -1), completed].join(' ');
}
