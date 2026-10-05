// Rendert 2 Muster für Larry: Helden-Referenzkarte + Epic-Item (Blade of Water).
import { chromium } from "playwright";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { supa } from "./lib.mjs";
import { renderReferenceCard } from "./template-reference.mjs";
import { renderEpicCard } from "./template-epic.mjs";

const require = createRequire(import.meta.url);
const ab = require("./rules-js/abilities.js");
const racesMod = require("./rules-js/races.js");
const HERE = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(readFileSync(join(HERE, "..", "..", ".env.local"), "utf8").split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const genai = new GoogleGenAI({ apiKey: env.GOOGLE_API_KEY });
const OUT = join(HERE, "out", "char-samples");
const PORT = join(HERE, "cache", "portraits");
const ITEMART = join(HERE, "cache", "art-items");
mkdirSync(OUT, { recursive: true }); mkdirSync(ITEMART, { recursive: true });

async function downloadPortrait(name, url) {
  const f = join(PORT, `${name}.webp`);
  if (existsSync(f)) return f;
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  await sharp(buf).resize(768, 520, { fit: "cover", position: "top" }).webp({ quality: 88 }).toFile(f);
  return f;
}
async function genItemArt(slug, prompt) {
  const f = join(ITEMART, `${slug}.webp`);
  if (existsSync(f)) return f;
  const style = " — dark fantasy painterly digital illustration, dramatic arcane lighting, atmospheric, highly detailed, no text, no letters, no words.";
  const r = await genai.models.generateImages({ model: "imagen-4.0-generate-001", prompt: prompt + style, config: { numberOfImages: 1, aspectRatio: "4:3" } });
  const b64 = r.generatedImages?.[0]?.image?.imageBytes;
  if (!b64) throw new Error("no item art");
  await sharp(Buffer.from(b64, "base64")).resize(768, 470, { fit: "cover", position: "attention" }).webp({ quality: 88 }).toFile(f);
  return f;
}

(async () => {
  const sb = supa();
  const { data: c } = await sb.from("characters").select("*").eq("name", "Larry").single();
  const { data: blade } = await sb.from("epic_items").select("*").eq("name", "Klinge des Wassers").single();

  // ── Referenzkarte ──
  const S = ab.getStrengthModifiers(c.str, c.str_exceptional, c.str_muscle, c.str_stamina);
  const D = ab.getDexterityModifiers(c.dex, c.dex_aim, c.dex_balance);
  const C = ab.getConstitutionModifiers(c.con, c.con_health, c.con_fitness);
  const I = ab.getIntelligenceModifiers(c.int);
  const W = ab.getWisdomModifiers(c.wis);
  const H = ab.getCharismaModifiers(c.cha);
  const sgn = (n) => (n >= 0 ? `+${n}` : `${n}`);
  const race = racesMod.getRace(c.race_id);
  const refData = {
    name: c.name, subtitle: "Human Fighter · Chaotic Good", badge: c.level,
    accent: "#e0524e", accent2: "#8f2f2b", // Warrior-Rot
    portraitB64: readFileSync(await downloadPortrait("larry", c.avatar_url)).toString("base64"),
    abilities: [
      { abbr: "STR", score: c.str, sub: c.str_muscle && c.str_muscle !== c.str ? `Mus ${c.str_muscle}` : "", lines: [`Hit ${sgn(S.hitAdj)}`, `Dmg ${sgn(S.dmgAdj)}`, `Doors ${S.openDoors}`, `Bend ${S.bendBars}%`] },
      { abbr: "DEX", score: c.dex, sub: c.dex_balance && c.dex_balance !== c.dex ? `Bal ${c.dex_balance}` : "", lines: [`Def ${sgn(D.defensiveAdj)}`, `Missile ${sgn(D.missileAdj)}`, `React ${sgn(D.reactionAdj)}`] },
      { abbr: "CON", score: c.con, sub: c.con_fitness && c.con_fitness !== c.con ? `Fit ${c.con_fitness}` : "", lines: [`HP ${sgn(C.hpAdj)}/HD`, `Shock ${C.systemShock}%`, `Res ${C.resurrectionSurvival}%`] },
      { abbr: "INT", score: c.int, sub: "", lines: [`Languages ${I.numberOfLanguages}`] },
      { abbr: "WIS", score: c.wis, sub: "", lines: [`Magic Def ${sgn(W.magicalDefenseAdj)}`] },
      { abbr: "CHA", score: c.cha, sub: "", lines: [`Henchmen ${H.maxHenchmen}`, `Loyalty ${sgn(H.loyaltyBase)}`, `React ${sgn(H.reactionAdj)}`] },
    ],
    footer: [
      { label: "Movement", value: `${race?.baseMovement || 12}` },
      { label: "Perception", value: `${Math.floor((c.int + c.wis) / 2)}` },
      { label: "Languages", value: `${I.numberOfLanguages}` },
      { label: "Player", value: c.player_name || "—" },
    ],
  };

  // ── Epic-Item-Karte ──
  const dl = blade.damage_levels || {};
  const romans = ["I", "II", "III", "IV", "V"];
  const stages = Object.keys(dl).filter((k) => k !== "0").sort((a, b) => +a - +b).map((k, i) => {
    const desc = (dl[k].description_en || dl[k].description || "").replace(/^Level ([\d-]+):\s*/, "");
    const lvMatch = (dl[k].description_en || "").match(/^Level ([\d-]+)/);
    return { roman: romans[i], levels: lvMatch ? `Char. Level ${lvMatch[1]}` : `Stage ${k}`, text: desc };
  });
  const itemData = { name: blade.name_en || "Blade of Water", typeLabel: "Sword", bearer: "Larry", accent: "#4aa3e0", accent2: "#2560b8",
    stages, footnote: "1 of 4 Elemental Blades" };
  const artB64 = readFileSync(await genItemArt("blade-of-water",
    "A magnificent longsword whose blade is formed of shimmering flowing enchanted water and pale blue arcane light, droplets and cold mist swirling around it, displayed upright against a dark stone background")).toString("base64");

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 768, height: 1146 }, deviceScaleFactor: 1 });
  await page.setContent(renderReferenceCard(refData), { waitUntil: "networkidle" });
  await page.screenshot({ path: join(OUT, "reference-larry.png"), clip: { x: 0, y: 0, width: 768, height: 1146 } });
  await page.setContent(renderEpicCard(itemData, { artB64 }), { waitUntil: "networkidle" });
  await page.screenshot({ path: join(OUT, "epic-blade-of-water.png"), clip: { x: 0, y: 0, width: 768, height: 1146 } });
  await browser.close();
  console.log("→ out/char-samples/ (reference-larry.png, epic-blade-of-water.png)");
})();
