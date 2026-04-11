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

  // 1. Hyphenated adjective forms (e.g., "10-foot radius", "20-Fuß Radius").
  //    Must come before non-hyphenated AND before range forms — the range
  //    patterns below require a NUMBER after the dash, so "10-foot" (word
  //    after dash) is unaffected by them. These adjective patterns, however,
  //    require a WORD directly after the dash.
  result = result.replace(
    /(\d+(?:[.,]\d+)?)-(?:yards?|yds?\.?)/gi,
    (_, n) => `${formatMetric(parseFloat(n) * 0.9144)}-Meter`
  );
  result = result.replace(
    /(\d+(?:[.,]\d+)?)-(?:feet|foot|ft\.?|Fuß)/gi,
    (_, n) => `${formatMetric(parseFloat(n) * 0.3048)}-Meter`
  );

  // 2. Range forms (e.g., "150-200 pounds", "5-10 feet"). Matches only when
  //    two numbers flank the dash. Must come before single-value patterns
  //    to avoid partial matches like "150-90,7 kg" where only "200 pounds"
  //    gets converted.
  result = result.replace(
    /(\d+(?:[.,]\d+)?)-(\d+(?:[.,]\d+)?)\s*(?:miles?|Meilen?)/gi,
    (_, a, b) =>
      `${formatMetric(parseFloat(a) * 1.6093)}-${formatMetric(parseFloat(b) * 1.6093)} km`
  );
  result = result.replace(
    /(\d+(?:[.,]\d+)?)-(\d+(?:[.,]\d+)?)\s*(?:yards?|yds?\.?)/gi,
    (_, a, b) => `${formatMetric(parseFloat(a) * 0.9144)}-${formatMetric(parseFloat(b) * 0.9144)} m`
  );
  result = result.replace(
    /(\d+(?:[.,]\d+)?)-(\d+(?:[.,]\d+)?)\s*(?:feet|foot|ft\.?|Fuß)/gi,
    (_, a, b) => `${formatMetric(parseFloat(a) * 0.3048)}-${formatMetric(parseFloat(b) * 0.3048)} m`
  );
  result = result.replace(
    /(\d+(?:[.,]\d+)?)-(\d+(?:[.,]\d+)?)\s*(?:lbs?\.?|pounds?)/gi,
    (_, a, b) =>
      `${formatMetric(parseFloat(a) * 0.4536)}-${formatMetric(parseFloat(b) * 0.4536)} kg`
  );
  result = result.replace(
    /(\d+(?:[.,]\d+)?)-(\d+(?:[.,]\d+)?)\s*(?:inches?|Zoll)/gi,
    (_, a, b) => `${formatMetric(parseFloat(a) * 2.54)}-${formatMetric(parseFloat(b) * 2.54)} cm`
  );

  // 3. Miles (before yards/feet to avoid "mile" matching "mi" prefix issues)
  result = result.replace(
    /(\d+(?:[.,]\d+)?)\s*(?:miles?|Meilen?)/gi,
    (_, n) => `${formatMetric(parseFloat(n) * 1.6093)} km`
  );

  // 4. Yards (before feet — longer unit name first)
  result = result.replace(
    /(\d+(?:[.,]\d+)?)\s*(?:yards?|yds?\.?)/gi,
    (_, n) => `${formatMetric(parseFloat(n) * 0.9144)} m`
  );

  // 5. Feet / Fuß
  result = result.replace(
    /(\d+(?:[.,]\d+)?)\s*(?:feet|foot|ft\.?|Fuß)/gi,
    (_, n) => `${formatMetric(parseFloat(n) * 0.3048)} m`
  );

  // 6. Pounds
  result = result.replace(
    /(\d+(?:[.,]\d+)?)\s*(?:lbs?\.?|pounds?)/gi,
    (_, n) => `${formatMetric(parseFloat(n) * 0.4536)} kg`
  );

  // 7. Inches
  result = result.replace(
    /(\d+(?:[.,]\d+)?)\s*(?:inches?|Zoll)/gi,
    (_, n) => `${formatMetric(parseFloat(n) * 2.54)} cm`
  );

  return result;
}
