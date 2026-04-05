"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Plus, X, Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { MagicEffects, MagicSpellAbility } from "@/lib/supabase/types";

export interface MagicItemFormData {
  name: string;
  nameEn: string;
  category: string;
  effects: MagicEffects;
}

interface MagicItemFormProps {
  onSubmit: (data: MagicItemFormData) => void;
  submitLabel?: string;
  loading?: boolean;
  initialData?: MagicItemFormData;
}

const CATEGORIES = [
  { value: "Ring", i18nKey: "magicItemRing" },
  { value: "Amulet", i18nKey: "magicItemAmulet" },
  { value: "Cloak", i18nKey: "magicItemCloak" },
  { value: "Belt", i18nKey: "magicItemBelt" },
  { value: "Boots", i18nKey: "magicItemBoots" },
  { value: "Bracers", i18nKey: "magicItemBracers" },
  { value: "Gauntlets", i18nKey: "magicItemGauntlets" },
  { value: "Helm", i18nKey: "magicItemHelm" },
  { value: "Robe", i18nKey: "magicItemRobe" },
  { value: "Girdle", i18nKey: "magicItemGirdle" },
  { value: "Wand/Staff/Rod", i18nKey: "magicItemWandStaffRod" },
  { value: "Potion", i18nKey: "magicItemPotion" },
  { value: "Scroll", i18nKey: "magicItemScroll" },
  { value: "Miscellaneous", i18nKey: "magicItemMisc" },
] as const;

const STAT_KEYS = ["str", "dex", "con", "int", "wis", "cha"] as const;

const SAVE_KEYS = [
  { key: "save_all", label: "magicSaveAll" },
  { key: "save_vs_spell", label: "magicSaveSpell" },
  { key: "save_vs_poison", label: "magicSavePoison" },
  { key: "save_vs_breath", label: "magicSaveBreath" },
  { key: "save_vs_petrification", label: "magicSavePetrification" },
  { key: "save_vs_rod", label: "magicSaveRod" },
] as const;

const THIEF_KEYS = [
  { key: "hide_in_shadows", label: "magicHideInShadows" },
  { key: "move_silently", label: "magicMoveSilently" },
  { key: "pick_pockets", label: "magicPickPockets" },
  { key: "open_locks", label: "magicOpenLocks" },
  { key: "find_traps", label: "magicFindTraps" },
  { key: "climb_walls", label: "magicClimbWalls" },
  { key: "detect_noise", label: "magicDetectNoise" },
  { key: "read_languages", label: "magicReadLanguages" },
] as const;

function emptyFormData(): MagicItemFormData {
  return { name: "", nameEn: "", category: "", effects: {} };
}

/** Collapsible section with summary when collapsed */
function Section({
  title,
  summary,
  testId,
  children,
  defaultOpen = false,
}: {
  title: string;
  summary?: string;
  testId: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-border/50 bg-background/30">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium hover:bg-accent/10"
        data-testid={`magic-section-${testId}`}
      >
        <span className="flex items-center gap-2">
          {title}
          {summary && !open && (
            <span className="text-xs font-normal text-muted-foreground">{summary}</span>
          )}
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="flex flex-col gap-2 px-3 pb-3">{children}</div>}
    </div>
  );
}

/** Numeric input row for effects */
function EffectRow({
  label,
  value,
  onChange,
  testId,
  placeholder = "0",
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  testId: string;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-40 text-xs">{label}</span>
      <Input
        type="number"
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" || v === "0" ? undefined : Number(v));
        }}
        placeholder={placeholder}
        className="w-20 text-center text-sm"
        data-testid={testId}
      />
    </div>
  );
}

/** Tag input for string arrays (resistances, passive abilities) */
function TagInput({
  tags,
  onChange,
  placeholder,
  testId,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  testId: string;
}) {
  const [input, setInput] = useState("");

  function addTag() {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInput("");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1 text-xs">
              {tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter((t) => t !== tag))}
                className="rounded-full p-0.5 hover:bg-destructive/20"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex gap-1">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
          className="text-sm"
          data-testid={testId}
        />
        <Button type="button" variant="ghost" size="sm" onClick={addTag} disabled={!input.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function MagicItemForm({ onSubmit, submitLabel, loading, initialData }: MagicItemFormProps) {
  const t = useTranslations("equipment");
  const [form, setForm] = useState<MagicItemFormData>(initialData ?? emptyFormData());

  const fx = form.effects;

  function updateEffect<K extends keyof MagicEffects>(key: K, value: MagicEffects[K]) {
    const effects = { ...fx };
    if (value === undefined || value === null) {
      delete effects[key];
    } else {
      effects[key] = value;
    }
    setForm({ ...form, effects });
  }

  function handleSubmit() {
    if (!form.name.trim()) return;
    onSubmit(form);
    setForm(emptyFormData());
  }

  // Summaries for collapsed sections
  const attrSummary = STAT_KEYS.filter((k) => fx[k] != null)
    .map((k) => `${k.toUpperCase()} ${(fx[k] ?? 0) > 0 ? "+" : ""}${fx[k]}`)
    .join(", ");

  const combatSummary = [
    fx.ac_bonus != null && `AC ${fx.ac_bonus}`,
    fx.attack_bonus != null && `Atk +${fx.attack_bonus}`,
    fx.damage_bonus != null && `Dmg +${fx.damage_bonus}`,
  ]
    .filter(Boolean)
    .join(", ");

  const saveSummary = SAVE_KEYS.filter((s) => fx[s.key as keyof MagicEffects] != null)
    .map((s) => {
      const v = fx[s.key as keyof MagicEffects] as number;
      return `${s.key === "save_all" ? "All" : s.key.replace("save_vs_", "")} ${v > 0 ? "+" : ""}${v}`;
    })
    .join(", ");

  const thiefSummary = THIEF_KEYS.filter((s) => fx[s.key as keyof MagicEffects] != null)
    .map((s) => {
      const v = fx[s.key as keyof MagicEffects] as number;
      return `${v > 0 ? "+" : ""}${v}%`;
    })
    .join(", ");

  const spellAbilities = fx.spell_abilities ?? [];

  return (
    <div className="flex flex-col gap-3" data-testid="magic-item-form">
      {/* ── Basis Section (always open) ── */}
      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium">{t("createMagicItem")}</div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="text"
            placeholder={t("magicItemName")}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            data-testid="magic-item-name"
          />
          <Input
            type="text"
            placeholder={t("magicItemNameEn")}
            value={form.nameEn}
            onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
            data-testid="magic-item-name-en"
          />
        </div>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          data-testid="magic-item-category"
        >
          <option value="">{t("magicItemCategoryNone")}</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {t(cat.i18nKey as Parameters<typeof t>[0])}
            </option>
          ))}
        </select>
        <textarea
          placeholder={t("magicItemDescription")}
          value={fx.description ?? ""}
          onChange={(e) => updateEffect("description", e.target.value || undefined)}
          rows={2}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          data-testid="magic-item-description"
        />
        <textarea
          placeholder={t("magicItemDescriptionEn")}
          value={fx.description_en ?? ""}
          onChange={(e) => updateEffect("description_en", e.target.value || undefined)}
          rows={2}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          data-testid="magic-item-description-en"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={fx.is_cursed ?? false}
            onChange={(e) => updateEffect("is_cursed", e.target.checked || undefined)}
            data-testid="magic-item-cursed"
          />
          <Skull className="h-4 w-4 text-destructive" />
          {t("magicItemCursed")}
        </label>
      </div>

      {/* ── Collapsible Sections ── */}

      <Section title={t("magicSectionAttributes")} summary={attrSummary} testId="attributes">
        {STAT_KEYS.map((stat) => (
          <EffectRow
            key={stat}
            label={stat.toUpperCase()}
            value={fx[stat]}
            onChange={(v) => updateEffect(stat, v)}
            testId={`magic-effect-${stat}`}
          />
        ))}
      </Section>

      <Section title={t("magicSectionCombat")} summary={combatSummary} testId="combat">
        <EffectRow
          label={t("magicAcBonus")}
          value={fx.ac_bonus}
          onChange={(v) => updateEffect("ac_bonus", v)}
          testId="magic-effect-ac-bonus"
        />
        <EffectRow
          label={t("magicAttackBonus")}
          value={fx.attack_bonus}
          onChange={(v) => updateEffect("attack_bonus", v)}
          testId="magic-effect-attack-bonus"
        />
        <EffectRow
          label={t("magicDamageBonus")}
          value={fx.damage_bonus}
          onChange={(v) => updateEffect("damage_bonus", v)}
          testId="magic-effect-damage-bonus"
        />
      </Section>

      <Section title={t("magicSectionSaves")} summary={saveSummary} testId="saves">
        {SAVE_KEYS.map((s) => (
          <EffectRow
            key={s.key}
            label={t(s.label)}
            value={fx[s.key as keyof MagicEffects] as number | undefined}
            onChange={(v) => updateEffect(s.key as keyof MagicEffects, v)}
            testId={`magic-effect-${s.key}`}
          />
        ))}
      </Section>

      <Section title={t("magicSectionThiefSkills")} summary={thiefSummary} testId="thief-skills">
        {THIEF_KEYS.map((s) => (
          <EffectRow
            key={s.key}
            label={t(s.label)}
            value={fx[s.key as keyof MagicEffects] as number | undefined}
            onChange={(v) => updateEffect(s.key as keyof MagicEffects, v)}
            testId={`magic-effect-${s.key}`}
          />
        ))}
      </Section>

      <Section
        title={t("magicSectionMovementPerception")}
        summary={
          [
            fx.perception_bonus != null && `Perception +${fx.perception_bonus}`,
            fx.movement_bonus != null && `Movement +${fx.movement_bonus}`,
          ]
            .filter(Boolean)
            .join(", ") || undefined
        }
        testId="movement-perception"
      >
        <EffectRow
          label={t("magicPerceptionBonus")}
          value={fx.perception_bonus}
          onChange={(v) => updateEffect("perception_bonus", v)}
          testId="magic-effect-perception-bonus"
        />
        <EffectRow
          label={t("magicMovementBonus")}
          value={fx.movement_bonus}
          onChange={(v) => updateEffect("movement_bonus", v)}
          testId="magic-effect-movement-bonus"
        />
      </Section>

      <Section
        title={t("magicSectionMagic")}
        summary={
          [
            fx.magic_resistance != null && `MR ${fx.magic_resistance}%`,
            fx.spell_failure != null && `SF ${fx.spell_failure}%`,
          ]
            .filter(Boolean)
            .join(", ") || undefined
        }
        testId="magic"
      >
        <EffectRow
          label={t("magicResistance")}
          value={fx.magic_resistance}
          onChange={(v) => updateEffect("magic_resistance", v)}
          testId="magic-effect-magic-resistance"
        />
        <EffectRow
          label={t("magicSpellFailure")}
          value={fx.spell_failure}
          onChange={(v) => updateEffect("spell_failure", v)}
          testId="magic-effect-spell-failure"
        />
      </Section>

      <Section
        title={t("magicSectionCharges")}
        summary={
          fx.max_charges != null ? `${fx.current_charges ?? 0}/${fx.max_charges}` : undefined
        }
        testId="charges"
      >
        <EffectRow
          label={t("magicMaxCharges")}
          value={fx.max_charges}
          onChange={(v) => updateEffect("max_charges", v)}
          testId="magic-effect-max-charges"
        />
        <EffectRow
          label={t("magicCurrentCharges")}
          value={fx.current_charges}
          onChange={(v) => updateEffect("current_charges", v)}
          testId="magic-effect-current-charges"
        />
      </Section>

      <Section
        title={t("magicSectionSpellAbilities")}
        summary={spellAbilities.length > 0 ? `${spellAbilities.length}` : undefined}
        testId="spell-abilities"
      >
        {spellAbilities.map((sa, i) => (
          <div key={i} className="flex flex-col gap-1 rounded border border-border/30 p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">#{i + 1}</span>
              <button
                type="button"
                onClick={() => {
                  const updated = spellAbilities.filter((_, j) => j !== i);
                  updateEffect("spell_abilities", updated.length > 0 ? updated : undefined);
                }}
                className="rounded p-0.5 hover:bg-destructive/20"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <Input
                placeholder={t("magicSpellAbilityName")}
                value={sa.name}
                onChange={(e) => {
                  const updated = [...spellAbilities];
                  updated[i] = { ...sa, name: e.target.value };
                  updateEffect("spell_abilities", updated);
                }}
                className="text-sm"
                data-testid={`magic-spell-ability-name-${i}`}
              />
              <Input
                placeholder={t("magicSpellAbilityNameEn")}
                value={sa.name_en ?? ""}
                onChange={(e) => {
                  const updated = [...spellAbilities];
                  updated[i] = { ...sa, name_en: e.target.value || undefined };
                  updateEffect("spell_abilities", updated);
                }}
                className="text-sm"
                data-testid={`magic-spell-ability-name-en-${i}`}
              />
            </div>
            <Input
              type="number"
              placeholder={t("magicSpellAbilityUsesPerDay")}
              value={sa.uses_per_day}
              onChange={(e) => {
                const updated = [...spellAbilities];
                updated[i] = { ...sa, uses_per_day: Number(e.target.value) || 0 };
                updateEffect("spell_abilities", updated);
              }}
              className="w-32 text-sm"
              data-testid={`magic-spell-ability-uses-${i}`}
            />
            <Input
              placeholder={t("magicSpellAbilityDescription")}
              value={sa.description}
              onChange={(e) => {
                const updated = [...spellAbilities];
                updated[i] = { ...sa, description: e.target.value };
                updateEffect("spell_abilities", updated);
              }}
              className="text-sm"
              data-testid={`magic-spell-ability-desc-${i}`}
            />
            <Input
              placeholder={t("magicSpellAbilityDescriptionEn")}
              value={sa.description_en ?? ""}
              onChange={(e) => {
                const updated = [...spellAbilities];
                updated[i] = { ...sa, description_en: e.target.value || undefined };
                updateEffect("spell_abilities", updated);
              }}
              className="text-sm"
              data-testid={`magic-spell-ability-desc-en-${i}`}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const newAbility: MagicSpellAbility = {
              name: "",
              uses_per_day: 1,
              description: "",
            };
            updateEffect("spell_abilities", [...spellAbilities, newAbility]);
          }}
          data-testid="magic-add-spell-ability"
        >
          <Plus className="mr-1 h-4 w-4" />
          {t("magicAddSpellAbility")}
        </Button>
      </Section>

      <Section
        title={t("magicSectionResistances")}
        summary={(fx.resistances?.length ?? 0) > 0 ? `${fx.resistances!.length}` : undefined}
        testId="resistances"
      >
        <TagInput
          tags={fx.resistances ?? []}
          onChange={(tags) => updateEffect("resistances", tags.length > 0 ? tags : undefined)}
          placeholder={t("magicAddResistance")}
          testId="magic-resistance-input"
        />
      </Section>

      <Section
        title={t("magicSectionPassiveAbilities")}
        summary={
          (fx.passive_abilities?.length ?? 0) > 0 ? `${fx.passive_abilities!.length}` : undefined
        }
        testId="passive-abilities"
      >
        <TagInput
          tags={fx.passive_abilities ?? []}
          onChange={(tags) => updateEffect("passive_abilities", tags.length > 0 ? tags : undefined)}
          placeholder={t("magicAddPassiveAbility")}
          testId="magic-passive-input"
        />
      </Section>

      {/* ── Submit ── */}
      <Button
        variant="default"
        size="sm"
        disabled={loading || !form.name.trim()}
        onClick={handleSubmit}
        data-testid="magic-item-submit"
      >
        {submitLabel ?? t("createMagicItem")}
      </Button>
    </div>
  );
}
