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
      onClick={copy}
      className="text-[11px] font-medium text-muted hover:text-fg transition-colors tabular-nums w-10 text-left"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
