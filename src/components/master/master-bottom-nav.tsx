"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { BookOpen } from "lucide-react";
import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";

export function MasterBottomNav() {
  const t = useTranslations("nav");

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background sm:hidden"
      aria-label="GM navigation"
      data-testid="gm-bottom-nav"
    >
      <div className="flex items-center justify-around px-2 py-2">
        <Link
          href="/chat"
          className="flex flex-col items-center gap-0.5 rounded-md px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          data-testid="gm-nav-chat"
        >
          <BookOpen className="h-5 w-5" />
          <span className="truncate">{t("rulebook")}</span>
        </Link>
        <LocaleToggle />
        <ThemeToggle />
        <LogoutButton />
      </div>
    </nav>
  );
}
