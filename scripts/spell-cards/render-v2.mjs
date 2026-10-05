// Rendert v2-Musterkarten (Text via Opus, Bild via Imagen, App-Palette).
import { chromium } from "playwright";
import { mkdirSync, rmSync, readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { fetchIllusionistDeck, slug, englishName } from "./lib.mjs";
import { getContent } from "./content.mjs";
import { renderCardV2 } from "./template-v2.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "out", "sample-v2");
const preview = process.argv.includes("--preview");

const SAMPLE_NAMES = ["Change Self", "Shadow Monsters", "Color Spray", "Mirror Image", "Wind Wall", "Magic Missile"];

(async () => {
  const deck = await fetchIllusionistDeck({ maxLevel: 4 });
  const picks = SAMPLE_NAMES.map((n) => deck.find((s) => englishName(s) === n)).filter(Boolean);
  console.log(`v2-Muster: ${picks.length} Zauber`);

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 768, height: 1146 }, deviceScaleFactor: 1 });
  const index = [];

  for (const s of picks) {
    process.stdout.write(`  ${englishName(s)} … `);
    const { rules, artPath, stats } = await getContent(s);
    const artB64 = readFileSync(artPath).toString("base64");
    await page.setContent(renderCardV2(s, { rules, artB64, stats, preview }), { waitUntil: "networkidle" });
    const file = `L${s.level}-${slug(englishName(s))}.png`;
    await page.screenshot({ path: join(OUT, file), clip: { x: 0, y: 0, width: 768, height: 1146 } });
    index.push({ file, name: englishName(s), level: s.level, school: s.school, rules, chars: rules.length });
    console.log(`✓ (${rules.length} chars)`);
  }
  writeFileSync(join(OUT, "index.json"), JSON.stringify(index, null, 2));
  await browser.close();
  console.log(`\n→ ${OUT}`);
})();
