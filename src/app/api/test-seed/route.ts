import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { TEST_DOMAIN, TEST_SECONDARY_EMAIL } from "@/lib/test/constants";

/**
 * Creates test characters for E2E tests.
 * - "Gor" (Fighter) owned by the requesting test user
 * - "Elara" (Mage) owned by a secondary test user, made public
 *
 * Only works for test-domain users. Idempotent — skips if characters already exist.
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
  const secondaryEmail = TEST_SECONDARY_EMAIL;
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
    created.push("Gor");
  } else {
    // Ensure character_classes entry exists for pre-existing Gor
    await supabaseAdmin
      .from("character_classes")
      .upsert(
        { character_id: existingGor.id, class_id: "fighter", level: 5, xp_current: 32000 },
        { onConflict: "character_id,class_id" }
      );
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

/**
 * Creates a single test character with custom data and returns its ID.
 * Only works for test-domain users.
 */
export async function PUT(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "not_configured" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const ownerEmail = body.email?.toLowerCase();
  const characterData = body.character;

  if (!ownerEmail?.endsWith(TEST_DOMAIN)) {
    return NextResponse.json({ error: "only_test_users" }, { status: 403 });
  }

  if (!characterData?.name) {
    return NextResponse.json({ error: "character.name_required" }, { status: 400 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
  const owner = usersData?.users?.find((u) => u.email === ownerEmail);

  if (!owner) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const { data: char, error } = await supabaseAdmin
    .from("characters")
    .insert({
      user_id: owner.id,
      name: characterData.name,
      level: characterData.level ?? 1,
      race_id: characterData.race_id ?? "human",
      class_id: characterData.class_id ?? "fighter",
      str: characterData.str ?? 10,
      dex: characterData.dex ?? 10,
      con: characterData.con ?? 10,
      int: characterData.int ?? 10,
      wis: characterData.wis ?? 10,
      cha: characterData.cha ?? 10,
      hp_current: characterData.hp_current ?? 10,
      hp_max: characterData.hp_max ?? 10,
      alignment: characterData.alignment ?? "true-neutral",
      is_public: characterData.is_public ?? false,
      is_active: characterData.is_active ?? true,
      ...(characterData.gold_pp != null && { gold_pp: characterData.gold_pp }),
      ...(characterData.gold_gp != null && { gold_gp: characterData.gold_gp }),
      ...(characterData.gold_sp != null && { gold_sp: characterData.gold_sp }),
      ...(characterData.gold_cp != null && { gold_cp: characterData.gold_cp }),
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Create character_classes entries (supports multiclass via classes array)
  const classEntries = characterData.classes ?? [
    {
      class_id: characterData.class_id ?? "fighter",
      level: characterData.level ?? 1,
      xp_current: 0,
    },
  ];
  for (const cc of classEntries) {
    await supabaseAdmin.from("character_classes").upsert(
      {
        character_id: char.id,
        class_id: cc.class_id,
        level: cc.level ?? 1,
        xp_current: cc.xp_current ?? 0,
      },
      { onConflict: "character_id,class_id" }
    );
  }

  // Optional inventory seeding for party-loot tests
  const inventoryEntries: Array<{ custom_name?: string; item_id?: string; quantity?: number }> =
    characterData.inventory ?? [];
  for (const inv of inventoryEntries) {
    const { error: invErr } = await supabaseAdmin.from("character_inventory").insert({
      character_id: char.id,
      item_id: inv.item_id ?? null,
      custom_name: inv.custom_name ?? null,
      quantity: inv.quantity ?? 1,
      notes: "",
    });
    if (invErr) {
      return NextResponse.json(
        { error: `inventory_seed_failed: ${invErr.message}`, character_id: char.id },
        { status: 500 }
      );
    }
  }

  // Optional equipment seeding for party-loot tests
  const equipmentEntries: Array<{
    weapon_id?: string;
    armor_id?: string;
    custom_label?: string;
    equipped?: boolean;
  }> = characterData.equipment ?? [];
  for (const eq of equipmentEntries) {
    const { error: eqErr } = await supabaseAdmin.from("character_equipment").insert({
      character_id: char.id,
      weapon_id: eq.weapon_id ?? null,
      armor_id: eq.armor_id ?? null,
      quantity: 1,
      equipped: eq.equipped ?? false,
      hit_bonus: 0,
      damage_bonus: 0,
      magic_effects: {},
      custom_label: eq.custom_label ?? null,
    });
    if (eqErr) {
      return NextResponse.json(
        { error: `equipment_seed_failed: ${eqErr.message}`, character_id: char.id },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ character_id: char.id });
}

/**
 * Deletes a test character by ID. Only works for characters owned by @qa.chaosforge.test users.
 */
export async function DELETE(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "not_configured" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const characterId = body.character_id;

  if (!characterId) {
    return NextResponse.json({ error: "character_id_required" }, { status: 400 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verify the character belongs to a test-domain user
  const { data: character } = await supabaseAdmin
    .from("characters")
    .select("id, user_id")
    .eq("id", characterId)
    .maybeSingle();

  if (!character) {
    return NextResponse.json({ deleted: false, reason: "not_found" });
  }

  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
  const owner = usersData?.users?.find((u) => u.id === character.user_id);

  if (!owner?.email?.endsWith(TEST_DOMAIN)) {
    return NextResponse.json({ error: "only_test_characters" }, { status: 403 });
  }

  // Delete character (cascades handle junction tables)
  const { error } = await supabaseAdmin.from("characters").delete().eq("id", characterId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
