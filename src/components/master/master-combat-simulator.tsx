"use client";

import { useState, useCallback, useEffect, startTransition } from "react";
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
      startTransition(() => {
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
      });
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
    <div className="space-y-6" data-testid="gm-combat-simulator">
      {/* Epic Header */}
      <div className="relative overflow-hidden rounded-xl border border-red-500/20 bg-gradient-to-r from-red-950/40 via-background/60 to-amber-950/30 px-4 py-4 sm:px-6">
        <div className="pointer-events-none absolute -left-16 -top-16 h-32 w-32 rounded-full bg-red-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20 shadow-lg shadow-red-500/10">
            <Flame className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">{t("combatTitle")}</h2>
            <p className="text-xs text-red-400/60">{t("combatSetup")}</p>
          </div>
        </div>
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

      {/* Epic Run Button */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={handleRunSimulation}
          disabled={!canRun || isRunning}
          className="group relative flex items-center gap-2 overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-600/20 via-red-600/20 to-amber-600/20 px-8 py-3 font-heading text-sm font-semibold text-amber-400 shadow-lg shadow-amber-500/10 transition-all hover:border-amber-500/50 hover:shadow-amber-500/20 disabled:opacity-50"
          data-testid="gm-combat-run"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 opacity-0 transition-opacity group-hover:opacity-100" />
          {isRunning ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {t("combatRunning")}
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              {t("combatRun")}
            </>
          )}
        </button>

        {/* Validation messages */}
        {selectedParty.size === 0 && (
          <p className="text-center text-xs text-muted-foreground">{t("combatNoParty")}</p>
        )}
        {!hasOpposition && (
          <p className="text-center text-xs text-muted-foreground">{t("combatNoOpposition")}</p>
        )}
      </div>

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
