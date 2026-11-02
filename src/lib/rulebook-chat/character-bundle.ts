/**
 * Loads everything SvenBot gets to know about characters, for several at once.
 *
 * Only pass ids from an RLS-bound `characters` query: the child tables are
 * readable by every signed-in user (USING (true)), so the ids are the only
 * thing keeping other players' heroes private.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CharacterClassRow,
  CharacterEffectRow,
  CharacterEquipmentWithDetails,
  CharacterFightingStyleRow,
  CharacterInventoryWithDetails,
  CharacterLanguageRow,
  CharacterNWPWithDetails,
  CharacterRow,
  CharacterSpellWithDetails,
  CharacterWeaponProficiencyRow,
  EpicItemRow,
} from "@/lib/supabase/types";

export type BundleDetail = "full" | "compact";

export interface CharacterBundle {
  character: CharacterRow;
  classes: CharacterClassRow[];
  equipment: CharacterEquipmentWithDetails[];
  epicItems: EpicItemRow[];
  weaponProficiencies: CharacterWeaponProficiencyRow[];
  fightingStyles: CharacterFightingStyleRow[];
  effects: CharacterEffectRow[];
  /** Empty in compact bundles. */
  spells: CharacterSpellWithDetails[];
  nonweaponProficiencies: CharacterNWPWithDetails[];
  inventory: CharacterInventoryWithDetails[];
  languages: CharacterLanguageRow[];
}

type Row = { character_id: string };

async function rows<T extends Row>(query: PromiseLike<{ data: unknown; error: unknown }>) {
  const { data, error } = await query;
  if (error) throw new Error(`character bundle: ${JSON.stringify(error)}`);
  return (data ?? []) as T[];
}

function byCharacter<T extends Row>(list: T[], id: string): T[] {
  return list.filter((row) => row.character_id === id);
}

/** Bundles in the order of `ids`; ids the client cannot read are skipped. */
export async function loadCharacterBundles(
  supabase: SupabaseClient,
  ids: string[],
  detail: BundleDetail
): Promise<CharacterBundle[]> {
  if (ids.length === 0) return [];
  const full = detail === "full";
  const child = (table: string, select = "*") =>
    supabase.from(table).select(select).in("character_id", ids);
  const none = Promise.resolve([] as never[]);

  const [
    characters,
    classes,
    equipment,
    epicItems,
    weaponProficiencies,
    fightingStyles,
    effects,
    spells,
    nonweaponProficiencies,
    inventory,
    languages,
  ] = await Promise.all([
    supabase
      .from("characters")
      .select("*")
      .in("id", ids)
      .then(({ data, error }) => {
        if (error) throw new Error(`character bundle: ${JSON.stringify(error)}`);
        return (data ?? []) as CharacterRow[];
      }),
    rows<CharacterClassRow>(child("character_classes")),
    rows<CharacterEquipmentWithDetails>(
      child("character_equipment", "*, weapon:weapons(*), armor:armor(*)")
    ),
    rows<EpicItemRow>(child("epic_items")),
    rows<CharacterWeaponProficiencyRow>(child("character_weapon_proficiencies")),
    rows<CharacterFightingStyleRow>(child("character_fighting_styles")),
    rows<CharacterEffectRow>(child("character_effects").is("ended_at", null).order("created_at")),
    full ? rows<CharacterSpellWithDetails>(child("character_spells", "*, spell:spells(*)")) : none,
    full
      ? rows<CharacterNWPWithDetails>(
          child("character_nonweapon_proficiencies", "*, proficiency:nonweapon_proficiencies(*)")
        )
      : none,
    full
      ? rows<CharacterInventoryWithDetails>(
          child("character_inventory", "*, item:general_items(*)")
        )
      : none,
    full ? rows<CharacterLanguageRow>(child("character_languages")) : none,
  ]);

  return ids.flatMap((id) => {
    const character = characters.find((c) => c.id === id);
    if (!character) return [];
    return [
      {
        character,
        classes: byCharacter(classes, id),
        equipment: byCharacter(equipment, id),
        epicItems: byCharacter(epicItems, id),
        weaponProficiencies: byCharacter(weaponProficiencies, id),
        fightingStyles: byCharacter(fightingStyles, id),
        effects: byCharacter(effects, id),
        spells: byCharacter(spells, id),
        nonweaponProficiencies: byCharacter(nonweaponProficiencies, id),
        inventory: byCharacter(inventory, id),
        languages: byCharacter(languages, id),
      },
    ];
  });
}
