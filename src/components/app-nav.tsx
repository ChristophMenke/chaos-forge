"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Ellipsis, Settings as SettingsIcon } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { NAV_ITEMS } from "@/lib/navigation";

interface AppNavProps {
  userEmail?: string;
  userId?: string;
  userAvatarUrl?: string | null;
}

export function AppNav({ userEmail, userId, userAvatarUrl }: AppNavProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const morePanelRef = useRef<HTMLDivElement>(null);
  const moreTriggerRef = useRef<HTMLButtonElement>(null);
  const barItems = NAV_ITEMS.filter((item) => item.mobileBar);
  const moreNavItems = NAV_ITEMS.filter((item) => !item.mobileBar);

  const handleUnreadCountChange = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

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
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-medium text-primary"
                data-testid="mobile-more-avatar"
              >
                {userAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userAvatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  userEmail.charAt(0).toUpperCase()
                )}
              </div>
              <span
                className="truncate text-xs text-muted-foreground"
                data-testid="mobile-more-email"
              >
                {userEmail}
              </span>
            </div>
          )}
          {/* Notifications */}
          {userId && (
            <NotificationBell
              userId={userId}
              variant="mobile"
              onUnreadCountChange={handleUnreadCountChange}
            />
          )}
          {/* Nav items hidden from bottom bar */}
          <div className="flex flex-col gap-1">
            {moreNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={closeMore}
                  data-testid={`${item.testId}-mobile`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <LocaleToggle />
            <ThemeToggle />
            <Link
              href="/settings"
              onClick={closeMore}
              className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
                pathname === "/settings" || pathname.startsWith("/settings/")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={t("settings")}
              data-testid="nav-settings-mobile"
            >
              <SettingsIcon className="h-5 w-5" />
            </Link>
            <LogoutButton />
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="relative z-40 flex items-center justify-around border-t border-border bg-background px-2 py-1">
        {barItems.map((item) => {
          const hasMoreSpecificMatch = barItems.some(
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
          <div className="relative">
            <Ellipsis className="h-5 w-5" />
            {unreadCount > 0 && (
              <span
                className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-0.5 text-[8px] font-bold text-white"
                data-testid="mobile-more-unread-badge"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <span className="truncate">{t("more")}</span>
        </button>
      </div>
    </nav>
  );
}
