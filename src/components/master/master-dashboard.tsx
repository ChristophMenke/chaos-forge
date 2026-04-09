"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Shield, Zap, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MasterPartyPanel } from "./master-party-panel";
import { MasterItemsPanel } from "./master-items-panel";
import { MasterGoldPanel } from "./master-gold-panel";
import { MasterNpcsPanel } from "./master-npcs-panel";
import { MasterBestiaryPanel } from "./master-bestiary-panel";
import { MasterCombatSimulator } from "./master-combat-simulator";
import { RulebookChat } from "@/components/rulebook-chat/rulebook-chat";
import { MasterBottomNav } from "./master-bottom-nav";
import { MasterSidebar } from "./master-sidebar";
import { MasterBookmarksPanel } from "./master-bookmarks-panel";
import type {
  CharacterRow,
  CharacterClassRow,
  WeaponRow,
  ArmorRow,
  GeneralItemRow,
  ChronicleNpcRow,
  MonsterRow,
  SpellRow,
  MagicItemRow,
  GmBookmarkRow,
  BookmarkEntityType,
} from "@/lib/supabase/types";
import type { CharacterCombatData } from "@/lib/rules/character-computed";
import { fetchMagicItems, fetchMagicItemDistribution } from "@/app/master/actions";

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
  npcs: ChronicleNpcRow[];
  monsters: MonsterRow[];
  characterSpells: Map<string, SpellRow[]>;
  initialMagicItems: MagicItemRow[];
  initialBookmarks: GmBookmarkRow[];
  userId: string;
  userEmail?: string;
}

export type TabId =
  | "party"
  | "items"
  | "gold"
  | "chat"
  | "npcs"
  | "bestiary"
  | "combat"
  | "bookmarks";

export function MasterDashboard({
  partyData,
  weapons,
  armor,
  generalItems,
  npcs,
  monsters,
  characterSpells,
  initialMagicItems,
  initialBookmarks,
  userId,
  userEmail,
}: MasterDashboardProps) {
  const t = useTranslations("master");
  const [activeTab, setActiveTab] = useState<TabId>("party");
  const [viewingCharacterId, setViewingCharacterId] = useState<string | null>(null);
  const [liveHpMap, setLiveHpMap] = useState<Map<string, { current: number; max: number }>>(
    new Map()
  );
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Magic Items state (refreshable)
  const [magicItems, setMagicItems] = useState<MagicItemRow[]>(initialMagicItems);
  const [magicItemDistribution, setMagicItemDistribution] = useState<
    Map<
      string,
      {
        owners: { characterId: string; characterName: string; equipped: boolean }[];
        inPartyLoot: boolean;
      }
    >
  >(new Map());

  // Bookmarks state
  const [bookmarks, setBookmarks] = useState<GmBookmarkRow[]>(initialBookmarks);
  const bookmarkSet = useMemo(
    () => new Set(bookmarks.map((b) => `${b.entity_type}:${b.entity_id}`)),
    [bookmarks]
  );

  const handleBookmarkToggle = useCallback(
    (entityType: BookmarkEntityType, entityId: string) => {
      const key = `${entityType}:${entityId}`;
      setBookmarks((prev) => {
        if (prev.some((b) => `${b.entity_type}:${b.entity_id}` === key)) {
          return prev.filter((b) => `${b.entity_type}:${b.entity_id}` !== key);
        }
        return [
          ...prev,
          {
            // Client-side placeholder — bookmarkSet is keyed by entity_type:entity_id, not by id
            id: crypto.randomUUID(),
            user_id: userId,
            entity_type: entityType,
            entity_id: entityId,
            created_at: new Date().toISOString(),
          },
        ];
      });
    },
    [userId]
  );

  const refreshMagicItems = useCallback(async () => {
    const [items, dist] = await Promise.all([fetchMagicItems(), fetchMagicItemDistribution()]);
    setMagicItems(items);
    setMagicItemDistribution(dist);
  }, []);

  // Load magic item distribution on mount (items already come from SSR)
  useEffect(() => {
    refreshMagicItems();
  }, [refreshMagicItems]);

  // Shared state: monsters queued from Bestiary for the Combat Simulator
  const [pendingCombatMonsters, setPendingCombatMonsters] = useState<
    { monster: MonsterRow; count: number }[]
  >([]);

  const handleAddToCombatFromBestiary = useCallback((monster: MonsterRow, count: number) => {
    setPendingCombatMonsters((prev) => {
      const existing = prev.findIndex((e) => e.monster.id === monster.id);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = { ...next[existing], count: next[existing].count + count };
        return next;
      }
      return [...prev, { monster, count }];
    });
    setActiveTab("combat");
  }, []);

  // Realtime subscription with fallback polling
  const setupRealtime = useCallback(() => {
    const supabase = createClient();
    const characterIds = partyData.map((p) => p.character.id);
    if (characterIds.length === 0) return () => {};
    let fallbackTimeout: ReturnType<typeof setTimeout> | null = null;

    async function pollHp() {
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
    }

    const channel = supabase
      .channel("gm-hp-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "characters",
          filter: `id=in.(${characterIds.join(",")})`,
        },
        (payload) => {
          const updated = payload.new as { id: string; hp_current: number; hp_max: number };
          setLiveHpMap((prev) => {
            const next = new Map(prev);
            next.set(updated.id, { current: updated.hp_current, max: updated.hp_max });
            return next;
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsRealtimeConnected(true);
          // Cancel fallback — Realtime is up
          if (fallbackTimeout) {
            clearTimeout(fallbackTimeout);
            fallbackTimeout = null;
          }
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setIsRealtimeConnected(false);
          if (!pollingRef.current) {
            pollingRef.current = setInterval(pollHp, 10_000);
          }
        }
      });

    // Fallback polling every 10s if Realtime doesn't connect within 5s
    fallbackTimeout = setTimeout(() => {
      fallbackTimeout = null;
      if (!pollingRef.current) {
        pollingRef.current = setInterval(pollHp, 10_000);
      }
    }, 5_000);

    return () => {
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
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

  const characters = useMemo(
    () => partyData.filter((p) => p.character.is_active).map((p) => p.character),
    [partyData]
  );

  // When viewing a character, show embedded character sheet
  if (viewingCharacterId) {
    const viewingChar = partyData.find((p) => p.character.id === viewingCharacterId);
    return (
      <>
        <MasterSidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setViewingCharacterId(null);
            setActiveTab(tab);
          }}
          userEmail={userEmail}
        />
        <div
          className="flex h-screen flex-col pb-20 sm:pl-16 sm:pb-0 xl:pl-48"
          data-testid="gm-character-view"
        >
          {/* Back bar */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-2">
            <button
              onClick={() => setViewingCharacterId(null)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
              data-testid="gm-back-to-party"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("partyTab")}
            </button>
            {viewingChar && (
              <span className="font-heading text-sm text-foreground">
                {viewingChar.character.name}
              </span>
            )}
          </div>
          {/* Embedded character sheet */}
          <iframe
            src={`/characters/${viewingCharacterId}/manage?embed=1`}
            className="flex-1 border-0"
            title={viewingChar?.character.name ?? "Character Sheet"}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            data-testid="gm-character-iframe"
          />
        </div>
        <MasterBottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setViewingCharacterId(null);
            setActiveTab(tab);
          }}
        />
      </>
    );
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <MasterSidebar activeTab={activeTab} onTabChange={setActiveTab} userEmail={userEmail} />

      {/* Main Content — offset for sidebar on desktop */}
      <div
        className={`pb-20 sm:pl-16 sm:pb-4 xl:pl-48 ${
          activeTab === "chat"
            ? "flex h-[calc(100vh-var(--header-height,140px))] flex-col sm:h-screen"
            : "w-full p-3 sm:pr-4 sm:pt-4"
        }`}
        data-testid="gm-dashboard"
      >
        {/* Header — hidden on chat tab for max space */}
        {activeTab !== "chat" && (
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-amber-400" />
              <h1 className="font-heading text-xl text-foreground sm:text-2xl">{t("title")}</h1>
            </div>
            <div className="flex items-center gap-1.5" data-testid="gm-live-indicator">
              <Zap
                className={`h-3.5 w-3.5 ${isRealtimeConnected ? "text-green-400" : "text-yellow-400"}`}
              />
              <span
                className={`text-xs ${isRealtimeConnected ? "text-green-400" : "text-yellow-400"}`}
              >
                {t("liveIndicator")}
              </span>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "party" && (
          <MasterPartyPanel
            partyData={partyData}
            liveHpMap={liveHpMap}
            onViewCharacter={setViewingCharacterId}
          />
        )}
        {activeTab === "items" && (
          <MasterItemsPanel
            weapons={weapons}
            armor={armor}
            generalItems={generalItems}
            characters={characters}
            magicItems={magicItems}
            magicItemDistribution={magicItemDistribution}
            bookmarkSet={bookmarkSet}
            userId={userId}
            onBookmarkToggle={handleBookmarkToggle}
            onMagicItemsChange={refreshMagicItems}
          />
        )}
        {activeTab === "gold" && <MasterGoldPanel characters={characters} />}
        {activeTab === "npcs" && (
          <MasterNpcsPanel
            initialNpcs={npcs}
            characters={partyData
              .filter((p) => !p.character.is_npc)
              .map((p) => ({
                ...p.character,
                level: p.combat.maxLevel,
              }))}
            npcCharacters={partyData
              .filter((p) => p.character.is_npc)
              .map((p) => ({
                ...p.character,
                level: p.combat.maxLevel,
              }))}
            gmUserId={userId}
            bookmarkSet={bookmarkSet}
            onBookmarkToggle={handleBookmarkToggle}
          />
        )}
        {activeTab === "bestiary" && (
          <MasterBestiaryPanel
            monsters={monsters}
            onAddToCombat={handleAddToCombatFromBestiary}
            bookmarkSet={bookmarkSet}
            userId={userId}
            onBookmarkToggle={handleBookmarkToggle}
          />
        )}
        {activeTab === "combat" && (
          <MasterCombatSimulator
            partyData={partyData}
            monsters={monsters}
            characterSpells={characterSpells}
            initialMonsters={pendingCombatMonsters}
            onMonstersConsumed={() => setPendingCombatMonsters([])}
          />
        )}
        {activeTab === "bookmarks" && (
          <MasterBookmarksPanel
            bookmarks={bookmarks}
            weapons={weapons}
            armor={armor}
            generalItems={generalItems}
            magicItems={magicItems}
            npcs={npcs}
            monsters={monsters}
            characters={characters}
            onBookmarkToggle={handleBookmarkToggle}
            userId={userId}
            onAddToCombat={handleAddToCombatFromBestiary}
          />
        )}
        {activeTab === "chat" && <RulebookChat />}
      </div>

      {/* Mobile Bottom Nav with tab switching */}
      <MasterBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  );
}
