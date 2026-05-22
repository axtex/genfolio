import type { PortfolioContent } from "@/lib/claude";
import type { GitHubUser, Repo } from "@/lib/github";

const LANG_COLORS: Record<string, string> = {
  TypeScript: "bg-blue-500",
  JavaScript: "bg-yellow-400",
  Python: "bg-green-500",
  Rust: "bg-orange-500",
  Go: "bg-cyan-500",
  Java: "bg-red-500",
  "C++": "bg-pink-500",
  C: "bg-gray-500",
  Ruby: "bg-red-400",
  Swift: "bg-orange-400",
  Kotlin: "bg-purple-500",
  Dart: "bg-teal-500",
};

type PortfolioViewProps = {
  username: string;
  user: GitHubUser;
  repos: Repo[];
  portfolio: PortfolioContent;
  toolbar?: React.ReactNode;
  showFooter?: boolean;
  devRaw?: PortfolioContent;
};

export default function PortfolioView({
  username,
  user,
  repos,
  portfolio,
  toolbar,
  showFooter = true,
  devRaw,
}: PortfolioViewProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 font-sans">
      {toolbar && (
        <div className="border-b border-zinc-100 dark:border-zinc-800">
          <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              genfolio
            </span>
            <div className="flex flex-nowrap items-center gap-4">{toolbar}</div>
          </div>
        </div>
      )}

      <header className="border-b border-zinc-100 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto px-6 py-16 flex flex-col items-center text-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.avatar_url}
            alt={user.name ?? user.login}
            className="w-24 h-24 rounded-full ring-4 ring-zinc-100 dark:ring-zinc-800"
          />
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              {user.name ?? user.login}
            </h1>
            <p className="mt-1 text-zinc-500 dark:text-zinc-400">
              @{user.login}
            </p>
          </div>

          <p className="max-w-xl text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {portfolio.bio}
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-6">
          Projects
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {portfolio.projects.map((project) => {
            const repo = repos.find((r) => r.name === project.name);
            const dotColor =
              repo?.language && LANG_COLORS[repo.language]
                ? LANG_COLORS[repo.language]
                : "bg-zinc-400";

            return (
              <a
                key={project.name}
                href={
                  repo?.url ?? `https://github.com/${username}/${project.name}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {project.name}
                  </h3>
                  {repo?.language && (
                    <span className="shrink-0 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${dotColor}`}
                      />
                      {repo.language}
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {project.description}
                </p>

                {repo && repo.stars > 0 && (
                  <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                    ★ {repo.stars}
                  </p>
                )}
              </a>
            );
          })}
        </div>

        {devRaw && (
          <details className="mt-10 text-xs text-zinc-400">
            <summary className="cursor-pointer select-none">
              Raw Claude output (dev only)
            </summary>
            <pre className="mt-2 p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg overflow-auto">
              {JSON.stringify(devRaw, null, 2)}
            </pre>
          </details>
        )}
      </main>

      {showFooter && (
        <footer className="border-t border-zinc-100 dark:border-zinc-800 mt-8">
          <div className="max-w-3xl mx-auto px-6 py-10 text-center">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              Build your genfolio
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
          </div>
        </footer>
      )}
    </div>
  );
}
