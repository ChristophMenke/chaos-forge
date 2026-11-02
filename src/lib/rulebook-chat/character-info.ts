/**
 * Which characters SvenBot knew for an answer — sent from the route to the
 * chat as a response header and stored with the message. Kept free of
 * server code so the browser bundle stays small.
 */

export interface CharacterContextInfo {
  /** Fully described characters. */
  names: string[];
  /** Party size for a group question, else null. */
  groupSize: number | null;
}

export const CHARACTER_HEADER = "X-SvenBot-Characters";

/** Header value (ASCII-safe) telling the chat which characters SvenBot knew. */
export function encodeCharacterHeader(info: CharacterContextInfo): string | null {
  if (info.names.length === 0 && info.groupSize === null) return null;
  return encodeURIComponent(JSON.stringify({ names: info.names, groupSize: info.groupSize }));
}

export function decodeCharacterHeader(value: string | null): CharacterContextInfo | null {
  if (!value) return null;
  try {
    return parseCharacterInfo(JSON.parse(decodeURIComponent(value)));
  } catch {
    return null;
  }
}

/** Validates stored or received character info; null when malformed. */
export function parseCharacterInfo(value: unknown): CharacterContextInfo | null {
  if (typeof value !== "object" || value === null) return null;
  const { names, groupSize } = value as Record<string, unknown>;
  if (!Array.isArray(names) || !names.every((n) => typeof n === "string")) return null;
  if (groupSize !== null && (typeof groupSize !== "number" || !Number.isInteger(groupSize))) {
    return null;
  }
  if (names.length === 0 && groupSize === null) return null;
  return { names, groupSize };
}
