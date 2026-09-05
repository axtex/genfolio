// Fetches GitHub user profiles and repo lists using a 3-priority chain (pinned → featured → filtered recent), filling up to 6 repos, with 24h server-side caching.
import { unstable_cache } from "next/cache";
import {
  PORTFOLIO_REPO_LIMIT,
  appendUniqueRepos,
  filterAndRankRecentRepos,
  isFeaturedRepo,
  type GitHubListRepo,
} from "@/lib/github-select";

export { PORTFOLIO_REPO_LIMIT } from "@/lib/github-select";

const GITHUB_API = "https://api.github.com";
const GITHUB_GRAPHQL = "https://api.github.com/graphql";
const README_MAX_CHARS = 2000;

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

type ListRepoJson = GitHubListRepo & {
  html_url: string;
  language: string | null;
};

async function hydrateListRepo(
  username: string,
  r: ListRepoJson,
  token?: string
): Promise<Repo> {
  return {
    name: r.name,
    description: r.description ?? null,
    url: r.html_url,
    language: r.language ?? null,
    readme: await fetchRepoReadme(username, r.name, token),
    stars: r.stargazers_count,
    pushedAt: r.pushed_at,
  };
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
    .slice(0, README_MAX_CHARS);
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
        pinnedItems(first: ${PORTFOLIO_REPO_LIMIT}, types: REPOSITORY) {
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
  const nodes: Array<{
    name: string;
    description?: string | null;
    url: string;
    primaryLanguage?: { name: string } | null;
    stargazerCount: number;
    pushedAt: string;
    object?: { text?: string } | null;
  }> = json?.data?.user?.pinnedItems?.nodes ?? [];

  return nodes.map((node) => ({
    name: node.name,
    description: node.description ?? null,
    url: node.url,
    language: node.primaryLanguage?.name ?? null,
    readme: node.object?.text
      ? node.object.text.slice(0, README_MAX_CHARS)
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
  const repos: ListRepoJson[] = await res.json();
  const featured = repos.filter(isFeaturedRepo);

  return Promise.all(
    featured.map((r) => hydrateListRepo(username, r, token))
  );
}

// Priority 3 — filtered recent repos (final fallback)
async function fetchFilteredRepos(
  username: string,
  token?: string
): Promise<Repo[]> {
  const res = await fetch(
    `${GITHUB_API}/users/${username}/repos?per_page=100&sort=pushed&type=owner`,
    { headers: githubHeaders(token) }
  );
  if (!res.ok) return [];
  const repos: ListRepoJson[] = await res.json();
  const filtered = filterAndRankRecentRepos(repos);

  return Promise.all(
    filtered.map((r) => hydrateListRepo(username, r, token))
  );
}

async function _getPortfolioRepos(
  username: string,
  token?: string
): Promise<Repo[]> {
  const repos: Repo[] = [];

  appendUniqueRepos(repos, await fetchPinnedRepos(username, token));

  if (repos.length < PORTFOLIO_REPO_LIMIT) {
    appendUniqueRepos(repos, await fetchFeaturedRepos(username, token));
  }

  if (repos.length < PORTFOLIO_REPO_LIMIT) {
    appendUniqueRepos(repos, await fetchFilteredRepos(username, token));
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
  token?: string
): Promise<Repo[]> {
  return unstable_cache(
    () => _getPortfolioRepos(username, token),
    ["github-repos", username],
    { tags: [username], revalidate: 86400 }
  )();
}
