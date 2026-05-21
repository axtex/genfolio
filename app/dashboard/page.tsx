/**
 * Dashboard page — the core of the app.
 *
 * Flow (all runs server-side):
 *   1. auth()        → get session + GitHub access token
 *   2. fetchGitHubUser + fetchUserRepos → pull repo data via GitHub API
 *   3. generatePortfolioContent        → send repo data to Claude
 *   4. Render the generated bio + project cards
 */

import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { fetchGitHubUser, fetchUserRepos } from "@/lib/github";
import { generatePortfolioContent } from "@/lib/claude";

export default async function DashboardPage() {
  // 1. Verify the user is logged in and has an access token
  const session = await auth();

  if (!session?.accessToken) {
    redirect("/api/auth/signin");
  }

  // 2. Fetch GitHub profile first (need the login for the READMEs call),
  //    then fetch repos and README content in parallel per-repo.
  const ghUser = await fetchGitHubUser(session.accessToken);
  const repos = await fetchUserRepos(session.accessToken, ghUser.login);

  // 3. Run repo data through Claude to generate bio + project descriptions
  const portfolio = await generatePortfolioContent(repos, ghUser.login);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
      {/* ── Header ── */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            genfolio
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* ── Profile section ── */}
        <section className="flex items-start gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ghUser.avatar_url}
            alt={ghUser.name ?? ghUser.login}
            className="w-20 h-20 rounded-full ring-2 ring-zinc-200 dark:ring-zinc-700 shrink-0"
          />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {ghUser.name ?? ghUser.login}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              @{ghUser.login} · {ghUser.public_repos} public repos
            </p>

            {/* ── Claude-generated bio ── */}
            <div className="mt-3 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                AI-generated bio
              </p>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-2xl">
                {portfolio.bio}
              </p>
            </div>
          </div>
        </section>

        {/* ── Project cards ── */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Projects ({portfolio.projects.length})
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {portfolio.projects.map((project) => {
              // Find the matching repo for language + stars data
              const repo = repos.find((r) => r.name === project.name);

              return (
                <a
                  key={project.name}
                  href={repo?.html_url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {project.name}
                    </h3>
                    {repo?.language && (
                      <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                        {repo.language}
                      </span>
                    )}
                  </div>

                  {/* Claude-generated description */}
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Stars */}
                  {repo && repo.stargazers_count > 0 && (
                    <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                      ★ {repo.stargazers_count}
                    </p>
                  )}
                </a>
              );
            })}
          </div>
        </section>

        {/* ── Debug panel (helpful during development) ── */}
        {process.env.NODE_ENV === "development" && (
          <details className="text-xs text-zinc-400">
            <summary className="cursor-pointer select-none">
              Raw Claude output (dev only)
            </summary>
            <pre className="mt-2 p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg overflow-auto">
              {JSON.stringify(portfolio, null, 2)}
            </pre>
          </details>
        )}
      </main>
    </div>
  );
}
