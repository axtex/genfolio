import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadOwnerPortfolio, loadPublicPortfolio } from "@/lib/portfolio";
import { fetchGitHubUser, getPortfolioRepos } from "@/lib/github";
import { generatePortfolio, getCachedPortfolio } from "@/lib/claude";
import type { GitHubUser, Repo } from "@/lib/github";
import type { PortfolioContent } from "@/lib/claude-parse";

vi.mock("@/lib/github");
vi.mock("@/lib/claude");

const fetchGitHubUserMock = vi.mocked(fetchGitHubUser);
const getPortfolioReposMock = vi.mocked(getPortfolioRepos);
const generatePortfolioMock = vi.mocked(generatePortfolio);
const getCachedPortfolioMock = vi.mocked(getCachedPortfolio);

const user: GitHubUser = {
  login: "alice",
  name: "Alice",
  bio: "from github",
  avatar_url: "https://example.com/a.png",
  public_repos: 4,
};

const repos: Repo[] = [
  {
    name: "genfolio",
    description: "x",
    url: "https://github.com/alice/genfolio",
    language: "TypeScript",
    readme: null,
    stars: 1,
    pushedAt: "2026-05-01T00:00:00Z",
  },
];

const portfolio: PortfolioContent = {
  bio: "I write software.",
  projects: [{ name: "genfolio", description: "Builds portfolios." }],
};

describe("loadPublicPortfolio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns not_found when GitHub has no such user", async () => {
    fetchGitHubUserMock.mockRejectedValue(
      new Error("GitHub user not found: missing")
    );
    await expect(loadPublicPortfolio("missing")).resolves.toEqual({
      status: "not_found",
    });
    expect(getCachedPortfolioMock).not.toHaveBeenCalled();
    expect(generatePortfolioMock).not.toHaveBeenCalled();
  });

  it("does not call Claude when the cache is empty", async () => {
    fetchGitHubUserMock.mockResolvedValue(user);
    getCachedPortfolioMock.mockResolvedValue(null);
    await expect(loadPublicPortfolio("alice")).resolves.toEqual({
      status: "not_generated",
      user,
    });
    expect(generatePortfolioMock).not.toHaveBeenCalled();
    expect(getPortfolioReposMock).not.toHaveBeenCalled();
  });

  it("returns cached copy without generating", async () => {
    fetchGitHubUserMock.mockResolvedValue(user);
    getCachedPortfolioMock.mockResolvedValue(portfolio);
    getPortfolioReposMock.mockResolvedValue(repos);
    await expect(loadPublicPortfolio("alice")).resolves.toEqual({
      status: "ok",
      user,
      repos,
      portfolio,
    });
    expect(getCachedPortfolioMock).toHaveBeenCalledWith("alice");
    expect(generatePortfolioMock).not.toHaveBeenCalled();
  });

  it("rethrows unexpected GitHub errors", async () => {
    fetchGitHubUserMock.mockRejectedValue(new Error("GitHub user fetch failed: 500"));
    await expect(loadPublicPortfolio("alice")).rejects.toThrow("500");
  });
});

describe("loadOwnerPortfolio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates via Claude on a cache miss", async () => {
    fetchGitHubUserMock.mockResolvedValue(user);
    getPortfolioReposMock.mockResolvedValue(repos);
    generatePortfolioMock.mockResolvedValue(portfolio);
    await expect(loadOwnerPortfolio("alice")).resolves.toEqual({
      user,
      repos,
      portfolio,
    });
    expect(generatePortfolioMock).toHaveBeenCalledWith(user, repos);
    expect(getCachedPortfolioMock).not.toHaveBeenCalled();
  });
});
