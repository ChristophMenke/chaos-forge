import { requireAuth } from "@/lib/supabase/auth";
import { after } from "next/server";
import { checkGmSession } from "./actions";
import { shareActiveCharactersWith } from "@/lib/master/auto-share";
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
  MagicItemRow,
  GmBookmarkRow,
  CharacterEffectRow,
} from "@/lib/supabase/types";

export default async function MasterPage() {
  const user = await requireAuth();
  const isGm = await checkGmSession();

  if (!isGm) {
    return <MasterPinGate />;
  }

  // Auto-share all active characters with the GM user. Runs after the response
  // is sent — it only writes shares and nothing below depends on it.
  after(() => shareActiveCharactersWith(user.id));

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
    { data: magicItems },
    { data: gmBookmarks },
    { data: allEffects },
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
    service.from("magic_items").select("*").order("name").returns<MagicItemRow[]>(),
    service
      .from("gm_bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<GmBookmarkRow[]>(),
    service
      .from("character_effects")
      .select("*")
      .is("ended_at", null)
      .order("created_at")
      .returns<CharacterEffectRow[]>(),
  ]);

  // Build lookup maps for O(1) access per character
  function buildGroupMap<T extends { character_id: string }>(rows: T[] | null): Map<string, T[]> {
    const map = new Map<string, T[]>();
    for (const row of rows ?? []) {
      const existing = map.get(row.character_id);
      if (existing) existing.push(row);
      else map.set(row.character_id, [row]);
    }
    return map;
  }

  const classMap = buildGroupMap(allClasses);
  const equipmentMap = buildGroupMap(allEquipment);
  const epicItemMap = buildGroupMap(allEpicItems);
  const weaponProfMap = buildGroupMap(allWeaponProfs);
  const fightingStyleMap = buildGroupMap(allFightingStyles);
  const effectMap = buildGroupMap(allEffects);

  // Compute combat data for each character
  const partyData = (characters ?? []).map((char) => {
    const charClasses = classMap.get(char.id) ?? [];
    const charEquipment = equipmentMap.get(char.id) ?? [];
    const charEpicItems = epicItemMap.get(char.id) ?? [];
    const charWeaponProfs = weaponProfMap.get(char.id) ?? [];
    const charFightingStyles = fightingStyleMap.get(char.id) ?? [];
    const charEffects = effectMap.get(char.id) ?? [];

    const combat = computeCharacterCombatData(
      char,
      charClasses,
      charEquipment,
      charEpicItems,
      charWeaponProfs,
      charFightingStyles,
      charEffects
    );

    // The combat simulator plans hypothetical fights: it works on the values
    // without temporary effects.
    const simulatorCombat =
      charEffects.length > 0
        ? computeCharacterCombatData(
            char,
            charClasses,
            charEquipment,
            charEpicItems,
            charWeaponProfs,
            charFightingStyles
          )
        : combat;

    return { character: char, classes: charClasses, combat, simulatorCombat, effects: charEffects };
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
      initialMagicItems={(magicItems as MagicItemRow[]) ?? []}
      initialBookmarks={(gmBookmarks as GmBookmarkRow[]) ?? []}
      userId={user.id}
      userEmail={user.email ?? ""}
    />
  );
}
