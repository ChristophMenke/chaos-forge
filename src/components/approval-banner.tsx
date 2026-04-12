"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useApprovalStatus } from "@/lib/hooks/use-approval-status";
import { Hourglass } from "lucide-react";

const IMMERSIVE_ROUTES_PREFIX = ["/login", "/master"];

export function ApprovalBanner() {
  const t = useTranslations("approval");
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const { isApproved, isLoading } = useApprovalStatus(userId);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  if (!userId || isLoading || isApproved) return null;
  if (
    pathname &&
    IMMERSIVE_ROUTES_PREFIX.some((r) => pathname === r || pathname.startsWith(r + "/"))
  ) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="approval-pending-banner"
      className="embed-hidden sticky top-0 z-40 border-b border-amber-700/40 bg-gradient-to-r from-amber-950/90 via-amber-900/80 to-amber-950/90 px-4 py-2.5 text-center text-sm text-amber-100 shadow-lg backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-4xl items-center justify-center gap-2">
        <Hourglass className="h-4 w-4 shrink-0 animate-pulse text-amber-400" aria-hidden />
        <span className="font-medium">{t("pendingBanner")}</span>
      </div>
    </div>
  );
}
