/**
 * Shown automatically by Next.js while the dashboard Server Component is
 * fetching repos and generating content with Claude.
 */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-zinc-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Fetching repos and generating your portfolio…
      </p>
    </div>
  );
}
