"use server";

import { cookies } from "next/headers";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/service";

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
