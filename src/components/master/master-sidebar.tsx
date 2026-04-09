"use client";

import { useTranslations } from "next-intl";
import { Users, Swords, Coins, BookOpen, LogOut, UserRound, Bug, Flame, Star } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

import type { TabId } from "./master-dashboard";

interface MasterSidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  userEmail?: string;
}

export function MasterSidebar({ activeTab, onTabChange, userEmail }: MasterSidebarProps) {
  const t = useTranslations("master");
  const tn = useTranslations("nav");
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const tabs: { id: TabId; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { id: "party", icon: Users, label: t("partyTab") },
    { id: "items", icon: Swords, label: t("itemsTab") },
    { id: "gold", icon: Coins, label: t("goldTab") },
    { id: "npcs", icon: UserRound, label: t("npcsTab") },
    { id: "bestiary", icon: Bug, label: t("bestiaryTab") },
    { id: "bookmarks", icon: Star, label: t("bookmarksTab") },
    { id: "combat", icon: Flame, label: t("combatTab") },
  ];

  return (
    <nav
      className="fixed left-0 top-0 z-50 hidden h-full w-16 flex-col items-center border-r border-border glass py-4 sm:flex xl:w-48 xl:items-stretch"
      aria-label="GM sidebar"
      data-testid="gm-sidebar"
    >
      {/* Tab Navigation */}
      <div className="flex flex-1 flex-col items-center gap-1 pt-2 xl:items-stretch xl:px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Tooltip key={tab.id}>
              <TooltipTrigger
                onClick={() => onTabChange(tab.id)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all xl:w-full xl:justify-start xl:gap-3 xl:px-3 ${
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
                aria-label={tab.label}
                data-testid={`gm-sidebar-${tab.id}`}
              >
                <tab.icon className="h-5 w-5 shrink-0" />
                <span className="hidden text-sm font-medium xl:inline">{tab.label}</span>
              </TooltipTrigger>
              <TooltipContent side="right" className="xl:hidden">
                {tab.label}
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Divider */}
        <div className="my-2 h-px w-8 bg-border xl:w-full" />

        {/* Chat Tab */}
        <Tooltip>
          <TooltipTrigger
            onClick={() => onTabChange("chat")}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all xl:w-full xl:justify-start xl:gap-3 xl:px-3 ${
              activeTab === "chat"
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}
            aria-label={tn("rulebook")}
            data-testid="gm-sidebar-chat"
          >
            <BookOpen className="h-5 w-5 shrink-0" />
            <span className="hidden text-sm font-medium xl:inline">{tn("rulebook")}</span>
          </TooltipTrigger>
          <TooltipContent side="right" className="xl:hidden">
            {tn("rulebook")}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-1 pb-2 xl:items-stretch xl:px-2">
        {userEmail && (
          <Tooltip>
            <TooltipTrigger
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
              data-testid="gm-sidebar-user"
            >
              {userEmail.charAt(0).toUpperCase()}
            </TooltipTrigger>
            <TooltipContent side="right">{userEmail}</TooltipContent>
          </Tooltip>
        )}
        <LocaleToggle />
        <ThemeToggle />
        <Tooltip>
          <TooltipTrigger
            onClick={handleLogout}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive xl:w-full xl:justify-start xl:gap-3 xl:px-3"
            aria-label={tn("logout")}
            data-testid="gm-sidebar-logout"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="hidden text-sm font-medium xl:inline">{tn("logout")}</span>
          </TooltipTrigger>
          <TooltipContent side="right" className="xl:hidden">
            {tn("logout")}
          </TooltipContent>
        </Tooltip>
      </div>
    </nav>
  );
}
