"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Shield, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MasterPartyPanel } from "./master-party-panel";
import { MasterItemsPanel } from "./master-items-panel";
import { MasterGoldPanel } from "./master-gold-panel";
import { MasterBottomNav } from "./master-bottom-nav";
import type {
  CharacterRow,
  CharacterClassRow,
  WeaponRow,
  ArmorRow,
  GeneralItemRow,
} from "@/lib/supabase/types";
import type { CharacterCombatData } from "@/lib/rules/character-computed";

interface PartyMember {
  character: CharacterRow;
  classes: CharacterClassRow[];
  combat: CharacterCombatData;
}

interface MasterDashboardProps {
  partyData: PartyMember[];
  weapons: WeaponRow[];
  armor: ArmorRow[];
  generalItems: GeneralItemRow[];
}

type TabId = "party" | "items" | "gold";

export function MasterDashboard({ partyData, weapons, armor, generalItems }: MasterDashboardProps) {
  const t = useTranslations("master");
  const [activeTab, setActiveTab] = useState<TabId>("party");
  const [liveHpMap, setLiveHpMap] = useState<Map<string, { current: number; max: number }>>(
    new Map()
  );
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Realtime subscription with fallback polling
  const setupRealtime = useCallback(() => {
    const supabase = createClient();
    const characterIds = partyData.map((p) => p.character.id);

    const channel = supabase
      .channel("gm-hp-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "characters",
        },
        (payload) => {
          const updated = payload.new as { id: string; hp_current: number; hp_max: number };
          if (characterIds.includes(updated.id)) {
            setLiveHpMap((prev) => {
              const next = new Map(prev);
              next.set(updated.id, { current: updated.hp_current, max: updated.hp_max });
              return next;
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsRealtimeConnected(true);
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setIsRealtimeConnected(false);
          // Restart polling fallback when Realtime drops
          if (!pollingRef.current) {
            pollingRef.current = setInterval(async () => {
              const { data } = await supabase
                .from("characters")
                .select("id, hp_current, hp_max")
                .in("id", characterIds);
              if (data) {
                setLiveHpMap((prev) => {
                  const next = new Map(prev);
                  for (const row of data) {
                    next.set(row.id, { current: row.hp_current, max: row.hp_max });
                  }
                  return next;
                });
              }
            }, 10_000);
          }
        }
      });

    // Fallback polling every 10s if Realtime doesn't connect within 5s
    const fallbackTimeout = setTimeout(() => {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(async () => {
          const { data } = await supabase
            .from("characters")
            .select("id, hp_current, hp_max")
            .in("id", characterIds);
          if (data) {
            setLiveHpMap((prev) => {
              const next = new Map(prev);
              for (const row of data) {
                next.set(row.id, { current: row.hp_current, max: row.hp_max });
              }
              return next;
            });
          }
        }, 10_000);
      }
    }, 5_000);

    return () => {
      clearTimeout(fallbackTimeout);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [partyData]);

  useEffect(() => {
    return setupRealtime();
  }, [setupRealtime]);

  const tabs: { id: TabId; label: string }[] = [
    { id: "party", label: t("partyTab") },
    { id: "items", label: t("itemsTab") },
    { id: "gold", label: t("goldTab") },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl p-3 pb-20 sm:p-4 sm:pb-4" data-testid="gm-dashboard">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-amber-400" />
          <h1 className="font-heading text-xl text-foreground sm:text-2xl">{t("title")}</h1>
        </div>
        <div className="flex items-center gap-1.5" data-testid="gm-live-indicator">
          <Zap
            className={`h-3.5 w-3.5 ${isRealtimeConnected ? "text-green-400" : "text-yellow-400"}`}
          />
          <span className={`text-xs ${isRealtimeConnected ? "text-green-400" : "text-yellow-400"}`}>
            {t("liveIndicator")}
          </span>
        </div>
      </div>

      {/* Tab Navigation — Pill Style */}
      <div className="mb-4 flex gap-1 rounded-lg bg-background/30 p-1" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-primary/20 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`gm-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "party" && <MasterPartyPanel partyData={partyData} liveHpMap={liveHpMap} />}
      {activeTab === "items" && (
        <MasterItemsPanel
          weapons={weapons}
          armor={armor}
          generalItems={generalItems}
          characters={partyData.map((p) => p.character)}
        />
      )}
      {activeTab === "gold" && <MasterGoldPanel characters={partyData.map((p) => p.character)} />}

      {/* Mobile Bottom Nav */}
      <MasterBottomNav />
    </div>
  );
}
