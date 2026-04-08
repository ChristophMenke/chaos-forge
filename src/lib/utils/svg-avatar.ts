/**
 * Deterministic SVG avatar generation for monsters and NPCs.
 * Generates unique colored avatars based on name hashing with configurable silhouettes.
 */

// ─── Deterministic Color Hash ────────────────────────────────────────

export function nameToHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

// ─── Silhouette Paths ────────────────────────────────────────────────

/** Monster size-based silhouettes (Tiny → Gargantuan) */
export const MONSTER_SILHOUETTES: Record<string, string> = {
  T: "M40 22c-3 0-5 2-5 5v3l-4 6v8l4 3v5h2v4h6v-4h2v-5l4-3v-8l-4-6v-3c0-3-2-5-5-5z",
  S: "M40 18c-6 0-10 4-10 9 0 3 2 6 4 8l-2 10 8 5 8-5-2-10c2-2 4-5 4-8 0-5-4-9-10-9z",
  M: "M28 50l4-14c-3-2-5-6-5-10 0-7 6-12 13-12s13 5 13 12c0 4-2 8-5 10l4 14h-4l-1 6h-14l-1-6h-4z",
  L: "M20 42c0-8 4-14 8-18 2-2 5-4 8-4h8c3 0 6 2 8 4 4 4 8 10 8 18v4l-4 6-6 2v4h-20v-4l-6-2-4-6v-4z",
  H: "M16 38c0-10 6-18 12-22 3-2 7-2 10 0l6 4 6-4c3-2 7-2 10 0 6 4 12 12 12 22v6l-8 8h-8v6h-24v-6h-8l-8-8v-6z",
  G: "M12 36c0-12 8-22 16-26 4-2 8-2 12 0 8 4 16 14 16 26v8l-6 6-4 2v4l-4 4h-16l-4-4v-4l-4-2-6-6v-8z",
};

/** NPC tier-based silhouettes */
export const NPC_SILHOUETTES: Record<string, string> = {
  // Standing person (normal NPC — tavern keeper, merchant)
  normal:
    "M40 14a6 6 0 110 12 6 6 0 010-12zm-4 14h8c4 0 7 3 7 7v10h-4v15h-14v-15h-4v-10c0-4 3-7 7-7z",
  // Person with shield/weapon (advanced NPC — guard, knight)
  advanced:
    "M40 12a7 7 0 110 14 7 7 0 010-14zm-5 16h10c4 0 7 3 7 7v8h-3v17h-18v-17h-3v-8c0-4 3-7 7-7zm18 4l6-3v14l-6-3v-8z",
  // Warrior figure (full character NPC — hero, boss)
  character:
    "M40 10a8 8 0 110 16 8 8 0 010-16zm-6 18h12c5 0 8 3 8 8v6h-3v18h-22v-18h-3v-6c0-5 3-8 8-8zm-12 6l-4 16 8-2-4-14zm36 0l4 16-8-2 4-14z",
};

// ─── SVG Generation ──────────────────────────────────────────────────

function generateSvg(name: string, silhouettePath: string): string {
  const hue = nameToHue(name);
  const letter = name.charAt(0).toUpperCase();
  const c1 = `hsl(${hue}, 60%, 25%)`;
  const c2 = `hsl(${hue}, 70%, 40%)`;
  const c3 = `hsl(${hue}, 50%, 55%)`;

  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0%" stop-color="${c1}"/>` +
      `<stop offset="100%" stop-color="${c2}"/>` +
      `</linearGradient></defs>` +
      `<rect width="80" height="80" rx="12" fill="url(#g)"/>` +
      `<path d="${silhouettePath}" fill="${c3}" opacity="0.4"/>` +
      `<text x="40" y="42" text-anchor="middle" dominant-baseline="central" ` +
      `font-family="serif" font-size="32" font-weight="bold" fill="white" opacity="0.95">${letter}</text>` +
      `</svg>`
  )}`;
}

// ─── Module-level Cache ──────────────────────────────────────────────

const avatarCache = new Map<string, string>();

function getCached(cacheKey: string, name: string, silhouette: string): string {
  let uri = avatarCache.get(cacheKey);
  if (!uri) {
    uri = generateSvg(name, silhouette);
    avatarCache.set(cacheKey, uri);
  }
  return uri;
}

// ─── Public API ──────────────────────────────────────────────────────

export function monsterAvatar(name: string, size: string): string {
  const path = MONSTER_SILHOUETTES[size] ?? MONSTER_SILHOUETTES.M;
  return getCached(`monster::${name}::${size}`, name, path);
}

export function npcAvatar(name: string, tier: "normal" | "advanced" | "character"): string {
  const path = NPC_SILHOUETTES[tier] ?? NPC_SILHOUETTES.normal;
  return getCached(`npc::${name}::${tier}`, name, path);
}
