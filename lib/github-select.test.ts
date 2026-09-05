import { describe, expect, it } from "vitest";
import {
  PORTFOLIO_REPO_LIMIT,
  TWO_YEARS_MS,
  appendUniqueRepos,
  filterAndRankRecentRepos,
  isCourseRepoName,
  isFeaturedRepo,
  selectPortfolioRepos,
  type GitHubListRepo,
} from "@/lib/github-select";

const NOW = Date.parse("2026-06-01T00:00:00.000Z");

function listRepo(
  name: string,
  extras: Partial<GitHubListRepo> = {}
): GitHubListRepo {
  return {
    name,
    description: "a project",
    fork: false,
    stargazers_count: 0,
    pushed_at: "2026-05-01T00:00:00.000Z",
    ...extras,
  };
}

describe("isCourseRepoName", () => {
  it("matches names that start with three digits", () => {
    expect(isCourseRepoName("346")).toBe(true);
    expect(isCourseRepoName("346-lab")).toBe(true);
  });

  it("matches names that contain three digits followed by a hyphen", () => {
    expect(isCourseRepoName("foo123-bar")).toBe(true);
  });

  it("does not match ordinary project names", () => {
    expect(isCourseRepoName("my-app")).toBe(false);
    expect(isCourseRepoName("cs346")).toBe(false);
    expect(isCourseRepoName("genfolio")).toBe(false);
  });
});

describe("isFeaturedRepo", () => {
  it("requires a featured topic and a non-fork", () => {
    expect(
      isFeaturedRepo(listRepo("keep", { topics: ["featured"] }))
    ).toBe(true);
  });

  it("rejects forks even with the featured topic", () => {
    expect(
      isFeaturedRepo(
        listRepo("forked", { fork: true, topics: ["featured"] })
      )
    ).toBe(false);
  });

  it("rejects missing or empty topics", () => {
    expect(isFeaturedRepo(listRepo("plain"))).toBe(false);
    expect(isFeaturedRepo(listRepo("empty", { topics: [] }))).toBe(false);
    expect(
      isFeaturedRepo(listRepo("other", { topics: ["hackathon"] }))
    ).toBe(false);
  });
});

describe("filterAndRankRecentRepos", () => {
  it("drops forks, course-number names, and repos older than two years", () => {
    const ranked = filterAndRankRecentRepos(
      [
        listRepo("forked", { fork: true }),
        listRepo("346-hw"),
        listRepo("ancient", {
          pushed_at: new Date(NOW - TWO_YEARS_MS - 1).toISOString(),
        }),
        listRepo("keep-me"),
      ],
      NOW
    );
    expect(ranked.map((r) => r.name)).toEqual(["keep-me"]);
  });

  it("sorts description-present first, then stars, then recency", () => {
    const ranked = filterAndRankRecentRepos(
      [
        listRepo("no-desc-old", {
          description: null,
          stargazers_count: 50,
          pushed_at: "2026-05-20T00:00:00.000Z",
        }),
        listRepo("desc-few-stars", {
          description: "hello",
          stargazers_count: 1,
          pushed_at: "2026-04-01T00:00:00.000Z",
        }),
        listRepo("desc-many-stars", {
          description: "hello",
          stargazers_count: 10,
          pushed_at: "2026-03-01T00:00:00.000Z",
        }),
        listRepo("desc-many-stars-newer", {
          description: "hello",
          stargazers_count: 10,
          pushed_at: "2026-05-01T00:00:00.000Z",
        }),
      ],
      NOW
    );
    expect(ranked.map((r) => r.name)).toEqual([
      "desc-many-stars-newer",
      "desc-many-stars",
      "desc-few-stars",
      "no-desc-old",
    ]);
  });

  it("caps at PORTFOLIO_REPO_LIMIT", () => {
    const repos = Array.from({ length: 10 }, (_, i) =>
      listRepo(`r${i}`, { stargazers_count: 10 - i })
    );
    expect(filterAndRankRecentRepos(repos, NOW)).toHaveLength(
      PORTFOLIO_REPO_LIMIT
    );
  });
});

describe("appendUniqueRepos / selectPortfolioRepos", () => {
  it("fills pinned first, then featured, then filtered, skipping duplicates, cap 6", () => {
    const pinned = [{ name: "a" }, { name: "b" }];
    const featured = [
      { name: "b" },
      { name: "c" },
      { name: "d" },
      { name: "e" },
      { name: "f" },
      { name: "g" },
      { name: "h" },
    ];
    const filtered = [{ name: "i" }, { name: "j" }];
    expect(
      selectPortfolioRepos(pinned, featured, filtered).map((r) => r.name)
    ).toEqual(["a", "b", "c", "d", "e", "f"]);
  });

  it("returns empty when every source is empty", () => {
    expect(selectPortfolioRepos([], [], [])).toEqual([]);
  });

  it("does not insert duplicates into an existing target", () => {
    const target = [{ name: "a" }];
    appendUniqueRepos(target, [{ name: "a" }, { name: "b" }], 6);
    expect(target.map((r) => r.name)).toEqual(["a", "b"]);
  });
});
