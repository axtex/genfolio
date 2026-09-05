export interface PortfolioContent {
  bio: string;
  projects: Array<{
    name: string;
    description: string;
  }>;
}

export class ClaudeEmptyResponseError extends Error {
  constructor() {
    super("Claude returned no text content");
    this.name = "ClaudeEmptyResponseError";
  }
}

export function textFromClaudeMessage(
  content: Array<{ type: string; text?: string }>
): string {
  const textBlock = content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text" || typeof textBlock.text !== "string") {
    throw new ClaudeEmptyResponseError();
  }
  return textBlock.text;
}

export function parsePortfolioContent(text: string): PortfolioContent {
  return JSON.parse(text) as PortfolioContent;
}

export function projectNamesMatchRepos(
  portfolio: PortfolioContent,
  repoNames: string[]
): boolean {
  if (portfolio.projects.length !== repoNames.length) return false;
  const expected = new Set(repoNames);
  return portfolio.projects.every((p) => expected.has(p.name));
}
