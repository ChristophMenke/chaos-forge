import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { TEST_DOMAIN } from "@/lib/test/constants";

const TEST_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_PASSWORD = "test-chaos-forge-2026!";

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey || !TEST_EMAIL) {
    return NextResponse.json({ error: "not_configured" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const email = body.email?.toLowerCase();

  // Allow any test-domain email for E2E tests
  if (!email?.endsWith(TEST_DOMAIN)) {
    return NextResponse.json({ error: "not_test_user" }, { status: 404 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Find the test user
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const testUser = existingUsers?.users?.find((u) => u.email === email);

  if (!testUser) {
    // Create with password for programmatic login
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: email.split("@")[0] },
    });
    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }
  } else {
    // Ensure password is set (Magic Link users don't have one)
    await supabaseAdmin.auth.admin.updateUserById(testUser.id, {
      password: TEST_PASSWORD,
      email_confirm: true,
    });
  }

  // Test-domain users are auto-approved so the approval-enforcement trigger
  // doesn't block E2E writes. Gated by TEST_DOMAIN already — non-test emails
  // never reach this branch.
  await supabaseAdmin.from("profiles").update({ is_approved: true }).eq("email", email);

  // Now sign in with password
  const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({
    access_token: data.session?.access_token,
    refresh_token: data.session?.refresh_token,
    user_id: data.user?.id,
  });
}
