/**
 * Pick the localized text based on the current locale.
 * Falls back to German (de) if no English text is available.
 */
export function localized(de: string, en: string | null | undefined, locale: string): string {
  return locale === "en" && en ? en : de;
}

const GENDER_MAP: Record<string, { de: string; en: string }> = {
  männlich: { de: "Männlich", en: "Male" },
  weiblich: { de: "Weiblich", en: "Female" },
  male: { de: "Männlich", en: "Male" },
  female: { de: "Weiblich", en: "Female" },
  divers: { de: "Divers", en: "Non-binary" },
  "non-binary": { de: "Divers", en: "Non-binary" },
  nonbinary: { de: "Divers", en: "Non-binary" },
};

/**
 * Translate a free-text gender value based on locale.
 * Falls back to the original value if no mapping exists.
 */
export function translateGender(gender: string, locale: string): string {
  const entry = GENDER_MAP[gender.toLowerCase()];
  if (!entry) return gender;
  return locale === "en" ? entry.en : entry.de;
}
