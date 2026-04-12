"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

/**
 * Global safety net: intercepts fetch responses and shows a user-friendly
 * toast whenever a write fails due to the `user_not_approved` enforcement
 * trigger (PostgreSQL errcode 42501). This catches edit/delete paths that
 * don't have an explicit ApprovalGate guard around the UI button.
 */
export function ApprovalErrorToast() {
  const t = useTranslations("approval");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;
    let toastCooldown = 0; // throttle — avoid 10 toasts for one button click

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (!response.ok && (response.status === 403 || response.status === 500)) {
        try {
          const cloned = response.clone();
          const text = await cloned.text();
          if (text.includes("user_not_approved") || text.includes('"code":"42501"')) {
            const now = Date.now();
            if (now - toastCooldown > 2000) {
              toastCooldown = now;
              toast.error(t("writeBlocked"));
            }
          }
        } catch {
          // If the body can't be read, skip — nothing we can do
        }
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [t]);

  return null;
}
