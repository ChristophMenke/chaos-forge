import type { EffectModifier } from "@/lib/supabase/types";
import { factorLabel } from "./modifier-row";

type Translate = (key: string, values?: Record<string, string | number>) => string;

export function signed(value: number): string {
  return value >= 0 ? `+${value}` : `−${Math.abs(value)}`;
}

/** "Angriff −2", "Bewegung ×½", "Stärke → 5", "Alle Rettungswürfe +2 gegen Böse". */
export function formatModifier(modifier: EffectModifier, t: Translate): string {
  const target = t(`targets.${modifier.target}`);
  if (modifier.op === "factor") return `${target} ${factorLabel(modifier.value)}`;
  if (modifier.op === "set") return `${target} → ${modifier.value}`;
  if (modifier.condition) {
    return `${target} ${t("conditional", { value: signed(modifier.value), condition: modifier.condition })}`;
  }
  return `${target} ${signed(modifier.value)}`;
}
