import { fetchGitHubUser, getPortfolioRepos } from "@/lib/github";
import {
  generatePortfolio,
  getCachedPortfolio,
} from "@/lib/claude";
import type { GitHubUser, Repo } from "@/lib/github";
import type { PortfolioContent } from "@/lib/claude-parse";

export type PublicPortfolioResult =
  | { status: "not_found" }
  | { status: "not_generated"; user: GitHubUser }
  | {
      status: "ok";
      user: GitHubUser;
      repos: Repo[];
      portfolio: PortfolioContent;
    };

export type OwnerPortfolio = {
  user: GitHubUser;
  repos: Repo[];
  portfolio: PortfolioContent;
};

export async function loadPublicPortfolio(
  username: string
): Promise<PublicPortfolioResult> {
  let user: GitHubUser;
  try {
    user = await fetchGitHubUser(username);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("not found")) return { status: "not_found" };
    throw err;
  }

  const portfolio = await getCachedPortfolio(user.login);
  if (!portfolio) {
    return { status: "not_generated", user };
  }

  const repos = await getPortfolioRepos(username);
  return { status: "ok", user, repos, portfolio };
}

export async function loadOwnerPortfolio(
  username: string
): Promise<OwnerPortfolio> {
  const user = await fetchGitHubUser(username);
  const repos = await getPortfolioRepos(username);
  const portfolio = await generatePortfolio(user, repos);
  return { user, repos, portfolio };
}
