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
