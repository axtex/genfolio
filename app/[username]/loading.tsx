export default function PortfolioLoading() {
  return (
    <div className="min-h-screen bg-bg font-sans">
      <header className="border-b border-border bg-bg">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="w-[72px] h-[72px] rounded-full bg-border animate-pulse" />

          <div className="mt-4 space-y-2">
            <div className="h-7 w-44 bg-border rounded animate-pulse" />
            <div className="h-4 w-24 bg-border/70 rounded animate-pulse" />
          </div>

          <div className="mt-6 space-y-2.5">
            <div className="h-2.5 w-28 bg-border/60 rounded animate-pulse" />
            <div className="h-4 w-full max-w-[65ch] bg-border rounded animate-pulse" />
            <div className="h-4 w-[88%] max-w-[65ch] bg-border rounded animate-pulse" />
            <div className="h-4 w-[72%] max-w-[65ch] bg-border/70 rounded animate-pulse" />
          </div>
        </div>
      </header>

      <main className="bg-subtle">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="h-2.5 w-20 bg-border/70 rounded animate-pulse mb-7" />

          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-5 border border-border bg-bg rounded-lg">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="h-4 w-32 bg-border rounded animate-pulse" />
                  <div className="h-5 w-16 bg-border/70 rounded-full animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-border/60 rounded animate-pulse" />
                  <div className="h-3 w-[85%] bg-border/60 rounded animate-pulse" />
                  <div className="h-3 w-[65%] bg-border/50 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
