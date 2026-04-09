"use server";

import { cookies } from "next/headers";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { createNotification } from "@/lib/notifications";
import type {
  MagicEffects,
  MagicItemRow,
  ChronicleNpcRow,
  MonsterRow,
  GmBookmarkRow,
  BookmarkEntityType,
} from "@/lib/supabase/types";

const COOKIE_NAME = "gm_session";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24h

// Rate limiting: 5 failures → 15 min lockout (in-memory, resets on cold start)
const failureMap = new Map<string, { count: number; resetAt: number }>();
const MAX_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function createToken(): string {
  const secret = process.env.GM_SESSION_SECRET ?? process.env.GM_PIN;
  if (!secret) throw new Error("GM_SESSION_SECRET or GM_PIN must be set");
  return crypto.createHmac("sha256", secret).update("gm-authenticated").digest("hex");
}

export async function verifyPin(pin: string): Promise<{ success: boolean; lockedOut?: boolean }> {
  if (!process.env.GM_PIN) return { success: false };

  // Rate limiting
  const key = "gm";
  const now = Date.now();
  const entry = failureMap.get(key);

  if (entry && now < entry.resetAt && entry.count >= MAX_FAILURES) {
    return { success: false, lockedOut: true };
  }

  if (pin !== process.env.GM_PIN) {
    const current = entry && now < entry.resetAt ? entry : { count: 0, resetAt: now + LOCKOUT_MS };
    failureMap.set(key, { count: current.count + 1, resetAt: current.resetAt });
    return { success: false };
  }

  failureMap.delete(key);

  const token = createToken();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && !process.env.CI,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/master",
  });

  return { success: true };
}

export async function checkGmSession(): Promise<boolean> {
  if (!process.env.GM_PIN) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const expected = createToken();

  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ─── Item Injection ────────────────────────────────────────────────────

export async function injectItemToCharacter(
  characterId: string,
  itemType: "weapon" | "armor" | "general",
  itemId: string,
  options?: { hitBonus?: number; damageBonus?: number; quantity?: number }
): Promise<{ success: boolean; error?: string }> {
  if (!(await checkGmSession())) {
    return { success: false, error: "Unauthorized" };
  }

  const service = createServiceClient();
  const qty = options?.quantity ?? 1;

  if (itemType === "weapon") {
    const { error } = await service.from("character_equipment").insert({
      character_id: characterId,
      weapon_id: itemId,
      quantity: qty,
      equipped: false,
      hit_bonus: options?.hitBonus ?? 0,
      damage_bonus: options?.damageBonus ?? 0,
    });
    if (error) return { success: false, error: error.message };
  } else if (itemType === "armor") {
    const { error } = await service.from("character_equipment").insert({
      character_id: characterId,
      armor_id: itemId,
      quantity: qty,
      equipped: false,
      hit_bonus: 0,
      damage_bonus: 0,
    });
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await service.from("character_inventory").insert({
      character_id: characterId,
      item_id: itemId,
      quantity: qty,
    });
    if (error) return { success: false, error: error.message };
  }

  // Create notification for character owner
  const { data: char } = await service
    .from("characters")
    .select("user_id, name")
    .eq("id", characterId)
    .single();

  if (char) {
    let itemName = "Item";
    if (itemType === "weapon") {
      const { data: w } = await service.from("weapons").select("name").eq("id", itemId).single();
      if (w) itemName = w.name;
    } else if (itemType === "armor") {
      const { data: a } = await service.from("armor").select("name").eq("id", itemId).single();
      if (a) itemName = a.name;
    } else {
      const { data: g } = await service
        .from("general_items")
        .select("name")
        .eq("id", itemId)
        .single();
      if (g) itemName = g.name;
    }

    await createNotification(service, {
      userId: char.user_id,
      characterId,
      type: "gm_item_received",
      details: { item_name: itemName, quantity: qty, character_name: char.name },
    });
  }

  return { success: true };
}

export async function injectItemToParty(
  itemType: "weapon" | "armor" | "general",
  itemId: string,
  customName: string
): Promise<{ success: boolean; error?: string }> {
  if (!(await checkGmSession())) {
    return { success: false, error: "Unauthorized" };
  }

  const service = createServiceClient();

  if (itemType === "general") {
    const { error } = await service.from("party_loot_items").insert({
      item_id: itemId,
      quantity: 1,
    });
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await service.from("party_loot_items").insert({
      custom_name: customName,
      quantity: 1,
    });
    if (error) return { success: false, error: error.message };
  }

  return { success: true };
}

// ─── Auto-Share Characters ─────────────────────────────────────────────

export async function autoShareCharacters(userId: string): Promise<void> {
  if (!(await checkGmSession())) return;

  const service = createServiceClient();

  const { data: characters } = await service.from("characters").select("id").eq("is_active", true);

  if (!characters || characters.length === 0) return;

  const shares = characters.map((c) => ({
    character_id: c.id,
    shared_with_user_id: userId,
  }));

  await service.from("character_shares").upsert(shares, {
    onConflict: "character_id,shared_with_user_id",
    ignoreDuplicates: true,
  });
}

// ─── Gold Distribution ─────────────────────────────────────────────────

export async function distributeGold(
  characterId: string,
  coins: { pp: number; gp: number; ep: number; sp: number; cp: number }
): Promise<{ success: boolean; error?: string }> {
  if (!(await checkGmSession())) {
    return { success: false, error: "Unauthorized" };
  }

  const service = createServiceClient();
  const { error } = await service.rpc("distribute_gold", {
    char_id: characterId,
    pp: coins.pp,
    gp: coins.gp,
    ep: coins.ep,
    sp: coins.sp,
    cp: coins.cp,
  });

  if (error) return { success: false, error: error.message };

  // Create notification for character owner
  const { data: char } = await service
    .from("characters")
    .select("user_id, name")
    .eq("id", characterId)
    .single();

  if (char) {
    await createNotification(service, {
      userId: char.user_id,
      characterId,
      type: "gm_gold_received",
      details: { ...coins, character_name: char.name },
    });
  }

  return { success: true };
}

// ─── Custom Item Creation (GM) ─────────────────────────────────────────

export async function createCustomWeaponGm(data: {
  name: string;
  name_en?: string;
  damage_sm?: string;
  damage_l?: string;
  weapon_type: "melee" | "ranged" | "both";
  speed?: number;
  weight?: number;
  hit_bonus?: number;
  damage_bonus?: number;
}): Promise<{ success: boolean; weaponId?: string; error?: string }> {
  if (!(await checkGmSession())) {
    return { success: false, error: "Unauthorized" };
  }

  const service = createServiceClient();
  const { data: weapon, error } = await service
    .from("weapons")
    .insert({
      name: data.name,
      name_en: data.name_en || null,
      damage_sm: data.damage_sm || "1d4",
      damage_l: data.damage_l || "1d4",
      weapon_type: data.weapon_type,
      speed: data.speed ?? 0,
      weight: data.weight ?? 0,
      cost_gp: 0,
      is_custom: true,
    })
    .select("id")
    .single();

  if (error || !weapon) return { success: false, error: error?.message };
  return { success: true, weaponId: weapon.id };
}

export async function createCustomArmorGm(data: {
  name: string;
  name_en?: string;
  ac?: number;
  weight?: number;
  is_shield: boolean;
  shield_type?: "buckler" | "small" | "medium" | "large" | null;
  is_magical_protection?: boolean;
}): Promise<{ success: boolean; armorId?: string; error?: string }> {
  if (!(await checkGmSession())) {
    return { success: false, error: "Unauthorized" };
  }

  const service = createServiceClient();
  const { data: armor, error } = await service
    .from("armor")
    .insert({
      name: data.name,
      name_en: data.name_en || null,
      ac: data.ac ?? 10,
      weight: data.weight ?? 0,
      cost_gp: 0,
      max_movement: 12,
      is_custom: true,
      is_magical_protection: data.is_magical_protection ?? false,
      is_shield: data.is_shield,
      shield_type: data.is_shield ? (data.shield_type ?? null) : null,
    })
    .select("id")
    .single();

  if (error || !armor) return { success: false, error: error?.message };
  return { success: true, armorId: armor.id };
}

// ─── Weapon CRUD ────────────────────────────────────────────────────

export async function updateWeaponGm(
  id: string,
  data: {
    name?: string;
    name_en?: string;
    damage_sm?: string;
    damage_l?: string;
    weapon_type?: "melee" | "ranged" | "both";
    speed?: number;
    weight?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!(await checkGmSession())) return { success: false, error: "Unauthorized" };
  const service = createServiceClient();
  const { error } = await service.from("weapons").update(data).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteWeaponGm(
  id: string
): Promise<{ success: boolean; error?: string; usedBy?: { name: string; id: string }[] }> {
  if (!(await checkGmSession())) return { success: false, error: "Unauthorized" };
  const service = createServiceClient();

  // Check character_equipment
  const { data: equipRows } = await service
    .from("character_equipment")
    .select("character_id")
    .eq("weapon_id", id);

  if (equipRows && equipRows.length > 0) {
    const charIds = [...new Set(equipRows.map((r) => r.character_id))];
    const { data: chars } = await service.from("characters").select("id, name").in("id", charIds);
    return {
      success: false,
      error: "item_in_use",
      usedBy: (chars ?? []).map((c) => ({ name: c.name, id: c.id })),
    };
  }

  const { error } = await service.from("weapons").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── Armor CRUD ─────────────────────────────────────────────────────

export async function updateArmorGm(
  id: string,
  data: {
    name?: string;
    name_en?: string;
    ac?: number;
    weight?: number;
    is_shield?: boolean;
    shield_type?: "buckler" | "small" | "medium" | "large" | null;
    is_magical_protection?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!(await checkGmSession())) return { success: false, error: "Unauthorized" };
  const service = createServiceClient();
  const { error } = await service.from("armor").update(data).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteArmorGm(
  id: string
): Promise<{ success: boolean; error?: string; usedBy?: { name: string; id: string }[] }> {
  if (!(await checkGmSession())) return { success: false, error: "Unauthorized" };
  const service = createServiceClient();

  const { data: equipRows } = await service
    .from("character_equipment")
    .select("character_id")
    .eq("armor_id", id);

  if (equipRows && equipRows.length > 0) {
    const charIds = [...new Set(equipRows.map((r) => r.character_id))];
    const { data: chars } = await service.from("characters").select("id, name").in("id", charIds);
    return {
      success: false,
      error: "item_in_use",
      usedBy: (chars ?? []).map((c) => ({ name: c.name, id: c.id })),
    };
  }

  const { error } = await service.from("armor").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── General Item CRUD ──────────────────────────────────────────────

export async function createGeneralItemGm(data: {
  name: string;
  name_en?: string;
  weight?: number;
  category?: string;
}): Promise<{ success: boolean; itemId?: string; error?: string }> {
  if (!(await checkGmSession())) return { success: false, error: "Unauthorized" };
  const service = createServiceClient();

  const { data: item, error } = await service
    .from("general_items")
    .insert({
      name: data.name,
      name_en: data.name_en || null,
      weight: data.weight ?? 0,
      cost_gp: 0,
      category: data.category || "general",
      is_custom: true,
    })
    .select("id")
    .single();

  if (error || !item) return { success: false, error: error?.message };
  return { success: true, itemId: item.id };
}

export async function updateGeneralItemGm(
  id: string,
  data: {
    name?: string;
    name_en?: string;
    weight?: number;
    category?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!(await checkGmSession())) return { success: false, error: "Unauthorized" };
  const service = createServiceClient();
  const { error } = await service.from("general_items").update(data).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteGeneralItemGm(
  id: string
): Promise<{ success: boolean; error?: string; usedBy?: { name: string; id: string }[] }> {
  if (!(await checkGmSession())) return { success: false, error: "Unauthorized" };
  const service = createServiceClient();

  // Check character_inventory
  const { data: invRows } = await service
    .from("character_inventory")
    .select("character_id")
    .eq("item_id", id);

  // Check party_loot_items
  const { data: partyRows } = await service.from("party_loot_items").select("id").eq("item_id", id);

  if ((invRows && invRows.length > 0) || (partyRows && partyRows.length > 0)) {
    const charIds = [...new Set((invRows ?? []).map((r) => r.character_id))];
    const usedBy: { name: string; id: string }[] = [];

    if (charIds.length > 0) {
      const { data: chars } = await service.from("characters").select("id, name").in("id", charIds);
      usedBy.push(...(chars ?? []).map((c) => ({ name: c.name, id: c.id })));
    }
    if (partyRows && partyRows.length > 0) {
      usedBy.push({ name: "Party Loot", id: "party" });
    }

    return { success: false, error: "item_in_use", usedBy };
  }

  const { error } = await service.from("general_items").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── Magic Item Catalog (CRUD) ───────────────────────────────────────

export async function fetchMagicItems(): Promise<MagicItemRow[]> {
  if (!(await checkGmSession())) return [];
  const service = createServiceClient();
  const { data } = await service.from("magic_items").select("*").order("name", { ascending: true });
  return (data as MagicItemRow[]) ?? [];
}

export async function createMagicItem(data: {
  name: string;
  name_en?: string;
  category?: string;
  magic_effects: MagicEffects;
  weight?: number;
}): Promise<{ success: boolean; id?: string; item?: MagicItemRow; error?: string }> {
  if (!(await checkGmSession())) return { success: false, error: "Unauthorized" };
  const service = createServiceClient();

  const { data: item, error } = await service
    .from("magic_items")
    .insert({
      name: data.name,
      name_en: data.name_en || null,
      category: data.category || null,
      magic_effects: data.magic_effects,
      weight: data.weight ?? 0,
      is_custom: true,
    })
    .select("*")
    .single();

  if (error || !item) return { success: false, error: error?.message };
  return { success: true, id: item.id, item: item as MagicItemRow };
}

export async function updateMagicItem(
  id: string,
  data: {
    name?: string;
    name_en?: string;
    category?: string;
    magic_effects?: MagicEffects;
    weight?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!(await checkGmSession())) return { success: false, error: "Unauthorized" };
  const service = createServiceClient();
  const { error } = await service.from("magic_items").update(data).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteMagicItem(
  id: string
): Promise<{ success: boolean; error?: string; usedBy?: { name: string; id: string }[] }> {
  if (!(await checkGmSession())) return { success: false, error: "Unauthorized" };
  const service = createServiceClient();

  // Check character_equipment
  const { data: equipRows } = await service
    .from("character_equipment")
    .select("character_id")
    .eq("magic_item_id", id);

  const { data: partyRows } = await service
    .from("party_loot_items")
    .select("id")
    .eq("magic_item_id", id);

  if ((equipRows && equipRows.length > 0) || (partyRows && partyRows.length > 0)) {
    const charIds = [...new Set((equipRows ?? []).map((r) => r.character_id))];
    const usedBy: { name: string; id: string }[] = [];

    if (charIds.length > 0) {
      const { data: chars } = await service.from("characters").select("id, name").in("id", charIds);
      usedBy.push(...(chars ?? []).map((c) => ({ name: c.name, id: c.id })));
    }
    if (partyRows && partyRows.length > 0) {
      usedBy.push({ name: "Party Loot", id: "party" });
    }

    return { success: false, error: "item_in_use", usedBy };
  }

  const { error } = await service.from("magic_items").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Fetch which characters/party have instances of each magic item */
export async function fetchMagicItemDistribution(): Promise<
  Map<
    string,
    {
      owners: { characterId: string; characterName: string; equipped: boolean }[];
      inPartyLoot: boolean;
    }
  >
> {
  if (!(await checkGmSession())) return new Map();
  const service = createServiceClient();
  const result = new Map<
    string,
    {
      owners: { characterId: string; characterName: string; equipped: boolean }[];
      inPartyLoot: boolean;
    }
  >();

  // Character instances
  const { data: equipRows } = await service
    .from("character_equipment")
    .select("magic_item_id, character_id, equipped, character:characters(name)")
    .not("magic_item_id", "is", null);

  if (equipRows) {
    for (const row of equipRows) {
      const mid = row.magic_item_id as string;
      if (!result.has(mid)) result.set(mid, { owners: [], inPartyLoot: false });
      const entry = result.get(mid)!;
      const charData = row.character as unknown as { name: string } | null;
      entry.owners.push({
        characterId: row.character_id,
        characterName: charData?.name ?? "Unknown",
        equipped: row.equipped,
      });
    }
  }

  // Party loot instances
  const { data: partyRows } = await service
    .from("party_loot_items")
    .select("magic_item_id")
    .not("magic_item_id", "is", null);

  if (partyRows) {
    for (const row of partyRows) {
      const mid = row.magic_item_id as string;
      if (!result.has(mid)) result.set(mid, { owners: [], inPartyLoot: false });
      result.get(mid)!.inPartyLoot = true;
    }
  }

  return result;
}

// ─── Magic Item Distribution (GM) ───────────────────────────────────

export async function injectMagicItemToCharacter(
  characterId: string,
  data: {
    name: string;
    name_en?: string;
    category?: string;
    magic_effects: MagicEffects;
    magic_item_id?: string;
  }
): Promise<{ success: boolean; catalogId?: string; error?: string }> {
  if (!(await checkGmSession())) {
    return { success: false, error: "Unauthorized" };
  }

  const service = createServiceClient();
  let catalogId = data.magic_item_id;

  // If no catalog entry exists yet, create one
  if (!catalogId) {
    const catalogResult = await createMagicItem({
      name: data.name,
      name_en: data.name_en,
      category: data.category,
      magic_effects: data.magic_effects,
    });
    if (!catalogResult.success || !catalogResult.id) {
      return { success: false, error: catalogResult.error ?? "Failed to create catalog entry" };
    }
    catalogId = catalogResult.id;
  }

  const label = data.category ? `${data.name} (${data.category})` : data.name;

  const { error } = await service.from("character_equipment").insert({
    character_id: characterId,
    weapon_id: null,
    armor_id: null,
    quantity: 1,
    equipped: false,
    hit_bonus: 0,
    damage_bonus: 0,
    magic_effects: data.magic_effects,
    custom_label: label,
    magic_item_id: catalogId,
  });

  if (error) return { success: false, error: error.message };

  // Create notification for character owner
  const { data: char } = await service
    .from("characters")
    .select("user_id, name")
    .eq("id", characterId)
    .single();

  if (char) {
    await createNotification(service, {
      userId: char.user_id,
      characterId,
      type: "gm_item_received",
      details: { item_name: label, quantity: 1, character_name: char.name },
    });
  }

  return { success: true, catalogId };
}

export async function injectMagicItemToParty(data: {
  name: string;
  name_en?: string;
  category?: string;
  magic_effects: MagicEffects;
  magic_item_id?: string;
}): Promise<{ success: boolean; catalogId?: string; error?: string }> {
  if (!(await checkGmSession())) {
    return { success: false, error: "Unauthorized" };
  }

  const service = createServiceClient();
  let catalogId = data.magic_item_id;

  // If no catalog entry exists yet, create one
  if (!catalogId) {
    const catalogResult = await createMagicItem({
      name: data.name,
      name_en: data.name_en,
      category: data.category,
      magic_effects: data.magic_effects,
    });
    if (!catalogResult.success || !catalogResult.id) {
      return { success: false, error: catalogResult.error ?? "Failed to create catalog entry" };
    }
    catalogId = catalogResult.id;
  }

  const label = data.category ? `${data.name} (${data.category})` : data.name;

  const { error } = await service.from("party_loot_items").insert({
    custom_name: label,
    quantity: 1,
    magic_effects: data.magic_effects,
    custom_label: label,
    magic_item_id: catalogId,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, catalogId };
}

// ─── GM Bookmarks ────────────────────────────────────────────────────

export async function fetchBookmarks(userId: string): Promise<GmBookmarkRow[]> {
  if (!(await checkGmSession())) return [];
  const service = createServiceClient();
  const { data } = await service
    .from("gm_bookmarks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data as GmBookmarkRow[]) ?? [];
}

export async function toggleBookmark(
  userId: string,
  entityType: BookmarkEntityType,
  entityId: string
): Promise<{ success: boolean; bookmarked: boolean; error?: string }> {
  if (!(await checkGmSession()))
    return { success: false, bookmarked: false, error: "Unauthorized" };
  const service = createServiceClient();

  // Check if bookmark exists
  const { data: existing } = await service
    .from("gm_bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .maybeSingle();

  if (existing) {
    // Remove bookmark
    const { error } = await service.from("gm_bookmarks").delete().eq("id", existing.id);
    if (error) return { success: false, bookmarked: true, error: error.message };
    return { success: true, bookmarked: false };
  } else {
    // Add bookmark
    const { error } = await service.from("gm_bookmarks").insert({
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
    });
    if (error) return { success: false, bookmarked: false, error: error.message };
    return { success: true, bookmarked: true };
  }
}

// ─── NPC Management ───────────────────────────────────────────────────

export async function fetchNpcs(): Promise<ChronicleNpcRow[]> {
  if (!(await checkGmSession())) return [];
  const service = createServiceClient();
  const { data } = await service
    .from("chronicle_npcs")
    .select("*")
    .order("name", { ascending: true });
  return (data as ChronicleNpcRow[]) ?? [];
}

export async function createNpc(
  npc: Partial<ChronicleNpcRow>
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!(await checkGmSession())) return { success: false, error: "Unauthorized" };
  const service = createServiceClient();
  const { data, error } = await service
    .from("chronicle_npcs")
    .insert({
      name: npc.name ?? "Unnamed NPC",
      location: npc.location ?? "",
      description: npc.description ?? "",
      tier: npc.tier ?? "normal",
      is_visible_to_players: npc.is_visible_to_players ?? false,
      race_id: npc.race_id ?? null,
      class_ids: npc.class_ids ?? [],
      level: npc.level ?? null,
      str: npc.str ?? null,
      dex: npc.dex ?? null,
      con: npc.con ?? null,
      int: npc.int ?? null,
      wis: npc.wis ?? null,
      cha: npc.cha ?? null,
      hp_current: npc.hp_current ?? null,
      hp_max: npc.hp_max ?? null,
      ac: npc.ac ?? null,
      thac0: npc.thac0 ?? null,
      equipment_notes: npc.equipment_notes ?? null,
      spell_notes: npc.spell_notes ?? null,
      notes: npc.notes ?? "",
    })
    .select("id")
    .single();
  if (error || !data) return { success: false, error: error?.message };
  return { success: true, id: data.id };
}

export async function updateNpc(
  id: string,
  updates: Partial<ChronicleNpcRow>
): Promise<{ success: boolean; error?: string }> {
  if (!(await checkGmSession())) return { success: false, error: "Unauthorized" };
  const service = createServiceClient();
  const { error } = await service.from("chronicle_npcs").update(updates).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteNpc(id: string): Promise<{ success: boolean; error?: string }> {
  if (!(await checkGmSession())) return { success: false, error: "Unauthorized" };
  const service = createServiceClient();
  const { error } = await service.from("chronicle_npcs").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── NPC from Character ───────────────────────────────────────────────

export async function createNpcFromCharacter(
  characterId: string,
  gmUserId: string
): Promise<{ success: boolean; id?: string; error?: string; warning?: string }> {
  if (!(await checkGmSession())) return { success: false, error: "Unauthorized" };
  const service = createServiceClient();

  // Fetch source character
  const { data: char, error: charErr } = await service
    .from("characters")
    .select("*")
    .eq("id", characterId)
    .single();
  if (charErr || !char) return { success: false, error: charErr?.message ?? "Character not found" };

  // Create a full character copy with is_npc = true
  const { id: _id, created_at: _ca, updated_at: _ua, last_accessed_at: _la, ...charData } = char;
  const { data: npcChar, error } = await service
    .from("characters")
    .insert({
      ...charData,
      name: `${char.name} (NPC)`,
      user_id: gmUserId,
      is_npc: true,
      npc_visible_to_players: false,
      is_active: false,
      is_public: false,
    })
    .select("id")
    .single();

  if (error || !npcChar) return { success: false, error: error?.message };

  const npcId = npcChar.id;

  // Copy related data — generic helper strips id/character_id and re-assigns
  const warnings: string[] = [];

  async function copyRelated(table: string) {
    const { data } = await service.from(table).select("*").eq("character_id", characterId);
    if (!data || data.length === 0) return;

    const rows = data.map((row: Record<string, unknown>) => {
      const { id: _id, character_id: _cid, ...rest } = row;
      return { ...rest, character_id: npcId };
    });

    const { error: err } = await service.from(table).insert(rows);
    if (err) {
      console.error(`NPC ${table} copy failed:`, err.message);
      warnings.push(table);
    }
  }

  await copyRelated("character_classes");
  await copyRelated("character_equipment");
  await copyRelated("character_spells");
  await copyRelated("character_weapon_proficiencies");
  await copyRelated("character_fighting_styles");
  await copyRelated("epic_items");

  return {
    success: true,
    id: npcId,
    warning: warnings.length > 0 ? `Partial copy — failed: ${warnings.join(", ")}` : undefined,
  };
}

/** Create a blank NPC character (for wizard/import flow) */
export async function createBlankNpcCharacter(
  gmUserId: string,
  name: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!(await checkGmSession())) return { success: false, error: "Unauthorized" };
  const service = createServiceClient();

  const { data, error } = await service
    .from("characters")
    .insert({
      user_id: gmUserId,
      name,
      level: 1,
      is_npc: true,
      npc_visible_to_players: false,
      is_active: false,
      is_public: false,
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
      hp_current: 4,
      hp_max: 4,
      alignment: "true_neutral",
      notes: "",
      xp_current: 0,
      gold_pp: 0,
      gold_gp: 0,
      gold_ep: 0,
      gold_sp: 0,
      gold_cp: 0,
      player_name: "GM",
      gender: "",
      hair_color: "",
      eye_color: "",
      thief_pick_locks: 0,
      thief_find_traps: 0,
      thief_move_silently: 0,
      thief_hide_shadows: 0,
      thief_climb_walls: 0,
      thief_detect_noise: 0,
      thief_read_languages: 0,
    })
    .select("id")
    .single();

  if (error || !data) return { success: false, error: error?.message };
  return { success: true, id: data.id };
}

// ─── Monster Image Upload ─────────────────────────────────────────────

export async function uploadMonsterImage(
  monsterId: string,
  formData: FormData
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  if (!(await checkGmSession())) return { success: false, error: "Unauthorized" };
  const service = createServiceClient();

  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "No file provided" };

  const ext = file.name.split(".").pop() ?? "png";
  const path = `${monsterId}.${ext}`;

  // Upload to storage (overwrite if exists)
  const { error: uploadErr } = await service.storage
    .from("monster-images")
    .upload(path, file, { upsert: true });

  if (uploadErr) return { success: false, error: uploadErr.message };

  // Get public URL
  const { data: urlData } = service.storage.from("monster-images").getPublicUrl(path);
  const imageUrl = urlData.publicUrl;

  // Update monster row
  const { error: updateErr } = await service
    .from("monsters")
    .update({ image_url: imageUrl })
    .eq("id", monsterId);

  if (updateErr) return { success: false, error: updateErr.message };
  return { success: true, imageUrl };
}

// ─── Monster Fetching ─────────────────────────────────────────────────

export async function fetchMonsters(
  search?: string,
  filters?: { minHd?: number; maxHd?: number; size?: string }
): Promise<MonsterRow[]> {
  if (!(await checkGmSession())) return [];
  const service = createServiceClient();
  let query = service.from("monsters").select("*").order("name", { ascending: true });

  if (search) {
    query = query.or(`name.ilike.%${search}%,name_en.ilike.%${search}%`);
  }
  if (filters?.minHd !== undefined) {
    query = query.gte("hit_dice_value", filters.minHd);
  }
  if (filters?.maxHd !== undefined) {
    query = query.lte("hit_dice_value", filters.maxHd);
  }
  if (filters?.size) {
    query = query.eq("size", filters.size);
  }

  const { data } = await query;
  return (data as MonsterRow[]) ?? [];
}

// ─── Monster CRUD ───────────────────────────────────────────────────

export async function createMonsterGm(
  monsterData: Partial<MonsterRow>
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!(await checkGmSession())) return { success: false, error: "Unauthorized" };
  const service = createServiceClient();

  const { data, error } = await service
    .from("monsters")
    .insert({
      name: monsterData.name ?? "New Monster",
      name_en: monsterData.name_en || null,
      climate_terrain: monsterData.climate_terrain || null,
      frequency: monsterData.frequency || null,
      organization: monsterData.organization || null,
      activity_cycle: monsterData.activity_cycle || null,
      diet: monsterData.diet || null,
      intelligence: monsterData.intelligence || null,
      treasure: monsterData.treasure || null,
      alignment: monsterData.alignment || null,
      ac: monsterData.ac ?? 10,
      movement: monsterData.movement || null,
      hit_dice: monsterData.hit_dice || "1",
      hit_dice_value: monsterData.hit_dice_value ?? 1,
      thac0: monsterData.thac0 ?? 20,
      attacks_per_round: String(monsterData.attacks_per_round ?? "1"),
      damage: monsterData.damage || "1d4",
      special_attacks: monsterData.special_attacks || null,
      special_defenses: monsterData.special_defenses || null,
      magic_resistance: monsterData.magic_resistance || null,
      size: monsterData.size ?? "M",
      morale: monsterData.morale || null,
      morale_value: monsterData.morale_value ?? 10,
      xp_value: monsterData.xp_value ?? 0,
      description: monsterData.description || null,
      source_book: monsterData.source_book || "Custom",
      default_zone: monsterData.default_zone ?? "melee",
      has_ranged_attack: monsterData.has_ranged_attack ?? false,
      typical_spells: monsterData.typical_spells || null,
      is_custom: true,
    })
    .select("id")
    .single();

  if (error || !data) return { success: false, error: error?.message };
  return { success: true, id: data.id };
}

export async function updateMonsterGm(
  id: string,
  monsterData: Partial<MonsterRow>
): Promise<{ success: boolean; error?: string }> {
  if (!(await checkGmSession())) return { success: false, error: "Unauthorized" };
  const service = createServiceClient();
  const { error } = await service.from("monsters").update(monsterData).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteMonsterGm(id: string): Promise<{ success: boolean; error?: string }> {
  if (!(await checkGmSession())) return { success: false, error: "Unauthorized" };
  const service = createServiceClient();
  const { error } = await service.from("monsters").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
