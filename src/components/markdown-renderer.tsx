"use client";

import dynamic from "next/dynamic";

/**
 * Lazy-loaded ReactMarkdown wrapper (~45kB gzipped).
 * Only loaded when first rendered, not on initial page load.
 */
export const MarkdownRenderer = dynamic(() => import("react-markdown"), {
  loading: () => <span className="text-xs text-muted-foreground">…</span>,
  ssr: false,
});
