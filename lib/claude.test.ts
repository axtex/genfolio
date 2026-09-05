import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Repo } from "@/lib/github";

const createMock = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: createMock };
  },
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
}));

const repos: Repo[] = [
  {
    name: "genfolio",
    description: "AI portfolios",
    url: "https://github.com/alice/genfolio",
    language: "TypeScript",
    readme: "# genfolio",
    stars: 3,
    pushedAt: "2026-05-01T00:00:00Z",
  },
];

describe("generatePortfolioContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("parses structured JSON from the text block", async () => {
    createMock.mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            bio: "I build tools.",
            projects: [
              { name: "genfolio", description: "Builds portfolios." },
            ],
          }),
        },
      ],
    });
    const { generatePortfolioContent } = await import("@/lib/claude");
    await expect(
      generatePortfolioContent(repos, "alice")
    ).resolves.toEqual({
      bio: "I build tools.",
      projects: [{ name: "genfolio", description: "Builds portfolios." }],
    });
    expect(createMock).toHaveBeenCalledOnce();
  });

  it("throws when Claude returns no text block", async () => {
    createMock.mockResolvedValue({ content: [{ type: "thinking" }] });
    const { generatePortfolioContent } = await import("@/lib/claude");
    await expect(generatePortfolioContent(repos, "alice")).rejects.toThrow(
      "Claude returned no text content"
    );
  });
});
