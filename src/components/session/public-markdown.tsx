"use client";

import { MarkdownRenderer as ReactMarkdown } from "@/components/markdown-renderer";
import remarkBreaks from "remark-breaks";

/**
 * Client-side Markdown wrapper for the public share page.
 *
 * The share page is a Server Component, and React forbids passing functions
 * (like the remarkBreaks plugin) from a Server Component to a Client Component.
 * This wrapper keeps the plugin reference inside the client boundary so the
 * server only needs to pass the raw markdown string.
 */
export function PublicMarkdown({ children }: { children: string }) {
  return <ReactMarkdown remarkPlugins={[remarkBreaks]}>{children}</ReactMarkdown>;
}
