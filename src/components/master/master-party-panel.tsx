"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MasterCharacterCard } from "./master-character-card";
import type { CharacterRow, CharacterClassRow } from "@/lib/supabase/types";
import type { CharacterCombatData } from "@/lib/rules/character-computed";

interface PartyMember {
  character: CharacterRow;
  classes: CharacterClassRow[];
  combat: CharacterCombatData;
}

interface MasterPartyPanelProps {
  partyData: PartyMember[];
  liveHpMap: Map<string, { current: number; max: number }>;
  onViewCharacter: (characterId: string) => void;
}

export function MasterPartyPanel({ partyData, liveHpMap, onViewCharacter }: MasterPartyPanelProps) {
  const t = useTranslations("characters");
  const [showInactive, setShowInactive] = useState(false);

  const active = partyData.filter((p) => p.character.is_active);
  const inactive = partyData.filter((p) => !p.character.is_active);

  if (partyData.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground" data-testid="gm-party-empty">
        Keine Charaktere gefunden.
      </p>
    );
  }

  return (
    <div data-testid="gm-party-panel">
      {/* Active Characters */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {active.map(({ character, classes, combat }) => (
          <MasterCharacterCard
            key={character.id}
            character={character}
            classes={classes}
            combat={combat}
            liveHp={liveHpMap.get(character.id)}
            onViewCharacter={onViewCharacter}
          />
        ))}
      </div>

      {/* Inactive Characters (collapsible) */}
      {inactive.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="mb-3 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            data-testid="gm-inactive-toggle"
          >
            {showInactive ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {t("inactiveCharacters")} ({inactive.length})
          </button>

          {showInactive && (
            <div className="grid grid-cols-1 gap-3 opacity-60 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {inactive.map(({ character, classes, combat }) => (
                <MasterCharacterCard
                  key={character.id}
                  character={character}
                  classes={classes}
                  combat={combat}
                  liveHp={liveHpMap.get(character.id)}
                  onViewCharacter={onViewCharacter}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
