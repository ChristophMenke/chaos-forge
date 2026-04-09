"use client";

import { useTranslations, useLocale } from "next-intl";
import { Eye } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { HpBar } from "@/components/hp-bar";
import { LevelBadge } from "@/components/level-badge";
import { AvatarDisplay } from "@/components/avatar-display";
import { getClassGroupColors } from "@/lib/utils/class-colors";
import { localized } from "@/lib/utils/localize";
import { RACES } from "@/lib/rules/races";
import { CLASSES } from "@/lib/rules/classes";
import type { CharacterRow, CharacterClassRow } from "@/lib/supabase/types";
import type { CharacterCombatData } from "@/lib/rules/character-computed";
import type { ClassId, RaceId } from "@/lib/rules/types";

interface MasterCharacterCardProps {
  character: CharacterRow;
  classes: CharacterClassRow[];
  combat: CharacterCombatData;
  /** Live HP override from Realtime subscription */
  liveHp?: { current: number; max: number } | null;
  /** Called when GM clicks to view character details */
  onViewCharacter?: (characterId: string) => void;
}

export function MasterCharacterCard({
  character,
  classes,
  combat,
  liveHp,
  onViewCharacter,
}: MasterCharacterCardProps) {
  const t = useTranslations("master");
  const locale = useLocale();

  const colors = getClassGroupColors(combat.primaryClassGroup);
  const activeClasses = classes.filter((cc) => cc.is_active);
  const hpCurrent = liveHp?.current ?? combat.hpCurrent;
  const hpMax = liveHp?.max ?? combat.hpMax;

  // Build class label (e.g. "Fighter 5 / Thief 6")
  const classLabel = activeClasses
    .map((cc) => {
      const cls = CLASSES[cc.class_id as ClassId];
      const name = cls ? localized(cls.name, cls.name_en, locale) : cc.class_id;
      return `${name} ${cc.level}`;
    })
    .join(" / ");

  const race = RACES[character.race_id as RaceId];
  const raceName = race ? localized(race.name, race.name_en, locale) : "";

  return (
    <GlassCard
      glow={combat.primaryClassGroup}
      hover={false}
      className="p-3"
      data-testid={`gm-character-card-${character.id}`}
    >
      {/* Header: Avatar + Name + Race/Class + Level + View Button */}
      <button
        onClick={() => onViewCharacter?.(character.id)}
        className="mb-2 flex w-full items-center gap-3 rounded-lg text-left transition-colors hover:bg-background/20"
        data-testid={`gm-view-character-${character.id}`}
      >
        <AvatarDisplay
          name={character.name}
          avatarUrl={character.avatar_url}
          size={40}
          raceId={character.race_id ?? undefined}
          classGroup={combat.primaryClassGroup}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-heading text-base text-foreground">
              {character.name}
            </span>
            <LevelBadge level={String(combat.maxLevel)} badgeClass={colors.badge} />
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {raceName} {classLabel}
          </p>
        </div>
        <Eye className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {/* HP Bar */}
      <div className="mb-3">
        <HpBar
          current={hpCurrent}
          max={hpMax}
          barClass={colors.hpBar}
          unconsciousLabel={t("unconscious")}
          deadLabel={t("dead")}
        />
      </div>

      {/* AC + THAC0 */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-background/30 p-2 text-center">
          <div className="text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground">
            {t("ac")}
          </div>
          <div className="font-mono text-xl font-bold text-foreground">{combat.ac}</div>
        </div>
        <div className="rounded-lg bg-background/30 p-2 text-center">
          <div className="text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground">
            {t("thac0")}
          </div>
          <div className="font-mono text-xl font-bold text-foreground">{combat.thac0}</div>
        </div>
      </div>

      {/* Saving Throws */}
      <div className="mb-3">
        <div className="mb-1 text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground">
          {t("saves")}
        </div>
        <div className="grid grid-cols-5 gap-1">
          {[
            { label: t("savePara"), value: combat.saves.paralyzation },
            { label: t("saveRod"), value: combat.saves.rod },
            { label: t("savePetri"), value: combat.saves.petrification },
            { label: t("saveBreath"), value: combat.saves.breath },
            { label: t("saveSpell"), value: combat.saves.spell },
          ].map((save) => (
            <div key={save.label} className="rounded bg-background/20 px-1 py-0.5 text-center">
              <div className="text-[8px] md:text-[10px] text-muted-foreground">{save.label}</div>
              <div className="font-mono text-sm font-semibold text-foreground">{save.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Perception */}
      <div className="mb-3 flex items-center justify-between rounded-lg bg-background/20 px-3 py-1.5">
        <span className="text-xs text-muted-foreground">{t("perception")}</span>
        <span className="font-mono text-sm font-semibold text-foreground">{combat.perception}</span>
      </div>

      {/* Thief Skills (only if character has them) */}
      {combat.thiefSkills && (
        <div>
          <div className="mb-1 text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground">
            {t("thiefSkills")}
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[
              { label: t("openLocks"), value: combat.thiefSkills.openLocks },
              { label: t("findTraps"), value: combat.thiefSkills.findTraps },
              { label: t("moveSilently"), value: combat.thiefSkills.moveSilently },
              { label: t("hideShadows"), value: combat.thiefSkills.hideInShadows },
              { label: t("detectNoise"), value: combat.thiefSkills.detectNoise },
              { label: t("climbWalls"), value: combat.thiefSkills.climbWalls },
              { label: t("readLanguages"), value: combat.thiefSkills.readLanguages },
            ].map((skill) => (
              <div key={skill.label} className="rounded bg-background/20 px-1 py-0.5 text-center">
                <div className="text-[8px] md:text-[10px] text-muted-foreground">{skill.label}</div>
                <div className="font-mono text-sm text-foreground">{skill.value}</div>
              </div>
            ))}
            {combat.backstabMultiplier && (
              <div className="rounded bg-background/20 px-1 py-0.5 text-center">
                <div className="text-[8px] md:text-[10px] text-muted-foreground">BS</div>
                <div className="font-mono text-sm text-foreground">
                  &times;{combat.backstabMultiplier}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
