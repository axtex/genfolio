export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-bg font-sans">
      <nav className="border-b border-border bg-bg" aria-hidden="true">
        <div className="max-w-3xl mx-auto page-x py-3 sm:py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-2.5 w-14 bg-border rounded animate-pulse" />
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-2.5 w-[4.5rem] bg-border/60 rounded animate-pulse" />
            <div className="h-2.5 w-[3.5rem] bg-border/60 rounded animate-pulse" />
            <div className="h-2.5 w-[3.25rem] bg-border/60 rounded animate-pulse" />
          </div>
        </div>
      </nav>

      <header className="border-b border-border bg-bg">
        <div className="max-w-3xl mx-auto page-x py-5 sm:py-7">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-border animate-pulse shrink-0" />
            <div className="space-y-2">
              <div className="h-7 w-44 bg-border rounded animate-pulse" />
              <div className="h-4 w-24 bg-border/70 rounded animate-pulse" />
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            <div className="h-4 w-full max-w-[65ch] bg-border rounded animate-pulse" />
            <div className="h-4 w-[88%] max-w-[65ch] bg-border rounded animate-pulse" />
            <div className="h-4 w-[70%] max-w-[65ch] bg-border/70 rounded animate-pulse" />
          </div>
        </div>
      </header>

      <main className="bg-subtle">
        <div className="max-w-3xl mx-auto page-x py-7 sm:py-9">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="h-3 w-16 bg-border/70 rounded animate-pulse" />
            <div className="h-3 w-14 bg-border/60 rounded animate-pulse" />
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 border border-border bg-bg rounded-lg">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="h-4 w-32 bg-border rounded animate-pulse" />
                  <div className="h-5 w-16 bg-border/70 rounded-full animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-3.5 w-full bg-border/60 rounded animate-pulse" />
                  <div className="h-3.5 w-[85%] bg-border/60 rounded animate-pulse" />
                  <div className="h-3.5 w-[65%] bg-border/50 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
