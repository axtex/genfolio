"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { refreshPortfolio } from "@/lib/actions";

export default function RefreshButton({ username }: { username: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handleClick() {
    setDone(false);
    startTransition(async () => {
      await refreshPortfolio(username);
      router.refresh();
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-busy={isPending}
      aria-live="polite"
      className="tap-target focus-ring gap-1.5 text-xs text-muted hover:text-fg active:text-fg transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ transitionTimingFunction: "var(--ease-out)" }}
    >
      {isPending ? (
        <>
          <svg
            className="animate-spin h-3 w-3 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Refreshing…
        </>
      ) : done ? (
        "Updated"
      ) : (
        "Refresh"
      )}
    </button>
  );
}
