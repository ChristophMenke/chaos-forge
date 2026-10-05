"use client";

import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { getEffectPreset } from "@/lib/rules/effect-presets";
import type { CharacterEffectRow } from "@/lib/supabase/types";

interface EffectChipsProps {
  effects: CharacterEffectRow[];
  readOnly?: boolean;
  /** Fold the list after this many chips (GM cards). */
  maxVisible?: number;
  onOpen: (effect: CharacterEffectRow) => void;
  onEnd?: (effect: CharacterEffectRow) => void;
  onAdd?: () => void;
}

export function EffectChips({
  effects,
  readOnly,
  maxVisible,
  onOpen,
  onEnd,
  onAdd,
}: EffectChipsProps) {
  const t = useTranslations("effects");
  const visible = maxVisible ? effects.slice(0, maxVisible) : effects;
  const hidden = effects.length - visible.length;

  if (effects.length === 0 && (readOnly || !onAdd)) return null;

  return (
    <ul
      className="flex flex-wrap items-center gap-1.5"
      aria-label={t("title")}
      data-testid="effect-chips"
    >
      {visible.map((effect) => {
        const icon = getEffectPreset(effect.preset_key)?.icon ?? "✦";
        return (
          <li
            key={effect.id}
            className="flex items-center rounded-full border border-amber-600/40 bg-amber-500/10 text-xs"
          >
            <button
              type="button"
              className="flex items-center gap-1 rounded-full px-2.5 py-1 hover:bg-amber-500/20"
              onClick={() => onOpen(effect)}
              aria-label={effect.name}
              title={effect.notes || effect.name}
            >
              <span aria-hidden>{icon}</span>
              <span>{effect.name}</span>
              {effect.temp_hp_remaining > 0 && (
                <span className="font-mono text-emerald-400">
                  {t("tempHp", { count: effect.temp_hp_remaining })}
                </span>
              )}
            </button>
            {!readOnly && onEnd && (
              <button
                type="button"
                className="mr-1 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                aria-label={`${t("end")}: ${effect.name}`}
                onClick={() => {
                  if (window.confirm(t("endConfirm", { name: effect.name }))) onEnd(effect);
                }}
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            )}
          </li>
        );
      })}
      {hidden > 0 && (
        <li
          className="text-xs text-muted-foreground"
          title={effects
            .slice(visible.length)
            .map((e) => e.name)
            .join(", ")}
        >
          {t("more", { count: hidden })}
        </li>
      )}
      {!readOnly && onAdd && (
        <li>
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
            data-testid="effect-add"
          >
            <Plus className="h-3 w-3" aria-hidden />
            {t("addShort")}
          </button>
        </li>
      )}
    </ul>
  );
}
