"use client";

import { useLocale, useTranslations } from "next-intl";
import { localized } from "@/lib/utils/localize";
import { UNDEAD_LABELS, type TurnTableResult } from "@/lib/rules/turn-undead";
import type { LevelUpChange, SkillAllocation, ThiefSkillKey } from "@/lib/rules/level-up";

interface LevelUpSummaryStepProps {
  changes: LevelUpChange[];
  hpMax: number;
  hpGain: number;
  skillAllocation: SkillAllocation;
  currentSkills: Record<ThiefSkillKey, number>;
  leftoverPoints: number;
}

const SAVE_LABEL_KEYS = {
  paralyzation: "saveParalyzation",
  rod: "saveRod",
  petrification: "savePetrification",
  breath: "saveBreath",
  spell: "saveSpell",
} as const;

function turnValue(value: TurnTableResult, cannot: string): string {
  return value === null ? cannot : String(value);
}

/** Step 3: everything the level changes, before → after. */
export function LevelUpSummaryStep({
  changes,
  hpMax,
  hpGain,
  skillAllocation,
  currentSkills,
  leftoverPoints,
}: LevelUpSummaryStepProps) {
  const t = useTranslations("levelUpWizard");
  const ts = useTranslations("sheet");
  const locale = useLocale();
  const of = <K extends LevelUpChange["kind"]>(kind: K) =>
    changes.filter((c): c is Extract<LevelUpChange, { kind: K }> => c.kind === kind);

  const rows: { label: string; value: string; hint?: string }[] = [
    { label: t("hitPoints"), value: `${hpMax} → ${hpMax + hpGain} (+${hpGain})` },
  ];

  for (const c of of("thac0")) rows.push({ label: t("thac0"), value: `${c.before} → ${c.after}` });
  const saves = of("save");
  if (saves.length > 0) {
    rows.push({
      label: t("saves"),
      value: saves
        .map((c) => `${ts(SAVE_LABEL_KEYS[c.save])} ${c.before} → ${c.after}`)
        .join(" · "),
    });
  }
  for (const c of of("attacks"))
    rows.push({ label: t("attacks"), value: `${c.before} → ${c.after}` });
  for (const c of of("backstab"))
    rows.push({ label: t("backstab"), value: `×${c.before} → ×${c.after}` });

  const skills = (Object.entries(skillAllocation) as [ThiefSkillKey, number][]).filter(
    ([, p]) => p > 0
  );
  if (skills.length > 0) {
    rows.push({
      label: t("skills"),
      value: skills
        .map(([skill, p]) => `${ts(skill)} ${currentSkills[skill]} → ${currentSkills[skill] + p}`)
        .join(" · "),
    });
  }

  for (const c of of("weaponSlots")) {
    rows.push({ label: t("weaponSlots"), value: `${c.before} → ${c.after}`, hint: t("slotsHint") });
  }
  for (const c of of("nwpSlots")) {
    rows.push({ label: t("nwpSlots"), value: `${c.before} → ${c.after}`, hint: t("slotsHint") });
  }
  for (const c of of("spellSlots")) {
    const label =
      c.list === "druid"
        ? t("spellSlotsDruid")
        : c.list === "wizard"
          ? t("spellSlotsWizard")
          : t("spellSlots");
    rows.push({ label, value: `${c.before} → ${c.after}` });
  }
  for (const c of of("spellPoints"))
    rows.push({ label: t("spellPoints"), value: `${c.before} → ${c.after}` });

  const turn = of("turnUndead");
  if (turn.length > 0) {
    const cannot = t("cannotTurn");
    rows.push({
      label: t("turnUndead"),
      value: turn
        .map((c) => {
          const name = localized(
            UNDEAD_LABELS[c.undead].name,
            UNDEAD_LABELS[c.undead].name_en,
            locale
          );
          return `${name} ${turnValue(c.before, cannot)} → ${turnValue(c.after, cannot)}`;
        })
        .join(" · "),
    });
  }

  for (const c of of("grantedPower")) {
    rows.push({
      label: t("grantedPower"),
      value: localized(c.power.name, c.power.name_en, locale),
    });
  }
  for (const c of of("epicUnlock")) {
    rows.push({
      label: t("epic"),
      value: t("epicUnlock", { item: localized(c.itemName, c.itemNameEn, locale), level: c.after }),
    });
  }

  const notes = of("note");
  const onlyHitPoints = rows.length === 1;

  return (
    <section className="flex flex-col gap-3" aria-labelledby="level-up-summary-title">
      <h3 id="level-up-summary-title" className="font-heading text-base text-primary">
        {t("summaryTitle")}
      </h3>
      <dl className="flex flex-col gap-2 text-sm" data-testid="level-up-summary">
        {rows.map((row, i) => (
          <div key={i} className="grid gap-x-4 sm:grid-cols-[10rem_1fr]">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="font-mono">
              {row.value}
              {row.hint && (
                <span className="ml-2 font-sans text-xs text-muted-foreground">{row.hint}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      {onlyHitPoints && <p className="text-xs text-muted-foreground">{t("noChanges")}</p>}
      {notes.length > 0 && (
        <ul className="flex flex-col gap-1 text-xs text-amber-300">
          {notes.map((c) => (
            <li key={c.note}>
              ⚠{" "}
              {c.note === "followers"
                ? t("noteFollowers")
                : c.note === "stronghold"
                  ? t("noteStronghold")
                  : t("noteFixedHpNext")}
            </li>
          ))}
        </ul>
      )}
      {leftoverPoints > 0 && (
        <p className="text-xs text-muted-foreground">{t("leftover", { count: leftoverPoints })}</p>
      )}
    </section>
  );
}
