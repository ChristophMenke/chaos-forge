import { requireAuth } from "@/lib/supabase/auth";
import { checkGmSession, autoShareCharacters } from "./actions";
import { MasterPinGate } from "@/components/master/master-pin-gate";
import { MasterDashboard } from "@/components/master/master-dashboard";
import { createServiceClient } from "@/lib/supabase/service";
import { computeCharacterCombatData } from "@/lib/rules/character-computed";
import type {
  CharacterRow,
  CharacterClassRow,
  CharacterEquipmentWithDetails,
  CharacterWeaponProficiencyRow,
  EpicItemRow,
  CharacterFightingStyleRow,
  WeaponRow,
  ArmorRow,
  GeneralItemRow,
  ChronicleNpcRow,
  MonsterRow,
  SpellRow,
} from "@/lib/supabase/types";

export default async function MasterPage() {
  const user = await requireAuth();
  const isGm = await checkGmSession();

  if (!isGm) {
    return <MasterPinGate />;
  }

  // Auto-share all active characters with the GM user
  await autoShareCharacters(user.id);

  const service = createServiceClient();

  // Fetch ALL characters (active + inactive) + related data (bypass RLS via Service Role)
  const [
    { data: characters },
    { data: allClasses },
    { data: allEquipment },
    { data: allEpicItems },
    { data: allWeaponProfs },
    { data: allFightingStyles },
    { data: weapons },
    { data: armor },
    { data: generalItems },
    { data: npcs },
    { data: monsters },
    { data: allCharSpells },
  ] = await Promise.all([
    service.from("characters").select("*").order("name").returns<CharacterRow[]>(),
    service.from("character_classes").select("*").returns<CharacterClassRow[]>(),
    service
      .from("character_equipment")
      .select("*, weapon:weapons(*), armor:armor(*)")
      .returns<CharacterEquipmentWithDetails[]>(),
    service.from("epic_items").select("*").returns<EpicItemRow[]>(),
    service
      .from("character_weapon_proficiencies")
      .select("*")
      .returns<CharacterWeaponProficiencyRow[]>(),
    service.from("character_fighting_styles").select("*").returns<CharacterFightingStyleRow[]>(),
    service.from("weapons").select("*").order("name").returns<WeaponRow[]>(),
    service.from("armor").select("*").order("name").returns<ArmorRow[]>(),
    service.from("general_items").select("*").order("name").returns<GeneralItemRow[]>(),
    service.from("chronicle_npcs").select("*").order("name").returns<ChronicleNpcRow[]>(),
    service.from("monsters").select("*").order("name").returns<MonsterRow[]>(),
    service
      .from("character_spells")
      .select("character_id, spell:spells(*)")
      .returns<{ character_id: string; spell: SpellRow }[]>(),
  ]);

  // Compute combat data for each character
  const partyData = (characters ?? []).map((char) => {
    const charClasses = (allClasses ?? []).filter((c) => c.character_id === char.id);
    const charEquipment = (allEquipment ?? []).filter((e) => e.character_id === char.id);
    const charEpicItems = (allEpicItems ?? []).filter((e) => e.character_id === char.id);
    const charWeaponProfs = (allWeaponProfs ?? []).filter((p) => p.character_id === char.id);
    const charFightingStyles = (allFightingStyles ?? []).filter((f) => f.character_id === char.id);

    const combat = computeCharacterCombatData(
      char,
      charClasses,
      charEquipment,
      charEpicItems,
      charWeaponProfs,
      charFightingStyles
    );

    return { character: char, classes: charClasses, combat };
  });

  // Build character spell map for combat simulator
  const characterSpells = new Map<string, SpellRow[]>();
  for (const entry of allCharSpells ?? []) {
    if (!entry.spell) continue;
    const existing = characterSpells.get(entry.character_id) ?? [];
    existing.push(entry.spell);
    characterSpells.set(entry.character_id, existing);
  }

  return (
    <MasterDashboard
      partyData={partyData}
      weapons={weapons ?? []}
      armor={armor ?? []}
      generalItems={generalItems ?? []}
      npcs={(npcs as ChronicleNpcRow[]) ?? []}
      monsters={(monsters as MonsterRow[]) ?? []}
      characterSpells={characterSpells}
      userId={user.id}
      userEmail={user.email ?? ""}
    />
  );
}
