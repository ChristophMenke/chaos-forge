import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import { PlayMode } from "@/components/play-mode/play-mode";
import { fetchAvailablePriestSpells } from "@/lib/supabase/priest-spells";
import { isPriestCaster } from "@/lib/rules/magic";
import type { ClassId } from "@/lib/rules/types";
import type {
  CharacterRow,
  CharacterClassRow,
  CharacterEquipmentWithDetails,
  CharacterSpellWithDetails,
  CharacterWeaponProficiencyRow,
  CharacterNWPWithDetails,
  CharacterInventoryWithDetails,
  EpicItemRow,
  CharacterFightingStyleRow,
} from "@/lib/supabase/types";

interface PlayPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayPage({ params }: PlayPageProps) {
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
    redirect(`/master/npcs/${id}/play`);
  }

  // Wave 2: All independent queries in parallel
  const [
    { data: characterClasses },
    { data: equipment },
    { data: spells },
    { data: weaponProfs },
    { data: nwProfs },
    { data: inventory },
    { data: epicItems },
    { data: fightingStyles },
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
    supabase.from("epic_items").select("*").eq("character_id", id).returns<EpicItemRow[]>(),
    supabase
      .from("character_fighting_styles")
      .select("*")
      .eq("character_id", id)
      .returns<CharacterFightingStyleRow[]>(),
  ]);

  // Wave 3: Priest spells (only if character has a priest class)
  const hasPriestClass = (characterClasses ?? []).some(
    (cc) => cc.is_active && isPriestCaster(cc.class_id as ClassId)
  );
  const priestAvailableSpells = hasPriestClass
    ? await fetchAvailablePriestSpells(supabase, character, characterClasses ?? [])
    : [];

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
      fightingStyles={fightingStyles ?? []}
      priestAvailableSpells={priestAvailableSpells}
    />
  );
}
