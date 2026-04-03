import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TEST_DOMAIN = "@chaos-forge.de";

/**
 * Creates test characters for E2E tests.
 * - "Gor" (Fighter) owned by the requesting test user
 * - "Elara" (Mage) owned by a secondary test user, made public
 *
 * Only works for @chaos-forge.de test users. Idempotent — skips if characters already exist.
 */
export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "not_configured" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const ownerEmail = body.email?.toLowerCase();

  if (!ownerEmail?.endsWith(TEST_DOMAIN)) {
    return NextResponse.json({ error: "only_test_users" }, { status: 403 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Find the test user
  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
  const owner = usersData?.users?.find((u) => u.email === ownerEmail);

  if (!owner) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  // Find or create secondary test user for Elara (owned by different user)
  const secondaryEmail = "e2e-other@chaos-forge.de";
  let secondary = usersData?.users?.find((u) => u.email === secondaryEmail);

  if (!secondary) {
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: secondaryEmail,
      password: "test-chaos-forge-2026!",
      email_confirm: true,
      user_metadata: { display_name: "e2e-other" },
    });
    if (createErr) {
      return NextResponse.json({ error: createErr.message }, { status: 500 });
    }
    secondary = created.user;
  }

  const created: string[] = [];

  // Create "Gor" (Fighter) for owner — if not exists
  const { data: existingGor } = await supabaseAdmin
    .from("characters")
    .select("id")
    .eq("user_id", owner.id)
    .eq("name", "Gor")
    .maybeSingle();

  if (!existingGor) {
    const { data: gorData, error: gorErr } = await supabaseAdmin
      .from("characters")
      .insert({
        user_id: owner.id,
        name: "Gor",
        level: 5,
        race_id: "human",
        class_id: "fighter",
        str: 17,
        dex: 12,
        con: 15,
        int: 10,
        wis: 9,
        cha: 11,
        hp_current: 45,
        hp_max: 45,
        alignment: "chaotic-good",
        is_public: false,
        is_active: true,
      })
      .select("id")
      .single();
    if (gorErr) {
      return NextResponse.json({ error: `Gor: ${gorErr.message}` }, { status: 500 });
    }
    await supabaseAdmin
      .from("character_classes")
      .upsert(
        { character_id: gorData.id, class_id: "fighter", level: 5, xp_current: 32000 },
        { onConflict: "character_id,class_id" }
      );

    // Add Chain Mail armor to Gor's equipment
    const { data: chainMail } = await supabaseAdmin
      .from("armor")
      .select("id")
      .eq("name_en", "Chain Mail")
      .limit(1)
      .maybeSingle();
    if (chainMail) {
      await supabaseAdmin.from("character_equipment").insert({
        character_id: gorData.id,
        armor_id: chainMail.id,
        quantity: 1,
        equipped: true,
      });
    }

    created.push("Gor");
  } else {
    // Ensure character_classes entry exists for pre-existing Gor
    await supabaseAdmin
      .from("character_classes")
      .upsert(
        { character_id: existingGor.id, class_id: "fighter", level: 5, xp_current: 32000 },
        { onConflict: "character_id,class_id" }
      );

    // Ensure Gor has armor equipment
    const { count } = await supabaseAdmin
      .from("character_equipment")
      .select("id", { count: "exact", head: true })
      .eq("character_id", existingGor.id)
      .not("armor_id", "is", null);
    if (count === 0) {
      const { data: chainMail } = await supabaseAdmin
        .from("armor")
        .select("id")
        .eq("name_en", "Chain Mail")
        .limit(1)
        .maybeSingle();
      if (chainMail) {
        await supabaseAdmin.from("character_equipment").insert({
          character_id: existingGor.id,
          armor_id: chainMail.id,
          quantity: 1,
          equipped: true,
        });
      }
    }
  }

  // Create "Elara" (Mage) for secondary user — if not exists, made public
  const { data: existingElara } = await supabaseAdmin
    .from("characters")
    .select("id")
    .eq("user_id", secondary.id)
    .eq("name", "Elara")
    .maybeSingle();

  if (!existingElara) {
    const { data: elaraData, error: elaraErr } = await supabaseAdmin
      .from("characters")
      .insert({
        user_id: secondary.id,
        name: "Elara",
        level: 7,
        race_id: "elf",
        class_id: "mage",
        str: 8,
        dex: 15,
        con: 12,
        int: 18,
        wis: 14,
        cha: 13,
        hp_current: 20,
        hp_max: 20,
        alignment: "neutral-good",
        is_public: true,
        is_active: true,
      })
      .select("id")
      .single();
    if (elaraErr) {
      return NextResponse.json({ error: `Elara: ${elaraErr.message}` }, { status: 500 });
    }
    await supabaseAdmin
      .from("character_classes")
      .upsert(
        { character_id: elaraData.id, class_id: "mage", level: 7, xp_current: 90000 },
        { onConflict: "character_id,class_id" }
      );
    created.push("Elara");
  } else {
    // Ensure character_classes entry exists for pre-existing Elara
    await supabaseAdmin
      .from("character_classes")
      .upsert(
        { character_id: existingElara.id, class_id: "mage", level: 7, xp_current: 90000 },
        { onConflict: "character_id,class_id" }
      );
  }

  return NextResponse.json({ created, owner_id: owner.id });
}
