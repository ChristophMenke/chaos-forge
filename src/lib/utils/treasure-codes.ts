/**
 * AD&D 2nd Edition DMG treasure-table code lookup.
 *
 * The Monstrous Manual references the DMG treasure tables via single-letter
 * codes (e.g. "L", "M", "N (Q×10)", "Nil"). Without a reference the codes are
 * cryptic, so this module provides a short German description for each code
 * plus a parser that splits compound references like "L, M, N (Q×10), S" into
 * individual annotated entries.
 *
 * The descriptions are paraphrased short summaries — they are not a direct
 * reproduction of the DMG tables and are intended only as an inline
 * reminder for the GM, not as a substitute for the actual tables.
 */

/**
 * Static lookup of treasure codes to short German descriptions.
 * Uppercase codes denote lair treasure, lowercase ones individual carried
 * treasure as used in the DMG.
 */
export const TREASURE_CODE_DESCRIPTIONS: Record<string, string> = {
  // ─── Lair treasure (Großbuchstaben) ─────────────────────────────
  A: "Sehr großer Hort: umfangreiche Mengen Münzen aller Art, viele Edelsteine und Schmuckstücke, etliche magische Gegenstände.",
  B: "Mittlerer Hort: vor allem Kupfer und Silber, einige Edelsteine, wenige Gegenstände.",
  C: "Kleiner Hort: vorwiegend Kupfer und Silber, seltene Edelsteine oder Gegenstände.",
  D: "Mittlerer Hort mit Fokus auf Gold, einigen Edelsteinen und vereinzelten magischen Gegenständen.",
  E: "Größerer Hort mit Fokus auf Schriftrollen und Tränke.",
  F: "Großer Hort: viel Silber/Gold, viele Edelsteine und Schmuckstücke, magische Gegenstände (inkl. Tränke und Schriftrollen).",
  G: "Sehr umfangreicher Gold-Hort mit wenigen, dafür wertvollen magischen Gegenständen.",
  H: "Maximalhort: massive Mengen Münzen aller Art, viele Edelsteine und Schmuckstücke, etliche magische Gegenstände (Drachen-Niveau).",
  I: "Ein Einzelschatz: Schmuckstücke und Edelsteine, kaum Münzen.",

  // ─── Individual / carried treasure (Kleinbuchstaben & diverse) ────
  J: "Wenige Kupfermünzen in der Tasche.",
  K: "Wenige Silbermünzen in der Tasche.",
  L: "Einige Edelsteine.",
  M: "Goldmünzen und Schmuckstücke.",
  N: "Eine oder zwei magische Zaubertränke.",
  O: "Kupfer- und Silbermünzen im Gepäck.",
  P: "Silber- und Goldmünzen im Gepäck.",
  Q: "Einzelne Edelsteine.",
  R: "Schmuck, Edelsteine und Gold.",
  S: "Zaubertränke (mehrere).",
  T: "Schriftrollen.",
  U: "Magische Gegenstände (Auswahl).",
  V: "Stab, Zauberstab oder höhere Magie.",
  W: "Große Gold-Mengen plus wertvolle Kunstgegenstände.",
  X: "Magische Waffen oder Rüstungen.",
  Y: "Sehr seltene Magie (Artefakt-Niveau).",
  Z: "Kombinierter Hort aus mehreren Kategorien.",
};

export interface TreasureCodeEntry {
  /** Einzelner Code-Buchstabe, z.B. "L", "M", "Q". */
  code: string;
  /** Deutsche Kurzbeschreibung aus TREASURE_CODE_DESCRIPTIONS oder Fallback. */
  description: string;
  /** Optionaler Modifikator in Klammern, z.B. "(Q×10)" oder "(siehe Text)". */
  note?: string;
}

/**
 * Splits a treasure reference string like `"L, M, N (Q×10), S"` into an array
 * of annotated entries. Returns an empty array for empty input or `"Nil"`.
 *
 * Unknown codes are kept in the output with a fallback description so the
 * GM can still see that the source specified something we don't recognise.
 */
export function parseTreasureCodes(treasure: string | null | undefined): TreasureCodeEntry[] {
  if (!treasure) return [];
  const trimmed = treasure.trim();
  if (!trimmed || /^nil$/i.test(trimmed)) return [];

  // Split at commas that are NOT inside parentheses. Simplest robust approach:
  // walk the string and track parenthesis depth.
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of trimmed) {
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());

  return parts.map((part) => {
    // Match a single letter (optionally followed by a parenthesised note)
    const match = part.match(/^([A-Za-z])\s*(\(.+\))?$/);
    if (match) {
      const code = match[1].toUpperCase();
      const note = match[2]?.trim();
      const description =
        TREASURE_CODE_DESCRIPTIONS[code] ?? `Unbekannter Code — prüfe im DMG unter „${code}".`;
      return note ? { code, description, note } : { code, description };
    }
    // Fallback: the entry isn't a recognisable letter code, pass it through
    return {
      code: part,
      description: `Kein DMG-Standardcode — prüfe die Monster-Beschreibung.`,
    };
  });
}
