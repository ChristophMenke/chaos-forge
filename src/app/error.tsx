"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-6 p-6"
      data-testid="error-boundary"
    >
      <div className="glass glow-neutral mx-4 flex max-w-md flex-col items-center gap-4 rounded-xl p-8 text-center">
        <div className="text-5xl" aria-hidden="true">
          ⚔️
        </div>
        <h1 className="font-heading text-2xl text-primary">{t("title")}</h1>
        <p className="text-muted-foreground">{t("message")}</p>
        {error.digest && (
          <p className="font-mono text-xs text-muted-foreground/60">Ref: {error.digest}</p>
        )}
        <div className="flex gap-3">
          <Button onClick={reset} data-testid="error-retry-button">
            {t("retry")}
          </Button>
          <Link href="/dashboard">
            <Button variant="outline" data-testid="error-dashboard-button">
              {t("backToDashboard")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
