import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/supabase/auth";
import { checkGmSession } from "@/app/master/actions";
import { createServiceClient } from "@/lib/supabase/service";
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

interface NpcManagePageProps {
  params: Promise<{ id: string }>;
}

export default async function NpcManagePage({ params }: NpcManagePageProps) {
  const { id } = await params;
  const user = await requireAuth();
  const isGm = await checkGmSession();
  if (!isGm) redirect("/master");

  const service = createServiceClient();

  // Wave 1: Character (needed for notFound guard + NPC validation)
  const { data: character } = await service
    .from("characters")
    .select("*")
    .eq("id", id)
    .single<CharacterRow>();

  if (!character) notFound();
  if (!character.is_npc) notFound();

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
    service
      .from("character_classes")
      .select("*")
      .eq("character_id", id)
      .returns<CharacterClassRow[]>(),
    service
      .from("character_equipment")
      .select("*, weapon:weapons(*), armor:armor(*)")
      .eq("character_id", id),
    service.from("character_spells").select("*, spell:spells(*)").eq("character_id", id),
    service
      .from("character_weapon_proficiencies")
      .select("*")
      .eq("character_id", id)
      .returns<CharacterWeaponProficiencyRow[]>(),
    service
      .from("character_nonweapon_proficiencies")
      .select("*, proficiency:nonweapon_proficiencies(*)")
      .eq("character_id", id),
    service.from("character_inventory").select("*, item:general_items(*)").eq("character_id", id),
    service
      .from("character_languages")
      .select("*")
      .eq("character_id", id)
      .returns<CharacterLanguageRow[]>(),
    service
      .from("character_fighting_styles")
      .select("*")
      .eq("character_id", character.id)
      .returns<CharacterFightingStyleRow[]>(),
    service.from("epic_items").select("*").eq("character_id", id).returns<EpicItemRow[]>(),
    service
      .from("xp_history")
      .select("*")
      .eq("character_id", id)
      .order("created_at", { ascending: false })
      .returns<XpHistoryRow[]>(),
    service
      .from("sessions")
      .select("id, title, session_date")
      .order("session_date", { ascending: false })
      .limit(20)
      .returns<Pick<SessionRow, "id" | "title" | "session_date">[]>(),
    service.from("weapons").select("*").order("name").returns<WeaponRow[]>(),
    service.from("armor").select("*").order("ac", { ascending: false }).returns<ArmorRow[]>(),
    service
      .from("nonweapon_proficiencies")
      .select("*")
      .order("name")
      .returns<NonweaponProficiencyRow[]>(),
    service.from("general_items").select("*").order("name").returns<GeneralItemRow[]>(),
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
      basePath="/master/npcs"
    />
  );
}
