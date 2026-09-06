/**
 * The shape of GitHub repo data used by the site, and the one place the REST
 * response is flattened into it — shared by the runtime fetch
 * (`useGitHubRepos`) and the build-time snapshot script (`scripts/fetch-repos`)
 * so the two can never drift.
 */

export type Repo = {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  pushedAt: string;
  url: string;
  topics: string[];
};

/** Only the fields we read; the real response has many more. */
type ApiRepo = {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
  html_url: string;
  topics?: string[];
  fork: boolean;
  archived: boolean;
};

export const reposEndpoint = (user: string) =>
  `https://api.github.com/users/${user}/repos?per_page=100&sort=pushed`;

/** Flattens a repos response, dropping forks and archived repos. */
export function toRepos(payload: unknown): Repo[] {
  if (!Array.isArray(payload)) return [];
  return (payload as ApiRepo[])
    .filter((r) => !r.fork && !r.archived)
    .map((r) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      forks: r.forks_count,
      pushedAt: r.pushed_at,
      url: r.html_url,
      topics: r.topics ?? [],
    }));
}
