import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { TEST_DOMAIN } from "@/lib/test/constants";

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "not_configured" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const email = body.email?.toLowerCase();

  // Safety: only allow deletion of test-domain users
  if (!email?.endsWith(TEST_DOMAIN)) {
    return NextResponse.json({ error: "only_test_users_can_be_deleted" }, { status: 403 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Find the user by email
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const user = existingUsers?.users?.find((u) => u.email === email);

  if (!user) {
    return NextResponse.json({ deleted: false, reason: "user_not_found" });
  }

  // Double-check domain before deleting
  if (!user.email?.endsWith(TEST_DOMAIN)) {
    return NextResponse.json({ error: "only_test_users_can_be_deleted" }, { status: 403 });
  }

  // Delete profile first (cascade should handle it, but be explicit)
  await supabaseAdmin.from("profiles").delete().eq("id", user.id);

  // Delete auth user
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
