/**
 * GitHub API service.
 *
 * Uses the authenticated user's OAuth access token to fetch:
 *   - Their top repos (sorted by most-recently pushed)
 *   - The README content for each repo
 */

export interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  html_url: string;
  stargazers_count: number;
  fork: boolean;
  readme: string | null;
}

export interface GitHubUser {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  public_repos: number;
}

const GITHUB_API = "https://api.github.com";

function githubHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

/**
 * Fetch the authenticated GitHub user's profile.
 */
export async function fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
  const res = await fetch(`${GITHUB_API}/user`, {
    headers: githubHeaders(accessToken),
  });

  if (!res.ok) {
    throw new Error(`GitHub user fetch failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Fetch up to `limit` of the user's own (non-fork) repos sorted by
 * most-recently pushed, then hydrate each with its README content.
 */
export async function fetchUserRepos(
  accessToken: string,
  userLogin: string,
  limit = 8
): Promise<GitHubRepo[]> {
  const res = await fetch(
    `${GITHUB_API}/user/repos?sort=pushed&per_page=${limit}&type=owner`,
    { headers: githubHeaders(accessToken) }
  );

  if (!res.ok) {
    throw new Error(`GitHub repos fetch failed: ${res.status} ${res.statusText}`);
  }

  const repos: GitHubRepo[] = await res.json();

  // Filter out forks — only show original work on the portfolio
  const ownRepos = repos.filter((r) => !r.fork);

  // Fetch all READMEs in parallel (one network round-trip per repo, not serial)
  const reposWithReadmes = await Promise.all(
    ownRepos.map(async (repo) => ({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      html_url: repo.html_url,
      stargazers_count: repo.stargazers_count,
      fork: repo.fork,
      readme: await fetchRepoReadme(accessToken, userLogin, repo.name),
    }))
  );

  return reposWithReadmes;
}

/**
 * Fetch and decode a repo's README, capped at 2 000 chars to stay within
 * reasonable prompt sizes when we later send this to Claude.
 * Returns null if the repo has no README.
 */
async function fetchRepoReadme(
  accessToken: string,
  owner: string,
  repo: string
): Promise<string | null> {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/readme`, {
    headers: githubHeaders(accessToken),
  });

  if (!res.ok) return null;

  const data = await res.json();
  // GitHub returns README content as base64
  return Buffer.from(data.content, "base64").toString("utf-8").slice(0, 2000);
}
