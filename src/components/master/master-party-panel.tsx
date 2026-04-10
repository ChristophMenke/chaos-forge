"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Users, Heart, Shield, Swords, Skull } from "lucide-react";
import { MasterCharacterCard } from "./master-character-card";
import { getHpStatus } from "@/lib/rules/hitpoints";
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

interface PartyAggregateStats {
  totalLevel: number;
  avgHpPct: number;
  downCount: number;
  lowestAc: number;
  bestThac0: number;
  partyHp: number;
  partyMaxHp: number;
}

/** Compute aggregate combat stats for the party overview banner. Pure function — React Compiler will memoize the call site. */
function computePartyStats(
  active: PartyMember[],
  liveHpMap: Map<string, { current: number; max: number }>
): PartyAggregateStats {
  if (active.length === 0) {
    return {
      totalLevel: 0,
      avgHpPct: 0,
      downCount: 0,
      lowestAc: 0,
      bestThac0: 0,
      partyHp: 0,
      partyMaxHp: 0,
    };
  }
  let totalLevel = 0;
  let partyHp = 0;
  let partyMaxHp = 0;
  let downCount = 0;
  let lowestAc = Infinity;
  let bestThac0 = Infinity;
  for (const member of active) {
    const live = liveHpMap.get(member.character.id);
    const hpCurrent = live?.current ?? member.combat.hpCurrent;
    const hpMax = live?.max ?? member.combat.hpMax;
    totalLevel += member.combat.maxLevel;
    partyHp += Math.max(0, hpCurrent);
    partyMaxHp += hpMax;
    const status = getHpStatus(hpCurrent, hpMax);
    if (status !== "alive") downCount++;
    if (member.combat.ac < lowestAc) lowestAc = member.combat.ac;
    if (member.combat.thac0 < bestThac0) bestThac0 = member.combat.thac0;
  }
  return {
    totalLevel,
    avgHpPct: partyMaxHp > 0 ? Math.round((partyHp / partyMaxHp) * 100) : 0,
    downCount,
    lowestAc: lowestAc === Infinity ? 0 : lowestAc,
    bestThac0: bestThac0 === Infinity ? 0 : bestThac0,
    partyHp,
    partyMaxHp,
  };
}

export function MasterPartyPanel({ partyData, liveHpMap, onViewCharacter }: MasterPartyPanelProps) {
  const t = useTranslations("characters");
  const tm = useTranslations("master");
  const [showInactive, setShowInactive] = useState(false);

  const nonNpcData = partyData.filter((p) => !p.character.is_npc);
  const active = nonNpcData.filter((p) => p.character.is_active);
  const inactive = nonNpcData.filter((p) => !p.character.is_active);

  const partyStats = computePartyStats(active, liveHpMap);

  if (nonNpcData.length === 0) {
    return (
      <div
        className="rounded-xl border border-border/30 bg-background/20 py-16 text-center"
        data-testid="gm-party-empty"
      >
        <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">{tm("noCharactersFound")}</p>
      </div>
    );
  }

  // Health status color
  const healthColor =
    partyStats.avgHpPct >= 75
      ? "text-green-400"
      : partyStats.avgHpPct >= 50
        ? "text-amber-400"
        : partyStats.avgHpPct >= 25
          ? "text-orange-400"
          : "text-red-400";

  const healthGradient =
    partyStats.avgHpPct >= 75
      ? "from-green-500/20"
      : partyStats.avgHpPct >= 50
        ? "from-amber-500/20"
        : partyStats.avgHpPct >= 25
          ? "from-orange-500/20"
          : "from-red-500/20";

  return (
    <div data-testid="gm-party-panel">
      {/* ═══ Party Overview Banner ═══ */}
      {active.length > 0 && (
        <div
          className={`relative mb-5 overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br ${healthGradient} via-background/40 to-background/20 p-4 backdrop-blur-sm`}
          data-testid="gm-party-overview-banner"
        >
          {/* Decorative elements */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-red-500/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

          <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Heroes Count */}
            <OverviewStat
              icon={<Users className="h-4 w-4" />}
              label={tm("partyHeroes")}
              value={active.length.toString()}
              accent="text-amber-300"
              subtitle={tm("partyTotalLevel", { level: partyStats.totalLevel })}
            />

            {/* Avg HP */}
            <OverviewStat
              icon={<Heart className="h-4 w-4" />}
              label={tm("partyHealth")}
              value={`${partyStats.avgHpPct}%`}
              accent={healthColor}
              subtitle={`${partyStats.partyHp} / ${partyStats.partyMaxHp} HP`}
            />

            {/* Lowest AC (= best defender) */}
            <OverviewStat
              icon={<Shield className="h-4 w-4" />}
              label={tm("partyBestAC")}
              value={partyStats.lowestAc.toString()}
              accent="text-blue-300"
              subtitle={tm("partyLowestAC")}
            />

            {/* Best THAC0 */}
            <OverviewStat
              icon={<Swords className="h-4 w-4" />}
              label={tm("partyBestThac0")}
              value={partyStats.bestThac0.toString()}
              accent="text-red-300"
              subtitle={tm("partyStrongestFighter")}
            />
          </div>

          {/* Down-Warning */}
          {partyStats.downCount > 0 && (
            <div className="relative mt-3 flex items-center gap-2 rounded-md border border-red-500/40 bg-red-950/30 px-3 py-2">
              <Skull className="h-4 w-4 shrink-0 text-red-400" />
              <span className="text-xs font-medium text-red-300">
                {tm("partyDownWarning", { count: partyStats.downCount })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ═══ Active Heroes Grid ═══ */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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

      {/* ═══ Inactive Heroes (collapsible) ═══ */}
      {inactive.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="group mb-3 flex items-center gap-2 rounded-lg border border-border/30 bg-background/20 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-background/40 hover:text-foreground"
            data-testid="gm-inactive-toggle"
          >
            {showInactive ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="font-heading text-xs uppercase tracking-widest">
              {t("inactiveCharacters")}
            </span>
            <span className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-semibold">
              {inactive.length}
            </span>
          </button>

          {showInactive && (
            <div className="grid grid-cols-1 gap-4 opacity-50 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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

/** Single stat tile in the party overview banner */
function OverviewStat({
  icon,
  label,
  value,
  accent,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
  subtitle?: string;
}) {
  return (
    <div className="relative rounded-lg border border-border/30 bg-background/30 p-3 backdrop-blur-sm">
      <div className={`mb-1 flex items-center gap-1.5 ${accent}`}>
        {icon}
        <span className="text-[9px] font-semibold uppercase tracking-widest opacity-80">
          {label}
        </span>
      </div>
      <div className={`font-heading text-2xl font-bold leading-none ${accent}`}>{value}</div>
      {subtitle && (
        <div className="mt-1 truncate text-[9px] uppercase tracking-wider text-muted-foreground/70">
          {subtitle}
        </div>
      )}
    </div>
  );
}
