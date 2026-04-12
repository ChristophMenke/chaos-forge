import type { APIRequestContext } from "@playwright/test";

const TEST_EMAIL = "QA-primary@qa.chaosforge.test";
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

export interface TestNpcOptions {
  name: string;
  is_visible_to_players?: boolean;
  description?: string | null;
  location?: string | null;
}

/**
 * Creates a test NPC via the test-seed-npc API. Name must start with "QA-".
 * Returns the NPC ID.
 */
export async function createTestNpc(
  request: APIRequestContext,
  options: TestNpcOptions
): Promise<string> {
  const resp = await request.post(`${BASE_URL}/api/test-seed-npc`, {
    data: {
      email: TEST_EMAIL,
      name: options.name,
      is_visible_to_players: options.is_visible_to_players ?? false,
      description: options.description ?? null,
      location: options.location ?? null,
    },
  });
  const data = await resp.json();
  if (!data.npc_id) {
    throw new Error(`Failed to create test NPC "${options.name}": ${JSON.stringify(data)}`);
  }
  return data.npc_id;
}

/**
 * Deletes a test NPC by ID via the test-seed-npc API.
 */
export async function deleteTestNpc(request: APIRequestContext, npcId: string): Promise<void> {
  const resp = await request.delete(`${BASE_URL}/api/test-seed-npc`, {
    data: { email: TEST_EMAIL, npc_id: npcId },
  });
  if (!resp.ok()) {
    console.warn(`deleteTestNpc: failed for ${npcId} (status ${resp.status()})`);
  }
}
