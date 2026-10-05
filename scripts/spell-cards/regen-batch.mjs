// Batch-Regeneration:
//  1. Regeltext + Stats für ALLE Deck-Zauber neu (Saving-Throw-Typ in Tabelle,
//     kein Save-Typ mehr im Fließtext, Erase-Korrektur) — mit Nebenläufigkeit.
//  2. Artwork nur für die im Feedback beanstandeten Zauber neu.
// Danach separat rendern (generate-deck / build-char-cards / portrait-back).
import { fetchIllusionistDeck, fetchLearnedWizardSpells, fetchCharacters, englishName } from "./lib.mjs";
import { getContent } from "./content.mjs";

const ART_REGEN = new Set([
  "Change Self", "Comprehend Languages", "Enlarge", "Hold Portal", "Sleep", "Spider Climb",
  "Taunt", "ESP", "Fog Cloud", "Invisibility", "Hold Person", "Water Breathing", "Wind Wall",
  "Leomund's Secure Shelter", "Massmorph", "Monster Summoning II", "Polymorph Other", "Solid Fog",
  "Fireball", "Dig",
]);

async function pool(items, size, fn) {
  const q = [...items.entries()];
  let done = 0;
  const worker = async () => {
    while (q.length) {
      const [i, it] = q.shift();
      try { await fn(it, i); } catch (e) { console.log(`  ⚠ ${englishName(it)}: ${e.message}`); }
      done++;
      if (done % 15 === 0 || done === items.length) console.log(`  Text ${done}/${items.length}`);
    }
  };
  await Promise.all(Array.from({ length: size }, worker));
}

(async () => {
  const spr = await fetchIllusionistDeck({ maxLevel: 4 });
  const chars = await fetchCharacters();
  const now = await fetchLearnedWizardSpells(chars.find((c) => c.name.includes("Nowi")).id);
  const all = new Map();
  for (const s of [...spr, ...now]) all.set(englishName(s), s);
  const list = [...all.values()];
  console.log(`Regen Text für ${list.length} Zauber (Nebenläufigkeit 6) …`);
  await pool(list, 6, (s) => getContent(s, { regenText: true }));

  const artSpells = list.filter((s) => ART_REGEN.has(englishName(s)));
  console.log(`\nRegen Artwork für ${artSpells.length} Zauber …`);
  let n = 0;
  for (const s of artSpells) {
    await getContent(s, { regenArt: true });
    console.log(`  ✓ ${englishName(s)} (${++n}/${artSpells.length})`);
  }
  const missing = [...ART_REGEN].filter((nm) => !all.has(nm));
  if (missing.length) console.log("  ⚠ nicht im Deck gefunden:", missing.join(", "));
  console.log("\nFertig. Jetzt rendern.");
})();
