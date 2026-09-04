# genfolio

Sign in with GitHub. Get a clean, AI-written portfolio page in seconds — no manual editing required.

**Live at:** https://genfolio-hazel.vercel.app
**Example portfolio:** https://genfolio-hazel.vercel.app/axtex (Avneet Thind — generated from GitHub, ISR-cached)

---

## Why it exists

Developer portfolios are either a raw GitHub profile or hours of copywriting and a custom site. genfolio turns an existing GitHub account into a shareable page in one OAuth click. It picks repos from real signals (pinned → `featured` topic → ranked recency) so the page is your best work, not your six most recently touched folders.

---

## Stack

| Frontend | Backend / Cloud |
|---|---|
| Next.js 16 (App Router) | Vercel (hosting + edge cache) |
| TypeScript | Claude API (claude-haiku-4-5) |
| Tailwind CSS | GitHub REST + GraphQL API |
| React 19 | NextAuth v5 (GitHub OAuth) |
| | `unstable_cache` + ISR |

---

## What it does

genfolio connects to your GitHub account, selects your best repositories, and uses Claude to write your bio and project descriptions in a natural, technical voice. After sign-in you get a public page at `/yourusername` that you can share immediately; from the dashboard you can copy that URL or refresh to regenerate from your latest GitHub data. No forms, no templates, no writing.

---

## Technical highlights

- **3-priority repo selection chain** — tries GraphQL pinned repos first, falls back to repos tagged `featured`, then falls back to filtered recent repos ranked by description quality, star count, and recency. Visitors always see your best work.
- **Two-layer caching** — `unstable_cache` keeps GitHub and Claude responses in the server cache for 24 hours; Next.js ISR keeps the rendered HTML at the CDN edge. Cold visitors get instant page loads even on first hit.
- **Prompt caching on Claude** — the system prompt is sent with `cache_control: ephemeral`, so repeated generations for different users reuse the cached prompt tokens instead of paying to re-process them.
- **Stale-while-revalidate** — hitting the refresh button calls `revalidateTag(username)` to bust all three cache layers (user, repos, portfolio) atomically, so the next request regenerates fresh content without a visible loading state for other visitors.
- **Auth-gated mutations** — server actions verify the session before allowing cache invalidation, so users can only refresh their own portfolio.

---

## Design decisions

- **Repo quality without a CMS** — pinned → `featured` topic → ranked recency, so empty or junk repos do not become the portfolio.
- **Cost and latency** — 24h `unstable_cache` + ISR + Claude prompt cache so visitors do not wait on GitHub/Claude and you do not pay full prompt tokens per user.
- **Refresh without breaking other visitors** — `revalidateTag(username)` busts user/repos/portfolio together; other users’ caches stay intact.

---

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
 unstable_cache (24h, server) → ISR / CDN edge cache
```

---

## Getting started

```bash
git clone https://github.com/axtex/genfolio.git
cd genfolio
npm install
cp .env.example .env.local
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Required environment variables (see `.env.example`):

| Variable | Purpose |
|---|---|
| `AUTH_SECRET` | Auth.js session secret (`npx auth secret`) |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth App credentials |
| `ANTHROPIC_API_KEY` | Claude API key for bio + project copy |
| `GITHUB_TOKEN` | Optional. Fallback for public GitHub fetches; required to read pinned repos |

Create a GitHub OAuth App at [github.com/settings/developers](https://github.com/settings/developers):

- **Homepage URL:** `http://localhost:3000`
- **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`

---
