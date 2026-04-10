"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Eye, ChevronDown, Shield, Swords, Skull, Heart, Zap, Sparkles } from "lucide-react";
import { HpBar } from "@/components/hp-bar";
import { AvatarDisplay } from "@/components/avatar-display";
import { getClassGroupColors } from "@/lib/utils/class-colors";
import { localized } from "@/lib/utils/localize";
import { RACES } from "@/lib/rules/races";
import { CLASSES } from "@/lib/rules/classes";
import { getHpStatus } from "@/lib/rules/hitpoints";
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

/** Atmospheric class-based accent gradients (card interior glow) */
const CLASS_ACCENT_GRADIENTS: Record<string, string> = {
  warrior: "from-red-950/50 via-background/40 to-background/20",
  priest: "from-amber-950/50 via-background/40 to-background/20",
  rogue: "from-blue-950/50 via-background/40 to-background/20",
  wizard: "from-teal-950/50 via-background/40 to-background/20",
};

const CLASS_CORNER_GLOW: Record<string, string> = {
  warrior: "bg-red-500/20",
  priest: "bg-amber-500/20",
  rogue: "bg-blue-500/20",
  wizard: "bg-teal-500/20",
};

const CLASS_BORDER: Record<string, string> = {
  warrior: "border-red-500/30 hover:border-red-400/60",
  priest: "border-amber-500/30 hover:border-amber-400/60",
  rogue: "border-blue-500/30 hover:border-blue-400/60",
  wizard: "border-teal-500/30 hover:border-teal-400/60",
};

const CLASS_SHADOW: Record<string, string> = {
  warrior: "hover:shadow-red-500/20",
  priest: "hover:shadow-amber-500/20",
  rogue: "hover:shadow-blue-500/20",
  wizard: "hover:shadow-teal-500/20",
};

export function MasterCharacterCard({
  character,
  classes,
  combat,
  liveHp,
  onViewCharacter,
}: MasterCharacterCardProps) {
  const t = useTranslations("master");
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);

  const colors = getClassGroupColors(combat.primaryClassGroup);
  const activeClasses = classes.filter((cc) => cc.is_active);
  const hpCurrent = liveHp?.current ?? combat.hpCurrent;
  const hpMax = liveHp?.max ?? combat.hpMax;
  const hpStatus = getHpStatus(hpCurrent, hpMax);
  const hpPct = hpMax > 0 ? Math.round((hpCurrent / hpMax) * 100) : 0;

  const classLabel = activeClasses
    .map((cc) => {
      const cls = CLASSES[cc.class_id as ClassId];
      const name = cls ? localized(cls.name, cls.name_en, locale) : cc.class_id;
      return `${name} ${cc.level}`;
    })
    .join(" / ");

  const race = RACES[character.race_id as RaceId];
  const raceName = race ? localized(race.name, race.name_en, locale) : "";

  const group = combat.primaryClassGroup;
  const accentGradient = CLASS_ACCENT_GRADIENTS[group] ?? CLASS_ACCENT_GRADIENTS.warrior;
  const cornerGlow = CLASS_CORNER_GLOW[group] ?? CLASS_CORNER_GLOW.warrior;
  const borderClass = CLASS_BORDER[group] ?? CLASS_BORDER.warrior;
  const shadowClass = CLASS_SHADOW[group] ?? CLASS_SHADOW.warrior;

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br backdrop-blur-sm shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl ${accentGradient} ${borderClass} ${shadowClass}`}
      data-testid={`gm-character-card-${character.id}`}
    >
      {/* Decorative radial glows */}
      <div
        className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full ${cornerGlow} blur-3xl`}
      />
      <div
        className={`pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full ${cornerGlow} opacity-50 blur-3xl`}
      />

      {/* Top gold filigree line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

      {/* Status Badge Banner (dead/unconscious) */}
      {hpStatus !== "alive" && (
        <div
          className={`relative flex items-center justify-center gap-1.5 border-b px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
            hpStatus === "dead"
              ? "border-red-500/40 bg-red-950/60 text-red-300"
              : "border-amber-500/40 bg-amber-950/60 text-amber-300"
          }`}
        >
          {hpStatus === "dead" ? (
            <>
              <Skull className="h-3 w-3" />
              <span>{t("dead")}</span>
            </>
          ) : (
            <>
              <Heart className="h-3 w-3" />
              <span>{t("unconscious")}</span>
            </>
          )}
        </div>
      )}

      {/* Main content */}
      <button
        onClick={() => onViewCharacter?.(character.id)}
        className="relative block w-full text-left"
        data-testid={`gm-view-character-${character.id}`}
      >
        {/* Hero Header: Portrait + Name + Level */}
        <div className="flex gap-3 p-4 pb-3">
          {/* Portrait with ornate frame */}
          <div className="relative shrink-0">
            {/* Gold ring + glow */}
            <div
              className={`relative rounded-lg ring-2 ring-offset-2 ring-offset-background ${colors.text.replace("text-", "ring-")}`}
            >
              <AvatarDisplay
                name={character.name}
                avatarUrl={character.avatar_url}
                size={72}
                variant="square"
                raceId={character.race_id ?? undefined}
                classGroup={group}
              />
              {/* Inner shadow for depth */}
              <div className="pointer-events-none absolute inset-0 rounded-lg shadow-inner shadow-black/40" />
            </div>
            {/* Hexagonal Level Badge — bottom right corner */}
            <div
              className={`absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-md border-2 border-background font-heading text-xs font-bold text-white shadow-lg ${colors.badge}`}
              data-testid={`gm-char-level-${character.id}`}
            >
              {combat.maxLevel}
            </div>
          </div>

          {/* Name + Title */}
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate font-heading text-lg leading-tight text-foreground">
                {character.name}
              </h3>
              <Eye className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-amber-400/80" />
            </div>
            <p className={`mt-0.5 truncate text-xs font-medium ${colors.text}`}>{classLabel}</p>
            <p className="mt-0.5 truncate text-[10px] uppercase tracking-wider text-muted-foreground/70">
              {raceName}
            </p>
          </div>
        </div>

        {/* HP Bar with pulse on low HP */}
        <div className="px-4 pb-3">
          <HpBar
            current={hpCurrent}
            max={hpMax}
            barClass={colors.hpBar}
            unconsciousLabel={t("unconscious")}
            deadLabel={t("dead")}
          />
          {/* HP percentage indicator */}
          {hpStatus === "alive" && (
            <div className="mt-1 text-right text-[9px] uppercase tracking-wider text-muted-foreground/60">
              {hpPct}%{" "}
              {hpPct >= 75
                ? t("hpHealthy")
                : hpPct >= 50
                  ? t("hpWounded")
                  : hpPct >= 25
                    ? t("hpBloodied")
                    : t("hpCritical")}
            </div>
          )}
        </div>

        {/* Core Combat Stats — AC + THAC0 as dramatic rune tiles */}
        <div className="grid grid-cols-2 gap-2 px-4 pb-3">
          <StatTile
            icon={<Shield className="h-3.5 w-3.5" />}
            label={t("ac")}
            value={combat.ac}
            accent={group}
          />
          <StatTile
            icon={<Swords className="h-3.5 w-3.5" />}
            label={t("thac0")}
            value={combat.thac0}
            accent={group}
          />
        </div>

        {/* Saving Throws — compact rune strip */}
        <div className="px-4 pb-3">
          <div className="mb-1 flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-amber-400/60" />
            <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-400/60">
              {t("saves")}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            <SaveTile label={t("savePara")} value={combat.saves.paralyzation} />
            <SaveTile label={t("saveRod")} value={combat.saves.rod} />
            <SaveTile label={t("savePetri")} value={combat.saves.petrification} />
            <SaveTile label={t("saveBreath")} value={combat.saves.breath} />
            <SaveTile label={t("saveSpell")} value={combat.saves.spell} />
          </div>
        </div>
      </button>

      {/* Expandable: Perception + Thief Skills */}
      <div className="border-t border-border/30 px-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 transition-colors hover:text-foreground"
          data-testid={`gm-char-expand-${character.id}`}
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            {t("moreStats")}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
          />
        </button>

        {expanded && (
          <div className="space-y-3 pb-4 pt-1">
            {/* Perception */}
            <div className="flex items-center justify-between rounded-md bg-background/30 px-3 py-1.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t("perception")}
              </span>
              <span className="font-mono text-sm font-bold text-foreground">
                {combat.perception}
              </span>
            </div>

            {/* Thief Skills (if any) */}
            {combat.thiefSkills && (
              <div>
                <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-blue-400/70">
                  {t("thiefSkills")}
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <ThiefTile label={t("openLocks")} value={combat.thiefSkills.openLocks} />
                  <ThiefTile label={t("findTraps")} value={combat.thiefSkills.findTraps} />
                  <ThiefTile label={t("moveSilently")} value={combat.thiefSkills.moveSilently} />
                  <ThiefTile label={t("hideShadows")} value={combat.thiefSkills.hideInShadows} />
                  <ThiefTile label={t("detectNoise")} value={combat.thiefSkills.detectNoise} />
                  <ThiefTile label={t("climbWalls")} value={combat.thiefSkills.climbWalls} />
                  <ThiefTile label={t("readLanguages")} value={combat.thiefSkills.readLanguages} />
                  {combat.backstabMultiplier && (
                    <div className="rounded bg-blue-950/30 px-1 py-0.5 text-center ring-1 ring-blue-500/30">
                      <div className="text-[8px] text-blue-400/70">BS</div>
                      <div className="font-mono text-xs font-bold text-blue-300">
                        ×{combat.backstabMultiplier}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Core stat tile — dramatic display for AC / THAC0 */
function StatTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
}) {
  const tileGradient: Record<string, string> = {
    warrior: "from-red-950/50 to-red-900/20 ring-red-500/30",
    priest: "from-amber-950/50 to-amber-900/20 ring-amber-500/30",
    rogue: "from-blue-950/50 to-blue-900/20 ring-blue-500/30",
    wizard: "from-teal-950/50 to-teal-900/20 ring-teal-500/30",
  };
  const grad = tileGradient[accent] ?? tileGradient.warrior;
  return (
    <div className={`relative overflow-hidden rounded-lg bg-gradient-to-br p-2 ring-1 ${grad}`}>
      <div className="mb-0.5 flex items-center justify-center gap-1 text-amber-400/70">
        {icon}
        <span className="text-[9px] font-semibold uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-center font-heading text-2xl font-bold text-foreground">{value}</div>
    </div>
  );
}

/** Small save tile */
function SaveTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-border/30 bg-background/30 px-1 py-1 text-center">
      <div className="text-[8px] text-muted-foreground/70">{label}</div>
      <div className="font-mono text-[11px] font-bold text-foreground">{value}</div>
    </div>
  );
}

/** Thief skill tile */
function ThiefTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded bg-blue-950/20 px-1 py-0.5 text-center ring-1 ring-blue-500/20">
      <div className="text-[8px] text-blue-400/70">{label}</div>
      <div className="font-mono text-[11px] text-blue-200">{value}</div>
    </div>
  );
}
