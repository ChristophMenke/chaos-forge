// Regeneriert gezielt die Bilder einzelner Zauber (per Name).
// node regen-art.mjs "Fly" "Water Breathing" ...
import { fetchIllusionistDeck, fetchLearnedWizardSpells, fetchCharacters, englishName } from "./lib.mjs";
import { getContent } from "./content.mjs";

const names = process.argv.slice(2);
const spr = await fetchIllusionistDeck({ maxLevel: 4 });
const chars = await fetchCharacters();
const nowi = chars.find((c) => c.name.includes("Nowi"));
const now = await fetchLearnedWizardSpells(nowi.id);
const all = new Map(); [...spr, ...now].forEach((s) => all.set(s.id, s));
const deck = [...all.values()];

for (const nm of names) {
  const s = deck.find((x) => englishName(x) === nm);
  if (!s) { console.log(`? ${nm} nicht gefunden`); continue; }
  try {
    await getContent(s, { regenArt: true });
    console.log(`✓ Bild neu: ${nm}`);
  } catch (e) { console.log(`⚠ ${nm}: ${e.message.slice(0, 120)}`); }
}
