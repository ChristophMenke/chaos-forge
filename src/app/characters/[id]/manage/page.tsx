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
  GeneralItemRow,
  WeaponRow,
  ArmorRow,
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
    { data: allWeapons },
    { data: allArmor },
    { data: allNWPs },
    { data: allGeneralItems },
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
    supabase.from("weapons").select("*").order("name").returns<WeaponRow[]>(),
    supabase.from("armor").select("*").order("ac", { ascending: false }).returns<ArmorRow[]>(),
    supabase
      .from("nonweapon_proficiencies")
      .select("*")
      .order("name")
      .returns<NonweaponProficiencyRow[]>(),
    supabase.from("general_items").select("*").order("name").returns<GeneralItemRow[]>(),
  ]);

  return (
    <CharacterSheet
      character={character}
      characterClasses={characterClasses ?? []}
      userId={user.id}
      equipment={(equipment as CharacterEquipmentWithDetails[]) ?? []}
      spells={(spells as CharacterSpellWithDetails[]) ?? []}
      allWeapons={allWeapons ?? []}
      allArmor={allArmor ?? []}
      allSpells={[]}
      weaponProficiencies={weaponProfs ?? []}
      nonweaponProficiencies={(nwProfs as CharacterNWPWithDetails[]) ?? []}
      inventory={(inventoryData as CharacterInventoryWithDetails[]) ?? []}
      allGeneralItems={allGeneralItems ?? []}
      allNonweaponProficiencies={allNWPs ?? []}
      languages={languages ?? []}
      fightingStyles={fightingStyles ?? []}
      sessions={sessionsData ?? []}
      xpHistory={xpHistoryData ?? []}
      epicItems={epicItems ?? []}
    />
  );
}
