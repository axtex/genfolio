"use client";

import { useState } from "react";

export default function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className="toolbar-btn focus-ring text-xs text-muted hover:text-fg active:text-fg transition-colors duration-200"
      style={{ transitionTimingFunction: "var(--ease-out)" }}
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
