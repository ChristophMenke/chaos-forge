"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Users,
  Swords,
  Coins,
  BookOpen,
  MoreHorizontal,
  UserRound,
  Bug,
  Flame,
  Star,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { LogoutButton } from "@/components/logout-button";
import type { TabId } from "./master-dashboard";

interface MasterBottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  userEmail?: string;
}

const MORE_TABS: TabId[] = ["npcs", "bestiary", "bookmarks", "combat"];

export function MasterBottomNav({ activeTab, onTabChange, userEmail }: MasterBottomNavProps) {
  const t = useTranslations("master");
  const tn = useTranslations("nav");
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    if (!moreOpen) return;
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moreOpen]);

  const primaryTabs: { id: TabId; icon: React.ReactNode; label: string }[] = [
    { id: "party", icon: <Users className="h-5 w-5" />, label: t("partyTab") },
    { id: "items", icon: <Swords className="h-5 w-5" />, label: t("itemsTab") },
    { id: "gold", icon: <Coins className="h-5 w-5" />, label: t("goldTab") },
    { id: "chat", icon: <BookOpen className="h-5 w-5" />, label: tn("rulebook") },
  ];

  const moreTabs: { id: TabId; icon: React.ReactNode; label: string }[] = [
    { id: "npcs", icon: <UserRound className="h-5 w-5" />, label: t("npcsTab") },
    { id: "bestiary", icon: <Bug className="h-5 w-5" />, label: t("bestiaryTab") },
    { id: "bookmarks", icon: <Star className="h-5 w-5" />, label: t("bookmarksTab") },
    { id: "combat", icon: <Flame className="h-5 w-5" />, label: t("combatTab") },
  ];

  const isMoreActive = MORE_TABS.includes(activeTab);
  const activeMoreTab = isMoreActive ? moreTabs.find((mt) => mt.id === activeTab) : null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background sm:hidden"
      aria-label="GM navigation"
      data-testid="gm-bottom-nav"
    >
      {/* More panel — full-width glass panel (same as player app-nav) */}
      {moreOpen && (
        <div
          ref={moreRef}
          className="glass glow-neutral absolute bottom-full left-0 right-0 z-40 mb-1 flex flex-col gap-3 rounded-t-xl p-4"
          data-testid="gm-nav-more-menu"
        >
          {userEmail && (
            <span className="truncate text-xs text-muted-foreground" data-testid="gm-nav-email">
              {userEmail}
            </span>
          )}
          <div className="flex flex-col gap-1">
            {moreTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  setMoreOpen(false);
                }}
                className={`flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors ${
                  activeTab === tab.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`gm-nav-${tab.id}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <LocaleToggle />
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="relative z-40 flex items-center justify-around border-t border-border bg-background px-2 py-1">
        {primaryTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              onTabChange(tab.id);
              setMoreOpen(false);
            }}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-md py-2 text-xs transition-colors ${
              activeTab === tab.id ? "text-primary" : "text-muted-foreground"
            }`}
            data-testid={`gm-nav-${tab.id}`}
          >
            {tab.icon}
            <span className="truncate">{tab.label}</span>
          </button>
        ))}

        {/* More button */}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className={`flex flex-1 flex-col items-center gap-0.5 rounded-md py-2 text-xs transition-colors ${
            isMoreActive ? "text-primary" : "text-muted-foreground"
          }`}
          data-testid="gm-nav-more"
        >
          {activeMoreTab ? activeMoreTab.icon : <MoreHorizontal className="h-5 w-5" />}
          <span className="truncate">{activeMoreTab ? activeMoreTab.label : t("moreTab")}</span>
        </button>
      </div>
    </nav>
  );
}
