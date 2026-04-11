/**
 * Parse AD&D 2nd Edition hit dice notation into a numeric base value.
 *
 * Supports the three notations found in the Monstrous Manual:
 * - Fractional notation ("1/2", "1/4") — returns the decimal equivalent
 * - Plus notation ("3+3", "8+8") — returns the base (left of the plus)
 * - Range notation ("2-5") — returns the minimum (left of the hyphen)
 * - Plain integers ("8") — returns the integer
 *
 * Fallback is 1 for unparseable or empty input.
 *
 * Examples:
 *   parseHitDiceValue("3+3") === 3
 *   parseHitDiceValue("1/2") === 0.5
 *   parseHitDiceValue("2-5") === 2   // Range → minimum
 *   parseHitDiceValue("8")   === 8
 */
export function parseHitDiceValue(hd: string): number {
  const trimmed = hd.trim();
  if (!trimmed) return 1;

  // Fractional notation: "1/2" → 0.5
  if (trimmed.includes("/")) {
    const [num, denom] = trimmed.split("/").map(Number);
    if (!Number.isNaN(num) && !Number.isNaN(denom) && denom !== 0) {
      return num / denom;
    }
    return 0.5;
  }

  // Leading numeric part handles "3+3" → 3, "2-5" → 2, "8" → 8
  const match = trimmed.match(/^(\d+(?:\.\d+)?)/);
  if (match) {
    const val = parseFloat(match[1]);
    return val > 0 ? val : 1;
  }
  return 1;
}
