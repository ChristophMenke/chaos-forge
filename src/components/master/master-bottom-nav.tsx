"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Users, Swords, Coins, BookOpen } from "lucide-react";
import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";

type TabId = "party" | "items" | "gold";

interface MasterBottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function MasterBottomNav({ activeTab, onTabChange }: MasterBottomNavProps) {
  const t = useTranslations("master");
  const tn = useTranslations("nav");

  const tabs: { id: TabId; icon: React.ReactNode; label: string }[] = [
    { id: "party", icon: <Users className="h-5 w-5" />, label: t("partyTab") },
    { id: "items", icon: <Swords className="h-5 w-5" />, label: t("itemsTab") },
    { id: "gold", icon: <Coins className="h-5 w-5" />, label: t("goldTab") },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background sm:hidden"
      aria-label="GM navigation"
      data-testid="gm-bottom-nav"
    >
      <div className="flex items-center justify-around px-1 py-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-md py-2 text-xs transition-colors ${
              activeTab === tab.id ? "text-primary" : "text-muted-foreground"
            }`}
            data-testid={`gm-nav-${tab.id}`}
          >
            {tab.icon}
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
        <Link
          href="/chat"
          className="flex flex-1 flex-col items-center gap-0.5 rounded-md py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          data-testid="gm-nav-chat"
        >
          <BookOpen className="h-5 w-5" />
          <span className="truncate">{tn("rulebook")}</span>
        </Link>
        <div className="flex flex-col items-center gap-0.5 py-1">
          <LocaleToggle />
        </div>
        <div className="flex flex-col items-center gap-0.5 py-1">
          <ThemeToggle />
        </div>
        <div className="flex flex-col items-center gap-0.5 py-1">
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
