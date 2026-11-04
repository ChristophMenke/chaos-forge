"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { BellRing, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/glass-card";
import {
  disablePush,
  enablePush,
  getCurrentSubscription,
  getPushSupport,
  readPushEnv,
  refreshSubscription,
  type PushSupport,
} from "@/lib/push/client";

const HINT_KEYS: Partial<Record<PushSupport, string>> = {
  "ios-needs-install": "pushIosInstall",
  unsupported: "pushUnsupported",
  denied: "pushDenied",
};

/** Settings → "Notifications": push on/off for this device, plus a test push. */
export function PushSettingsSection() {
  const t = useTranslations("settings");
  const locale = useLocale();
  const [support, setSupport] = useState<PushSupport | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const current = getPushSupport(readPushEnv());
      const subscription = current === "supported" ? await getCurrentSubscription() : null;
      if (cancelled) return;
      setSupport(current);
      setEnabled(subscription !== null);
      // A language switch reloads the page; store the device's language again.
      if (subscription) void refreshSubscription(locale).catch(() => {});
    })();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  async function handleToggle() {
    setBusy(true);
    try {
      if (enabled) {
        await disablePush();
        setEnabled(false);
      } else if ((await enablePush(locale)) === "denied") {
        setSupport("denied");
      } else {
        setEnabled(true);
        toast.success(t("pushEnabled"));
      }
    } catch (error) {
      console.error("[push] toggle failed", error);
      toast.error(t("pushError"));
    } finally {
      setBusy(false);
    }
  }

  async function handleTest() {
    const res = await fetch("/api/push/test", { method: "POST" });
    if (res.ok) toast.success(t("pushTestSent"));
    else toast.error(t("pushTestFailed"));
  }

  const hintKey = support ? HINT_KEYS[support] : undefined;
  const disabled = busy || support !== "supported";

  return (
    <GlassCard hover={false} data-testid="settings-section-push">
      <div className="mb-3 flex items-center gap-2">
        <BellRing className="h-4 w-4 text-primary" />
        <h2 className="font-heading text-lg text-primary">{t("sectionPush")}</h2>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p id="settings-push-label" className="text-sm font-medium">
            {t("pushToggle")}
          </p>
          <p className="text-xs text-muted-foreground">{t("pushHint")}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-labelledby="settings-push-label"
          disabled={disabled}
          onClick={() => void handleToggle()}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            enabled ? "bg-primary" : "bg-muted"
          }`}
          data-testid="settings-push-toggle"
        >
          {busy ? (
            <Loader2 className="mx-auto h-4 w-4 animate-spin text-primary-foreground" />
          ) : (
            <span
              className={`inline-block h-5 w-5 rounded-full bg-background shadow transition-transform ${
                enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          )}
        </button>
      </div>

      {hintKey && (
        <p
          className="mt-3 flex items-start gap-2 rounded-md bg-muted/40 p-2 text-xs text-muted-foreground"
          role="note"
          data-testid="settings-push-hint"
        >
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t(hintKey)}
        </p>
      )}

      {enabled && (
        <Button
          variant="outline"
          className="mt-3"
          onClick={() => void handleTest()}
          data-testid="settings-push-test"
        >
          {t("pushTest")}
        </Button>
      )}
    </GlassCard>
  );
}
