"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { useCharacterEffects } from "@/lib/hooks/use-character-effects";
import { getEffectPreset } from "@/lib/rules/effect-presets";
import type { CharacterEffectRow } from "@/lib/supabase/types";
import { EffectDialog, EFFECT_FLAGS } from "./effect-dialog";
import { formatModifier } from "./effect-format";

interface EffectsSectionProps {
  state: ReturnType<typeof useCharacterEffects>;
  readOnly: boolean;
}

/** Character sheet: list of active temporary effects with full management. */
export function EffectsSection({ state, readOnly }: EffectsSectionProps) {
  const t = useTranslations("effects");
  const [dialog, setDialog] = useState<{ open: boolean; effect: CharacterEffectRow | null }>({
    open: false,
    effect: null,
  });
  const { effects } = state;

  return (
    <section
      className="flex flex-col gap-3"
      aria-labelledby="effects-section-title"
      data-testid="effects-section"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="effects-section-title" className="font-heading text-lg">
          {t("title")}
        </h3>
        {!readOnly && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDialog({ open: true, effect: null })}
            >
              <Plus className="mr-1 h-4 w-4" aria-hidden />
              {t("add")}
            </Button>
            {effects.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (window.confirm(t("endAllConfirm", { count: effects.length })))
                    void state.endAll();
                }}
              >
                {t("endAll")}
              </Button>
            )}
          </div>
        )}
      </div>

      {effects.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("none")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {effects.map((effect) => {
            const summary = [
              ...effect.modifiers.map((m) => formatModifier(m, t)),
              ...EFFECT_FLAGS.filter((f) => effect.flags.includes(f)).map((f) => t(`flags.${f}`)),
            ].join(" · ");
            return (
              <li
                key={effect.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border p-3"
                data-testid={`effect-row-${effect.id}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    <span aria-hidden>{getEffectPreset(effect.preset_key)?.icon ?? "✦"}</span>{" "}
                    {effect.name}
                    {effect.duration_text && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {effect.duration_text}
                      </span>
                    )}
                  </p>
                  {summary && <p className="text-sm text-muted-foreground">{summary}</p>}
                  {effect.notes && (
                    <p className="mt-1 text-xs italic text-muted-foreground">{effect.notes}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setDialog({ open: true, effect })}
                    aria-label={readOnly ? t("details") : t("edit")}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </Button>
                  {!readOnly && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`${t("end")}: ${effect.name}`}
                      onClick={() => {
                        if (window.confirm(t("endConfirm", { name: effect.name })))
                          void state.end(effect.id);
                      }}
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <EffectDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        effect={dialog.effect}
        readOnly={readOnly}
        onSubmit={(draft) =>
          dialog.effect ? state.update(dialog.effect, draft) : state.add(draft)
        }
      />
    </section>
  );
}
