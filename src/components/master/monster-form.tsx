"use client";

/**
 * Unified monster create/edit form.
 *
 * Replaces the ~420-line inline form previously embedded in
 * `master-bestiary-panel.tsx`. The same component powers:
 * - **Create mode**: new-monster modal triggered from the bestiary toolbar.
 * - **Edit mode**: opened from the detail modal's pencil button.
 *
 * Core combat stats are rendered prominently. Fluff and narrative fields live
 * inside a collapsible "Erweiterte Details" section — collapsed by default in
 * create mode for fast quick-add, expanded by default in edit mode for full
 * review/correction.
 */

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseHitDiceValue } from "@/lib/utils/hit-dice";
import type { MonsterRow } from "@/lib/supabase/types";

const SIZE_OPTIONS: MonsterRow["size"][] = ["T", "S", "M", "L", "H", "G"];

type MonsterFormData = Partial<MonsterRow>;

export interface MonsterFormProps {
  mode: "create" | "edit";
  initial?: MonsterFormData;
  /** Full monster list — used to populate the variant_of_id parent dropdown. */
  allMonsters: MonsterRow[];
  onSubmit: (data: MonsterFormData) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
}

const DEFAULT_FORM: MonsterFormData = {
  // NOT NULL fields — initialised with sensible defaults so the form never
  // submits an invalid payload
  name: "",
  ac: 10,
  thac0: 20,
  hit_dice: "1",
  hit_dice_value: 1,
  xp_value: 0,
  movement: "12",
  attacks_per_round: "1",
  damage: "1d4",
  size: "M",
  morale: "",
  morale_value: 10,
  magic_resistance: 0,
  frequency: "common",
  source_book: "Custom",

  // Nullable fields
  name_en: null,
  special_attacks: null,
  special_defenses: null,
  climate_terrain: null,
  organization: null,
  activity_cycle: null,
  diet: null,
  intelligence: null,
  treasure: null,
  alignment: null,
  no_appearing: null,
  intro_text: null,
  combat_tactics: null,
  habitat_society: null,
  ecology: null,
  variant_of_id: null,
  variant_name: null,
};

export function MonsterForm({
  mode,
  initial,
  allMonsters,
  onSubmit,
  onCancel,
  submitting = false,
}: MonsterFormProps) {
  const t = useTranslations("master");
  const [form, setForm] = useState<MonsterFormData>({ ...DEFAULT_FORM, ...initial });
  const [advancedOpen, setAdvancedOpen] = useState(mode === "edit");

  /** Parents for the variant_of_id dropdown: any monster that isn't itself a
   *  variant, excluding the current monster (to prevent self-references). */
  const parentOptions = useMemo(
    () =>
      allMonsters
        .filter((m) => m.variant_of_id === null && m.id !== initial?.id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allMonsters, initial?.id]
  );

  function update<K extends keyof MonsterFormData>(key: K, value: MonsterFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    await onSubmit(form);
  }

  const fieldClass =
    "w-full rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm focus:border-primary focus:outline-none";
  const labelClass = "mb-0.5 block text-[10px] text-muted-foreground";

  return (
    <form className="space-y-4" onSubmit={handleSubmit} data-testid="monster-form" data-mode={mode}>
      {/* ── Name (DE + EN) ────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass} htmlFor="mf-name">
            {t("monsterName")}
          </label>
          <input
            id="mf-name"
            type="text"
            value={form.name ?? ""}
            onChange={(e) => update("name", e.target.value)}
            className={fieldClass}
            required
            data-testid="monster-form-name"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="mf-name-en">
            {t("monsterNameEn")}
          </label>
          <input
            id="mf-name-en"
            type="text"
            value={form.name_en ?? ""}
            onChange={(e) => update("name_en", e.target.value)}
            className={fieldClass}
            data-testid="monster-form-name-en"
          />
        </div>
      </div>

      {/* ── Core combat stats ─────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div>
          <label className={labelClass}>{t("monsterAC")}</label>
          <input
            type="number"
            value={form.ac ?? 10}
            onChange={(e) => update("ac", Number(e.target.value))}
            className={fieldClass}
            data-testid="monster-form-ac"
          />
        </div>
        <div>
          <label className={labelClass}>{t("monsterTHAC0")}</label>
          <input
            type="number"
            value={form.thac0 ?? 20}
            onChange={(e) => update("thac0", Number(e.target.value))}
            className={fieldClass}
            data-testid="monster-form-thac0"
          />
        </div>
        <div>
          <label className={labelClass}>{t("monsterHD")}</label>
          <input
            type="text"
            value={form.hit_dice ?? "1"}
            onChange={(e) => {
              const hd = e.target.value;
              setForm((prev) => ({
                ...prev,
                hit_dice: hd,
                hit_dice_value: parseHitDiceValue(hd),
              }));
            }}
            className={fieldClass}
            data-testid="monster-form-hit-dice"
          />
        </div>
        <div>
          <label className={labelClass}>{t("monsterXP")}</label>
          <input
            type="number"
            value={form.xp_value ?? 0}
            onChange={(e) => update("xp_value", Number(e.target.value))}
            className={fieldClass}
            data-testid="monster-form-xp"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div>
          <label className={labelClass}>{t("monsterMovement")}</label>
          <input
            type="text"
            value={form.movement ?? ""}
            onChange={(e) => update("movement", e.target.value)}
            className={fieldClass}
            data-testid="monster-form-movement"
          />
        </div>
        <div>
          <label className={labelClass}>{t("monsterAttacks")}</label>
          <input
            type="text"
            value={form.attacks_per_round ?? "1"}
            onChange={(e) => update("attacks_per_round", e.target.value)}
            className={fieldClass}
            data-testid="monster-form-attacks"
          />
        </div>
        <div>
          <label className={labelClass}>{t("monsterDamage")}</label>
          <input
            type="text"
            value={form.damage ?? ""}
            onChange={(e) => update("damage", e.target.value)}
            className={fieldClass}
            data-testid="monster-form-damage"
          />
        </div>
        <div>
          <label className={labelClass}>{t("monsterSize")}</label>
          <select
            value={form.size ?? "M"}
            onChange={(e) => update("size", e.target.value as MonsterRow["size"])}
            className={fieldClass}
            data-testid="monster-form-size"
          >
            {SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {t(`size${s}` as "sizeT" | "sizeS" | "sizeM" | "sizeL" | "sizeH" | "sizeG")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t("monsterSpecialAttacks")}</label>
          <input
            type="text"
            value={form.special_attacks ?? ""}
            onChange={(e) => update("special_attacks", e.target.value || null)}
            className={fieldClass}
            data-testid="monster-form-special-attacks"
          />
        </div>
        <div>
          <label className={labelClass}>{t("monsterSpecialDefenses")}</label>
          <input
            type="text"
            value={form.special_defenses ?? ""}
            onChange={(e) => update("special_defenses", e.target.value || null)}
            className={fieldClass}
            data-testid="monster-form-special-defenses"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div>
          <label className={labelClass}>MR %</label>
          <input
            type="number"
            min={0}
            max={100}
            value={form.magic_resistance ?? 0}
            onChange={(e) => update("magic_resistance", Number(e.target.value))}
            className={fieldClass}
            data-testid="monster-form-magic-resistance"
          />
        </div>
        <div>
          <label className={labelClass}>{t("monsterMoralValue")}</label>
          <input
            type="number"
            value={form.morale_value ?? 10}
            onChange={(e) => update("morale_value", Number(e.target.value))}
            className={fieldClass}
            data-testid="monster-form-morale-value"
          />
        </div>
        <div>
          <label className={labelClass}>Moral Text</label>
          <input
            type="text"
            value={form.morale ?? ""}
            onChange={(e) => update("morale", e.target.value)}
            placeholder="Elite (13)"
            className={fieldClass}
            data-testid="monster-form-morale"
          />
        </div>
      </div>

      {/* ── Collapsible: Erweiterte Details ──────────── */}
      <div>
        <button
          type="button"
          onClick={() => setAdvancedOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          data-testid="monster-form-advanced-toggle"
          aria-expanded={advancedOpen}
          aria-controls="monster-form-advanced-section"
        >
          <span>{t("monsterFormAdvancedSection")}</span>
          {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {advancedOpen && (
          <div
            id="monster-form-advanced-section"
            className="mt-2 space-y-3 rounded-lg border border-border/50 bg-background/20 p-3"
            data-testid="monster-form-advanced-section"
          >
            {/* Fluff fields */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Klima/Gelände</label>
                <input
                  type="text"
                  value={form.climate_terrain ?? ""}
                  onChange={(e) => update("climate_terrain", e.target.value || null)}
                  className={fieldClass}
                  data-testid="monster-form-climate-terrain"
                />
              </div>
              <div>
                <label className={labelClass}>Häufigkeit</label>
                <input
                  type="text"
                  value={form.frequency ?? ""}
                  onChange={(e) => update("frequency", e.target.value || "common")}
                  className={fieldClass}
                  data-testid="monster-form-frequency"
                />
              </div>
              <div>
                <label className={labelClass}>Organisation</label>
                <input
                  type="text"
                  value={form.organization ?? ""}
                  onChange={(e) => update("organization", e.target.value || null)}
                  className={fieldClass}
                  data-testid="monster-form-organization"
                />
              </div>
              <div>
                <label className={labelClass}>Aktivitätszyklus</label>
                <input
                  type="text"
                  value={form.activity_cycle ?? ""}
                  onChange={(e) => update("activity_cycle", e.target.value || null)}
                  className={fieldClass}
                  data-testid="monster-form-activity-cycle"
                />
              </div>
              <div>
                <label className={labelClass}>Ernährung</label>
                <input
                  type="text"
                  value={form.diet ?? ""}
                  onChange={(e) => update("diet", e.target.value || null)}
                  className={fieldClass}
                  data-testid="monster-form-diet"
                />
              </div>
              <div>
                <label className={labelClass}>Intelligenz</label>
                <input
                  type="text"
                  value={form.intelligence ?? ""}
                  onChange={(e) => update("intelligence", e.target.value || null)}
                  className={fieldClass}
                  data-testid="monster-form-intelligence"
                />
              </div>
              <div>
                <label className={labelClass}>Schatz</label>
                <input
                  type="text"
                  value={form.treasure ?? ""}
                  onChange={(e) => update("treasure", e.target.value || null)}
                  className={fieldClass}
                  data-testid="monster-form-treasure"
                />
              </div>
              <div>
                <label className={labelClass}>Gesinnung</label>
                <input
                  type="text"
                  value={form.alignment ?? ""}
                  onChange={(e) => update("alignment", e.target.value || null)}
                  className={fieldClass}
                  data-testid="monster-form-alignment"
                />
              </div>
              <div>
                <label className={labelClass}>No. Appearing</label>
                <input
                  type="text"
                  value={form.no_appearing ?? ""}
                  onChange={(e) => update("no_appearing", e.target.value || null)}
                  className={fieldClass}
                  placeholder="z.B. 2-8"
                  data-testid="monster-form-no-appearing"
                />
              </div>
              <div>
                <label className={labelClass}>Quellenbuch</label>
                <input
                  type="text"
                  value={form.source_book ?? "Custom"}
                  onChange={(e) => update("source_book", e.target.value || "Custom")}
                  className={fieldClass}
                  data-testid="monster-form-source-book"
                />
              </div>
            </div>

            {/* Narrative sections */}
            <div className="space-y-2">
              <div>
                <label className={labelClass}>Einleitung</label>
                <textarea
                  value={form.intro_text ?? ""}
                  onChange={(e) => update("intro_text", e.target.value || null)}
                  rows={3}
                  className={fieldClass}
                  data-testid="monster-form-intro-text"
                />
              </div>
              <div>
                <label className={labelClass}>Kampf</label>
                <textarea
                  value={form.combat_tactics ?? ""}
                  onChange={(e) => update("combat_tactics", e.target.value || null)}
                  rows={4}
                  className={fieldClass}
                  data-testid="monster-form-combat-tactics"
                />
              </div>
              <div>
                <label className={labelClass}>Lebensraum & Gesellschaft</label>
                <textarea
                  value={form.habitat_society ?? ""}
                  onChange={(e) => update("habitat_society", e.target.value || null)}
                  rows={4}
                  className={fieldClass}
                  data-testid="monster-form-habitat-society"
                />
              </div>
              <div>
                <label className={labelClass}>Ökologie</label>
                <textarea
                  value={form.ecology ?? ""}
                  onChange={(e) => update("ecology", e.target.value || null)}
                  rows={4}
                  className={fieldClass}
                  data-testid="monster-form-ecology"
                />
              </div>
            </div>

            {/* Variant linkage */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Variante von (Parent-Monster)</label>
                <select
                  value={form.variant_of_id ?? ""}
                  onChange={(e) => update("variant_of_id", e.target.value || null)}
                  className={fieldClass}
                  data-testid="monster-form-variant-of-id"
                >
                  <option value="">— keine Variante —</option>
                  {parentOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                      {m.name_en && m.name_en !== m.name ? ` (${m.name_en})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Varianten-Name</label>
                <input
                  type="text"
                  value={form.variant_name ?? ""}
                  onChange={(e) => update("variant_name", e.target.value || null)}
                  placeholder="z.B. Orog, Erwachsen, Jung"
                  className={fieldClass}
                  data-testid="monster-form-variant-name"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Actions ─────────────────────────────────── */}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
          data-testid="monster-form-cancel"
        >
          Abbrechen
        </Button>
        <Button type="submit" disabled={submitting} data-testid="monster-form-submit">
          {submitting ? "Speichert …" : mode === "create" ? "Anlegen" : "Speichern"}
        </Button>
      </div>
    </form>
  );
}
