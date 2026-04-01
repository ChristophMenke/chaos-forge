"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { localized } from "@/lib/utils/localize";
import { RACES } from "@/lib/rules/races";
import { CLASSES } from "@/lib/rules/classes";
import { getActivePowers } from "@/lib/rules/priesthoods";
import type { RaceId, ClassId } from "@/lib/rules/types";
import type { ClassAbility, GrantedPower } from "@/lib/rules/types";

interface PlayAbilitiesPanelProps {
  raceId: string;
  classIds?: string[];
  priesthoodId?: string | null;
  priestLevel?: number;
}

export function PlayAbilitiesPanel({
  raceId,
  classIds = [],
  priesthoodId,
  priestLevel = 1,
}: PlayAbilitiesPanelProps) {
  const t = useTranslations("playMode");
  const locale = useLocale();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [usedAbilities, setUsedAbilities] = useState<Record<string, number>>({});

  const race = RACES[raceId as RaceId];
  const racialAbilities: ClassAbility[] = race?.racialAbilities ?? [];
  const classAbilities: ClassAbility[] = classIds.flatMap(
    (id) => CLASSES[id as ClassId]?.classAbilities ?? []
  );
  const grantedPowers: GrantedPower[] = priesthoodId
    ? getActivePowers(priesthoodId, priestLevel)
    : [];

  const hasContent =
    racialAbilities.length > 0 || classAbilities.length > 0 || grantedPowers.length > 0;
  if (!hasContent) return null;

  function handleUse(abilityKey: string) {
    setUsedAbilities((prev) => ({
      ...prev,
      [abilityKey]: (prev[abilityKey] ?? 0) + 1,
    }));
  }

  function resetAll() {
    setUsedAbilities({});
  }

  return (
    <GlassCard hover={false} data-testid="play-abilities-panel">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("abilities")}
        </h3>
      </div>

      {/* Racial Abilities */}
      {racialAbilities.length > 0 && (
        <div className="mb-3">
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            {t("racialAbilities")}
          </div>
          <div className="space-y-1">
            {racialAbilities.map((ability, idx) => {
              const key = `racial-${idx}`;
              const isExpanded = expandedId === key;
              const used = usedAbilities[key] ?? 0;
              const hasUses = ability.usesPerDay != null && ability.usesPerDay > 0;
              const canUse = hasUses && used < ability.usesPerDay!;

              return (
                <div
                  key={key}
                  className="rounded-lg border border-border bg-card/50"
                  data-testid={`play-ability-${key}`}
                >
                  <div
                    className="flex min-h-[40px] cursor-pointer items-center gap-2 px-2 py-1.5"
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedId(isExpanded ? null : key)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setExpandedId(isExpanded ? null : key);
                      }
                    }}
                  >
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {localized(ability.name, ability.name_en, locale)}
                    </span>
                    {hasUses && (
                      <Badge
                        variant={used >= ability.usesPerDay! ? "secondary" : "outline"}
                        className="shrink-0 text-[10px]"
                        data-testid={`play-ability-uses-${key}`}
                      >
                        {t("usesRemaining", { used, total: ability.usesPerDay ?? 0 })}
                      </Badge>
                    )}
                    {hasUses && (
                      <Button
                        size="sm"
                        variant={canUse ? "default" : "ghost"}
                        className="h-6 shrink-0 px-2 text-[10px]"
                        disabled={!canUse}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUse(key);
                        }}
                        data-testid={`play-ability-use-${key}`}
                      >
                        {canUse ? t("useAbility") : t("abilityUsed")}
                      </Button>
                    )}
                  </div>
                  {isExpanded && (
                    <div className="border-t border-border px-2 pb-2 pt-1.5">
                      <p className="text-xs text-muted-foreground">
                        {localized(ability.description, ability.description_en, locale)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Class Abilities */}
      {classAbilities.length > 0 && (
        <div className="mb-3">
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            {t("classAbilities")}
          </div>
          <div className="space-y-1">
            {classAbilities.map((ability, idx) => {
              const key = `class-${idx}`;
              const isExpanded = expandedId === key;
              const used = usedAbilities[key] ?? 0;
              const hasUses = ability.usesPerDay != null && ability.usesPerDay > 0;
              const canUse = hasUses && used < ability.usesPerDay!;

              return (
                <div
                  key={key}
                  className="rounded-lg border border-border bg-card/50"
                  data-testid={`play-ability-${key}`}
                >
                  <div
                    className="flex min-h-[40px] cursor-pointer items-center gap-2 px-2 py-1.5"
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedId(isExpanded ? null : key)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setExpandedId(isExpanded ? null : key);
                      }
                    }}
                  >
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {localized(ability.name, ability.name_en, locale)}
                    </span>
                    {hasUses && (
                      <Badge
                        variant={used >= ability.usesPerDay! ? "secondary" : "outline"}
                        className="shrink-0 text-[10px]"
                        data-testid={`play-ability-uses-${key}`}
                      >
                        {t("usesRemaining", { used, total: ability.usesPerDay ?? 0 })}
                      </Badge>
                    )}
                    {hasUses && (
                      <Button
                        size="sm"
                        variant={canUse ? "default" : "ghost"}
                        className="h-6 shrink-0 px-2 text-[10px]"
                        disabled={!canUse}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUse(key);
                        }}
                        data-testid={`play-ability-use-${key}`}
                      >
                        {canUse ? t("useAbility") : t("abilityUsed")}
                      </Button>
                    )}
                  </div>
                  {isExpanded && (
                    <div className="border-t border-border px-2 pb-2 pt-1.5">
                      <p className="text-xs text-muted-foreground">
                        {localized(ability.description, ability.description_en, locale)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Granted Powers */}
      {grantedPowers.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">{t("grantedPowers")}</div>
          <div className="space-y-1">
            {grantedPowers.map((power) => {
              const key = `power-${power.id}`;
              const isExpanded = expandedId === key;
              const used = usedAbilities[key] ?? 0;
              const hasUses =
                power.mechanical?.usesPerDay != null && power.mechanical.usesPerDay > 0;
              const canUse = hasUses && used < power.mechanical!.usesPerDay!;

              return (
                <div
                  key={key}
                  className="rounded-lg border border-border bg-card/50"
                  data-testid={`play-ability-${key}`}
                >
                  <div
                    className="flex min-h-[40px] cursor-pointer items-center gap-2 px-2 py-1.5"
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedId(isExpanded ? null : key)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setExpandedId(isExpanded ? null : key);
                      }
                    }}
                  >
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {localized(power.name, power.name_en, locale)}
                    </span>
                    {power.level > 1 && (
                      <Badge variant="outline" className="shrink-0 text-[9px]">
                        Lvl {power.level}+
                      </Badge>
                    )}
                    {hasUses && (
                      <Badge
                        variant={used >= power.mechanical!.usesPerDay! ? "secondary" : "outline"}
                        className="shrink-0 text-[10px]"
                        data-testid={`play-ability-uses-${key}`}
                      >
                        {t("usesRemaining", {
                          used,
                          total: power.mechanical!.usesPerDay ?? 0,
                        })}
                      </Badge>
                    )}
                    {hasUses && (
                      <Button
                        size="sm"
                        variant={canUse ? "default" : "ghost"}
                        className="h-6 shrink-0 px-2 text-[10px]"
                        disabled={!canUse}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUse(key);
                        }}
                        data-testid={`play-ability-use-${key}`}
                      >
                        {canUse ? t("useAbility") : t("abilityUsed")}
                      </Button>
                    )}
                  </div>
                  {isExpanded && (
                    <div className="border-t border-border px-2 pb-2 pt-1.5">
                      <p className="text-xs text-muted-foreground">
                        {localized(power.description, power.description_en, locale)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </GlassCard>
  );
}

/** Expose reset function for parent components */
PlayAbilitiesPanel.resetKey = "play-abilities-reset";
