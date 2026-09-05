import Link from "next/link";
import { auth } from "@/auth";
import type { GitHubUser } from "@/lib/github";

export default async function PortfolioNotGenerated({
  user,
}: {
  user: GitHubUser;
}) {
  const session = await auth();
  const isOwner =
    session?.user?.login?.toLowerCase() === user.login.toLowerCase();

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center page-x text-center gap-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={user.avatar_url}
        alt=""
        width={64}
        height={64}
        className="w-16 h-16 rounded-full border border-border"
      />
      <div className="space-y-2">
        <h1 className="font-display font-semibold text-2xl tracking-tight text-fg">
          {user.name ?? user.login}
        </h1>
        <p className="font-mono text-xs text-muted">@{user.login}</p>
      </div>
      <p className="text-sm text-muted max-w-[40ch]">
        {isOwner
          ? "Your public genfolio isn’t live yet. Open the dashboard to generate it."
          : "This GitHub user hasn’t generated a genfolio yet. Sign in to create yours."}
      </p>
      <Link
        href={isOwner ? "/dashboard" : "/"}
        className="group focus-ring inline-flex items-center justify-center gap-1.5 min-h-11 px-4 text-sm font-medium text-fg hover:text-accent active:text-accent transition-colors duration-200"
        style={{ transitionTimingFunction: "var(--ease-out)" }}
      >
        {isOwner ? "Open dashboard" : "Build your genfolio"}
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
      </Link>
    </div>
  );
}
