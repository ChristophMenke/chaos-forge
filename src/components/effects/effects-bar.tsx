"use client";

import { useState } from "react";
import type { useCharacterEffects } from "@/lib/hooks/use-character-effects";
import type { AbilityKey } from "@/lib/rules/temporary-effects";
import type { CharacterEffectRow } from "@/lib/supabase/types";
import { EffectChips } from "./effect-chips";
import { EffectDialog } from "./effect-dialog";
import { EffectWarnings } from "./effect-warnings";

type EffectsState = ReturnType<typeof useCharacterEffects>;

interface EffectsBarProps {
  state: EffectsState;
  readOnly: boolean;
  /** Effective ability scores for the threshold warnings. */
  values: Record<AbilityKey, number>;
}

/** Play mode: effect chips with add / edit / end, plus warnings. */
export function EffectsBar({ state, readOnly, values }: EffectsBarProps) {
  const [dialog, setDialog] = useState<{ open: boolean; effect: CharacterEffectRow | null }>({
    open: false,
    effect: null,
  });

  return (
    <div className="flex flex-col gap-1.5" data-testid="effects-bar">
      <EffectChips
        effects={state.effects}
        readOnly={readOnly}
        onOpen={(effect) => setDialog({ open: true, effect })}
        onEnd={(effect) => void state.end(effect.id)}
        onAdd={() => setDialog({ open: true, effect: null })}
      />
      <EffectWarnings effects={state.effects} values={values} />
      <EffectDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        effect={dialog.effect}
        readOnly={readOnly}
        onSubmit={(draft) =>
          dialog.effect ? state.update(dialog.effect, draft) : state.add(draft)
        }
      />
    </div>
  );
}
