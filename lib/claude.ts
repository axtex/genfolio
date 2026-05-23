// Calls Claude to generate a portfolio bio and per-project descriptions; results are cached 24h per user with prompt caching on the system prompt.
import Anthropic from "@anthropic-ai/sdk";
import { unstable_cache } from "next/cache";
import type { GitHubUser, Repo } from "@/lib/github";

export interface PortfolioContent {
  bio: string;
  projects: Array<{
    name: string;
    description: string;
  }>;
}

const client = new Anthropic();

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

async function _generatePortfolioContent(
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

  const response = await client.messages.create({
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

Here are their ${repos.length} most recently active repositories. Return a projects entry for each one (use the exact name field):

${JSON.stringify(repoContext, null, 2)}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }

  return JSON.parse(textBlock.text) as PortfolioContent;
}

// Cached wrapper — Claude is only called once per user per 24 hours.
// All three cache entries (user, repos, portfolio) share the same tag
// so revalidateTag(username) busts them all together.
export async function generatePortfolio(
  user: GitHubUser,
  repos: Repo[]
): Promise<PortfolioContent> {
  return unstable_cache(
    () => _generatePortfolioContent(repos, user.login),
    ["claude-portfolio", user.login],
    { tags: [user.login], revalidate: 86400 }
  )();
}
