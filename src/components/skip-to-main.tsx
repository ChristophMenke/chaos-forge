"use client";

import { useTranslations } from "next-intl";

export function SkipToMain() {
  const t = useTranslations("common");
  return (
    <a
      href="#main"
      className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-background focus-visible:px-4 focus-visible:py-2 focus-visible:text-foreground focus-visible:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      data-testid="skip-to-main"
    >
      {t("skipToMain")}
    </a>
  );
}
