"use client";

import { type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import { useApproval } from "@/components/approval-provider";

interface ApprovalGateProps {
  /** What to render when the user is approved (the normal action). */
  children: ReactNode;
  /**
   * What to render when the user is NOT yet approved. Defaults to a small
   * hint badge so the user sees *why* the action is unavailable instead of
   * just "it's gone". Pass `null` to hide completely.
   */
  fallback?: ReactNode;
}

/**
 * Hides or replaces write-action UI for users that aren't approved yet.
 * Components that wrap it stay inside server components because this file is
 * a client component — import and use it like any other component.
 */
export function ApprovalGate({ children, fallback }: ApprovalGateProps) {
  const t = useTranslations("approval");
  const { userId, isApproved, isLoading } = useApproval();

  // Be permissive during load to avoid UI flash; the DB trigger is the final
  // safety net anyway.
  if (!userId || isLoading || isApproved) return <>{children}</>;

  if (fallback === null) return null;

  return (
    <>
      {fallback ?? (
        <span
          className="inline-flex items-center gap-1.5 rounded-md border border-amber-700/40 bg-amber-950/30 px-2.5 py-1 text-xs text-amber-200/80"
          data-testid="approval-gate-locked"
        >
          <Lock className="h-3 w-3" aria-hidden />
          {t("writeBlockedShort")}
        </span>
      )}
    </>
  );
}
