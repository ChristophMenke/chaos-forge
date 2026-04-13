"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut, Settings as SettingsIcon } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { NAV_ITEMS } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface AppSidebarProps {
  userEmail?: string;
  userId?: string;
  userAvatarUrl?: string | null;
}

export function AppSidebar({ userEmail, userId, userAvatarUrl }: AppSidebarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <nav
      className="fixed left-0 top-0 z-50 hidden h-full w-16 flex-col items-center border-r border-border glass py-4 sm:flex xl:w-48 xl:items-stretch"
      aria-label="Main navigation"
      data-testid="app-sidebar"
    >
      {/* Navigation Icons */}
      <div className="flex flex-1 flex-col items-center gap-1 pt-2 xl:items-stretch xl:px-2">
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
            <Tooltip key={item.href}>
              <TooltipTrigger
                render={<Link href={item.href} />}
                className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all xl:w-full xl:justify-start xl:gap-3 xl:px-3 ${
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
                aria-label={t(item.labelKey)}
                data-testid={item.testId}
              >
                <item.icon className="h-5 w-5 shrink-0 xl:h-5 xl:w-5" />
                <span className="hidden text-sm font-medium xl:inline">{t(item.labelKey)}</span>
              </TooltipTrigger>
              <TooltipContent side="right" className="xl:hidden">
                {t(item.labelKey)}
              </TooltipContent>
            </Tooltip>
          );
        })}
        {userId && <NotificationBell userId={userId} />}
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-1 pb-2 xl:items-stretch xl:px-2">
        {userEmail && (
          <Tooltip>
            <TooltipTrigger
              render={<Link href="/settings" />}
              className="flex h-10 w-10 items-center justify-center self-center overflow-hidden rounded-full bg-primary/10 text-sm font-medium text-primary ring-1 ring-primary/20 transition-all hover:ring-primary/50"
              aria-label={userEmail}
              data-testid="sidebar-user-avatar"
            >
              {userAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={userAvatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                userEmail.charAt(0).toUpperCase()
              )}
            </TooltipTrigger>
            <TooltipContent side="right">{userEmail}</TooltipContent>
          </Tooltip>
        )}
        <LocaleToggle />
        <ThemeToggle />
        <Tooltip>
          <TooltipTrigger
            render={<Link href="/settings" />}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all xl:w-full xl:justify-start xl:gap-3 xl:px-3 ${
              pathname === "/settings" || pathname.startsWith("/settings/")
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}
            aria-label={t("settings")}
            data-testid="nav-settings"
          >
            <SettingsIcon className="h-5 w-5 shrink-0" />
            <span className="hidden text-sm font-medium xl:inline">{t("settings")}</span>
          </TooltipTrigger>
          <TooltipContent side="right" className="xl:hidden">
            {t("settings")}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            onClick={handleLogout}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive xl:w-full xl:justify-start xl:gap-3 xl:px-3"
            aria-label={t("logout")}
            data-testid="logout-button-sidebar"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="hidden text-sm font-medium xl:inline">{t("logout")}</span>
          </TooltipTrigger>
          <TooltipContent side="right" className="xl:hidden">
            {t("logout")}
          </TooltipContent>
        </Tooltip>
      </div>
    </nav>
  );
}
