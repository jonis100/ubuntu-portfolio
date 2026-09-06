/**
 * The virtual filesystem. This is the single source of truth for browsable
 * content: `ls ~/projects` in the Terminal and the Files window navigating to
 * ~/projects read the *same* tree, and opening a README from either surface
 * lands in the same Reader window.
 */
import { profile } from './profile';
import { projects } from './projects';

export type FSFile = {
  type: 'file';
  name: string;
  content: string;
  /** Set on a project README so Files can offer "open project details". */
  projectSlug?: string;
  /** Hidden files are skipped by `ls` without -a, like a real shell. */
  hidden?: boolean;
};

export type FSDir = {
  type: 'dir';
  name: string;
  children: FSNode[];
  projectSlug?: string;
  hidden?: boolean;
};

export type FSNode = FSFile | FSDir;

export const HOME = `/home/${profile.username}`;

const aboutTxt = `${profile.name}
${profile.headline} · ${profile.subhead}

${profile.bio.join('\n\n')}

Location:  ${profile.location}
Education: ${profile.education}
`;

const experienceTxt = profile.experience
  .map(
    (e) =>
      `${e.period}\n${e.role} — ${e.org}\n${e.summary}\nStack: ${e.stack.join(', ')}`,
  )
  .join('\n\n---\n\n');

const skillsJson = JSON.stringify(
  Object.fromEntries(profile.skills.map((g) => [g.label, g.items])),
  null,
  2,
);

const contactTxt = `Email:    ${profile.links.email}
GitHub:   ${profile.links.github}
LinkedIn: ${profile.links.linkedin}

Open to interesting problems and good coffee.
`;

const certificationsTxt = profile.certifications.map((c) => `- ${c}`).join('\n');

/** One directory per project, each holding its README. */
const projectDirs: FSDir[] = projects.map((p) => ({
  type: 'dir',
  name: p.slug,
  projectSlug: p.slug,
  children: [
    {
      type: 'file',
      name: 'README.md',
      content: p.readme,
      projectSlug: p.slug,
    },
  ],
}));

export const root: FSDir = {
  type: 'dir',
  name: '/',
  children: [
    {
      type: 'dir',
      name: 'home',
      children: [
        {
          type: 'dir',
          name: profile.username,
          children: [
            { type: 'dir', name: 'projects', children: projectDirs },
            {
              type: 'dir',
              name: 'documents',
              children: [
                { type: 'file', name: 'experience.txt', content: experienceTxt },
                { type: 'file', name: 'certifications.txt', content: certificationsTxt },
                { type: 'file', name: 'skills.json', content: skillsJson },
              ],
            },
            { type: 'file', name: 'about.txt', content: aboutTxt },
            { type: 'file', name: 'contact.txt', content: contactTxt },
            {
              type: 'file',
              name: '.secret',
              hidden: true,
              content: `You found it.

If you read hidden files on a stranger's portfolio, we would probably get on.

  ${profile.links.email}

`,
            },
          ],
        },
      ],
    },
  ],
};

/** Turn any user-typed path into an absolute, normalised one. */
export function resolvePath(cwd: string, input: string): string {
  let path = input.trim();
  if (path === '' || path === '~') path = HOME;
  else if (path.startsWith('~/')) path = `${HOME}/${path.slice(2)}`;
  else if (!path.startsWith('/')) path = `${cwd}/${path}`;

  const out: string[] = [];
  for (const part of path.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') out.pop();
    else out.push(part);
  }
  return `/${out.join('/')}`;
}

export function getNode(path: string): FSNode | undefined {
  const parts = path.split('/').filter(Boolean);
  let node: FSNode = root;
  for (const part of parts) {
    if (node.type !== 'dir') return undefined;
    const next: FSNode | undefined = node.children.find((c) => c.name === part);
    if (!next) return undefined;
    node = next;
  }
  return node;
}

export function isDir(node: FSNode | undefined): node is FSDir {
  return node?.type === 'dir';
}

/** Directory contents, sorted dirs-first then alphabetically, as `ls` does. */
export function listDir(path: string, includeHidden = false): FSNode[] {
  const node = getNode(path);
  if (!isDir(node)) return [];
  return node.children
    .filter((c) => includeHidden || !c.hidden)
    .slice()
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

/** Display a path with the home directory collapsed to `~`. */
export function prettyPath(path: string): string {
  return path === HOME ? '~' : path.startsWith(`${HOME}/`) ? `~${path.slice(HOME.length)}` : path;
}

/** Breadcrumb segments for the Files path bar. */
export function breadcrumbs(path: string): { label: string; path: string }[] {
  if (path === HOME || !path.startsWith(HOME)) {
    return [{ label: 'Home', path: HOME }];
  }
  const rest = path.slice(HOME.length + 1).split('/').filter(Boolean);
  const crumbs = [{ label: 'Home', path: HOME }];
  let acc = HOME;
  for (const part of rest) {
    acc = `${acc}/${part}`;
    crumbs.push({ label: part, path: acc });
  }
  return crumbs;
}
