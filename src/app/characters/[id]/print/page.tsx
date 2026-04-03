import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import { PrintSheetContainer } from "@/components/print-sheet/print-sheet";
import { fetchAvailablePriestSpells } from "@/lib/supabase/priest-spells";
import type {
  CharacterRow,
  CharacterClassRow,
  CharacterEquipmentWithDetails,
  CharacterSpellWithDetails,
  CharacterWeaponProficiencyRow,
  CharacterNWPWithDetails,
  CharacterLanguageRow,
  CharacterFightingStyleRow,
  CharacterInventoryWithDetails,
} from "@/lib/supabase/types";

interface PrintPageProps {
  params: Promise<{ id: string }>;
}

export default async function PrintPage({ params }: PrintPageProps) {
  const { id } = await params;
  await requireAuth();
  const supabase = await createClient();

  const { data: character } = await supabase
    .from("characters")
    .select("*")
    .eq("id", id)
    .single<CharacterRow>();

  if (!character) {
    notFound();
  }

  const { data: characterClasses } = await supabase
    .from("character_classes")
    .select("*")
    .eq("character_id", id)
    .returns<CharacterClassRow[]>();

  const { data: equipment } = await supabase
    .from("character_equipment")
    .select("*, weapon:weapons(*), armor:armor(*)")
    .eq("character_id", id);

  const { data: spells } = await supabase
    .from("character_spells")
    .select("*, spell:spells(*)")
    .eq("character_id", id);

  const { data: weaponProfs } = await supabase
    .from("character_weapon_proficiencies")
    .select("*")
    .eq("character_id", id)
    .returns<CharacterWeaponProficiencyRow[]>();

  const { data: nwProfs } = await supabase
    .from("character_nonweapon_proficiencies")
    .select("*, proficiency:nonweapon_proficiencies(*)")
    .eq("character_id", id);

  const { data: languages } = await supabase
    .from("character_languages")
    .select("*")
    .eq("character_id", id)
    .returns<CharacterLanguageRow[]>();

  const { data: fightingStyles } = await supabase
    .from("character_fighting_styles")
    .select("*")
    .eq("character_id", id)
    .returns<CharacterFightingStyleRow[]>();

  const { data: inventory } = await supabase
    .from("character_inventory")
    .select("*, item:general_items(*)")
    .eq("character_id", id);

  const priestAvailableSpells = await fetchAvailablePriestSpells(
    supabase,
    character,
    characterClasses ?? []
  );

  return (
    <PrintSheetContainer
      character={character}
      characterClasses={characterClasses ?? []}
      equipment={(equipment as CharacterEquipmentWithDetails[]) ?? []}
      spells={(spells as CharacterSpellWithDetails[]) ?? []}
      weaponProficiencies={weaponProfs ?? []}
      nonweaponProficiencies={(nwProfs as CharacterNWPWithDetails[]) ?? []}
      languages={languages ?? []}
      fightingStyles={fightingStyles ?? []}
      inventory={(inventory as CharacterInventoryWithDetails[]) ?? []}
      priestAvailableSpells={priestAvailableSpells}
    />
  );
}
