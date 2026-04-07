import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TEST_DOMAIN = "@chaos-forge.de";
const TEST_CHARACTER_NAMES = ["Gor", "Elara", "QA-MultiXP", "QA-SingleXP"];

/**
 * Removes test characters created by the E2E test seed.
 * Only works for @chaos-forge.de test users. Deletes characters by name.
 */
export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "not_configured" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const email = body.email?.toLowerCase();

  if (!email?.endsWith(TEST_DOMAIN)) {
    return NextResponse.json({ error: "only_test_users" }, { status: 403 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Find all test users
  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
  const testUsers = usersData?.users?.filter((u) => u.email?.endsWith(TEST_DOMAIN)) ?? [];
  const testUserIds = testUsers.map((u) => u.id);

  if (testUserIds.length === 0) {
    return NextResponse.json({ deleted: 0 });
  }

  // Delete seeded test characters by exact name
  const { data: deletedByName } = await supabaseAdmin
    .from("characters")
    .delete()
    .in("user_id", testUserIds)
    .in("name", TEST_CHARACTER_NAMES)
    .select("id");

  // Delete all QA-* characters (dynamically generated test data)
  const { data: deletedByPrefix } = await supabaseAdmin
    .from("characters")
    .delete()
    .in("user_id", testUserIds)
    .like("name", "QA-%")
    .select("id");

  const deleted = [...(deletedByName ?? []), ...(deletedByPrefix ?? [])];

  // Clean up party loot test data: reset gold to 0, clear log + items created by test users
  await supabaseAdmin
    .from("party_loot_gold")
    .update({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 })
    .not("id", "is", null);
  await supabaseAdmin.from("party_loot_items").delete().in("added_by", testUserIds);
  await supabaseAdmin.from("party_loot_log").delete().in("user_id", testUserIds);

  // Clean up QA NPCs (created via GM Dashboard without user context)
  await supabaseAdmin.from("chronicle_npcs").delete().like("name", "QA%");

  return NextResponse.json({ deleted: deleted?.length ?? 0 });
}
