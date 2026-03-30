import { notFound } from "next/navigation";
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

  const { data: character } = await supabase
    .from("characters")
    .select("*")
    .eq("id", id)
    .single<CharacterRow>();

  if (!character) {
    notFound();
  }

  // Fetch equipment with joined weapon/armor data
  const { data: equipment } = await supabase
    .from("character_equipment")
    .select("*, weapon:weapons(*), armor:armor(*)")
    .eq("character_id", id);

  // Fetch spells with joined spell data
  const { data: spells } = await supabase
    .from("character_spells")
    .select("*, spell:spells(*)")
    .eq("character_id", id);

  // Fetch all reference data for add dialogs
  const { data: allWeapons } = await supabase
    .from("weapons")
    .select("*")
    .order("name")
    .returns<WeaponRow[]>();

  const { data: allArmor } = await supabase
    .from("armor")
    .select("*")
    .order("ac", { ascending: false })
    .returns<ArmorRow[]>();

  // allSpells loaded lazily in TabSpells when learn dialog opens

  // Fetch proficiencies
  const { data: weaponProfs } = await supabase
    .from("character_weapon_proficiencies")
    .select("*")
    .eq("character_id", id)
    .returns<CharacterWeaponProficiencyRow[]>();

  const { data: nwProfs } = await supabase
    .from("character_nonweapon_proficiencies")
    .select("*, proficiency:nonweapon_proficiencies(*)")
    .eq("character_id", id);

  const { data: allNWPs } = await supabase
    .from("nonweapon_proficiencies")
    .select("*")
    .order("name")
    .returns<NonweaponProficiencyRow[]>();

  // Fetch character classes (multiclass support)
  const { data: characterClasses } = await supabase
    .from("character_classes")
    .select("*")
    .eq("character_id", id)
    .returns<CharacterClassRow[]>();

  // Fetch inventory
  const { data: inventoryData } = await supabase
    .from("character_inventory")
    .select("*, item:general_items(*)")
    .eq("character_id", id);

  const { data: allGeneralItems } = await supabase
    .from("general_items")
    .select("*")
    .order("name")
    .returns<GeneralItemRow[]>();

  // Fetch languages
  const { data: languages } = await supabase
    .from("character_languages")
    .select("*")
    .eq("character_id", id)
    .returns<CharacterLanguageRow[]>();

  // Fetch fighting styles
  const { data: fightingStyles } = await supabase
    .from("character_fighting_styles")
    .select("*")
    .eq("character_id", character.id)
    .returns<CharacterFightingStyleRow[]>();

  // Fetch sessions (for XP assignment dropdown)
  const { data: sessionsData } = await supabase
    .from("sessions")
    .select("id, title, session_date")
    .order("session_date", { ascending: false })
    .limit(20)
    .returns<Pick<SessionRow, "id" | "title" | "session_date">[]>();

  // Fetch epic items
  const { data: epicItems } = await supabase
    .from("epic_items")
    .select("*")
    .eq("character_id", id)
    .returns<EpicItemRow[]>();

  // Fetch XP history
  const { data: xpHistoryData } = await supabase
    .from("xp_history")
    .select("*")
    .eq("character_id", id)
    .order("created_at", { ascending: false })
    .returns<XpHistoryRow[]>();

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
