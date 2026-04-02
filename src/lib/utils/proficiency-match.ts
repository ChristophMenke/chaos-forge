import type { CharacterWeaponProficiencyRow } from "@/lib/supabase/types";

/**
 * Check if a weapon proficiency row matches a weapon by name (bilingual).
 * Compares the stored weapon_name against both the DE name and EN name.
 */
export function matchesWeaponProf(
  wp: CharacterWeaponProficiencyRow,
  name: string,
  nameEn: string | null | undefined
): boolean {
  const stored = wp.weapon_name.toLowerCase();
  return stored === name.toLowerCase() || (nameEn != null && stored === nameEn.toLowerCase());
}

/**
 * Find the matching weapon proficiency for a weapon (bilingual lookup).
 */
export function findWeaponProf(
  profs: CharacterWeaponProficiencyRow[],
  name: string,
  nameEn: string | null | undefined
): CharacterWeaponProficiencyRow | undefined {
  return profs.find((wp) => matchesWeaponProf(wp, name, nameEn));
}
