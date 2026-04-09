"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Search, Plus, Minus, Trash2, Users, Skull, ChevronLeft, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { localized } from "@/lib/utils/localize";
import type { CharacterRow, CharacterClassRow, MonsterRow } from "@/lib/supabase/types";
import type { CharacterCombatData } from "@/lib/rules/character-computed";

interface PartyMember {
  character: CharacterRow;
  classes: CharacterClassRow[];
  combat: CharacterCombatData;
}

export interface MonsterEntry {
  monster: MonsterRow;
  count: number;
}

interface EntitySetupProps {
  partyData: PartyMember[];
  monsters: MonsterRow[];
  selectedParty: Set<string>;
  onTogglePartyMember: (id: string) => void;
  monsterEntries: MonsterEntry[];
  onAddMonster: (monster: MonsterRow) => void;
  onRemoveMonster: (index: number) => void;
  onUpdateMonsterCount: (index: number, count: number) => void;
  /** Characters selected as opposition (for PvP / NPC fights) */
  selectedOppositionChars: Set<string>;
  onToggleOppositionChar: (id: string) => void;
}

export function EntitySetup({
  partyData,
  monsters,
  selectedParty,
  onTogglePartyMember,
  monsterEntries,
  onAddMonster,
  onRemoveMonster,
  onUpdateMonsterCount,
  selectedOppositionChars,
  onToggleOppositionChar,
}: EntitySetupProps) {
  const t = useTranslations("master");
  const locale = useLocale();
  const [monsterSearch, setMonsterSearch] = useState("");
  const [oppSource, setOppSource] = useState<"monsters" | "characters">("monsters");
  const [monsterPage, setMonsterPage] = useState(0);
  const MONSTER_PAGE_SIZE = 20;

  // Player characters (active, non-NPC) for party side
  const playerMembers = partyData.filter((p) => p.character.is_active && !p.character.is_npc);
  // All usable characters for opposition (including NPCs)
  const oppositionMembers = partyData.filter((p) => p.character.is_active || p.character.is_npc);

  const filteredMonsters = useMemo(() => {
    if (!monsterSearch) return monsters;
    const q = monsterSearch.toLowerCase();
    return monsters.filter(
      (m) => m.name.toLowerCase().includes(q) || (m.name_en?.toLowerCase().includes(q) ?? false)
    );
  }, [monsters, monsterSearch]);

  const monsterTotalPages = Math.ceil(filteredMonsters.length / MONSTER_PAGE_SIZE);
  const safeMonsterPage = Math.min(monsterPage, Math.max(0, monsterTotalPages - 1));
  const pagedMonsters = filteredMonsters.slice(
    safeMonsterPage * MONSTER_PAGE_SIZE,
    (safeMonsterPage + 1) * MONSTER_PAGE_SIZE
  );

  return (
    <div className="relative grid gap-4 lg:grid-cols-2" data-testid="gm-combat-setup">
      {/* VS Divider (desktop) */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/30 bg-background/80 shadow-lg shadow-amber-500/10 backdrop-blur-sm">
          <span className="font-heading text-sm font-bold text-amber-400">VS</span>
        </div>
      </div>
      {/* Party Side */}
      <GlassCard glow="warrior" className="p-4" data-testid="gm-combat-party-setup">
        <h3 className="mb-3 flex items-center gap-2 font-heading text-sm font-semibold text-foreground">
          <Users className="h-4 w-4 text-green-400" />
          {t("combatParty")}
        </h3>
        <div className="space-y-1">
          {playerMembers.map((p) => {
            const selected = selectedParty.has(p.character.id);
            return (
              <button
                key={p.character.id}
                onClick={() => onTogglePartyMember(p.character.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                  selected
                    ? "bg-green-900/20 text-green-400"
                    : "text-muted-foreground hover:bg-accent/30"
                }`}
                data-testid={`gm-combat-party-${p.character.id}`}
              >
                <span className="truncate font-medium">{p.character.name}</span>
                <span className="shrink-0 text-xs">
                  {t("ac")} {p.combat.ac} / HP {p.character.hp_max}
                </span>
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Opposition Side */}
      <GlassCard className="p-4" data-testid="gm-combat-opposition-setup">
        <h3 className="mb-3 flex items-center gap-2 font-heading text-sm font-semibold text-foreground">
          <Skull className="h-4 w-4 text-red-400" />
          {t("combatOpposition")}
        </h3>

        {/* Source toggle: Monsters vs Characters */}
        <div className="mb-3 flex gap-1 rounded-lg bg-background/50 p-0.5">
          <button
            onClick={() => setOppSource("monsters")}
            className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              oppSource === "monsters" ? "bg-red-900/20 text-red-400" : "text-muted-foreground"
            }`}
            data-testid="gm-combat-opp-monsters"
          >
            Monster
          </button>
          <button
            onClick={() => setOppSource("characters")}
            className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              oppSource === "characters" ? "bg-red-900/20 text-red-400" : "text-muted-foreground"
            }`}
            data-testid="gm-combat-opp-characters"
          >
            {t("combatCharacters")}
          </button>
        </div>

        {/* Selected monsters */}
        {monsterEntries.length > 0 && (
          <div className="mb-3 space-y-1">
            {monsterEntries.map((entry, i) => (
              <div
                key={`${entry.monster.id}-${i}`}
                className="flex items-center justify-between rounded-lg bg-red-900/10 px-3 py-2 text-sm"
                data-testid={`gm-combat-monster-entry-${i}`}
              >
                <span className="truncate font-medium text-red-400">
                  {localized(entry.monster.name, entry.monster.name_en, locale)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateMonsterCount(i, Math.max(1, entry.count - 1))}
                    className="rounded p-0.5 hover:bg-red-900/30"
                    data-testid={`gm-combat-monster-dec-${i}`}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-xs">{entry.count}</span>
                  <button
                    onClick={() => onUpdateMonsterCount(i, entry.count + 1)}
                    className="rounded p-0.5 hover:bg-red-900/30"
                    data-testid={`gm-combat-monster-inc-${i}`}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => onRemoveMonster(i)}
                    className="ml-1 rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    data-testid={`gm-combat-monster-remove-${i}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected opposition characters */}
        {selectedOppositionChars.size > 0 && (
          <div className="mb-3 space-y-1">
            {oppositionMembers
              .filter((p) => selectedOppositionChars.has(p.character.id))
              .map((p) => (
                <div
                  key={p.character.id}
                  className="flex items-center justify-between rounded-lg bg-red-900/10 px-3 py-2 text-sm"
                  data-testid={`gm-combat-opp-char-entry-${p.character.id}`}
                >
                  <span className="truncate font-medium text-red-400">{p.character.name}</span>
                  <button
                    onClick={() => onToggleOppositionChar(p.character.id)}
                    className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
          </div>
        )}

        {/* Monster search (when source is monsters) */}
        {oppSource === "monsters" && (
          <>
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={monsterSearch}
                onChange={(e) => {
                  setMonsterSearch(e.target.value);
                  setMonsterPage(0);
                }}
                placeholder={t("monsterSearch")}
                className="w-full rounded-md border border-border bg-background/50 py-1.5 pl-8 pr-3 text-xs"
                data-testid="gm-combat-monster-search"
              />
            </div>
            <div className="max-h-72 overflow-y-auto">
              {pagedMonsters.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onAddMonster(m)}
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent/30"
                  data-testid={`gm-combat-add-monster-${m.id}`}
                >
                  <span className="truncate">{localized(m.name, m.name_en, locale)}</span>
                  <span className="shrink-0 text-[10px]">
                    HD {m.hit_dice} / AC {m.ac}
                  </span>
                </button>
              ))}
            </div>
            {/* Pagination */}
            {monsterTotalPages > 1 && (
              <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                <button
                  onClick={() => setMonsterPage((p) => Math.max(0, p - 1))}
                  disabled={safeMonsterPage === 0}
                  className="flex items-center gap-0.5 rounded px-1.5 py-0.5 hover:bg-accent/30 disabled:opacity-30"
                >
                  <ChevronLeft className="h-3 w-3" />
                  {t("paginationPrev")}
                </button>
                <span>
                  {t("paginationPage", {
                    current: safeMonsterPage + 1,
                    total: monsterTotalPages,
                  })}
                </span>
                <button
                  onClick={() => setMonsterPage((p) => Math.min(monsterTotalPages - 1, p + 1))}
                  disabled={safeMonsterPage >= monsterTotalPages - 1}
                  className="flex items-center gap-0.5 rounded px-1.5 py-0.5 hover:bg-accent/30 disabled:opacity-30"
                >
                  {t("paginationNext")}
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Character picker (when source is characters) */}
        {oppSource === "characters" && (
          <div className="space-y-1">
            {oppositionMembers
              .filter((p) => !selectedOppositionChars.has(p.character.id))
              .map((p) => (
                <button
                  key={p.character.id}
                  onClick={() => onToggleOppositionChar(p.character.id)}
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent/30"
                  data-testid={`gm-combat-add-opp-char-${p.character.id}`}
                >
                  <span className="truncate font-medium">{p.character.name}</span>
                  <span className="shrink-0 text-[10px]">
                    {t("ac")} {p.combat.ac} / HP {p.character.hp_max}
                  </span>
                </button>
              ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
