import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import { CharacterSheet } from "@/components/character-sheet/character-sheet";
import type {
  CharacterRow,
  CharacterClassRow,
  CharacterEquipmentWithDetails,
  CharacterSpellWithDetails,
  CharacterInventoryWithDetails,
  CharacterWeaponProficiencyRow,
  CharacterNWPWithDetails,
  NonweaponProficiencyRow,
  CharacterLanguageRow,
  CharacterFightingStyleRow,
  SessionRow,
  XpHistoryRow,
  EpicItemRow,
} from "@/lib/supabase/types";

interface CharacterPageProps {
  params: Promise<{ id: string }>;
}

export default async function CharacterPage({ params }: CharacterPageProps) {
  const { id } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  // Wave 1: Character (needed for notFound guard)
  const { data: character } = await supabase
    .from("characters")
    .select("*")
    .eq("id", id)
    .single<CharacterRow>();

  if (!character) {
    notFound();
  }

  // NPCs are managed via /master/npcs/
  if (character.is_npc) {
    redirect(`/master/npcs/${id}/manage`);
  }

  // Wave 2: All independent queries in parallel
  const [
    { data: characterClasses },
    { data: equipment },
    { data: spells },
    { data: weaponProfs },
    { data: nwProfs },
    { data: inventoryData },
    { data: languages },
    { data: fightingStyles },
    { data: epicItems },
    { data: xpHistoryData },
    { data: sessionsData },
    { data: allNWPs },
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
    supabase.from("character_inventory").select("*, item:general_items(*)").eq("character_id", id),
    supabase
      .from("character_languages")
      .select("*")
      .eq("character_id", id)
      .returns<CharacterLanguageRow[]>(),
    supabase
      .from("character_fighting_styles")
      .select("*")
      .eq("character_id", character.id)
      .returns<CharacterFightingStyleRow[]>(),
    supabase.from("epic_items").select("*").eq("character_id", id).returns<EpicItemRow[]>(),
    supabase
      .from("xp_history")
      .select("*")
      .eq("character_id", id)
      .order("created_at", { ascending: false })
      .returns<XpHistoryRow[]>(),
    supabase
      .from("sessions")
      .select("id, title, session_date")
      .order("session_date", { ascending: false })
      .limit(20)
      .returns<Pick<SessionRow, "id" | "title" | "session_date">[]>(),
    // allSpells loaded lazily in TabSpells when learn dialog opens
    // allWeapons, allArmor, allGeneralItems, allMagicItems loaded lazily in TabEquipment
    supabase
      .from("nonweapon_proficiencies")
      .select("*")
      .order("name")
      .returns<NonweaponProficiencyRow[]>(),
  ]);

  return (
    <CharacterSheet
      character={character}
      characterClasses={characterClasses ?? []}
      userId={user.id}
      equipment={(equipment as CharacterEquipmentWithDetails[]) ?? []}
      spells={(spells as CharacterSpellWithDetails[]) ?? []}
      allWeapons={[]}
      allArmor={[]}
      allSpells={[]}
      weaponProficiencies={weaponProfs ?? []}
      nonweaponProficiencies={(nwProfs as CharacterNWPWithDetails[]) ?? []}
      inventory={(inventoryData as CharacterInventoryWithDetails[]) ?? []}
      allGeneralItems={[]}
      allMagicItems={[]}
      allNonweaponProficiencies={allNWPs ?? []}
      languages={languages ?? []}
      fightingStyles={fightingStyles ?? []}
      sessions={sessionsData ?? []}
      xpHistory={xpHistoryData ?? []}
      epicItems={epicItems ?? []}
    />
  );
}
