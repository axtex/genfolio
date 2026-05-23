import type { PortfolioContent } from "@/lib/claude";
import type { GitHubUser, Repo } from "@/lib/github";
import ExpandableBio from "./ExpandableBio";

type PortfolioViewProps = {
  username: string;
  user: GitHubUser;
  repos: Repo[];
  portfolio: PortfolioContent;
  toolbar?: React.ReactNode;
  banner?: React.ReactNode;
  projectsAction?: React.ReactNode;
  showFooter?: boolean;
  devRaw?: PortfolioContent;
};

export default function PortfolioView({
  username,
  user,
  repos,
  portfolio,
  toolbar,
  banner,
  projectsAction,
  showFooter = true,
  devRaw,
}: PortfolioViewProps) {
  const totalStars = repos.reduce((sum, r) => sum + r.stars, 0);

  return (
    <div className="min-h-screen bg-bg font-sans">
      {toolbar && (
        <nav className="border-b border-border bg-bg">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted select-none">
              genfolio
            </span>
            <div className="flex items-center gap-5">{toolbar}</div>
          </div>
        </nav>
      )}

      {banner && (
        <div className="border-b border-border bg-bg">
          <div className="max-w-3xl mx-auto px-6 py-3">{banner}</div>
        </div>
      )}

      <header className="border-b border-border bg-bg">
        <div className="max-w-3xl mx-auto px-6 py-7">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-8">
            {/* Left column — profile */}
            <div className="flex-1 min-w-0">
              <div
                className="flex items-center gap-3 animate-fade-up"
                style={{ animationDelay: "0ms" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.avatar_url}
                  alt={user.name ?? user.login}
                  className="w-12 h-12 rounded-full border border-border shrink-0"
                />
                <div>
                  <h1 className="font-display font-semibold text-2xl tracking-tight text-fg leading-tight">
                    {user.name ?? user.login}
                  </h1>
                  <p className="font-mono text-xs text-muted mt-0.5">
                    @{user.login}
                  </p>
                </div>
              </div>

              <div
                className="mt-4 animate-fade-up"
                style={{ animationDelay: "100ms" }}
              >
                <ExpandableBio bio={portfolio.bio} />
              </div>
            </div>

            {/* Right column — star count if any */}
            {totalStars > 0 && (
              <div
                className="shrink-0 sm:pt-1 animate-fade-up"
                style={{ animationDelay: "80ms" }}
              >
                <span className="font-mono text-xs opacity-[0.2] select-none tabular-nums">
                  {totalStars} stars
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="bg-subtle">
        <div className="max-w-3xl mx-auto px-6 py-9">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted">
              Projects
            </h2>
            {projectsAction}
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {portfolio.projects.map((project, i) => {
              const repo = repos.find((r) => r.name === project.name);

              return (
                <a
                  key={project.name}
                  href={
                    repo?.url ??
                    `https://github.com/${username}/${project.name}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block p-4 border border-border border-l-2 bg-bg rounded-lg hover:border-accent/30 hover:border-l-accent hover:-translate-y-0.5 transition-all duration-200 animate-fade-up"
                  style={{ animationDelay: `${200 + i * 60}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display font-semibold text-base text-fg group-hover:text-accent transition-colors leading-snug">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0 mt-0.5">
                      {repo?.language && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-border text-muted">
                          {repo.language}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-3">
                    {project.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between min-h-[1.125rem]">
                    {repo && repo.stars > 0 ? (
                      <p className="text-xs text-muted/40">★ {repo.stars}</p>
                    ) : (
                      <span />
                    )}
                    <span className="font-mono text-[11px] text-muted/60 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                      ↗ GitHub
                    </span>
                  </div>
                </a>
              );
            })}
          </div>

          {devRaw && (
            <details className="mt-8 text-xs text-muted/50">
              <summary className="cursor-pointer select-none hover:text-muted transition-colors">
                Raw Claude output (dev only)
              </summary>
              <pre className="mt-2 p-4 bg-border/30 rounded-lg overflow-auto text-fg/60">
                {JSON.stringify(devRaw, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </main>

      {showFooter && (
        <footer className="border-t border-border bg-bg">
          <div className="max-w-3xl mx-auto px-6 py-12 text-center">
            <a
              href="/"
              className="group inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-fg transition-colors"
            >
              Build your genfolio
              <svg
                className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
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
