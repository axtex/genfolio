import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center page-x text-center gap-5">
      <p
        className="font-display font-semibold text-[6rem] sm:text-[8rem] md:text-[11rem] leading-none text-border select-none"
        aria-hidden="true"
      >
        404
      </p>

      <div className="-mt-2 space-y-5">
        <p className="text-sm text-muted">
          This portfolio doesn&#8217;t exist yet.
        </p>
        <Link
          href="/"
          className="group focus-ring inline-flex items-center justify-center gap-1.5 min-h-11 px-4 text-sm font-medium text-fg hover:text-accent active:text-accent transition-colors duration-200"
          style={{ transitionTimingFunction: "var(--ease-out)" }}
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
        </Link>
      </div>
    </div>
  );
}
