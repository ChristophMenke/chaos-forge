import { Badge } from "@/components/ui/badge";
import type { MagicEffects } from "@/lib/supabase/types";

interface MagicEffectBadgesProps {
  effects: MagicEffects;
  id?: string;
}

export function getMagicEffectBadgeList(fx: MagicEffects): string[] {
  if (!fx || Object.keys(fx).length === 0) return [];
  const badges: string[] = [];
  for (const stat of ["str", "dex", "con", "int", "wis", "cha"] as const) {
    const v = fx[stat];
    if (v != null) badges.push(`${stat.toUpperCase()} ${v > 0 ? "+" : ""}${v}`);
  }
  if (fx.ac_bonus != null) badges.push(`AC ${fx.ac_bonus}`);
  if (fx.attack_bonus != null) badges.push(`Atk +${fx.attack_bonus}`);
  if (fx.damage_bonus != null) badges.push(`Dmg +${fx.damage_bonus}`);
  if (fx.save_all != null) badges.push(`Saves +${fx.save_all}`);
  if (fx.save_vs_spell != null) badges.push(`vs Spell +${fx.save_vs_spell}`);
  if (fx.save_vs_poison != null) badges.push(`vs Poison +${fx.save_vs_poison}`);
  if (fx.save_vs_breath != null) badges.push(`vs Breath +${fx.save_vs_breath}`);
  if (fx.save_vs_petrification != null) badges.push(`vs Petrif. +${fx.save_vs_petrification}`);
  if (fx.save_vs_rod != null) badges.push(`vs Rod +${fx.save_vs_rod}`);
  if (fx.perception_bonus != null) badges.push(`Perception +${fx.perception_bonus}`);
  if (fx.movement_bonus != null) badges.push(`Mov +${fx.movement_bonus}`);
  if (fx.magic_resistance != null) badges.push(`MR ${fx.magic_resistance}%`);
  if (fx.spell_failure != null) badges.push(`Spell Fail ${fx.spell_failure}%`);
  if (fx.max_charges != null) badges.push(`${fx.current_charges ?? 0}/${fx.max_charges} charges`);
  fx.resistances?.forEach((r) => badges.push(r));
  fx.passive_abilities?.forEach((p) => badges.push(p));
  fx.spell_abilities?.forEach((s) =>
    badges.push(`${s.name} (${s.uses_per_day > 0 ? `${s.uses_per_day}/day` : "at-will"})`)
  );
  // Show description as badge if no other mechanical badges were generated
  if (badges.length === 0 && (fx.description || fx.description_en)) {
    badges.push(fx.description ?? fx.description_en ?? "");
  }
  return badges;
}

export function MagicEffectBadges({ effects, id }: MagicEffectBadgesProps) {
  const badges = getMagicEffectBadgeList(effects);
  if (badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 pt-1" data-testid={id ? `magic-effects-${id}` : undefined}>
      {badges.map((b, i) => (
        <Badge key={`${i}-${b}`} variant="secondary" className="text-xs">
          {b}
        </Badge>
      ))}
    </div>
  );
}
