// Calls Claude to generate a portfolio bio and per-project descriptions; results are cached 24h per user with prompt caching on the system prompt.
import Anthropic from "@anthropic-ai/sdk";
import { unstable_cache } from "next/cache";
import type { GitHubUser, Repo } from "@/lib/github";
import {
  parsePortfolioContent,
  textFromClaudeMessage,
  type PortfolioContent,
} from "@/lib/claude-parse";

export type { PortfolioContent } from "@/lib/claude-parse";

const SYSTEM_PROMPT = `You are an expert technical writer who creates compelling developer portfolio content.

Given a list of a developer's GitHub repositories, you produce:
1. A professional bio (2-3 sentences, first person) that highlights their core skills, tech interests, and what they build
2. A one-sentence description for each project that clearly explains what it does and why it matters

Rules:
- Be specific and technical — avoid vague phrases like "powerful tool" or "amazing project"
- The bio should read naturally, not like a resume bullet
- Project descriptions should start with a verb (e.g. "Builds...", "Automates...", "Visualizes...")
- If a repo has no description and no README, write a plausible description based on its name and language
- Include exactly one projects entry for every repository in the input list — never return an empty projects array when repos were provided`;

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    bio: {
      type: "string",
      description: "2-3 sentence professional bio written in first person",
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Exact repo name" },
          description: {
            type: "string",
            description: "One-sentence project description starting with a verb",
          },
        },
        required: ["name", "description"],
        additionalProperties: false,
      },
    },
  },
  required: ["bio", "projects"],
  additionalProperties: false,
};

export const PORTFOLIO_CACHE_KEY_PREFIX = "claude-portfolio";

export function portfolioCacheKeyParts(login: string): [string, string] {
  return [PORTFOLIO_CACHE_KEY_PREFIX, login];
}

class PortfolioCacheMiss extends Error {
  constructor() {
    super("PORTFOLIO_CACHE_MISS");
    this.name = "PortfolioCacheMiss";
  }
}

function isPortfolioCacheMiss(err: unknown): boolean {
  return (
    err instanceof PortfolioCacheMiss ||
    (err instanceof Error &&
      (err.name === "PortfolioCacheMiss" ||
        err.message === "PORTFOLIO_CACHE_MISS"))
  );
}

function getClient(): Anthropic {
  return new Anthropic();
}

export async function generatePortfolioContent(
  repos: Repo[],
  githubUsername: string
): Promise<PortfolioContent> {
  const repoContext = repos.map((repo) => ({
    name: repo.name,
    description: repo.description,
    primary_language: repo.language,
    stars: repo.stars,
    readme_excerpt: repo.readme ? repo.readme.slice(0, 600) : null,
  }));

  const response = await getClient().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    output_config: {
      format: {
        type: "json_schema",
        schema: OUTPUT_SCHEMA,
      },
    },
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Generate portfolio content for GitHub user "${githubUsername}".

Here are ${repos.length} repositories selected for their portfolio (pinned first, then featured, then ranked recency). Return a projects entry for each one (use the exact name field):

${JSON.stringify(repoContext, null, 2)}`,
      },
    ],
  });

  return parsePortfolioContent(
    textFromClaudeMessage(
      response.content as Array<{ type: string; text?: string }>
    )
  );
}

function cacheOpts(login: string): { tags: string[]; revalidate: number } {
  return { tags: [login], revalidate: 86400 };
}

// One wrapper for generate + peek. unstable_cache puts cb.toString() in the
// key, so two different inner functions never share an entry — which is why
// "View public" used to miss after the dashboard had already generated.
function fromPortfolioCache(
  login: string,
  compute: (() => Promise<PortfolioContent>) | null
): Promise<PortfolioContent> {
  return unstable_cache(
    async (): Promise<PortfolioContent> => {
      if (!compute) throw new PortfolioCacheMiss();
      return compute();
    },
    portfolioCacheKeyParts(login),
    cacheOpts(login)
  )();
}

// Fills (or hits) the 24h per-login Claude cache. Dashboard / refresh only.
// Public pages must use getCachedPortfolio so a miss does not call Claude.
export async function generatePortfolio(
  user: GitHubUser,
  repos: Repo[]
): Promise<PortfolioContent> {
  return fromPortfolioCache(user.login, () =>
    generatePortfolioContent(repos, user.login)
  );
}

// Same cache key as generatePortfolio. On miss the inner function throws and
// the error is not stored, so this never writes a "not generated" entry and
// never calls Claude. On hit, Next returns the value cached by generatePortfolio.
export async function getCachedPortfolio(
  login: string
): Promise<PortfolioContent | null> {
  try {
    return await fromPortfolioCache(login, null);
  } catch (err) {
    if (isPortfolioCacheMiss(err)) return null;
    throw err;
  }
}
