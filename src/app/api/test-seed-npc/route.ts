import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TEST_DOMAIN = "@chaos-forge.de";
const QA_PREFIX = "QA-";

/**
 * Creates a test NPC in chronicle_npcs. Only works for @chaos-forge.de test users.
 * NPC name must start with "QA-" so the test-seed-cleanup endpoint can remove it.
 */
export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "not_configured" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const email = body.email?.toLowerCase();
  const name: string | undefined = body.name;
  const isVisible: boolean = body.is_visible_to_players ?? false;
  const description: string | null = body.description ?? null;
  const location: string | null = body.location ?? null;

  if (!email?.endsWith(TEST_DOMAIN)) {
    return NextResponse.json({ error: "only_test_users" }, { status: 403 });
  }

  if (!name || !name.startsWith(QA_PREFIX)) {
    return NextResponse.json({ error: "name_must_start_with_QA-" }, { status: 400 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
  const user = usersData?.users?.find((u) => u.email === email);
  if (!user) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin
    .from("chronicle_npcs")
    .insert({
      name,
      description,
      location,
      is_visible_to_players: isVisible,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ npc_id: data.id });
}

/**
 * Deletes a test NPC by ID. Only works for NPCs created by @chaos-forge.de users
 * AND named with a "QA-" prefix.
 */
export async function DELETE(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "not_configured" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const email = body.email?.toLowerCase();
  const npcId: string | undefined = body.npc_id;

  if (!email?.endsWith(TEST_DOMAIN)) {
    return NextResponse.json({ error: "only_test_users" }, { status: 403 });
  }

  if (!npcId) {
    return NextResponse.json({ error: "npc_id_required" }, { status: 400 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verify name prefix + owner domain before deleting
  const { data: npc } = await supabaseAdmin
    .from("chronicle_npcs")
    .select("id, name, created_by")
    .eq("id", npcId)
    .maybeSingle();

  if (!npc) {
    return NextResponse.json({ deleted: false, reason: "not_found" });
  }

  if (!npc.name?.startsWith(QA_PREFIX)) {
    return NextResponse.json({ error: "only_QA_npcs_can_be_deleted" }, { status: 403 });
  }

  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
  const owner = usersData?.users?.find((u) => u.id === npc.created_by);
  if (!owner?.email?.endsWith(TEST_DOMAIN)) {
    return NextResponse.json({ error: "only_test_users" }, { status: 403 });
  }

  const { error } = await supabaseAdmin.from("chronicle_npcs").delete().eq("id", npcId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
