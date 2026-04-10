"use client";

import { useSyncExternalStore, useCallback, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

function getLocaleFromCookie(): string {
  if (typeof document === "undefined") return "de";
  return (
    document.cookie
      .split("; ")
      .find((c) => c.startsWith("NEXT_LOCALE="))
      ?.split("=")[1] ?? "de"
  );
}

function subscribe(callback: () => void) {
  const id = setInterval(callback, 1000);
  return () => clearInterval(id);
}

function getServerSnapshot() {
  return "de";
}

export function LocaleToggle() {
  const current = useSyncExternalStore(subscribe, getLocaleFromCookie, getServerSnapshot);
  const [isPending] = useTransition();

  const toggleLocale = useCallback(() => {
    const next = current === "en" ? "de" : "en";
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000`;
    window.location.reload();
  }, [current]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      disabled={isPending}
      data-testid="locale-toggle"
      aria-label={current === "de" ? "English" : "Deutsch"}
    >
      {isPending ? <Spinner className="h-4 w-4" /> : current.toUpperCase()}
    </Button>
  );
}
