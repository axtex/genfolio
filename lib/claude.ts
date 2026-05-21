/**
 * Claude API service.
 *
 * Takes a developer's GitHub repos and uses Claude to produce:
 *   - A professional 2-3 sentence bio (first person)
 *   - A crisp one-sentence project description per repo
 *
 * Uses prompt caching on the stable system prompt so repeated calls
 * (e.g. when a user refreshes their dashboard) are fast and cheap.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { GitHubRepo } from "@/lib/github";

export interface PortfolioContent {
  bio: string;
  projects: Array<{
    name: string;
    description: string;
  }>;
}

const client = new Anthropic();

// The system prompt never changes — mark it ephemeral so the API caches
// it after the first request. Subsequent calls read from the cache (~10x cheaper).
const SYSTEM_PROMPT = `You are an expert technical writer who creates compelling developer portfolio content.

Given a list of a developer's GitHub repositories, you produce:
1. A professional bio (2-3 sentences, first person) that highlights their core skills, tech interests, and what they build
2. A one-sentence description for each project that clearly explains what it does and why it matters

Rules:
- Be specific and technical — avoid vague phrases like "powerful tool" or "amazing project"
- The bio should read naturally, not like a resume bullet
- Project descriptions should start with a verb (e.g. "Builds...", "Automates...", "Visualizes...")
- If a repo has no description and no README, write a plausible description based on its name and language`;

// JSON schema for structured output — guarantees we always get parseable JSON
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

export async function generatePortfolioContent(
  repos: GitHubRepo[],
  githubUsername: string
): Promise<PortfolioContent> {
  // Trim each repo down to the key signals Claude needs — name, language,
  // description, and a short README excerpt. Keeps the prompt concise.
  const repoContext = repos.map((repo) => ({
    name: repo.name,
    description: repo.description,
    primary_language: repo.language,
    stars: repo.stargazers_count,
    // Trim README to avoid blowing out the context window
    readme_excerpt: repo.readme ? repo.readme.slice(0, 600) : null,
  }));

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    // Structured output ensures we always get valid JSON back — no parsing errors.
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
        // Cache the stable system prompt — first call writes it, subsequent
        // calls read from cache at ~10% of normal input token cost.
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Generate portfolio content for GitHub user "${githubUsername}".

Here are their ${repos.length} most recently active repositories:

${JSON.stringify(repoContext, null, 2)}`,
      },
    ],
  });

  // Find the text block in the response (thinking blocks are separate)
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }

  return JSON.parse(textBlock.text) as PortfolioContent;
}
