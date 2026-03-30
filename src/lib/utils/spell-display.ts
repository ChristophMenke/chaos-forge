import { localized } from "@/lib/utils/localize";
import { convertImperialText } from "@/lib/utils/units";
import type { SpellRow } from "@/lib/supabase/types";

export function spellRange(spell: SpellRow): string {
  return convertImperialText(spell.range);
}

export function spellArea(spell: SpellRow): string {
  return convertImperialText(spell.area_of_effect);
}

export function spellDescription(spell: SpellRow, locale: string): string {
  const desc = localized(spell.description, spell.description_en, locale);
  return convertImperialText(desc);
}

export function spellName(spell: SpellRow, locale: string): string {
  return localized(spell.name, spell.name_en, locale);
}
