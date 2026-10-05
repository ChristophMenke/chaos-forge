// Baut alle Charakter-spezifischen Karten: Referenzkarten (aktive Charaktere) +
// Epic-Item-Karten, mit je passendem Layout. Artwork via Imagen (gecacht).
import { chromium } from "playwright";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { supa, slug, fetchLearnedWizardSpells } from "./lib.mjs";
import { generateImage } from "./generate-image.mjs";
import { renderReferenceCard } from "./template-reference.mjs";
import { renderEpicCard } from "./template-epic.mjs";
import { TAROT_REF_FMT, TAROT_EPIC_FMT, IS_TAROT as TAROT, DIR_SUFFIX } from "./tarot.mjs";

const CW = TAROT ? TAROT_REF_FMT.W : 768, CH = TAROT ? TAROT_REF_FMT.H : 1146;
// Cache-Auflösungen je Format (Tarot etwas größer, damit Portrait/Art nicht hochskaliert werden).
const P_W = TAROT ? 898 : 768, P_H = TAROT ? 960 : 780;
const A_W = TAROT ? 898 : 768, A_H = TAROT ? 610 : 470;
// Bild-Cache wird von beiden Tarot-Profilen geteilt (identische Pixelmaße) —
// bewusst nicht DIR_SUFFIX, sonst würden alle Artworks neu generiert werden.
const SUF = TAROT ? "-tarot" : "";

const require = createRequire(import.meta.url);
const ab = require("./rules-js/abilities.js");
const racesMod = require("./rules-js/races.js");
const clsMod = require("./rules-js/classes.js");
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const env = Object.fromEntries(readFileSync(join(ROOT, ".env.local"), "utf8").split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const genai = new GoogleGenAI({ apiKey: env.GOOGLE_API_KEY });
const OUT = join(HERE, "out", TAROT ? `char-cards${DIR_SUFFIX}` : "char-cards");
const PORT = join(HERE, "cache", "portraits");
const ITEMART = join(HERE, "cache", "art-items");
[OUT, PORT, ITEMART].forEach((d) => mkdirSync(d, { recursive: true }));

const GROUP_ACCENT = {
  warrior: ["#e0524e", "#8f2f2b"], wizard: ["#3ec7bd", "#0d7d75"], rogue: ["#5b8def", "#2f4fa0"], priest: ["#e0b24e", "#a1782f"],
};
const sgn = (n) => (n >= 0 ? `+${n}` : `${n}`);
const titleCase = (s) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const STYLE = " — dark fantasy painterly digital illustration, deep indigo-purple atmosphere with teal and gold arcane light, dramatic lighting, highly detailed, no text, no letters, no words.";

async function portraitB64(c) {
  const f = join(PORT, `${slug(c.name)}${SUF}.webp`);
  if (!existsSync(f)) {
    const src = c.avatar_url
      ? Buffer.from(await (await fetch(c.avatar_url)).arrayBuffer())
      : readFileSync(join(ROOT, "public", "images", "races", `${c.race_id}.webp`)); // Fallback: Rassen-Artwork (kein KI-Gesicht)
    // Kleine Avatare (z. B. 400px) hochskalieren + schärfen für weniger Matsch.
    await sharp(src).resize(P_W, P_H, { fit: "cover", position: "top", kernel: "lanczos3" }).sharpen({ sigma: 1.1 }).webp({ quality: 92 }).toFile(f);
  }
  return readFileSync(f).toString("base64");
}
async function itemArtB64(slugKey, prompt) {
  const f = join(ITEMART, `${slugKey}${SUF}.webp`);
  const srcCache = join(ITEMART, `${slugKey}.src.webp`); // Original-Imagen-Bild (verlustarm, für Reslice ohne neue Quota)
  if (!existsSync(f)) {
    let srcBuf;
    const stdArt = join(ITEMART, `${slugKey}.webp`);
    if (existsSync(srcCache)) {
      srcBuf = readFileSync(srcCache);
    } else if (existsSync(stdArt)) {
      srcBuf = readFileSync(stdArt); // vorhandenes Standard-Art als Quelle (spart Imagen-Quota)
    } else {
      // Bilderzeugung über Gemini, siehe generate-image.mjs
      srcBuf = await generateImage(prompt + STYLE);
      await sharp(srcBuf).webp({ quality: 95 }).toFile(srcCache); // Original sichern
    }
    await sharp(srcBuf).resize(A_W, A_H, { fit: "cover", position: "attention" }).webp({ quality: 88 }).toFile(f);
  }
  return readFileSync(f).toString("base64");
}

function referenceData(c, portrait, castsWizard) {
  const group = clsMod.getClassGroup(c.class_id);
  const [accent, accent2] = GROUP_ACCENT[group] || GROUP_ACCENT.rogue;
  const S = ab.getStrengthModifiers(c.str, c.str_exceptional, c.str_muscle, c.str_stamina);
  const D = ab.getDexterityModifiers(c.dex, c.dex_aim, c.dex_balance);
  const C = ab.getConstitutionModifiers(c.con, c.con_health, c.con_fitness);
  const I = ab.getIntelligenceModifiers(c.int);
  const W = ab.getWisdomModifiers(c.wis);
  const H = ab.getCharismaModifiers(c.cha);
  const race = racesMod.getRace(c.race_id);
  const isCaster = group === "wizard" || castsWizard; // auch Multiclass-Zauberer (z. B. Nowi)
  const intLines = isCaster ? [`Spells L${I.spellLevel}`, `Learn ${I.chanceToLearn}%`, `Max ${I.maxSpellsPerLevel}/lvl`] : [`Languages ${I.numberOfLanguages}`];
  const wisLines = [`Magic Def ${sgn(W.magicalDefenseAdj)}`];
  const footer = [
    { label: "Movement", value: `${race?.baseMovement || 12}` },
    { label: "Perception", value: `${Math.floor((c.int + c.wis) / 2)}` },
  ];
  if (race?.infravision) footer.push({ label: "Infravision", value: `${Math.round(race.infravision * 0.3048)} m` });
  footer.push({ label: "Player", value: c.player_name || "—" });
  const traits = (c.traits || []).map((t) => t.name_en || t.name).filter(Boolean);
  if (traits.length) footer.push({ label: "Trait", value: traits.join(", ") });
  const raceName = race?.name_en || titleCase(c.race_id);
  const kl = clsMod.getClass ? clsMod.getClass(c.class_id) : null;
  return {
    name: c.name.replace(/\s*\(NPC\)/, ""),
    subtitle: `${raceName} ${kl?.name_en || titleCase(c.class_id)} · ${titleCase(c.alignment)}`,
    badge: c.level, accent, accent2, portraitB64: portrait,
    abilities: [
      { abbr: "STR", score: c.str, sub: c.str_muscle && c.str_muscle !== c.str ? `Mus ${c.str_muscle}` : "", lines: [`Hit ${sgn(S.hitAdj)}`, `Dmg ${sgn(S.dmgAdj)}`, `Doors ${S.openDoors}`, `Bend ${S.bendBars}%`] },
      { abbr: "DEX", score: c.dex, sub: c.dex_balance && c.dex_balance !== c.dex ? `Bal ${c.dex_balance}` : "", lines: [`Def ${sgn(D.defensiveAdj)}`, `Missile ${sgn(D.missileAdj)}`, `React ${sgn(D.reactionAdj)}`] },
      { abbr: "CON", score: c.con, sub: c.con_fitness && c.con_fitness !== c.con ? `Fit ${c.con_fitness}` : "", lines: [`HP ${sgn(C.hpAdj)}/HD`, `Shock ${C.systemShock}%`, `Res ${C.resurrectionSurvival}%`] },
      { abbr: "INT", score: c.int, sub: "", lines: intLines },
      { abbr: "WIS", score: c.wis, sub: "", lines: wisLines },
      { abbr: "CHA", score: c.cha, sub: "", lines: [`Henchmen ${H.maxHenchmen}`, `Loyalty ${sgn(H.loyaltyBase)}`, `React ${sgn(H.reactionAdj)}`] },
    ],
    footer,
  };
}

(async () => {
  const sb = supa();
  // Optionaler Filter: nur einen Charakter/Bearer generieren (z. B. --only=isolde).
  // Ist er gesetzt, entfällt der is_active-Filter — sonst käme man an inaktive
  // Charaktere wie Lady Catrina gar nicht heran.
  const ONLY = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1]?.toLowerCase();
  const q = sb.from("characters").select("*");
  const { data: chars } = await (ONLY ? q : q.eq("is_active", true));
  const byName = Object.fromEntries(chars.map((c) => [c.name, c]));

  // Klasse und Stufe stehen bei Multiclass-Charakteren in character_classes;
  // auf der characters-Zeile können class_id/level fehlen oder veraltet sein.
  for (const c of chars) {
    const { data: cls } = await sb
      .from("character_classes")
      .select("class_id,level,is_active")
      .eq("character_id", c.id)
      .order("level", { ascending: false });
    const primary = (cls || []).find((r) => r.is_active) || (cls || [])[0];
    if (primary) {
      if (!c.class_id) c.class_id = primary.class_id;
      if (!c.level || c.level < primary.level) c.level = primary.level;
    }
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: CW, height: CH }, deviceScaleFactor: 1 });
  const shot = async (html, file) => { await page.setContent(html, { waitUntil: "networkidle" }); await page.screenshot({ path: join(OUT, file), clip: { x: 0, y: 0, width: CW, height: CH } }); };

  // ── Referenzkarten ──
  for (const c of chars) {
    if (ONLY && !c.name.toLowerCase().includes(ONLY)) continue;
    const castsWizard = (await fetchLearnedWizardSpells(c.id)).length > 0;
    const data = referenceData(c, await portraitB64(c), castsWizard);
    await shot(renderReferenceCard({ ...data, fmt: TAROT ? TAROT_REF_FMT : undefined }), `reference-${slug(c.name)}.png`);
    console.log("✓ Referenz:", c.name, castsWizard ? "(Zauberer)" : "");
  }

  // ── Epic Items ──
  const epics = [];
  // Larry: Blade of Water
  {
    const { data: bl } = await sb.from("epic_items").select("*").eq("name", "Klinge des Wassers").single();
    const romans = ["I", "II", "III", "IV"];
    const stages = Object.keys(bl.damage_levels).filter((k) => k !== "0").sort((a, b) => +a - +b).map((k, i) => {
      const d = bl.damage_levels[k].description_en || "";
      const lv = d.match(/^Level ([\d-]+)/);
      return { roman: romans[i], levels: lv ? `Char. Level ${lv[1]}` : `Stage ${k}`, text: d.replace(/^Level [\d-]+:\s*/, "") };
    });
    epics.push({ file: "epic-blade-of-water.png", art: ["blade-of-water", "A magnificent longsword whose blade is formed of shimmering flowing enchanted water and pale blue arcane light, droplets and cold mist swirling around it, upright against dark stone"],
      item: { name: "Blade of Water", typeLabel: "Sword", bearer: "Larry", accent: "#4aa3e0", accent2: "#2560b8", footnote: "1 of 4 Elemental Blades",
        blocks: [
          { type: "stages", items: stages },
          { type: "text", heading: "Granted Powers", text: "Water Walk — stride across water as solid ground. Water Breathing — breathe underwater. Cone of Cold — 10d4+10 cold damage, save vs. spell for half." },
        ] } });
  }
  // Isolde: Shadowdancer (progressive Schatten-Kräfte)
  epics.push({ file: "epic-shadowdancer.png", art: ["shadowdancer", "A flowing hooded cloak of living shadow, its edges dissolving into wisps of black smoke and starless void, faint silver-blue arcane light tracing its folds, draped over dark stone in a torchlit dungeon"],
    item: { name: "Shadowdancer", typeLabel: "Cloak", bearer: "Isolde", accent: "#6b57d8", accent2: "#352a80", footnote: "Master of shadow and silence",
      blocks: [
        { type: "stages", items: [
          { roman: "I", levels: "Char. Level 3-4", text: "Vanish into shadows 3×/day — even while observed (a Hide check is still rolled)." },
          { roman: "II", levels: "Char. Level 5-6", text: "+10% Hide in Shadows & Move Silently. On a save vs. damage: unharmed on success, half on failure." },
          { roman: "III", levels: "Char. Level 7-8", text: "Shadow-travel 3×/day, up to 300 m (+20 m/level). Slip into any shadow to hide at will." },
          { roman: "IV", levels: "Char. Level 9-10", text: "By night or in darkness, shadow-travel without limit." },
        ] },
        { type: "text", heading: "Nature", text: "The shadows answer only their dancer. The cloak's gifts wane in bright daylight and wax strongest in gloom and dark." },
      ] } });
  // Isolde: Ring of Many Faces (progressive Gestaltwandlung)
  epics.push({ file: "epic-ring-of-many-faces.png", art: ["ring-of-many-faces-v3", "A plain wide silver band ring lying on dark worn leather, shown at a three-quarter angle, NO gemstone and NO large bezel; the entire broad outer surface of the band is carved in fine relief with a continuous row of distinct portrait faces of classic Dungeons and Dragons fantasy races side by side around the band: a stout bearded dwarf man with a broad ruddy face and deep-set eyes; a slender elven woman with long pointed ears, angular delicate features and almond-shaped eyes and no beard; a small round-cheeked halfling man with short curly hair; a gnome man with a large bulbous nose and a neat pointed beard; a burly half-orc with grey-green skin, a heavy sloping brow, a jutting jaw and small protruding lower tusks; an ordinary bearded human man; each carved face detailed distinct and recognizable, delicate silver engraving, faint violet arcane glow catching in the recesses, understated old-school fantasy magic item"],
    item: { name: "Ring of Many Faces", typeLabel: "Ring", bearer: "Isolde", accent: "#5b8def", accent2: "#2f4fa0", footnote: "A thousand faces, one bearer",
      blocks: [
        { type: "stages", items: [
          { roman: "I", levels: "Char. Level 3-4", text: "Alter Self 2×/day — form and voice hold until you release them." },
          { roman: "II", levels: "Char. Level 5-6", text: "Change Self 2×/day — form and voice hold until released." },
          { roman: "III", levels: "Char. Level 7-8", text: "Change Self can now mimic specific, real people." },
          { roman: "IV", levels: "Char. Level 9-10", text: "Polymorph Self 2×/day." },
        ] },
        { type: "text", heading: "Guise", text: "Sight and sound shift as one — face, build and voice. A chosen form holds effortlessly until its bearer wills it away." },
      ] } });
  // Nowi: Tricksters Choice (Portal-Würfel, Zielort wächst mit der Stufe)
  epics.push({ file: "epic-tricksters-choice.png", art: ["tricksters-choice-v4", "Product photo of exactly ONE single ordinary six-sided die (a plain cube-shaped D6, identical in shape to a Vegas casino die or a Monopoly die), nothing else in the scene, solid silver metal, perfectly square flat faces, sharp 90-degree cube corners and edges, sitting alone on a dark wooden table, faint blue magical glow emanating from within the cube. Each visible flat face is engraved with ONE small abstract magical rune symbol (angular sigil glyphs, like ancient runic alphabet letters) — absolutely NO digits, NO numerals, NO number pips, NO dots; only rune-like symbols. IMPORTANT: only one object, a plain cube — NOT a D20, NOT a gemstone, NOT a crystal, NOT a polyhedral dice, NOT two dice"],
    item: { name: "Tricksters Choice", typeLabel: "Trinket", bearer: "Nowi", accent: "#c77dd9", accent2: "#7a3d94", footnote: "A planeswalker's gift, 3×/day",
      blocks: [
        { type: "stages", items: [
          { roman: "I", levels: "Char. Level 3-4", text: "Opens a portal to an extradimensional chest — 50 kg capacity." },
          { roman: "II", levels: "Char. Level 5-6", text: "The chest's capacity grows to 150 kg." },
          { roman: "III", levels: "Char. Level 7-8", text: "The portal now leads to an extradimensional cottage — room for 6, plus an invisible servant." },
          { roman: "IV", levels: "Char. Level 9-10", text: "The portal leads to an extradimensional house — room for 20, an invisible servant, and food for every guest (vanishes if removed)." },
        ] },
        { type: "text", heading: "Nature", text: "A small silver d6, forged by one of the mightiest planeswalkers ever for a good friend. Bonded through touch and use, each face unlocks in turn — but always opens the same three-times-daily portal." },
      ] } });
  // Nowi: Netherese Blooded (Magier-Bluterbe, Bonus-Spellpoints + Zauber-Sonderfähigkeiten)
  epics.push({ file: "epic-netherese-blooded.png", art: ["netherese-blooded-v2", "A single suspended droplet of glowing violet-blue magical blood at the center, glowing ancient Netherese arcane sigils and runes spiraling around it, ghostly violet-blue magical script hovering in the air, faint silver starlight, the blurred ruins of a sunken magical empire in the soft background"],
    item: { name: "Netherese Blooded", typeLabel: "Bloodline", bearer: "Nowi", accent: "#3ec7bd", accent2: "#0d7d75", footnote: "Wizards only · +2 spell points / level",
      blocks: [
        { type: "text", heading: "Awakened Heritage", text: "The blood of sunken Netheril's mage-empire grants a permanent bonus of level ×2 spell points." },
        { type: "stages", items: [
          { roman: "I", levels: "Char. Level 3-4", text: "3×/day, cast a spell you haven't stored, paying only the stored (fixed) cost." },
          { roman: "II", levels: "Char. Level 5-6", text: "2×/day, maximize a spell's range, damage and duration." },
          { roman: "III", levels: "Char. Level 7-8", text: "3×/day, cast a spell as if 1-2 levels higher (Magick cost scales with spell level — see character sheet)." },
          { roman: "IV", levels: "Char. Level 9-10", text: "Convert hit points into spell points (1 HP = 2 SP). Free level-1 spells now cost only 4 SP." },
        ] },
      ] } });
  // Sprocket: Constitution Condenser
  {
    const conByStage = [["0", "18"], ["1", "17"], ["2", "16"], ["3", "15"], ["4", "14"], ["5", "12"], ["6", "10"], ["7", "8"], ["8", "5"]];
    epics.push({ file: "epic-constitution-condenser.png", art: ["constitution-condenser-v3", "A compact round brass-and-glass device shaped like an ornate belt buckle, fastening a wide leather adventurer's belt at the waist, a glowing red magical crystal at its center connected by a spiral of copper wires, brass fittings rivets and valves, worn flat against the body as a buckle, pulsing with a faint red glow"],
      item: { name: "Constitution Condenser", typeLabel: "Device", bearer: "Sprocket", accent: "#d9484e", accent2: "#8f2b2f", footnote: "Raises CON to 18 while intact",
        blocks: [
          { type: "track", label: "Constitution by damage stage (0 = intact → 8 = failed)", pips: conByStage.map(([k, v]) => ({ k, v })) },
          { type: "text", heading: "Overclock", text: "For 1 hour the engine forces CON to 20 and heals 1 HP/hour, but poison saves worsen by 1. Needs a successful Engineering check." },
          { type: "text", heading: "Fragility", text: "Whenever Sprocket makes a physical saving throw, 50% chance the device takes one damage stage (−2% per character level)." },
        ] } });
  }
  // Sprocket: Sharpvision Goggles
  epics.push({ file: "epic-sharpvision-goggles.png", art: ["sharpvision-goggles", "A pair of ornate brass goggles with fine silver wire and polished crystal lenses glinting with a faint magical sheen, resting on dark leather"],
    item: { name: "Sharpvision Goggles", typeLabel: "Eyewear", bearer: "Sprocket", accent: "#3ec7bd", accent2: "#0d7d75", footnote: "Polished brass & silver",
      blocks: [
        { type: "text", heading: "Effect", text: "+2 to all sight-based perception checks — spotting hidden doors, distant movement, fine detail and forgeries." },
        { type: "text", heading: "Weakness", text: "The delicate lenses and mechanisms are fragile: a blow to the head or a hard fall may damage or shatter them." },
        { type: "text", heading: "Craft", text: "Polished brass and fine silver wire, ground to Sprocket's own prescription — as much a tinkerer's pride as a tool." },
      ] } });
  // Sprocket: Mix-and-Match Blades
  epics.push({ file: "epic-mix-and-match-blades.png", art: ["mix-and-match-blades-v5", "A fan of four throwing daggers floating in mid-air in a torchlit dungeon, each blade forged of clear fragile translucent glass meant to shatter on impact, light refracting through the glass blades, each hilt set with a glowing alchemical vial of liquid — one red, one blue, one green, one purple — one glass blade caught mid-shatter bursting into shards and spraying its colored potion, arcane sparks"],
    item: { name: "Mix-and-Match Blades", typeLabel: "Throwing Blades", bearer: "Sprocket", accent: "#9aa7b5", accent2: "#4f5b6a", footnote: "Dagger · Dmg 1d4 (S-M) / 1d3 (L) · THAC0 17 melee / 16 thrown",
      blocks: [
        { type: "text", heading: "Four alchemical knives", text: "Prepare up to four blades, each loaded with one mixture:" },
        { type: "rows", items: [
          { color: "#ef4444", name: "Smoke Bomb", meta: "4× · 1 rd", text: "Dense red smoke cloud obstructs vision and distracts enemies." },
          { color: "#3b82f6", name: "Frostburn", meta: "3× · 1 rd", text: "Evaporating liquid delivers a cold shock, briefly taking the breath away." },
          { color: "#22c55e", name: "Blinding Dye", meta: "3× · 1d4 rd", text: "Sticky luminous dye severely impairs or fully blinds the target." },
          { color: "#a855f7", name: "Narcosis", meta: "1× · 1d4 rd", text: "Fast narcotic; a hit on unprotected skin leaves the target dazed." },
        ] },
      ] } });

  for (const e of epics) {
    if (ONLY && !e.item.bearer.toLowerCase().includes(ONLY)) continue;
    const artB64 = await itemArtB64(e.art[0], e.art[1]);
    await shot(renderEpicCard(e.item, { artB64, fmt: TAROT ? TAROT_EPIC_FMT : undefined }), e.file);
    console.log("✓ Epic:", e.item.name);
  }

  await browser.close();
  console.log(`\nFertig → out/char-cards/`);
})();
