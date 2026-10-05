// Erzeugt (und cacht) pro Zauber: zweckoptimierten Kartentext (Zeichenlimit) +
// Effekt-Bild. Ein Opus-Aufruf liefert rules + art-prompt; Imagen macht das Bild.
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { generateImage } from "./generate-image.mjs";
import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { supa, englishName, englishDescription, translateField, convertImperialText, localizeSave, schoolInfo } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE = join(HERE, "cache");
const ART = join(CACHE, "art");
mkdirSync(ART, { recursive: true });

const env = Object.fromEntries(
  readFileSync(join(HERE, "..", "..", ".env.local"), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

export const RULES_CHAR_LIMIT = 480; // hartes Limit → einheitliche Schriftgröße, nutzt den Platz

// ── Text-Cache ────────────────────────────────────────────────────────────────
const TEXT_CACHE_FILE = join(CACHE, "content.json");
function loadTextCache() {
  return existsSync(TEXT_CACHE_FILE) ? JSON.parse(readFileSync(TEXT_CACHE_FILE, "utf8")) : {};
}
function saveTextCache(c) {
  writeFileSync(TEXT_CACHE_FILE, JSON.stringify(c, null, 2));
}

// Atomarer Merge-Write (frisch von Disk laden, einen Key setzen, schreiben) — über
// eine Promise-Kette serialisiert, damit nebenläufige getContent-Aufrufe sich nicht
// gegenseitig überschreiben (Lost Updates bei Read-Modify-Write auf content.json).
let cacheWriteLock = Promise.resolve();
function persistEntry(id, entry) {
  cacheWriteLock = cacheWriteLock.then(() => {
    const fresh = loadTextCache();
    fresh[id] = entry;
    saveTextCache(fresh);
  });
  return cacheWriteLock;
}

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

// Autoritative Stat-Korrekturen aus dem echten PHB (build-phb-override.mjs) —
// behebt den systematischen DB-Bug (Yards als Fuß gespeichert → Range 3× zu kurz;
// Turns als Runden → Duration 10× zu kurz). Nur abweichende Felder je Zauber-ID.
// NO_PHB_OVERRIDE=1 → Override ignorieren (nötig beim Generieren des Overrides
// selbst, sonst liest der Generator sein eigenes Output = Feedback-Loop).
const PHB_OVERRIDE = process.env.NO_PHB_OVERRIDE
  ? {}
  : existsSync(join(CACHE, "phb-override.json"))
    ? JSON.parse(readFileSync(join(CACHE, "phb-override.json"), "utf8"))
    : {};
// Handverifizierte Einzelkorrekturen (per englishName), die der Auto-Override nicht abdeckt.
const MANUAL_STAT = {
  Bind: { saving_throw: "None" }, // PHB: kein Rettungswurf (Karte hatte fälschlich "vs. Spell")
  Identify: { area_of_effect: "1 item/level", casting_time: "Special (8 h prep)" },
  // Vom Auto-Matcher verpasst (OCR-Schreibfehler "Ilusion" bzw. Substring), per PHB-Rohtext verifiziert:
  "Change Self": { duration: "2d6 rds. + 2 rds./level" }, // war fälschlich +1/level
  "Leomund's Tiny Hut": { area_of_effect: "4.6 m diameter sphere" }, // war 15-m
  "Hallucinatory Terrain": { range: "18.3 m/level", duration: "1 hr./level", area_of_effect: "9.1 m cube/level" },
  "Monster Summoning II": { range: "36.6 m" }, // interpoliert: MS I 27.4 m, MS III 45.7 m
};

const CONTENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["rules", "art", "stats"],
  properties: {
    rules: { type: "string", description: `Card rules text, English, MAX ${RULES_CHAR_LIMIT} characters.` },
    art: { type: "string", description: "Vivid visual scene of the spell's effect for an illustrator. No text/words." },
    stats: {
      type: "object",
      additionalProperties: false,
      required: ["casting_time", "range", "duration", "area_of_effect", "saving_throw", "components"],
      description: "Canonical AD&D 2e stat-block values (English, metric), used only to fill empty/corrupt DB fields.",
      properties: {
        casting_time: { type: "string" },
        range: { type: "string", description: "metric, e.g. '18.3 m + 3 m/level', 'Touch', '0'" },
        duration: { type: "string", description: "e.g. '2d6 rds. + 2 rds./level', 'Instantaneous', 'Permanent'" },
        area_of_effect: { type: "string", description: "metric" },
        saving_throw: {
          type: "string",
          description:
            "The saving throw for the stat table — ALWAYS state the CATEGORY the target rolls against when a save is allowed, plus the short result. Use AD&D 2e categories: 'vs. Spell', 'vs. Death Magic', 'vs. Petrification', 'vs. Breath Weapon', 'vs. Paralyzation', 'vs. Poison', 'vs. Rod/Staff/Wand'. Examples: 'vs. Spell (neg.)', 'vs. Spell (½)', 'vs. Death Magic', 'vs. Breath (½)', 'None', 'Special'. Most wizard spells that allow a save use 'vs. Spell'.",
        },
        components: { type: "array", items: { type: "string", enum: ["V", "S", "M"] } },
      },
    },
  },
};

// Bereinigt Kartentext: literale \uXXXX-Escapes dekodieren, Symbole normalisieren,
// sauberes Satzende. Wird auch auf gecachte Einträge angewandt (kein Re-Billing).
export function cleanRules(text) {
  let t = (text || "")
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  t = t.replace(/[;:,]\s*$/, "."); // Semikolon/Komma-Ende → Punkt
  if (t && !/[.!?"')\]]$/.test(t)) t += "."; // fehlender Schlusspunkt
  return t;
}

function truncateToLimit(text, limit) {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "));
  return (lastStop > limit * 0.5 ? cut.slice(0, lastStop + 1) : cut.trim().replace(/[,;:]?\s*\S*$/, "")).trim();
}

// Gezielte Kanon-Korrekturen für im QA-Audit gefundene Regelfehler/Lücken.
const TEXT_CORRECTIONS = {
  Forget:
    "Forget affects 1 creature plus 1 more per three caster levels above 1st; EACH target gets a save vs. spell at -2 to negate; a failed save makes the victim forget the events of the previous 5 minutes. Do NOT scale the forgotten time by level.",
  Knock:
    "Knock ONLY opens: it undoes one lock, or one hold portal / arcane (wizard) lock, or lifts one bar or bolt, per casting. It has NO locking or reversing function — never mention locking.",
  "Dimension Door":
    "Do not give a per-level metric distance that conflicts with the printed Range. Canon: the caster (and carried gear up to the weight limit) instantly steps through a magical door to a chosen point a known distance away and can act normally on arrival; if the destination is inside a solid object the caster is trapped and takes heavy damage.",
  "Polymorph Other":
    "Add the key risks: the victim must make a system-shock survival roll or die from the transformation, and an Intelligence check each turn or permanently adopt the new form's mind/instincts, losing its own personality. It gains the new form's physical capabilities; lasts until dispelled.",
  "Polymorph Self":
    "Add that assuming a form very unlike the caster's may require a system-shock survival roll. The caster keeps their own mind and hit points, gains the form's movement and physical (not special/magical) abilities, and can revert at will.",
  "Charm Person":
    "State the duration mechanic: the charm lasts until broken; the victim makes a new saving throw to break free at intervals set by its Intelligence (the smarter it is, the more often it checks). It treats the caster as a trusted friend but will not obey obviously suicidal orders.",
  "Sepia Snake Sigil":
    "Add that the sigil is inscribed on a written surface and springs only when read by someone other than the caster, trapping that reader in rigid amber stasis for 1d4 days + 1 day per level (no aging, food, or air needed); the reader must be lured into reading it.",
  "Phantasmal Force":
    "Add resolution of illusory harm: a creature that believes the illusion can be 'slain' by it but merely falls unconscious/incapacitated (the damage is not real hp loss); a viewer who interacts or is warned gets a save vs. spell to disbelieve, revealing it as false.",
  Jump:
    "State the distances (about 9 m forward, or 3 m straight up or backward) and that the spell grants a number of such jumps that scales with caster level; landing safely is not guaranteed.",
  Misdirection:
    "Include the resistance: the creature attempting the information-gathering divination may resist, and on a successful save it realizes the reading is false or misdirected. State this save-effect without naming the save category.",
  "Tasha's Hideous Laughter":
    "Include that a successful save completely negates the effect (the target does not succumb to the laughter). State the save-effect without naming the category.",
  "Phantasmal Killer":
    "Include the DISBELIEF mechanic: each round the victim may attempt to disbelieve the phantasm (aided by high Wisdom/Intelligence), and success dispels it. If the killer hits, the victim must save or die of fright; a successful save instead inflicts 3d6 damage. Do NOT name the save categories (the table shows them).",
  "Darkness, 15' Radius":
    "This spell allows NO saving throw — never mention a save. Describe the globe of utter magical darkness that blots out normal sight AND infravision within its radius, that it may be centered on a point, object, or creature, and that a light spell of equal level cancels it.",
  "Alter Self":
    "This spell allows NO saving throw — never mention a save. It is a self-only minor shapechange into any man-shaped bipedal form; keep the size range, that it grants none of the form's special abilities, and that touch or close inspection can reveal the disguise.",
  "Flame Arrow":
    "This spell allows NO saving throw; the fiery effect is resolved with normal ranged attack rolls, not a save. Cover BOTH modes: (1) touching arrows/bolts so the next volley (1 per 5 levels can be enchanted) bursts into flame, adding fire damage and igniting combustibles; (2) creating fiery darts hurled at targets with an attack roll for fire damage that scales with level. Never mention a save.",
  Tongues:
    "Normal use allows NO saving throw — never mention a save. The caster understands and speaks any one spoken language at a time (not written); the reversed form instead garbles communication.",
  "Detect Scrying":
    "This spell allows NO saving throw — never mention a save. It reveals any scrying or magical spying (crystal ball, ESP, clairvoyance, etc.) directed at the area during the duration, and gives a percentage chance to glimpse the spy and their location.",
  Vacancy:
    "This spell allows NO saving throw — never mention a save. It makes a clean, well-kept area appear long-abandoned, dusty and decayed (an illusion covering a radius that scales with level); only physical contact with hidden objects hints at the truth.",
  "Summon Swarm":
    "This spell allows NO saving throw — the swarm simply attacks every creature in the area; never mention a save. Keep the damage per round based on the victim's actions and that fire or area effects disperse the swarm after enough damage.",
  Erase:
    "Erase removes writing from a scroll or one to two pages. Nonmagical writing is removed automatically. Removing MAGICAL writing (explosive runes, glyph of warding, sepia snake sigil, wizard mark) is not certain: the chance of success is 30% plus 5% per caster level, to a maximum of 90%. It does NOT affect illusory script, a Symbol, or other spells the rulebook exempts. State the auto-removal of mundane writing AND the percentage chance for magical writing.",
  Irritation:
    "Cover BOTH versions and END WITH A COMPLETE SENTENCE within the limit: (1) Itch — the victim must spend a round scratching or else suffers penalties to AC and attack rolls for a few rounds; (2) Rash — after 1d4 rounds the victim breaks out, steadily losing Dexterity (and suffering a Charisma penalty) as it worsens over the duration. OMIT the exact save-penalty-per-number-of-targets scaling if space is tight — the two versions' effects are the priority. Never end mid-clause.",
};

async function generateText(spell) {
  const sc = schoolInfo(spell.school);
  const facts = [
    `Name: ${englishName(spell)}`,
    `School: ${sc.en}`,
    `Level: ${spell.level}`,
    `Casting Time: ${translateField(convertImperialText(spell.casting_time)) || "—"}`,
    `Range: ${translateField(convertImperialText(spell.range)) || "—"}`,
    `Duration: ${translateField(convertImperialText(spell.duration)) || "—"}`,
    `Area of Effect: ${translateField(convertImperialText(spell.area_of_effect)) || "—"}`,
    `Saving Throw: ${localizeSave(spell.saving_throw)}`,
    `Components: ${(spell.components || []).join(", ") || "—"}`,
  ].join("\n");
  const source = englishDescription(spell) || "(no description in database)";

  const sys =
    "You format Advanced Dungeons & Dragons 2nd Edition wizard spells for physical reference cards for a home game. " +
    "For each spell you receive its printed stat block and its full rulebook description, and you write the concise CARD TEXT of its mechanical effect.\n\n" +
    "Hard rules:\n" +
    `- English, correct AD&D 2e terminology.\n` +
    `- MAXIMUM ${RULES_CHAR_LIMIT} characters for "rules" — a hard limit so every card keeps the same font size. Aim for 380-480: use the space to be COMPLETE, don't pad. A genuinely simple spell may be shorter.\n` +
    "- NEVER restate anything already printed on the card. Do NOT repeat the numeric range, the area/volume or its dimensions, the duration, or the casting time; do NOT name or list the components (the card shows V/S/M — naming the material component is redundant); do NOT write filler like 'within range', 'in the area', 'no save', or 'for the duration'. Refer to effects without echoing those stat-block fields.\n" +
    "- Include EVERYTHING ELSE a player needs to resolve the spell: the core effect, all damage/healing dice, bonuses/penalties, per-level scaling of the EFFECT, what a successful/failed save does (in EFFECT terms), conditions inflicted and how long they last, targeting limits, stacking rules, and important exceptions. Keep every game-relevant number that is not itself a stat-block field.\n" +
    "- SAVING THROW: the stat table already shows the saving throw and its category. In the rules text, describe what failing or making the save DOES (e.g. 'those that fail are charmed', 'a save halves the damage'), but do NOT name the save category or write phrases like 'save vs. spell', 'save vs. death magic', 'saving throw vs. …'. Never restate the save type in prose — it belongs ONLY in the table. Put the correct category into the \"saving_throw\" stat field instead.\n" +
    "- Be strictly RULES-ACCURATE to AD&D 2e. Never invent mechanics the spell does not have.\n" +
    "- Measurements are metric (meters) — keep them metric.\n" +
    "- Third person, present tense. No flavour padding, no lead-ins like 'This spell'. Start directly with the effect.\n" +
    "- If the description is empty, corrupt, or garbled, reconstruct the effect from your knowledge of the canonical AD&D 2e spell.\n\n" +
    "Also write \"art\": a vivid one-sentence visual description of the spell's effect in action, for a fantasy illustrator (the magical phenomenon and its impact, atmospheric). No text, letters, words, or UI in the scene.";

  const res = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1200,
    system: sys,
    output_config: { format: { type: "json_schema", schema: CONTENT_SCHEMA } },
    messages: [{ role: "user", content:
      `STAT BLOCK:\n${facts}\n\nDESCRIPTION:\n${source}` +
      (TEXT_CORRECTIONS[englishName(spell)] ? `\n\nIMPORTANT RULES CORRECTION (authoritative — follow exactly): ${TEXT_CORRECTIONS[englishName(spell)]}` : "") }],
  });
  const txt = res.content.find((b) => b.type === "text")?.text || "{}";
  const obj = JSON.parse(txt);
  obj.rules = truncateToLimit(obj.rules.trim(), RULES_CHAR_LIMIT);
  return obj;
}

// ── Bild-Generierung (mit Key-Rotation über mehrere Google-Projekte) ──────────
// Nutzt GOOGLE_API_KEY plus optional GOOGLE_API_KEY_2, _3, … aus .env.local.
// Jeder Key aus einem eigenen Projekt bringt ein eigenes 70-Bilder/Tag-Kontingent.
const GEMINI_KEYS = Object.keys(env)
  .filter((k) => /^GOOGLE_API_KEY(_\d+)?$/.test(k) && env[k])
  .sort()
  .map((k) => env[k]);
const GEMINI_CLIENTS = GEMINI_KEYS.map((apiKey) => new GoogleGenAI({ apiKey }));
let keyIdx = 0;
const isQuota = (e) => /RESOURCE_EXHAUSTED|quota|429/i.test(e?.message || "");

const ART_STYLE =
  " — rendered as a dark-fantasy spell illustration in painterly digital concept-art style, " +
  "deep indigo-purple atmosphere with vibrant teal and warm gold arcane light, dramatic cinematic lighting, highly detailed. " +
  "Absolutely NO text, letters, words, numbers, captions, signage, watermarks or signatures anywhere in the image. " +
  "NOT a photograph, no photorealism, no real-world modern objects, no vehicles, no cars, no motorcycles, no contemporary clothing or settings.";

// Handgeschriebene, eindeutige Szenen für die 7 im Review beanstandeten Bilder
// (Imagen hatte hier Stil + Inhalt ignoriert und Fotos geliefert).
const ART_PROMPT_OVERRIDES = {
  Clairaudience:
    "A glowing arcane sigil shaped like a spiral ear of teal light hovers in the middle of an empty torchlit stone dungeon corridor, rippling concentric waves of magical sound curving through the walls toward it from far away. Absolutely no people, no human, no face, no portrait — only the magical phenomenon and the architecture",
  "Darkness, 15' Radius":
    "A sphere of absolute magical darkness expanding within a torchlit dungeon corridor, the torch flames swallowed and dying at its rippling black edge, dim silhouettes of adventurers groping blindly at the rim of the void",
  Fly:
    "A robed wizard soars through a twilight sky high above jagged mountain peaks, arms outstretched, swirling ribbons of teal and gold magic billowing the robes upward, vast glowing sunset clouds far below",
  "Magic Mouth":
    "A glowing spectral mouth of teal arcane light magically forms upon the weathered stone face of a gargoyle in a torchlit corridor, lips parted mid-whisper, faint glowing motes drifting from it",
  "Ray of Enfeeblement":
    "A thin beam of sickly violet-grey magical energy lances from a wizard's outstretched hand and strikes an armored warrior, whose muscles wither as his heavy sword sags from trembling weakened arms, draining magic swirling around him",
  "Summon Swarm":
    "A dense swarm of thousands of angry wasps and stinging insects erupts in a boiling black-and-amber cloud from a wizard's raised hand, engulfing terrified adventurers in a torchlit dungeon, wings and stingers glinting",
  "Water Breathing":
    "An armored adventurer swims deep beneath sunlit ocean waves with a BARE face — absolutely NO diving mask, NO goggles, NO breathing apparatus, NO modern gear — a soft luminous teal shimmer of magic glowing at the throat and faint glowing gills of light allowing underwater breathing, bubbles rising past coral and fish toward the distant surface light",
  Armor:
    "A lone warrior stands in a torchlit dungeon as a shimmering translucent force-field of magical armor materializes and wraps around the body, glowing overlapping plates of teal-blue arcane light forming a protective shell, faint golden sparks swirling around",
  // ── Batch-Feedback: gezielte, regeltreue Motive ──
  "Change Self":
    "Extreme close-up portrait of ONE person's head and shoulders caught mid-magical-transformation, split cleanly down the middle: the LEFT half is clearly an ordinary human man with a rounded ear and plain features; the RIGHT half has already become a slender fair elf with a long pointed ear, sharper elegant features and paler skin — the same single face morphing from human into elf, a glowing seam of soft teal illusion magic running down the centre where the change flows. Clearly a before/after of one individual changing race",
  "Comprehend Languages":
    "An unfurled aged parchment scroll lies on a stone table, a spell cast upon it so that rows of glowing teal arcane glyphs and runic symbols (decorative, crisp and clearly rendered, not real words) shine and settle into orderly readable lines, a soft aura of understanding radiating from the writing. Focus entirely on the glowing scroll and its clear symbols, no people, no faces",
  Enlarge:
    "Three adventurers of normal human height stand together in a torchlit dungeon; the middle one has just been magically enlarged and is only MODESTLY bigger — roughly one head taller and a bit broader than his two same-sized companions right beside him, a subtle teal arcane shimmer around his swelling frame. He is an ordinary-scale human, only slightly enlarged — absolutely NOT a giant, NOT towering, NOT huge, still clearly close to his friends' height for direct comparison",
  "Hold Portal":
    "A single heavy closed dungeon gate of wood and iron sealed fast by a glowing teal magical lock — shimmering arcane runes forming a padlock of light over the latch, holding the door shut. Just the gate and its magical lock, no people",
  Sleep:
    "A thief in dark leathers has fallen fast asleep and tumbles limply off the edge of a moonlit rooftop, body slack; behind him on the roof stands a blonde female elf mage with long flowing hair, lowering her outstretched hand as soft teal sleep-magic motes drift from it, having just cast the spell",
  "Spider Climb":
    "An adventurer scales a sheer vertical stone wall like a spider, body pressed flat to the stone, climbing upward, BOTH hands glowing with bright teal magical light where they grip the rock. Focus on the vertical climb and the glowing hands",
  Taunt:
    "A calm, smug robed wizard makes a mocking gesture as several snarling, enraged warriors and a brutish humanoid abandon all caution and charge furiously straight at him across a torchlit hall, faces twisted with irrational fury, irresistibly drawn to attack him",
  ESP:
    "A brighter airy candlelit chamber where a calm wizard stands with softly glowing teal eyes, translucent luminous thought-bubbles and pale wisps of ghostly mental imagery drifting up from the heads of nearby figures and streaming toward the caster, gentle violet and teal light, an open readable mood — not dark",
  "Fog Cloud":
    "A modest, contained bank of dense teal-grey magical fog billowing low over a single small patch of a torchlit dungeon floor near a wizard's outstretched hand, about man-high and only a few paces across, adventurers standing at its bounded edge — a localized fog cloud, clearly NOT an endless fogscape",
  Invisibility:
    "A wizard is turning invisible — the body faded to a translucent, barely-there outline of shimmering teal magic with the stone dungeon wall clearly visible THROUGH the vanishing form, only faint floating footprints and disturbed dust marking where they stand, an astonished companion staring wide-eyed at the near-empty space",
  "Hold Person":
    "Several human figures are frozen utterly rigid, completely paralyzed and locked mid-motion like living statues, limbs stiff and eyes wide, encased in a faint crackling teal stasis aura, unable to move a muscle, while a mage lowers an outstretched hand — clearly magically held motionless",
  "Wind Wall":
    "A powerful invisible vertical curtain of rushing wind sweeps upward across a torchlit battlefield, revealed by swirling dust, whipping leaves and streaks of teal air, violently deflecting a volley of arrows that scatter and tumble away from it, a robed mage holding the wall aloft with an outstretched hand",
  "Leomund's Secure Shelter":
    "A cozy, warm, inviting interior of a magically conjured stone cottage — a crackling hearth fire, comfortable cushioned armchairs, a laden wooden table with food, soft golden lantern light and a gentle teal magical glow, snug and safe, a comfortable haven for weary adventurers",
  Massmorph:
    "In a forest clearing several armored adventurers are magically transforming into natural-looking trees and bushes — bark creeping up their frozen bodies, arms lengthening into leafy branches, half-man half-tree in mid-change, a soft teal shimmer of illusion magic over the grove as they blend among the real trees",
  "Monster Summoning II":
    "A glowing teal magical summoning circle inscribed on a dark dungeon floor; a snarling monstrous creature materializes INSIDE the circle out of swirling arcane light, while the robed wizard who summoned it stands clearly OUTSIDE the ring with an outstretched commanding hand — caster outside the circle, monster within it",
  "Polymorph Other":
    "A hapless enemy warrior is caught mid-transformation as a wizard's teal polymorph magic twists and melts him from a man into a small harmless creature — his body shrinking, limbs reshaping into a frog or toad, armor clattering away, an arcane vortex of light swirling around the dwindling form",
  "Solid Fog":
    "A dense, contained bank of thick greenish-grey magical fog fills only a single small section of a torchlit dungeon corridor, so heavy it looks almost solid and tangible, an adventurer wading in and bogged down as if pushing through cotton, the fog clearly bounded within one area — NOT an endless fogscape",
  Fireball:
    "A blonde female elf mage with long flowing hair, elegant and sharp-eyed, hurls a roaring blazing orange fireball from her outstretched hands across a dark cavern toward a huge menacing brutish humanoid warlord, the billowing explosion of flame surging toward the snarling brute, embers and teal-gold arcane light trailing from her fingers",
  Dig:
    "A wizard gestures and a neat, tidy square pit is magically excavated in the earth of a torchlit dungeon floor — clods of soil lifting and flowing calmly aside in a controlled teal-lit arcane motion, a clean deepening hole. Restrained and precise, NOT an explosion, no debris storm",
};

async function generateArt(spell, artPrompt, outPath) {
  const scene = ART_PROMPT_OVERRIDES[englishName(spell)] || artPrompt;
  // Stil VORNE verankern (Imagen bindet den Stil dann zuverlässiger) + Szene + harte Vorgaben.
  const prompt = `Fantasy illustration, painterly digital art, of the following magical scene: ${scene}${ART_STYLE}`;
  // Jeden Key der Reihe nach versuchen; bei JEDEM Fehler (Kontingent, abgelaufener
  // Token/401, gesperrtes Modell/404 …) zum nächsten Key wechseln.
  let lastErr;
  for (let tried = 0; tried < 1; tried++) {
    try {
      // Bilderzeugung und Key-Rotation stecken in generate-image.mjs — das
      // liest auch keys.env, nicht nur .env.local.
      const buf = await generateImage(prompt);
      await sharp(buf).resize(768, 470, { fit: "cover", position: "attention" }).webp({ quality: 88 }).toFile(outPath);
      return;
    } catch (e) {
      lastErr = e;
      keyIdx = (keyIdx + 1) % GEMINI_CLIENTS.length; // nächster Key/Projekt
    }
  }
  throw lastErr; // alle Keys fehlgeschlagen

}

// ── Stat-Auflösung: DB-Wert bevorzugen, sonst Kanon (Opus) einsetzen ──────────
const isEmpty = (v) => v == null || !String(v).trim() || String(v).trim() === "—";
const isJunkCT = (v) => isEmpty(v) || v === "]" || v === "l";
const isCorruptDuration = (v) => /\d(rds|hrs|rd|hr|turns?)\b|rds?\+|hrs?\+|rds?rds/i.test(String(v || ""));
// Normalisiert kaputte/uneinheitliche Statwerte für die (englischen) Karten:
// doppelte Schrägstriche, deutsches Dezimalkomma, überzählige Leerzeichen.
function normalizeStat(v) {
  if (v == null) return v;
  return String(v)
    .replace(/\/{2,}/g, "/") // "4,5 m//level" → "4,5 m/level"
    .replace(/(\d),(\d)/g, "$1.$2") // Dezimalkomma → Punkt (englische Karten)
    .replace(/\s*\/\s*/g, "/") // "5 m / level" → "5 m/level"
    .replace(/\s{2,}/g, " ")
    .replace(/[,;\s]+$/, "") // nachlaufende Satzzeichen (z. B. "1.5 m x 18.3 m,")
    .trim();
}
const disp = (v) => normalizeStat(translateField(convertImperialText(v)));

// Vorhandene, aber falsche DB-Rettungswürfe korrigieren (gegen AD&D-2e-Kanon geprüft).
const SAVE_FIX = {
  Fireball: "½",
  "Lance of Disruption": "½",
  Forget: "Neg.",
  Irritation: "Neg.",
  "Explosive Runes": "Special",
};

// AUTORITATIVE Saving-Throw-Werte (PHB 2e) — höchste Priorität, überschreibt sowohl
// DB als auch Opus. Nötig, weil DB teils "None" bei Zaubern mit Save hat (z. B.
// Fireball) und Opus umgekehrt bei manchen Zaubern Saves erfindet (Darkness etc.).
const SAVE_OVERRIDE = {
  Fireball: "vs. Spell (½)",
  Forget: "vs. Spell (neg.)", // -2 gilt nur bei 1 Ziel (im Regeltext erklärt), nicht pauschal
  Irritation: "vs. Spell (neg.)",
  Misdirection: "vs. Spell (neg.)",
  "Tasha's Hideous Laughter": "vs. Spell (neg.)",
  "Explosive Runes": "vs. Spell (½, bystanders)",
  "Hallucinatory Terrain": "vs. Spell (disbelief)",
  "Phantasmal Killer": "vs. Spell / Death Magic",
  // Zauber OHNE Save (PHB) — Opus hatte hier fälschlich einen Save erfunden:
  "Darkness, 15' Radius": "None",
  "Alter Self": "None",
  "Flame Arrow": "None",
  Tongues: "None",
  "Detect Scrying": "None",
  Vacancy: "None",
  "Summon Swarm": "None",
};

function resolveStats(spell, canon = {}) {
  const enName = englishName(spell);
  const base = {
    casting_time: isJunkCT(spell.casting_time) ? canon.casting_time || "—" : disp(spell.casting_time),
    range: isEmpty(spell.range) ? canon.range || "—" : disp(spell.range),
    duration:
      isEmpty(spell.duration) || isCorruptDuration(spell.duration) ? canon.duration || "—" : disp(spell.duration),
    area_of_effect: isEmpty(spell.area_of_effect) ? canon.area_of_effect || "—" : disp(spell.area_of_effect),
    // Saving Throw: autoritativer Override (PHB) > Opus-Kanon (mit KATEGORIE) >
    // DB-Fix > DB. Opus liefert die Art, der Override korrigiert bekannte Fehler.
    saving_throw:
      SAVE_OVERRIDE[enName] || canon.saving_throw || SAVE_FIX[enName] || (isEmpty(spell.saving_throw) ? "—" : localizeSave(spell.saving_throw)),
    components: spell.components && spell.components.length ? spell.components : canon.components || [],
  };
  // PHB-Stat-Override (per Zauber-ID) + handverifizierte Einzelfixes (per Name)
  // überschreiben die aufgelösten Felder — höchste Priorität, da am echten PHB geankert.
  return { ...base, ...(PHB_OVERRIDE[spell.id] || {}), ...(MANUAL_STAT[enName] || {}) };
}

// ── Öffentliche API ───────────────────────────────────────────────────────────
import { slug } from "./lib.mjs";

// Handgeschriebene Regeltexte für Zauber, die der Generator nicht sauber ins
// Zeichenlimit bekommt (z. B. Doppelmodus-Zauber). Garantiert vollständig & passend.
const RULES_OVERRIDE = {
  Irritation:
    "Choose one effect at casting. Itch: the target itches maddeningly and, unless it spends a full round scratching, fights at -4 AC and -2 to attack for 3 rounds and cannot cast spells in the first round. Rash: one target only breaks out after 1d4 rounds, losing 1 Charisma per day (to a maximum of -4) and, after a week, 1 Dexterity, until removed by cure disease or dispel magic. Thick- or scaled-skinned creatures are immune; a save negates.",
  // PHB-verifizierte Korrekturen (Pre-Print-Review):
  Forget:
    "The caster chooses 1 to 4 creatures, which forget the previous round's events (roughly the last minute); for every three caster levels, one more minute of the past is forgotten. A single target resists at -2, two targets at -1, three or four normally (Wisdom adjusts the roll). It does not undo charm, suggestion, geas, or quest, though the caster of such magic may be forgotten. Heal, restoration, limited wish, or wish restores the lost memories.",
  Clairvoyance:
    "Lets the caster see, in the mind's eye, whatever could be seen from a chosen spot that is known or obvious; distance is no factor. It fixes a viewpoint at that location — not sight through a creature's eyes — and grants no infravision, so a magically dark area yields only darkness. Purely visual, with no sound. The caster must concentrate and perceives nothing else meanwhile, and cannot shift the view to a new spot during the spell.",
  "Flame Arrow":
    "Two modes. Enchant Missiles: a number of nocked arrows or bolts (rising with level) gain flame for one round, each dealing its normal damage plus 1 point of fire and possibly igniting the target. Fiery Bolts: from 5th level the caster hurls one bolt per five levels, each a ranged attack for 1d6 piercing plus 4d6 fire; the fire damage is halved on a successful save. Bolts must strike foes within 18 m of one another.",
  Jump:
    "The creature touched can leap once per round for the duration: up to 9 m forward, 9 m straight up, or 3 m backward. Forward and upward leaps follow only a slight arc — about 0.6 m of height per 3 m of distance. It grants one such leap each round it lasts, but does not ensure a safe landing or a secure grasp at a leap's end; the leaper must still cope with the arrival.",
  "Mirror Image":
    "Surrounds the caster with 1d4 illusory duplicates, plus one more per three caster levels, to a maximum of eight. The images mimic the caster exactly and shift about, so foes cannot tell which is real. Any melee or missile hit that strikes an image destroys it; the others remain until struck. As images vanish the chance of hitting the true caster rises. A single area effect that catches the group destroys all images at once.",
  "Rope Trick":
    "One end of the rope rises and hangs rigid, anchored to an extradimensional space. The caster and up to seven others (eight in all) may climb up and hide within, unseen and unreachable. Those inside see out through a hazy window at the rope; spells and area effects cannot cross it. If fewer than eight have climbed up, the rope can be pulled in after them. Anyone still inside when the spell ends falls from the height of the entrance.",
  Haste:
    "Affects 1 creature per caster level, the caster's choice. Each doubles its movement rate and its melee and missile attacks per round and gains a -2 initiative bonus (acting earlier). Spellcasting is not sped up. A hasted creature ages one year. The effect does not stack with itself. Haste and slow cancel each other, each negating one casting of the other.",
  Identify:
    "After 8 hours spent purifying the items, the caster handles one item per experience level, learning one property of each with a 10% chance per level (maximum 90%; a very high roll gives a false reading). Only one function of a multi-function item is revealed per handling, and a failed reading blocks further study of that item until the caster gains a level. It never shows exact combat bonuses. The effort drains 8 points of Constitution, regained with rest.",
};

export async function getContent(spell, { regenText = false, regenArt = false } = {}) {
  const cache = loadTextCache();
  let entry = cache[spell.id];
  if (!entry || regenText || !entry.stats) {
    // (!entry.stats: alte Cache-Einträge ohne Stat-Block einmalig nachziehen)
    entry = await generateText(spell);
    await persistEntry(spell.id, entry); // atomarer Merge-Write (nebenläufigkeitssicher)
  }
  const artPath = join(ART, `${slug(englishName(spell))}.webp`);
  if (!existsSync(artPath) || regenArt) {
    await generateArt(spell, entry.art, artPath);
  }
  const ruleText = RULES_OVERRIDE[englishName(spell)] || entry.rules;
  return { rules: cleanRules(ruleText), artPath, stats: resolveStats(spell, entry.stats) };
}
