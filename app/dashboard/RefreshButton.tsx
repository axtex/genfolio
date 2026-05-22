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
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? (
        <>
          <svg
            className="animate-spin h-3 w-3 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
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
        "Updated!"
      ) : (
        "Refresh portfolio"
      )}
    </button>
  );
}
