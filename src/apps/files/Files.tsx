import { useState } from 'react';
import {
  HOME,
  breadcrumbs,
  getNode,
  isDir,
  listDir,
  type FSNode,
} from '@/data/filesystem';
import { projectBySlug, type Project } from '@/data/projects';
import { LANGUAGE_COLORS, findRepo, useGitHubRepos, type Repo } from '@/hooks/useGitHubRepos';
import { useOS } from '@/os/store';
import { profile } from '@/data/profile';
import { useIsMobile } from '@/hooks/useIsMobile';
import { FileIcon, FolderIcon } from '@/components/icons';

const PLACES = [
  { label: 'Home', path: HOME },
  { label: 'Projects', path: `${HOME}/projects` },
  { label: 'Documents', path: `${HOME}/documents` },
];

/** Nautilus: sidebar, breadcrumb path bar, and a grid of the current folder. */
export default function Files() {
  const [cwd, setCwd] = useState(`${HOME}/projects`);
  const [selected, setSelected] = useState<string | null>(null);
  const { repos, live } = useGitHubRepos();
  const openApp = useOS((s) => s.openApp);
  const isMobile = useIsMobile();

  const entries = listDir(cwd);
  const crumbs = breadcrumbs(cwd);

  // When the current folder is a project, show its detail header above the files.
  const currentNode = getNode(cwd);
  const project = isDir(currentNode) && currentNode.projectSlug
    ? projectBySlug(currentNode.projectSlug)
    : undefined;

  function open(entry: FSNode) {
    if (entry.type === 'dir') {
      setCwd(`${cwd}/${entry.name}`);
      setSelected(null);
    } else {
      openApp('reader', { path: `${cwd}/${entry.name}` }, entry.name);
    }
  }

  return (
    <div className="flex h-full bg-bg text-ink">
      {/* Sidebar */}
      <aside className="hidden w-48 shrink-0 flex-col gap-0.5 border-r border-edge bg-header p-2 md:flex">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-faint">
          Places
        </p>
        {PLACES.map((place) => (
          <button
            key={place.path}
            onClick={() => {
              setCwd(place.path);
              setSelected(null);
            }}
            className={`rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
              cwd === place.path
                ? 'bg-accent text-white'
                : 'text-dim hover:bg-surface-2 hover:text-ink'
            }`}
          >
            {place.label}
          </button>
        ))}

        <div className="mt-auto rounded-md px-3 py-2 text-xs text-faint">
          {live ? 'GitHub: live' : 'GitHub: cached'}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Path bar */}
        <div className="flex shrink-0 items-center gap-1 border-b border-edge bg-header px-3 py-2">
          {crumbs.map((crumb, i) => (
            <div key={crumb.path} className="flex items-center gap-1">
              {i > 0 && <span className="text-faint">/</span>}
              <button
                onClick={() => {
                  setCwd(crumb.path);
                  setSelected(null);
                }}
                className={`rounded px-2 py-1 text-sm transition-colors hover:bg-surface-2 ${
                  i === crumbs.length - 1 ? 'font-medium text-ink' : 'text-dim'
                }`}
              >
                {crumb.label}
              </button>
            </div>
          ))}
        </div>

        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-4">
          {project && (
            <ProjectHeader
              project={project}
              repo={findRepo(repos, project.repoName)}
            />
          )}

          {entries.length === 0 ? (
            <p className="p-8 text-center text-dim">This folder is empty.</p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
              {entries.map((entry) => {
                const entryProject = entry.type === 'dir' && entry.projectSlug
                  ? projectBySlug(entry.projectSlug)
                  : undefined;
                const repo = findRepo(repos, entryProject?.repoName);
                const path = `${cwd}/${entry.name}`;

                return (
                  <button
                    key={entry.name}
                    onClick={() => (isMobile ? open(entry) : setSelected(path))}
                    onDoubleClick={() => open(entry)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        open(entry);
                      }
                    }}
                    title={entryProject?.blurb}
                    className={`flex flex-col items-center gap-2 rounded-lg p-3 text-center transition-colors ${
                      selected === path
                        ? 'bg-accent/25 ring-1 ring-accent'
                        : 'hover:bg-surface-2'
                    }`}
                  >
                    {entry.type === 'dir' ? (
                      <FolderIcon className="h-12 w-12" />
                    ) : (
                      <FileIcon className="h-12 w-12" />
                    )}
                    <span className="w-full truncate text-xs text-ink">{entry.name}</span>

                    {entryProject && (
                      <span className="flex items-center gap-2 text-[11px] text-faint">
                        <span className="flex items-center gap-1">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              background:
                                LANGUAGE_COLORS[entryProject.language] ?? '#8b8a88',
                            }}
                          />
                          {entryProject.language}
                        </span>
                        {repo && repo.stars > 0 && <span>★ {repo.stars}</span>}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-edge bg-header px-3 py-1.5 text-xs text-faint">
          {entries.length} item{entries.length === 1 ? '' : 's'}
          {selected && ' · 1 selected'}
          {isMobile ? ' · tap to open' : ' · double-click to open'}
        </div>
      </div>
    </div>
  );
}

function ProjectHeader({ project, repo }: { project: Project; repo?: Repo }) {
  return (
    <section className="mb-4 rounded-xl border border-edge bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-ink">{project.name}</h2>
        <div className="flex items-center gap-3 text-xs text-faint">
          <span>{project.year}</span>
          {repo && (
            <>
              <span>★ {repo.stars}</span>
              <span>updated {repo.pushedAt.slice(0, 10)}</span>
            </>
          )}
        </div>
      </div>

      {project.role && (
        <p className="mt-1 inline-block rounded bg-accent/20 px-2 py-0.5 text-xs text-accent">
          Role: {project.role}
        </p>
      )}

      <p className="mt-2 text-sm text-dim">{project.blurb}</p>

      <ul className="mt-3 space-y-1.5">
        {project.highlights.map((h) => (
          <li key={h} className="flex gap-2 text-sm text-dim">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
            {h}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {project.stack.map((s) => (
          <span key={s} className="rounded bg-surface-2 px-2 py-0.5 text-xs text-dim">
            {s}
          </span>
        ))}
      </div>

      {project.links.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {project.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#c7431a]"
            >
              {link.label} ↗
            </a>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-xs text-faint">
          Private repository — happy to walk through it. {profile.links.email}
        </p>
      )}
    </section>
  );
}
