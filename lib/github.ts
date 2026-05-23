// Fetches GitHub user profiles and repo lists using a 3-priority chain (pinned → featured → filtered recent), with 24h server-side caching.
import { unstable_cache } from "next/cache";

const GITHUB_API = "https://api.github.com";
const GITHUB_GRAPHQL = "https://api.github.com/graphql";
const README_MAX = 2000;
const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;

export interface GitHubUser {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  public_repos: number;
}

export interface Repo {
  name: string;
  description: string | null;
  url: string;
  language: string | null;
  readme: string | null;
  stars: number;
  pushedAt: string;
}

function githubHeaders(token?: string): HeadersInit {
  const hdrs: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const t = token ?? process.env.GITHUB_TOKEN;
  if (t) hdrs.Authorization = `Bearer ${t}`;
  return hdrs;
}

// ── Private helpers ──────────────────────────────────────────────────────────

async function _fetchGitHubUser(
  username: string,
  token?: string
): Promise<GitHubUser> {
  const res = await fetch(`${GITHUB_API}/users/${username}`, {
    headers: githubHeaders(token),
  });
  if (res.status === 404)
    throw new Error(`GitHub user not found: ${username}`);
  if (!res.ok)
    throw new Error(`GitHub user fetch failed: ${res.status} ${res.statusText}`);
  return res.json();
}

async function fetchRepoReadme(
  owner: string,
  repo: string,
  token?: string
): Promise<string | null> {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/readme`, {
    headers: githubHeaders(token),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return Buffer.from(data.content, "base64")
    .toString("utf-8")
    .slice(0, README_MAX);
}

// Priority 1 — pinned repos via GraphQL
async function fetchPinnedRepos(
  username: string,
  token?: string
): Promise<Repo[]> {
  const t = token ?? process.env.GITHUB_TOKEN;
  if (!t) return [];

  const query = `
    query($username: String!) {
      user(login: $username) {
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes {
            ... on Repository {
              name
              description
              url
              primaryLanguage { name }
              stargazerCount
              pushedAt
              object(expression: "HEAD:README.md") {
                ... on Blob { text }
              }
            }
          }
        }
      }
    }
  `;

  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${t}`,
    },
    body: JSON.stringify({ query, variables: { username } }),
  });

  if (!res.ok) return [];
  const json = await res.json();
  const nodes: any[] = json?.data?.user?.pinnedItems?.nodes ?? [];

  return nodes.map((node) => ({
    name: node.name,
    description: node.description ?? null,
    url: node.url,
    language: node.primaryLanguage?.name ?? null,
    readme: node.object?.text
      ? (node.object.text as string).slice(0, README_MAX)
      : null,
    stars: node.stargazerCount,
    pushedAt: node.pushedAt,
  }));
}

// Priority 2 — repos tagged with the "featured" topic
async function fetchFeaturedRepos(
  username: string,
  token?: string
): Promise<Repo[]> {
  const res = await fetch(
    `${GITHUB_API}/users/${username}/repos?per_page=100&type=owner`,
    { headers: githubHeaders(token) }
  );
  if (!res.ok) return [];
  const repos: any[] = await res.json();
  const featured = repos.filter(
    (r) => Array.isArray(r.topics) && r.topics.includes("featured") && !r.fork
  );

  return Promise.all(
    featured.map(async (r) => ({
      name: r.name,
      description: r.description ?? null,
      url: r.html_url,
      language: r.language ?? null,
      readme: await fetchRepoReadme(username, r.name, token),
      stars: r.stargazers_count,
      pushedAt: r.pushed_at,
    }))
  );
}

// Priority 3 — filtered recent repos (final fallback)
// Filters: non-fork, not a course-number repo, pushed within 2 years.
// GitHub description is optional — README/name are used for AI copy instead.
// Sorts: description present first, then stars desc, then pushed_at desc. Caps at 6.
const COURSE_RE = /^\d{3}|\d{3}-/;

async function fetchFilteredRepos(
  username: string,
  token?: string
): Promise<Repo[]> {
  const res = await fetch(
    `${GITHUB_API}/users/${username}/repos?per_page=100&sort=pushed&type=owner`,
    { headers: githubHeaders(token) }
  );
  if (!res.ok) return [];
  const repos: any[] = await res.json();
  const cutoff = Date.now() - TWO_YEARS_MS;

  const filtered = repos
    .filter(
      (r) =>
        !r.fork &&
        !COURSE_RE.test(r.name) &&
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
    .slice(0, 6);

  return Promise.all(
    filtered.map(async (r) => ({
      name: r.name,
      description: r.description ?? null,
      url: r.html_url,
      language: r.language ?? null,
      readme: await fetchRepoReadme(username, r.name, token),
      stars: r.stargazers_count,
      pushedAt: r.pushed_at,
    }))
  );
}

async function _getPortfolioRepos(
  username: string,
  token?: string,
  savedRepoNames?: string[]
): Promise<Repo[]> {
  let repos = await fetchPinnedRepos(username, token);

  if (repos.length === 0) {
    repos = await fetchFeaturedRepos(username, token);
  }

  if (repos.length === 0) {
    repos = await fetchFilteredRepos(username, token);
  }

  if (savedRepoNames && savedRepoNames.length > 0) {
    const allowed = new Set(savedRepoNames);
    repos = repos
      .filter((r) => allowed.has(r.name))
      .sort(
        (a, b) =>
          savedRepoNames.indexOf(a.name) - savedRepoNames.indexOf(b.name)
      );
  }

  return repos;
}

// ── Public exports (with 24h caching, tagged by username) ───────────────────

export async function fetchGitHubUser(
  username: string,
  token?: string
): Promise<GitHubUser> {
  return unstable_cache(
    () => _fetchGitHubUser(username, token),
    ["github-user", username],
    { tags: [username], revalidate: 86400 }
  )();
}

export async function getPortfolioRepos(
  username: string,
  token?: string,
  savedRepoNames?: string[]
): Promise<Repo[]> {
  return unstable_cache(
    () => _getPortfolioRepos(username, token, savedRepoNames),
    ["github-repos", username],
    { tags: [username], revalidate: 86400 }
  )();
}
