/**
 * Which characters a SvenBot question is about: names in the question, else
 * the latest mention in the conversation, plus the whole party for group
 * questions. Pure — the candidates come from an RLS-bound query.
 */

export interface CharacterCandidate {
  id: string;
  name: string;
  is_npc: boolean;
  is_active: boolean;
}

export interface CharacterSelection {
  /** Characters sent with all details (max MAX_FULL_CHARACTERS). */
  fullIds: string[];
  /** Further party members sent in compact form (group questions). */
  groupIds: string[];
  /** Names of the fully described characters, for the "Knew: …" line. */
  names: string[];
  /** Party size for a group question, else null. */
  groupSize: number | null;
}

export const MAX_FULL_CHARACTERS = 3;
const MIN_PART_LENGTH = 3;

/** Name parts that never identify a character on their own. */
const STOP_WORDS = new Set([
  "der",
  "die",
  "das",
  "den",
  "dem",
  "des",
  "von",
  "van",
  "vom",
  "zu",
  "de",
  "du",
  "la",
  "le",
  "el",
  "al",
  "the",
  "of",
  "und",
  "and",
]);

export function normalizeName(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function tokenize(text: string): string[] {
  return normalizeName(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/** Token equals the name part, also with a German genitive "s" (Thorins). */
function tokenMatches(token: string, part: string): boolean {
  return token === part || token === `${part}s`;
}

/**
 * Characters named in `text`, best first: whole-name matches before name
 * parts, then by first appearance.
 */
export function findMentionedCharacters<T extends CharacterCandidate>(
  text: string,
  candidates: T[]
): T[] {
  const tokens = tokenize(text);
  if (tokens.length === 0) return [];
  const joined = ` ${tokens.join(" ")} `;

  const hits: { candidate: T; full: boolean; position: number }[] = [];
  for (const candidate of candidates) {
    const nameTokens = tokenize(candidate.name);
    if (nameTokens.length === 0) continue;

    // Multi-word names: the whole name as a token sequence ranks first.
    const fullIndex = nameTokens.length > 1 ? joined.indexOf(` ${nameTokens.join(" ")} `) : -1;
    if (fullIndex >= 0) {
      const position = joined.slice(0, fullIndex).split(" ").filter(Boolean).length;
      hits.push({ candidate, full: true, position });
      continue;
    }

    const parts = nameTokens.filter((p) => p.length >= MIN_PART_LENGTH && !STOP_WORDS.has(p));
    const position = tokens.findIndex((t) => parts.some((p) => tokenMatches(t, p)));
    if (position >= 0) hits.push({ candidate, full: false, position });
  }

  return hits
    .sort((a, b) => Number(b.full) - Number(a.full) || a.position - b.position)
    .map((h) => h.candidate);
}

const GROUP_PATTERNS = [
  /\bgruppe\b/,
  /\bheldengruppe\b/,
  /\bparty\b/,
  /\bwer von (uns|euch)\b/,
  /\bwelche[rsmn]? von (uns|euch)\b/,
  /\bjede[rsmn]? von (uns|euch)\b/,
  /\bunsere[rsmn]? (helden|charaktere|chars|abenteurer)\b/,
  /\balle[nm]? (helden|charaktere|abenteurer)\b/,
  /\bgroup\b/,
  /\b(who|which|each|any) of us\b/,
  /\bour (heroes|characters|chars|adventurers)\b/,
  /\ball (heroes|characters)\b/,
];

/** Explicit party questions only — a plain "we/us" is not enough. */
export function hasGroupWords(text: string): boolean {
  const normalized = normalizeName(text);
  return GROUP_PATTERNS.some((pattern) => pattern.test(normalized));
}

export interface SelectInput<T extends CharacterCandidate> {
  message: string;
  /** Previous messages, oldest first (as sent to the API). */
  history: { content: string }[];
  summary: string;
  candidates: T[];
  scope: "player" | "gm";
}

/**
 * Names in the question win; without any, the latest message mentioning a
 * character, then the running summary. Group words count in the question only.
 */
export function selectCharacters<T extends CharacterCandidate>({
  message,
  history,
  summary,
  candidates,
  scope,
}: SelectInput<T>): CharacterSelection {
  const pool = scope === "gm" ? candidates : candidates.filter((c) => !c.is_npc);
  const isGroup = hasGroupWords(message);

  // A group question without names is about the party, not the last hero.
  const sources = isGroup
    ? [message]
    : [message, ...[...history].reverse().map((m) => m.content), summary];

  let full: T[] = [];
  for (const source of sources) {
    if (!source) continue;
    const found = findMentionedCharacters(source, pool);
    if (found.length > 0) {
      full = found.slice(0, MAX_FULL_CHARACTERS);
      break;
    }
  }

  const fullIds = full.map((c) => c.id);
  const party = isGroup ? pool.filter((c) => c.is_active && !c.is_npc) : [];
  const groupIds = party.filter((c) => !fullIds.includes(c.id)).map((c) => c.id);

  return {
    fullIds,
    groupIds,
    names: full.map((c) => c.name),
    groupSize: isGroup ? party.length : null,
  };
}
