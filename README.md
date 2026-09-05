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

genfolio connects to your GitHub account, selects your best repositories, and uses Claude to write your bio and project descriptions in a natural, technical voice. After sign-in, generation runs on the dashboard (and when you hit refresh). The public page at `/yourusername` serves that cached Claude copy — visiting `/someone-else` does not call Claude. From the dashboard you can copy the URL or refresh to regenerate from your latest GitHub data. No forms, no templates, no writing.

---

## Technical highlights

- **3-priority repo selection chain** — tries GraphQL pinned repos first, then fills remaining slots from repos tagged `featured`, then from filtered recent repos ranked by “has a GitHub description,” then star count, then recency.
- **Two-layer caching** — `unstable_cache` keeps GitHub and Claude responses in the server cache for 24 hours; Next.js ISR keeps the rendered HTML at the CDN edge once a portfolio has been generated. If the Claude cache expires, `/username` shows “not generated yet” until the owner opens the dashboard or hits refresh.
- **Generation is auth-gated** — Claude runs on the dashboard and on refresh, not on public `GET /[username]`. A Claude-cache miss on the public page shows a “not generated yet” state instead of spending API credits. Public pages still fetch GitHub (profile, and repos if a cached portfolio exists).
- **Prompt caching on Claude** — the system prompt is sent with `cache_control: ephemeral`, so repeated *generations* (new owners / refresh after expiry) reuse cached prompt tokens instead of paying to re-process them.
- **Refresh** — hitting the refresh button calls `updateTag(username)` to expire all three cache layers (user, repos, portfolio) for that login, then the dashboard regenerates. Other users’ caches stay intact.
- **Auth-gated mutations** — server actions verify the session before allowing cache invalidation, so users can only refresh their own portfolio.

---

## Design decisions

- **Repo quality without a CMS** — pinned → `featured` topic → ranked recency, so empty or junk repos do not become the portfolio.
- **Cost and latency** — Claude is not invoked by public pageviews (GitHub still is). 24h `unstable_cache` + ISR + Claude prompt cache cover repeat views and repeat generations.
- **Refresh without breaking other visitors** — `updateTag(username)` busts user/repos/portfolio together; other users’ caches stay intact.

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
     │           │   sign-in + refresh only
     ▼           ▼
 Public /[username]
     │           GitHub profile (+ repos if cached)
     │           Claude: cache read only (no call on miss)
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

```bash
npm test
```

Required environment variables (see `.env.example`):

| Variable | Purpose |
|---|---|
| `AUTH_SECRET` | Auth.js session secret (`npx auth secret`) |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth App credentials |
| `ANTHROPIC_API_KEY` | Claude API key for bio + project copy |
| `GITHUB_TOKEN` | Optional. Used for all GitHub REST/GraphQL calls (dashboard and public). Required to read pinned repos |

Create a GitHub OAuth App at [github.com/settings/developers](https://github.com/settings/developers):

- **Homepage URL:** `http://localhost:3000`
- **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`

---
