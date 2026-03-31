"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { localized } from "@/lib/utils/localize";
import { getAllPriesthoods } from "@/lib/rules/priesthoods";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { WizardState } from "./wizard-types";

interface StepPriesthoodProps {
  state: WizardState;
  onChange: (updates: Partial<WizardState>) => void;
}

const SPHERE_LABELS: Record<string, { de: string; en: string }> = {
  all: { de: "Alle", en: "All" },
  animal: { de: "Tier", en: "Animal" },
  astral: { de: "Astral", en: "Astral" },
  charm: { de: "Bezauberung", en: "Charm" },
  chaos: { de: "Chaos", en: "Chaos" },
  combat: { de: "Kampf", en: "Combat" },
  cosmos: { de: "Kosmos", en: "Cosmos" },
  creation: { de: "Erschaffung", en: "Creation" },
  divination: { de: "Erkenntnis", en: "Divination" },
  elemental: { de: "Elementar", en: "Elemental" },
  "elemental air": { de: "Elementar Luft", en: "Elemental Air" },
  "elemental earth": { de: "Elementar Erde", en: "Elemental Earth" },
  "elemental fire": { de: "Elementar Feuer", en: "Elemental Fire" },
  "elemental water": { de: "Elementar Wasser", en: "Elemental Water" },
  "elemental magma": { de: "Elementar Magma", en: "Elemental Magma" },
  guardian: { de: "Wächter", en: "Guardian" },
  healing: { de: "Heilung", en: "Healing" },
  law: { de: "Ordnung", en: "Law" },
  learning: { de: "Wissen", en: "Learning" },
  necromantic: { de: "Nekromantie", en: "Necromantic" },
  numbers: { de: "Zahlen", en: "Numbers" },
  plant: { de: "Pflanze", en: "Plant" },
  protection: { de: "Schutz", en: "Protection" },
  special: { de: "Besonders", en: "Special" },
  summoning: { de: "Beschwörung", en: "Summoning" },
  sun: { de: "Sonne", en: "Sun" },
  thought: { de: "Gedanken", en: "Thought" },
  time: { de: "Zeit", en: "Time" },
  travelers: { de: "Reisende", en: "Travelers" },
  war: { de: "Krieg", en: "War" },
  wards: { de: "Schutzwarden", en: "Wards" },
  weather: { de: "Wetter", en: "Weather" },
};

function getSphereLabel(sphere: string, locale: string): string {
  const labels = SPHERE_LABELS[sphere];
  return labels ? (locale === "en" ? labels.en : labels.de) : sphere;
}

const COMBAT_RATING_COLORS: Record<string, string> = {
  good: "bg-red-700/50 text-red-200",
  medium: "bg-amber-700/50 text-amber-200",
  poor: "bg-blue-700/50 text-blue-200",
};

export function StepPriesthood({ state, onChange }: StepPriesthoodProps) {
  const t = useTranslations("wizard");
  const locale = useLocale();
  const [search, setSearch] = useState("");

  const isCleric = state.classIds.includes("cleric");
  const isPriest = isCleric || state.classIds.includes("druid");

  const allPriesthoods = useMemo(() => getAllPriesthoods(), []);

  const filtered = useMemo(() => {
    if (!search.trim()) return allPriesthoods;
    const q = search.toLowerCase();
    return allPriesthoods.filter(
      (p) => p.name.toLowerCase().includes(q) || p.name_en.toLowerCase().includes(q)
    );
  }, [allPriesthoods, search]);

  if (!isPriest) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6" data-testid="step-priesthood">
      {/* Deity free text — for all priest classes */}
      <div className="flex flex-col gap-2">
        <label htmlFor="deity-input" className="text-sm font-medium">
          {t("deityLabel")}
        </label>
        <Input
          id="deity-input"
          value={state.deity}
          onChange={(e) => onChange({ deity: e.target.value })}
          placeholder={t("deityPlaceholder")}
          data-testid="deity-input"
        />
        <p className="text-xs text-muted-foreground">{t("deityHint")}</p>
      </div>

      {/* Priesthood selection — only for clerics */}
      {isCleric ? (
        <>
          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">{t("priesthoodDescription")}</p>
          </div>

          {/* Search */}
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("priesthoodSearch")}
            data-testid="priesthood-search"
          />

          {/* Generic Cleric option */}
          <button
            type="button"
            className={`rounded-lg border p-4 text-left transition-all ${
              state.priesthood === null
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => onChange({ priesthood: null })}
            data-testid="priesthood-option-none"
          >
            <div className="font-heading text-lg">{t("genericCleric")}</div>
            <div className="text-sm text-muted-foreground">{t("genericClericDesc")}</div>
          </button>

          {/* Priesthood cards */}
          {filtered.map((p) => {
            const isSelected = state.priesthood === p.id;
            const majorSpheres = Object.entries(p.spheres)
              .filter(([, a]) => a === "major")
              .map(([s]) => getSphereLabel(s, locale));
            const minorSpheres = Object.entries(p.spheres)
              .filter(([, a]) => a === "minor")
              .map(([s]) => getSphereLabel(s, locale));

            const combatLabel =
              p.combatRating === "good"
                ? t("combatGood")
                : p.combatRating === "medium"
                  ? t("combatMedium")
                  : t("combatPoor");

            const abilityWarnings: string[] = [];
            for (const [ability, min] of Object.entries(p.minAbilities)) {
              const score = state[ability as keyof typeof state] as number;
              if (score !== undefined && score < min) {
                abilityWarnings.push(`${ability.toUpperCase()} ${score} < ${min}`);
              }
            }

            return (
              <button
                key={p.id}
                type="button"
                className={`rounded-lg border p-4 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => onChange({ priesthood: p.id })}
                data-testid={`priesthood-option-${p.id}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-heading text-lg">
                    {localized(p.name, p.name_en, locale)}
                  </span>
                  <Badge variant="secondary" className={COMBAT_RATING_COLORS[p.combatRating] ?? ""}>
                    {combatLabel}
                  </Badge>
                </div>

                {/* Spheres */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {majorSpheres.map((s) => (
                    <span
                      key={s}
                      className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary"
                    >
                      {s}
                    </span>
                  ))}
                  {minorSpheres.map((s) => (
                    <span
                      key={s}
                      className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                {/* Granted Powers */}
                {p.grantedPowers.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{t("grantedPowers")}:</span>{" "}
                    {p.grantedPowers
                      .map(
                        (gp) =>
                          `${localized(gp.name, gp.name_en, locale)}${gp.level > 1 ? ` (${t("fromLevel", { level: gp.level })})` : ""}`
                      )
                      .join(", ")}
                  </div>
                )}

                {/* Ability warnings */}
                {abilityWarnings.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {abilityWarnings.map((w) => (
                      <span
                        key={w}
                        className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-xs text-yellow-400"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </>
      ) : (
        <p className="text-sm text-muted-foreground" data-testid="no-priesthood-druid">
          {t("noPriesthoodForDruid")}
        </p>
      )}
    </div>
  );
}
