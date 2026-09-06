import { useEffect, useState } from 'react';
import snapshot from '@/data/repos.generated.json';
import { reposEndpoint, toRepos, type Repo } from '@/data/github';
import { profile } from '@/data/profile';

export type { Repo };

const SNAPSHOT = snapshot as Repo[];

/**
 * One fetch per page load, shared by every window that asks. The result is
 * cached as a promise so opening a second Files window costs nothing — the
 * unauthenticated API allows only 60 requests/hour per IP.
 */
let pending: Promise<Repo[] | null> | null = null;

function fetchRepos(): Promise<Repo[] | null> {
  pending ??= fetch(reposEndpoint(profile.links.githubUser), {
    headers: { Accept: 'application/vnd.github+json' },
  })
    // A non-OK response means rate-limited or offline: keep the snapshot.
    .then((res) => (res.ok ? res.json() : null))
    .then((payload) => (payload ? toRepos(payload) : null))
    .catch(() => null);
  return pending;
}

/**
 * Live GitHub stats layered over a committed build-time snapshot.
 *
 * The snapshot renders immediately and is the permanent fallback: a live-only
 * fetch would show an empty list during any traffic spike. A successful fetch
 * simply upgrades what is already on screen.
 */
export function useGitHubRepos() {
  const [repos, setRepos] = useState<Repo[]>(SNAPSHOT);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchRepos().then((fresh) => {
      if (!active || !fresh?.length) return;
      setRepos(fresh);
      setLive(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return { repos, live };
}

/** Look up live stats for a curated project, matched on repo name. */
export function findRepo(repos: Repo[], repoName?: string): Repo | undefined {
  if (!repoName) return undefined;
  return repos.find((r) => r.name.toLowerCase() === repoName.toLowerCase());
}

/** GitHub's language dot colours, for the few languages in play here. */
export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  C: '#555555',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Java: '#b07219',
};
