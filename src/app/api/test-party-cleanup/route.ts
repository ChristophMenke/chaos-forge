import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TEST_DOMAIN = "@chaos-forge.de";

/**
 * Cleans up party loot state (gold, items, log) created by E2E tests.
 * Does NOT delete characters. Only works for @chaos-forge.de test users.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
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

  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
  const testUserIds =
    usersData?.users?.filter((u) => u.email?.endsWith(TEST_DOMAIN)).map((u) => u.id) ?? [];

  if (testUserIds.length === 0) {
    return NextResponse.json({ cleaned: false });
  }

  // Reset party gold to 0
  await supabaseAdmin
    .from("party_loot_gold")
    .update({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 })
    .not("id", "is", null);

  // Remove test items and log entries
  await supabaseAdmin.from("party_loot_items").delete().in("added_by", testUserIds);
  await supabaseAdmin.from("party_loot_log").delete().in("user_id", testUserIds);

  return NextResponse.json({ cleaned: true });
}
