"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Coins, Package, ScrollText } from "lucide-react";
import { PartyGoldPanel } from "@/components/party/party-gold-panel";
import { PartyItemsPanel } from "@/components/party/party-items-panel";
import { PartyLogPanel } from "@/components/party/party-log-panel";
import { useRealtimeRefresh } from "@/lib/hooks/use-realtime-refresh";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import type {
  PartyLootGoldRow,
  PartyLootItemWithDetails,
  PartyLootLogRow,
} from "@/lib/supabase/types";
import type { OwnedItemGroup } from "@/lib/party-loot/types";

interface CharacterOption {
  id: string;
  name: string;
  user_id: string;
}

interface PartyPageClientProps {
  gold: PartyLootGoldRow;
  items: PartyLootItemWithDetails[];
  log: PartyLootLogRow[];
  characters: CharacterOption[];
  userMap: Record<string, string>;
  characterMap: Record<string, string>;
  userId: string;
  ownedItemGroups: OwnedItemGroup[];
}

type ViewId = "loot" | "gold" | "log";
const DEFAULT_VIEW: ViewId = "loot";
const VIEW_IDS: ViewId[] = ["loot", "gold", "log"];

export function PartyPageClient({
  gold,
  items,
  log,
  characters,
  userMap,
  characterMap,
  userId,
  ownedItemGroups,
}: PartyPageClientProps) {
  const t = useTranslations("party");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawView = searchParams.get("view") as ViewId | null;
  const activeView: ViewId = rawView && VIEW_IDS.includes(rawView) ? rawView : DEFAULT_VIEW;
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const myCharacters = useMemo(
    () => characters.filter((c) => c.user_id === userId),
    [characters, userId]
  );
  const [activeCharacterId, setActiveCharacterId] = useState<string>(myCharacters[0]?.id ?? "");
  const activeCharacterName = characters.find((c) => c.id === activeCharacterId)?.name ?? "";

  useRealtimeRefresh("party-loot", [
    { table: "party_loot_gold" },
    { table: "party_loot_items" },
    { table: "party_loot_log" },
  ]);

  function setView(next: ViewId) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === DEFAULT_VIEW) {
      params.delete("view");
    } else {
      params.set("view", next);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const tabs: { id: ViewId; label: string; icon: React.ReactNode }[] = [
    { id: "loot", label: t("items"), icon: <Package className="size-4" /> },
    { id: "gold", label: t("goldPool"), icon: <Coins className="size-4" /> },
    { id: "log", label: t("log"), icon: <ScrollText className="size-4" /> },
  ];

  const goldPanel = (
    <PartyGoldPanel
      gold={gold}
      userId={userId}
      characters={characters}
      activeCharacterName={activeCharacterName}
    />
  );

  const itemsPanel = (
    <PartyItemsPanel
      items={items}
      userId={userId}
      characters={characters}
      characterMap={characterMap}
      ownedItemGroups={ownedItemGroups}
      activeCharacterId={activeCharacterId}
      activeCharacterName={activeCharacterName}
    />
  );

  const logPanel = <PartyLogPanel log={log} userMap={userMap} characterMap={characterMap} />;

  return (
    <>
      {myCharacters.length > 0 && (
        <div
          className="flex items-center gap-3 rounded-lg border border-border bg-card/30 px-4 py-2"
          data-testid="party-character-selector"
        >
          <label htmlFor="party-acting-as" className="text-sm font-medium text-muted-foreground">
            {t("actingAs")}:
          </label>
          <select
            id="party-acting-as"
            value={activeCharacterId}
            onChange={(e) => setActiveCharacterId(e.target.value)}
            className="rounded-md border border-input bg-input px-3 py-1.5 text-sm"
            data-testid="party-acting-as-select"
          >
            {myCharacters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {isDesktop ? (
        /* Desktop: 2-column grid */
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          <div className="flex flex-col gap-6">
            {goldPanel}
            {itemsPanel}
          </div>
          {logPanel}
        </div>
      ) : (
        /* Mobile/Tablet: Tabs */
        <div data-testid="party-mobile-tabs">
          <div
            className="sticky top-0 z-10 -mx-4 mb-4 flex gap-1 border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6"
            role="tablist"
            aria-label={t("tabsLabel")}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`party-tab-btn-${tab.id}`}
                aria-selected={activeView === tab.id}
                aria-controls={`party-tabpanel-${tab.id}`}
                onClick={() => setView(tab.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition ${
                  activeView === tab.id
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
                data-testid={`party-tab-${tab.id}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div
            id={`party-tabpanel-${activeView}`}
            role="tabpanel"
            aria-labelledby={`party-tab-btn-${activeView}`}
          >
            {activeView === "loot" && itemsPanel}
            {activeView === "gold" && goldPanel}
            {activeView === "log" && logPanel}
          </div>
        </div>
      )}
    </>
  );
}
