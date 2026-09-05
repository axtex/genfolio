import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GitHubUser, Repo } from "@/lib/github";

const cacheCalls: { source: string; keyParts: unknown; options: unknown }[] =
  [];

vi.mock("next/cache", () => ({
  unstable_cache: (
    fn: () => unknown,
    keyParts: unknown,
    options: unknown
  ) => {
    cacheCalls.push({ source: fn.toString(), keyParts, options });
    return async () => ({ bio: "cached", projects: [] });
  },
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: vi.fn() };
  },
}));

const user: GitHubUser = {
  login: "alice",
  name: "Alice",
  bio: null,
  avatar_url: "https://example.com/a.png",
  public_repos: 1,
};

const repos: Repo[] = [];

describe("portfolio cache key sharing", () => {
  beforeEach(() => {
    cacheCalls.length = 0;
    vi.resetModules();
  });

  it("uses the same callback source and key for generate and peek", async () => {
    const {
      generatePortfolio,
      getCachedPortfolio,
      portfolioCacheKeyParts,
    } = await import("@/lib/claude");

    await generatePortfolio(user, repos);
    await getCachedPortfolio("alice");

    expect(cacheCalls).toHaveLength(2);
    expect(cacheCalls[0].source).toBe(cacheCalls[1].source);
    expect(cacheCalls[0].keyParts).toEqual(portfolioCacheKeyParts("alice"));
    expect(cacheCalls[1].keyParts).toEqual(portfolioCacheKeyParts("alice"));
    expect(cacheCalls[0].options).toEqual(cacheCalls[1].options);
  });
});
