"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PartyGoldPanel } from "@/components/party/party-gold-panel";
import { PartyItemsPanel } from "@/components/party/party-items-panel";
import { PartyLogPanel } from "@/components/party/party-log-panel";
import type {
  PartyLootGoldRow,
  PartyLootItemWithDetails,
  PartyLootLogRow,
  GeneralItemRow,
  WeaponRow,
  ArmorRow,
} from "@/lib/supabase/types";

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
  allGeneralItems: GeneralItemRow[];
  allWeapons: WeaponRow[];
  allArmor: ArmorRow[];
}

export function PartyPageClient({
  gold,
  items,
  log,
  characters,
  userMap,
  characterMap,
  userId,
  allGeneralItems,
  allWeapons,
  allArmor,
}: PartyPageClientProps) {
  const t = useTranslations("party");

  // Characters owned by the current user
  const myCharacters = characters.filter((c) => c.user_id === userId);
  const [activeCharacterId, setActiveCharacterId] = useState<string>(myCharacters[0]?.id ?? "");

  const activeCharacterName = characters.find((c) => c.id === activeCharacterId)?.name ?? "";

  return (
    <>
      {/* Character Selector */}
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

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <PartyGoldPanel
          gold={gold}
          userId={userId}
          characters={characters}
          activeCharacterName={activeCharacterName}
        />
        <PartyItemsPanel
          items={items}
          userId={userId}
          characters={characters}
          allGeneralItems={allGeneralItems}
          allWeapons={allWeapons}
          allArmor={allArmor}
          activeCharacterName={activeCharacterName}
        />
      </div>

      <PartyLogPanel log={log} userMap={userMap} characterMap={characterMap} />
    </>
  );
}
