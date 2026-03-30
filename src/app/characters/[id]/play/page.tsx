import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import { PlayMode } from "@/components/play-mode/play-mode";
import type {
  CharacterRow,
  CharacterClassRow,
  CharacterEquipmentWithDetails,
  CharacterSpellWithDetails,
  CharacterWeaponProficiencyRow,
  CharacterNWPWithDetails,
  CharacterInventoryWithDetails,
  EpicItemRow,
} from "@/lib/supabase/types";

interface PlayPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayPage({ params }: PlayPageProps) {
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

  const { data: inventory } = await supabase
    .from("character_inventory")
    .select("*, item:general_items(*)")
    .eq("character_id", id);

  // Fetch epic items
  const { data: epicItems } = await supabase
    .from("epic_items")
    .select("*")
    .eq("character_id", id)
    .returns<EpicItemRow[]>();

  return (
    <PlayMode
      character={character}
      characterClasses={characterClasses ?? []}
      userId={user.id}
      equipment={(equipment as CharacterEquipmentWithDetails[]) ?? []}
      spells={(spells as CharacterSpellWithDetails[]) ?? []}
      weaponProficiencies={weaponProfs ?? []}
      nonweaponProficiencies={(nwProfs as CharacterNWPWithDetails[]) ?? []}
      inventory={(inventory as CharacterInventoryWithDetails[]) ?? []}
      epicItems={epicItems ?? []}
    />
  );
}
