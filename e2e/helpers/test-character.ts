import type { APIRequestContext } from "@playwright/test";

const TEST_EMAIL = "QA-primary@qa.chaosforge.test";
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

export interface TestCharacterOptions {
  name: string;
  race_id?: string;
  class_id?: string;
  level?: number;
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
  hp_current?: number;
  hp_max?: number;
  alignment?: string;
  is_public?: boolean;
  classes?: Array<{ class_id: string; level: number; xp_current?: number }>;
  inventory?: Array<{ custom_name?: string; item_id?: string; quantity?: number }>;
  equipment?: Array<{
    weapon_id?: string;
    armor_id?: string;
    custom_label?: string;
    equipped?: boolean;
  }>;
  gold_pp?: number;
  gold_gp?: number;
  gold_sp?: number;
  gold_cp?: number;
}

/**
 * Creates a test character via the test-seed API.
 * Returns the character ID. The character is owned by the primary test user.
 */
export async function createTestCharacter(
  request: APIRequestContext,
  options: TestCharacterOptions
): Promise<string> {
  const resp = await request.put(`${BASE_URL}/api/test-seed`, {
    data: {
      email: TEST_EMAIL,
      character: {
        name: options.name,
        race_id: options.race_id ?? "human",
        class_id: options.class_id ?? "fighter",
        level: options.level ?? 5,
        str: options.str ?? 14,
        dex: options.dex ?? 12,
        con: options.con ?? 13,
        int: options.int ?? 10,
        wis: options.wis ?? 10,
        cha: options.cha ?? 10,
        hp_current: options.hp_current ?? 30,
        hp_max: options.hp_max ?? 30,
        alignment: options.alignment ?? "true_neutral",
        is_public: options.is_public ?? false,
        classes: options.classes ?? [
          { class_id: options.class_id ?? "fighter", level: options.level ?? 5, xp_current: 18000 },
        ],
        inventory: options.inventory,
        equipment: options.equipment,
        ...(options.gold_pp != null && { gold_pp: options.gold_pp }),
        ...(options.gold_gp != null && { gold_gp: options.gold_gp }),
        ...(options.gold_sp != null && { gold_sp: options.gold_sp }),
        ...(options.gold_cp != null && { gold_cp: options.gold_cp }),
      },
    },
  });
  const data = await resp.json();
  if (data.error) {
    throw new Error(`Failed to create test character "${options.name}": ${data.error}`);
  }
  if (!data.character_id) {
    throw new Error(`Failed to create test character "${options.name}": ${JSON.stringify(data)}`);
  }
  return data.character_id;
}

/**
 * Deletes a test character by ID via the test-seed API.
 */
export async function deleteTestCharacter(
  request: APIRequestContext,
  characterId: string
): Promise<void> {
  const resp = await request.delete(`${BASE_URL}/api/test-seed`, {
    data: { email: TEST_EMAIL, character_id: characterId },
  });
  if (!resp.ok()) {
    console.warn(`deleteTestCharacter: failed for ${characterId} (status ${resp.status()})`);
  }
}
