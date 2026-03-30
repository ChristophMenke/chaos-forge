"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Ellipsis } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { NAV_ITEMS } from "@/lib/navigation";

interface AppNavProps {
  userEmail?: string;
}

export function AppNav({ userEmail }: AppNavProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const morePanelRef = useRef<HTMLDivElement>(null);
  const moreTriggerRef = useRef<HTMLButtonElement>(null);

  function closeMore() {
    setMoreOpen(false);
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 sm:hidden"
      aria-label="Mobile navigation"
      data-testid="app-nav-mobile"
    >
      {/* Backdrop */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setMoreOpen(false)}
          data-testid="mobile-more-backdrop"
        />
      )}

      {/* More panel */}
      {moreOpen && (
        <div
          ref={morePanelRef}
          className="glass glow-neutral rounded-t-xl absolute bottom-full left-0 right-0 z-40 mb-1 flex flex-col gap-3 p-4"
          data-testid="mobile-more-panel"
        >
          {userEmail && (
            <span
              className="truncate text-xs text-muted-foreground"
              data-testid="mobile-more-email"
            >
              {userEmail}
            </span>
          )}
          <div className="flex items-center justify-between">
            <LocaleToggle />
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="relative z-40 flex items-center justify-around border-t border-border bg-background px-2 py-1">
        {NAV_ITEMS.map((item) => {
          const hasMoreSpecificMatch = NAV_ITEMS.some(
            (other) =>
              other.href !== item.href &&
              other.href.startsWith(item.href + "/") &&
              (pathname === other.href || pathname.startsWith(other.href + "/"))
          );
          const isActive =
            !hasMoreSpecificMatch &&
            (pathname === item.href || pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-md py-2 text-xs transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
              onClick={closeMore}
              data-testid={`${item.testId}-mobile`}
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate">{t(item.labelKey)}</span>
            </Link>
          );
        })}
        <button
          ref={moreTriggerRef}
          className={`flex flex-1 flex-col items-center gap-0.5 rounded-md py-2 text-xs transition-colors ${
            moreOpen ? "text-primary" : "text-muted-foreground"
          }`}
          onClick={() => setMoreOpen((prev) => !prev)}
          aria-expanded={moreOpen}
          data-testid="mobile-more-trigger"
        >
          <Ellipsis className="h-5 w-5" />
          <span className="truncate">{t("more")}</span>
        </button>
      </div>
    </nav>
  );
}
