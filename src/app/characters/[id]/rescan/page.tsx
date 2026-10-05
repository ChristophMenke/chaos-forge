import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import { RescanView } from "@/components/character-rescan/rescan-view";
import type { CharacterSnapshot } from "@/lib/scan/character-diff-types";
import type {
  CharacterRow,
  CharacterClassRow,
  CharacterEquipmentWithDetails,
  CharacterInventoryWithDetails,
  CharacterSpellWithDetails,
  CharacterWeaponProficiencyRow,
  CharacterNWPWithDetails,
  CharacterFightingStyleRow,
  CharacterLanguageRow,
} from "@/lib/supabase/types";

interface RescanPageProps {
  params: Promise<{ id: string }>;
}

export default async function RescanPage({ params }: RescanPageProps) {
  const { id } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: character } = await supabase
    .from("characters")
    .select("*")
    .eq("id", id)
    .single<CharacterRow>();

  if (!character) {
    notFound();
  }

  // NPCs werden über /master/npcs/ gepflegt.
  if (character.is_npc) {
    redirect(`/master/npcs/${id}/manage`);
  }

  // Ein Rescan schreibt — das darf nur der Besitzer.
  if (character.user_id !== user.id) {
    redirect(`/characters/${id}/manage`);
  }

  // Nur die Relationen, gegen die der Diff vergleicht — xp_history, Sessions
  // und Epic Items sind für den Vergleich ohne Belang.
  const [
    { data: classes },
    { data: equipment },
    { data: inventory },
    { data: spells },
    { data: weaponProficiencies },
    { data: nonweaponProficiencies },
    { data: fightingStyles },
    { data: languages },
  ] = await Promise.all([
    supabase
      .from("character_classes")
      .select("*")
      .eq("character_id", id)
      .returns<CharacterClassRow[]>(),
    supabase
      .from("character_equipment")
      .select("*, weapon:weapons(*), armor:armor(*)")
      .eq("character_id", id),
    supabase.from("character_inventory").select("*, item:general_items(*)").eq("character_id", id),
    supabase.from("character_spells").select("*, spell:spells(*)").eq("character_id", id),
    supabase
      .from("character_weapon_proficiencies")
      .select("*")
      .eq("character_id", id)
      .returns<CharacterWeaponProficiencyRow[]>(),
    supabase
      .from("character_nonweapon_proficiencies")
      .select("*, proficiency:nonweapon_proficiencies(*)")
      .eq("character_id", id),
    supabase
      .from("character_fighting_styles")
      .select("*")
      .eq("character_id", id)
      .returns<CharacterFightingStyleRow[]>(),
    supabase
      .from("character_languages")
      .select("*")
      .eq("character_id", id)
      .returns<CharacterLanguageRow[]>(),
  ]);

  const snapshot: CharacterSnapshot = {
    character,
    classes: classes ?? [],
    equipment: (equipment as CharacterEquipmentWithDetails[]) ?? [],
    inventory: (inventory as CharacterInventoryWithDetails[]) ?? [],
    spells: (spells as CharacterSpellWithDetails[]) ?? [],
    weaponProficiencies: weaponProficiencies ?? [],
    nonweaponProficiencies: (nonweaponProficiencies as CharacterNWPWithDetails[]) ?? [],
    fightingStyles: fightingStyles ?? [],
    languages: languages ?? [],
  };

  return <RescanView snapshot={snapshot} />;
}
