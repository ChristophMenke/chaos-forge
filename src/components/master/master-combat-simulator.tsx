"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Flame, Play, Loader2 } from "lucide-react";
import { EntitySetup, type MonsterEntry } from "./combat-simulator/entity-setup";
import { SimulationResults } from "./combat-simulator/simulation-results";
import { CombatLogViewer } from "./combat-simulator/combat-log-viewer";
import {
  runSimulation,
  characterToCombatEntity,
  monsterToCombatEntities,
  createSeededRng,
} from "@/lib/combat-simulator";
import type { SimulationResult } from "@/lib/combat-simulator";
import type { CharacterRow, CharacterClassRow, MonsterRow, SpellRow } from "@/lib/supabase/types";
import type { CharacterCombatData } from "@/lib/rules/character-computed";

interface PartyMember {
  character: CharacterRow;
  classes: CharacterClassRow[];
  combat: CharacterCombatData;
}

interface MasterCombatSimulatorProps {
  partyData: PartyMember[];
  monsters: MonsterRow[];
  characterSpells: Map<string, SpellRow[]>;
  initialMonsters?: { monster: MonsterRow; count: number }[];
  onMonstersConsumed?: () => void;
}

export function MasterCombatSimulator({
  partyData,
  monsters,
  characterSpells,
  initialMonsters,
  onMonstersConsumed,
}: MasterCombatSimulatorProps) {
  const t = useTranslations("master");
  const [selectedParty, setSelectedParty] = useState<Set<string>>(
    () => new Set(partyData.filter((p) => p.character.is_active).map((p) => p.character.id))
  );
  const [monsterEntries, setMonsterEntries] = useState<MonsterEntry[]>([]);
  const [selectedOppositionChars, setSelectedOppositionChars] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Consume monsters passed from Bestiary tab
  useEffect(() => {
    if (initialMonsters && initialMonsters.length > 0) {
      setMonsterEntries((prev) => {
        const merged = [...prev];
        for (const entry of initialMonsters) {
          const existing = merged.findIndex((e) => e.monster.id === entry.monster.id);
          if (existing >= 0) {
            merged[existing] = {
              ...merged[existing],
              count: merged[existing].count + entry.count,
            };
          } else {
            merged.push(entry);
          }
        }
        return merged;
      });
      onMonstersConsumed?.();
    }
  }, [initialMonsters, onMonstersConsumed]);

  const handleTogglePartyMember = useCallback((id: string) => {
    setSelectedParty((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleOppositionChar = useCallback((id: string) => {
    setSelectedOppositionChars((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleAddMonster = useCallback((monster: MonsterRow) => {
    setMonsterEntries((prev) => {
      const existing = prev.findIndex((e) => e.monster.id === monster.id);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = { ...next[existing], count: next[existing].count + 1 };
        return next;
      }
      return [...prev, { monster, count: 1 }];
    });
  }, []);

  const handleRemoveMonster = useCallback((index: number) => {
    setMonsterEntries((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateCount = useCallback((index: number, count: number) => {
    setMonsterEntries((prev) => prev.map((e, i) => (i === index ? { ...e, count } : e)));
  }, []);

  const hasOpposition = monsterEntries.length > 0 || selectedOppositionChars.size > 0;

  const handleRunSimulation = useCallback(() => {
    if (selectedParty.size === 0 || !hasOpposition) return;

    setIsRunning(true);

    // Use requestAnimationFrame to let the UI update before heavy computation
    requestAnimationFrame(() => {
      const rng = createSeededRng(Date.now());

      // Build party entities
      const party = partyData
        .filter((p) => selectedParty.has(p.character.id))
        .map((p) =>
          characterToCombatEntity(
            p.character,
            p.classes,
            p.combat,
            characterSpells.get(p.character.id) ?? []
          )
        );

      // Build opposition: monsters + characters as opponents
      const monsterOpposition = monsterEntries.flatMap((entry) =>
        monsterToCombatEntities(entry.monster, entry.count, rng)
      );
      const charOpposition = partyData
        .filter((p) => selectedOppositionChars.has(p.character.id))
        .map((p) => {
          const entity = characterToCombatEntity(
            p.character,
            p.classes,
            p.combat,
            characterSpells.get(p.character.id) ?? []
          );
          return { ...entity, side: "opposition" as const };
        });
      const opposition = [...monsterOpposition, ...charOpposition];

      const simResult = runSimulation(party, opposition, { iterations: 20 });
      setResult(simResult);
      setIsRunning(false);
    });
  }, [
    selectedParty,
    monsterEntries,
    selectedOppositionChars,
    hasOpposition,
    partyData,
    characterSpells,
  ]);

  const canRun = selectedParty.size > 0 && hasOpposition;

  return (
    <div className="space-y-4" data-testid="gm-combat-simulator">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5 text-amber-400" />
        <h2 className="font-heading text-lg font-bold text-foreground">{t("combatTitle")}</h2>
      </div>

      {/* Setup */}
      <EntitySetup
        partyData={partyData}
        monsters={monsters}
        selectedParty={selectedParty}
        onTogglePartyMember={handleTogglePartyMember}
        monsterEntries={monsterEntries}
        onAddMonster={handleAddMonster}
        onRemoveMonster={handleRemoveMonster}
        onUpdateMonsterCount={handleUpdateCount}
        selectedOppositionChars={selectedOppositionChars}
        onToggleOppositionChar={handleToggleOppositionChar}
      />

      {/* Run button */}
      <div className="flex justify-center">
        <button
          onClick={handleRunSimulation}
          disabled={!canRun || isRunning}
          className="flex items-center gap-2 rounded-lg bg-amber-600/20 px-6 py-2.5 font-heading text-sm font-semibold text-amber-400 transition-all hover:bg-amber-600/30 disabled:opacity-50"
          data-testid="gm-combat-run"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("combatRunning")}
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              {t("combatRun")}
            </>
          )}
        </button>
      </div>

      {/* Validation messages */}
      {selectedParty.size === 0 && (
        <p className="text-center text-xs text-muted-foreground">{t("combatNoParty")}</p>
      )}
      {!hasOpposition && (
        <p className="text-center text-xs text-muted-foreground">{t("combatNoOpposition")}</p>
      )}

      {/* Results */}
      {result && (
        <>
          <SimulationResults result={result} />
          <CombatLogViewer log={result.representativeLog} />
        </>
      )}
    </div>
  );
}
