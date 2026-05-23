# genfolio

Sign in with GitHub. Get a beautiful, AI-written portfolio page in seconds — no manual editing required.

## Live demo

- **App:** https://genfolio-hazel.vercel.app
- **Example portfolio:** https://genfolio-hazel.vercel.app/axtex

## What it does

genfolio connects to your GitHub account, intelligently selects your best repositories, and uses Claude to write your bio and project descriptions in a natural, technical voice. The result is a public portfolio page at `/yourusername` that you can share immediately. Everything is cached so the page loads fast for visitors, and you can refresh your portfolio any time to pull in new work. No forms, no templates, no writing.

## Technical highlights

- **3-priority repo selection chain** — tries GraphQL pinned repos first, falls back to repos tagged `featured`, then falls back to filtered recent repos ranked by description quality, star count, and recency. Visitors always see your best work.
- **Two-layer caching** — `unstable_cache` keeps GitHub and Claude responses in the server cache for 24 hours; Next.js ISR keeps the rendered HTML at the CDN edge. Cold visitors get instant page loads even on first hit.
- **Prompt caching on Claude** — the system prompt is sent with `cache_control: ephemeral`, so repeated generations for different users reuse the cached prompt tokens instead of paying to re-process them.
- **Stale-while-revalidate** — hitting the refresh button calls `revalidateTag(username)` to bust all three cache layers (user, repos, portfolio) atomically, so the next request regenerates fresh content without a visible loading state for other visitors.
- **Auth-gated mutations** — server actions verify the session before allowing cache invalidation, so users can only refresh their own portfolio.

## Architecture

```
GitHub OAuth
     │
     ▼
 Dashboard ──── GitHub API (user profile + repos)
     │           │
     │           ▼
     │        Claude API (bio + project descriptions)
     │           │
     ▼           ▼
 Public portfolio page
     │
     ▼
 unstable_cache (24h) → ISR / CDN edge cache
```

## Stack

| Frontend | Backend / Cloud |
|---|---|
| Next.js 16 (App Router) | Vercel (hosting + edge cache) |
| TypeScript | Claude API (claude-haiku-4-5) |
| Tailwind CSS | GitHub REST + GraphQL API |
| Fraunces + Plus Jakarta Sans | NextAuth v5 (GitHub OAuth) |
| | `unstable_cache` + ISR |

## Local development

```bash
# 1. Clone
git clone https://github.com/yourusername/genfolio
cd genfolio

# 2. Install dependencies
npm install

# 3. Copy the env template
cp .env.example .env.local

# 4. Fill in your credentials (see table below)
# 5. Start the dev server
npm run dev
```

Open http://localhost:3000.

## Environment variables

| Variable | Description | Required |
|---|---|---|
| `AUTH_SECRET` | Random secret for NextAuth session encryption. Generate with `openssl rand -base64 32` | Yes |
| `AUTH_GITHUB_ID` | GitHub OAuth app client ID. Create at github.com/settings/developers | Yes |
| `AUTH_GITHUB_SECRET` | GitHub OAuth app client secret | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude. Get from console.anthropic.com | Yes |
| `GITHUB_TOKEN` | Personal access token for fetching pinned repos via GraphQL. Needs `read:user` and `public_repo` scopes | Yes |
| `NEXT_PUBLIC_BASE_URL` | Base URL for public portfolio links. Set to your production domain (e.g. `https://genfolio-hazel.vercel.app`) | No (defaults to localhost) |

**GitHub OAuth callback URL to register:** `http://localhost:3000/api/auth/callback/github` (dev) or `https://yourdomain.vercel.app/api/auth/callback/github` (prod)
