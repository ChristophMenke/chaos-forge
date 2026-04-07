"use server";

import { cookies } from "next/headers";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { createNotification } from "@/lib/notifications";
import type { MagicEffects, ChronicleNpcRow, MonsterRow } from "@/lib/supabase/types";

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
    secure: process.env.NODE_ENV === "production",
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

// ─── Magic Item Creation & Distribution (GM) ──────────────────────────

export async function injectMagicItemToCharacter(
  characterId: string,
  data: {
    name: string;
    category?: string;
    magic_effects: MagicEffects;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!(await checkGmSession())) {
    return { success: false, error: "Unauthorized" };
  }

  const service = createServiceClient();
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

  return { success: true };
}

export async function injectMagicItemToParty(data: {
  name: string;
  category?: string;
  magic_effects: object;
}): Promise<{ success: boolean; error?: string }> {
  if (!(await checkGmSession())) {
    return { success: false, error: "Unauthorized" };
  }

  const service = createServiceClient();
  const label = data.category ? `${data.name} (${data.category})` : data.name;

  const { error } = await service.from("party_loot_items").insert({
    custom_name: label,
    quantity: 1,
    magic_effects: data.magic_effects,
    custom_label: label,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
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
