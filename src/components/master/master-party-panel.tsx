"use client";

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
  if (partyData.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground" data-testid="gm-party-empty">
        Keine aktiven Charaktere gefunden.
      </p>
    );
  }

  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      data-testid="gm-party-panel"
    >
      {partyData.map(({ character, classes, combat }) => (
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
  );
}
