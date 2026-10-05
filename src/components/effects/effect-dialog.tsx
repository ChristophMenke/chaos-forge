"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EFFECT_PRESETS,
  EFFECT_PRESET_GROUPS,
  getEffectPreset,
  presetToDraft,
  type EffectDraft,
} from "@/lib/rules/effect-presets";
import { validateModifier } from "@/lib/rules/temporary-effects";
import type { EffectWriteResult } from "@/lib/effects/effects-api";
import { localized } from "@/lib/utils/localize";
import type { CharacterEffectRow, EffectFlag, EffectModifier } from "@/lib/supabase/types";
import { ModifierRow } from "./modifier-row";

export const EFFECT_FLAGS: EffectFlag[] = [
  "unconscious",
  "stunned",
  "prone",
  "held",
  "blinded",
  "deafened",
  "frightened",
  "nauseated",
  "helpless",
  "noAttacks",
  "cannotCast",
  "noDexAc",
  "noShield",
  "ongoingDamage",
];

const EMPTY_DRAFT: EffectDraft = {
  name: "",
  notes: "",
  duration_text: "",
  preset_key: null,
  modifiers: [],
  flags: [],
};

interface EffectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing effect → edit (or view when readOnly). */
  effect?: CharacterEffectRow | null;
  readOnly?: boolean;
  onSubmit?: (draft: EffectDraft) => Promise<EffectWriteResult>;
}

function toDraft(effect: CharacterEffectRow | null | undefined): EffectDraft {
  if (!effect) return EMPTY_DRAFT;
  return {
    name: effect.name,
    notes: effect.notes,
    duration_text: effect.duration_text,
    preset_key: effect.preset_key,
    modifiers: effect.modifiers,
    flags: effect.flags,
  };
}

export function EffectDialog(props: EffectDialogProps) {
  // Remount per opened effect so the form starts from its values.
  return <EffectForm key={`${props.open}-${props.effect?.id ?? "new"}`} {...props} />;
}

function EffectForm({ open, onOpenChange, effect, readOnly, onSubmit }: EffectDialogProps) {
  const t = useTranslations("effects");
  const locale = useLocale();
  const [draft, setDraft] = useState<EffectDraft>(() => toDraft(effect));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const preset = getEffectPreset(draft.preset_key);

  function choosePreset(key: string) {
    const chosen = getEffectPreset(key);
    setDraft(chosen ? presetToDraft(chosen, locale) : { ...EMPTY_DRAFT });
    setError(null);
  }

  function setModifier(index: number, modifier: EffectModifier) {
    setDraft((d) => ({ ...d, modifiers: d.modifiers.map((m, i) => (i === index ? modifier : m)) }));
  }

  function toggleFlag(flag: EffectFlag) {
    setDraft((d) => ({
      ...d,
      flags: d.flags.includes(flag) ? d.flags.filter((f) => f !== flag) : [...d.flags, flag],
    }));
  }

  async function handleSubmit() {
    if (!onSubmit) return;
    const name = draft.name.trim();
    if (!name) return setError(t("nameRequired"));
    const modifiers = draft.modifiers.map((m) =>
      m.condition?.trim()
        ? { ...m, condition: m.condition.trim() }
        : { target: m.target, op: m.op, value: m.value }
    );
    if (!modifiers.every(validateModifier)) return setError(t("invalidModifier"));

    setSaving(true);
    setError(null);
    const result = await onSubmit({
      ...draft,
      name,
      notes: draft.notes.trim(),
      duration_text: draft.duration_text.trim(),
      modifiers,
    });
    setSaving(false);
    if (result.ok) onOpenChange(false);
    else setError(result.notApproved ? t("errorNotApproved") : t("errorSave"));
  }

  const title = readOnly ? t("details") : effect ? t("edit") : t("add");

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent
        className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"
        data-testid="effect-dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-heading">{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {!readOnly && !effect && (
            <div className="flex flex-col gap-1">
              <Label htmlFor="effect-preset">{t("preset")}</Label>
              <select
                id="effect-preset"
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={draft.preset_key ?? ""}
                onChange={(e) => choosePreset(e.target.value)}
              >
                <option value="">{t("presetCustom")}</option>
                {EFFECT_PRESET_GROUPS.map((group) => (
                  <optgroup key={group} label={t(`groups.${group}`)}>
                    {EFFECT_PRESETS.filter((p) => p.group === group).map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.icon} {localized(p.name, p.name_en, locale)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {preset && (
                <p className="text-xs text-muted-foreground">
                  {t("source", { source: preset.source })}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
            <div className="flex flex-col gap-1">
              <Label htmlFor="effect-name">{t("name")}</Label>
              <Input
                id="effect-name"
                maxLength={80}
                value={draft.name}
                disabled={readOnly}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="effect-duration">
                {t("duration")}{" "}
                <span className="text-xs text-muted-foreground">({t("durationHint")})</span>
              </Label>
              <Input
                id="effect-duration"
                maxLength={80}
                value={draft.duration_text}
                disabled={readOnly}
                onChange={(e) => setDraft((d) => ({ ...d, duration_text: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="effect-notes">{t("notes")}</Label>
            <textarea
              id="effect-notes"
              maxLength={1000}
              rows={3}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder={t("notesPlaceholder")}
              value={draft.notes}
              disabled={readOnly}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">{t("modifiers")}</legend>
            {draft.modifiers.length === 0 && (
              <p className="text-xs text-muted-foreground">{t("noModifiers")}</p>
            )}
            {draft.modifiers.map((modifier, index) => (
              <ModifierRow
                key={index}
                modifier={modifier}
                readOnly={readOnly}
                onChange={(m) => setModifier(index, m)}
                onRemove={() =>
                  setDraft((d) => ({ ...d, modifiers: d.modifiers.filter((_, i) => i !== index) }))
                }
              />
            ))}
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    modifiers: [...d.modifiers, { target: "attack", op: "delta", value: 0 }],
                  }))
                }
              >
                <Plus className="mr-1 h-4 w-4" aria-hidden />
                {t("addModifier")}
              </Button>
            )}
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">{t("flagsTitle")}</legend>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
              {EFFECT_FLAGS.map((flag) => (
                <label key={flag} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.flags.includes(flag)}
                    disabled={readOnly}
                    onChange={() => toggleFlag(flag)}
                  />
                  {t(`flags.${flag}`)}
                </label>
              ))}
            </div>
          </fieldset>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        {!readOnly && (
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={saving} data-testid="effect-save">
              {effect ? t("update") : t("save")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
