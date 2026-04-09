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
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { TabId } from "./master-dashboard";

interface MasterBottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const MORE_TABS: TabId[] = ["npcs", "bestiary", "bookmarks", "combat"];

export function MasterBottomNav({ activeTab, onTabChange }: MasterBottomNavProps) {
  const t = useTranslations("master");
  const tn = useTranslations("nav");
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

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
      <div className="flex items-center justify-around px-1 py-1">
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
        <div ref={moreRef} className="relative flex-1">
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex w-full flex-col items-center gap-0.5 rounded-md py-2 text-xs transition-colors ${
              isMoreActive ? "text-primary" : "text-muted-foreground"
            }`}
            data-testid="gm-nav-more"
          >
            {activeMoreTab ? activeMoreTab.icon : <MoreHorizontal className="h-5 w-5" />}
            <span className="truncate">{activeMoreTab ? activeMoreTab.label : t("moreTab")}</span>
          </button>

          {/* Popover */}
          {moreOpen && (
            <div
              className="absolute bottom-full right-0 mb-2 min-w-[140px] rounded-lg border border-border bg-background p-1 shadow-lg"
              data-testid="gm-nav-more-menu"
            >
              {moreTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    setMoreOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent/50"
                  }`}
                  data-testid={`gm-nav-${tab.id}`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
              <div className="flex items-center justify-between border-t border-border pt-2 mt-1 px-2">
                <LocaleToggle />
                <ThemeToggle />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                  data-testid="gm-nav-logout"
                >
                  <LogOut className="h-4 w-4" />
                  {tn("logout")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
