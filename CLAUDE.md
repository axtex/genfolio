@AGENTS.md

# genfolio — Claude Code Rules

## Project
genfolio is an AI-powered developer portfolio SaaS. Users sign in with GitHub OAuth, their repos are fetched using a 3-priority chain (pinned → featured topic → filtered recency), and Claude generates a bio + project descriptions. The result is a public portfolio at `/username`, cached for 24h with unstable_cache + ISR.

Key files:
- `lib/github.ts` — GitHub API + GraphQL fetching with 24h cache
- `lib/claude.ts` — Claude API call with prompt caching and JSON schema output
- `lib/actions.ts` — server action to bust cache on demand
- `app/[username]/page.tsx` — public portfolio page (ISR)
- `app/dashboard/page.tsx` — authenticated dashboard
- `auth.ts` — NextAuth v5 config with GitHub provider

## Model
- Use claude-haiku-4-5-20251001 for all Claude API calls in the app

## API usage
- Only call the Claude API when explicitly testing
- Never trigger Claude API calls on auto-reload or file save

## Code style
- Always use TypeScript
- Use Tailwind for all styling