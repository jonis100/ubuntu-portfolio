/**
 * Writes a committed snapshot of the public GitHub repos to
 * src/data/repos.generated.json.
 *
 * The site prefers live data at runtime, but the unauthenticated GitHub API
 * allows only 60 requests/hour per IP — so without a snapshot the Files window
 * would empty out during exactly the traffic spike you want. Run this at build
 * time: `npm run fetch-repos`.
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { reposEndpoint, toRepos } from '../src/data/github';
import { profile } from '../src/data/profile';

const OUT = path.resolve(import.meta.dirname, '../src/data/repos.generated.json');

async function main() {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'yoni-portfolio-build',
  };
  // Optional: raises the rate limit and includes private repo counts if scoped.
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(reposEndpoint(profile.links.githubUser), { headers });
  if (!res.ok) {
    throw new Error(`GitHub API returned ${res.status} ${res.statusText}`);
  }

  const repos = toRepos(await res.json());
  if (repos.length === 0) {
    throw new Error('GitHub returned no usable repos; keeping the existing snapshot');
  }

  await writeFile(OUT, `${JSON.stringify(repos, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${repos.length} repos to ${path.relative(process.cwd(), OUT)}`);
}

main().catch((error) => {
  console.error('fetch-repos failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
