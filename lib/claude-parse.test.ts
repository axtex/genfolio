import { describe, expect, it } from "vitest";
import {
  ClaudeEmptyResponseError,
  parsePortfolioContent,
  projectNamesMatchRepos,
  textFromClaudeMessage,
} from "@/lib/claude-parse";

describe("textFromClaudeMessage", () => {
  it("returns the first text block", () => {
    expect(
      textFromClaudeMessage([
        { type: "thinking", text: "scratch" },
        { type: "text", text: '{"bio":"Hi"}' },
      ])
    ).toBe('{"bio":"Hi"}');
  });

  it("throws when there is no text block", () => {
    expect(() => textFromClaudeMessage([{ type: "thinking" }])).toThrow(
      ClaudeEmptyResponseError
    );
    expect(() => textFromClaudeMessage([])).toThrow(ClaudeEmptyResponseError);
  });
});

describe("parsePortfolioContent", () => {
  it("parses bio and projects", () => {
    const parsed = parsePortfolioContent(
      JSON.stringify({
        bio: "I build tools.",
        projects: [{ name: "genfolio", description: "Builds portfolios." }],
      })
    );
    expect(parsed.bio).toBe("I build tools.");
    expect(parsed.projects).toEqual([
      { name: "genfolio", description: "Builds portfolios." },
    ]);
  });

  it("throws on invalid JSON", () => {
    expect(() => parsePortfolioContent("not-json")).toThrow(SyntaxError);
  });
});

describe("projectNamesMatchRepos", () => {
  const portfolio = {
    bio: "Hi.",
    projects: [
      { name: "a", description: "Does a." },
      { name: "b", description: "Does b." },
    ],
  };

  it("is true when names match the repo list (any order in the set, same length)", () => {
    expect(projectNamesMatchRepos(portfolio, ["a", "b"])).toBe(true);
  });

  it("is false when Claude invents or drops a name", () => {
    expect(projectNamesMatchRepos(portfolio, ["a", "c"])).toBe(false);
    expect(projectNamesMatchRepos(portfolio, ["a"])).toBe(false);
    expect(projectNamesMatchRepos(portfolio, ["a", "b", "c"])).toBe(false);
  });
});
