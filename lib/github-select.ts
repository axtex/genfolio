export const PORTFOLIO_REPO_LIMIT = 6;
export const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;
// `^` only binds to the left alternative: names that *start* with 3 digits,
// or names that contain 3 digits followed by a hyphen anywhere.
export const COURSE_RE = /^\d{3}|\d{3}-/;

/** Shape of `GET /users/{username}/repos` items used by ranking. */
export type GitHubListRepo = {
  name: string;
  description: string | null;
  fork: boolean;
  topics?: string[];
  stargazers_count: number;
  pushed_at: string;
};

export function isCourseRepoName(name: string): boolean {
  return COURSE_RE.test(name);
}

export function isFeaturedRepo(repo: GitHubListRepo): boolean {
  return (
    Array.isArray(repo.topics) &&
    repo.topics.includes("featured") &&
    !repo.fork
  );
}

export function filterAndRankRecentRepos<T extends GitHubListRepo>(
  repos: T[],
  nowMs: number = Date.now(),
  limit: number = PORTFOLIO_REPO_LIMIT
): T[] {
  const cutoff = nowMs - TWO_YEARS_MS;

  return repos
    .filter(
      (r) =>
        !r.fork &&
        !isCourseRepoName(r.name) &&
        new Date(r.pushed_at).getTime() > cutoff
    )
    .sort((a, b) => {
      const aHasDesc = a.description ? 1 : 0;
      const bHasDesc = b.description ? 1 : 0;
      if (bHasDesc !== aHasDesc) return bHasDesc - aHasDesc;
      if (b.stargazers_count !== a.stargazers_count)
        return b.stargazers_count - a.stargazers_count;
      return (
        new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime()
      );
    })
    .slice(0, limit);
}

export function appendUniqueRepos<T extends { name: string }>(
  target: T[],
  source: T[],
  limit: number = PORTFOLIO_REPO_LIMIT
): void {
  const names = new Set(target.map((r) => r.name));
  for (const repo of source) {
    if (names.has(repo.name)) continue;
    names.add(repo.name);
    target.push(repo);
    if (target.length >= limit) return;
  }
}

export function selectPortfolioRepos<T extends { name: string }>(
  pinned: T[],
  featured: T[],
  filtered: T[],
  limit: number = PORTFOLIO_REPO_LIMIT
): T[] {
  const repos: T[] = [];
  appendUniqueRepos(repos, pinned, limit);
  if (repos.length < limit) appendUniqueRepos(repos, featured, limit);
  if (repos.length < limit) appendUniqueRepos(repos, filtered, limit);
  return repos;
}
