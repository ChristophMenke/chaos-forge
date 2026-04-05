/** Conversion factor: 1 lb = 0.453592 kg */
export const LBS_TO_KG = 0.453592;

/**
 * Convert pounds (lbs) to kilograms for display purposes.
 * DB values remain in imperial (lbs).
 */
export function lbsToKg(lbs: number): string {
  return (lbs * LBS_TO_KG).toFixed(1);
}

/**
 * Convert feet to meters for display purposes.
 */
export function feetToMeters(feet: number): string {
  return (feet * 0.3048).toFixed(1);
}

/**
 * Format a converted metric number: 1 decimal, strip trailing ".0".
 */
function formatMetric(value: number): string {
  const s = value.toFixed(1);
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}

/**
 * Convert imperial measurements embedded in text strings to metric.
 * Handles yards, feet, miles, pounds, and inches in both DE and EN formats.
 * Returns the text with imperial units replaced by metric equivalents.
 */
export function convertImperialText(text: string): string {
  if (!text) return text;

  let result = text;

  // 1. Hyphenated forms first (e.g., "10-foot radius", "10-yard radius", "20-Fuß Radius")
  //    Must come before non-hyphenated to avoid partial matches
  result = result.replace(
    /(\d+(?:[.,]\d+)?)-(?:yards?|yds?\.?)/gi,
    (_, n) => `${formatMetric(parseFloat(n) * 0.9144)}-Meter`
  );
  result = result.replace(
    /(\d+(?:[.,]\d+)?)-(?:feet|foot|ft\.?|Fuß)/gi,
    (_, n) => `${formatMetric(parseFloat(n) * 0.3048)}-Meter`
  );

  // 2. Miles (before yards/feet to avoid "mile" matching "mi" prefix issues)
  result = result.replace(
    /(\d+(?:[.,]\d+)?)\s*(?:miles?|Meilen?)/gi,
    (_, n) => `${formatMetric(parseFloat(n) * 1.6093)} km`
  );

  // 3. Yards (before feet — longer unit name first)
  result = result.replace(
    /(\d+(?:[.,]\d+)?)\s*(?:yards?|yds?\.?)/gi,
    (_, n) => `${formatMetric(parseFloat(n) * 0.9144)} m`
  );

  // 4. Feet / Fuß
  result = result.replace(
    /(\d+(?:[.,]\d+)?)\s*(?:feet|foot|ft\.?|Fuß)/gi,
    (_, n) => `${formatMetric(parseFloat(n) * 0.3048)} m`
  );

  // 5. Pounds
  result = result.replace(
    /(\d+(?:[.,]\d+)?)\s*(?:lbs?\.?|pounds?)/gi,
    (_, n) => `${formatMetric(parseFloat(n) * 0.4536)} kg`
  );

  // 6. Inches
  result = result.replace(
    /(\d+(?:[.,]\d+)?)\s*(?:inches?|Zoll)/gi,
    (_, n) => `${formatMetric(parseFloat(n) * 2.54)} cm`
  );

  return result;
}
