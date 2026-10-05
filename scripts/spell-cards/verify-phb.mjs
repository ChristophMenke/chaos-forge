// Verifiziert strittige Audit-Findings gegen den ECHTEN PHB-OCR-Text (Ground
// Truth), nicht gegen Modellgedächtnis. Extrahiert je Zauber den PHB-Auszug und
// lässt Opus jedes gemeldete Problem bestätigen (CONFIRMED) oder verwerfen
// (REJECTED) — mit exaktem PHB-Zitat und korrigiertem Wert. → cache/verify.json
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {
  fetchIllusionistDeck, fetchLearnedWizardSpells, fetchCharacters, englishName,
} from "./lib.mjs";
import { getContent } from "./content.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const env = Object.fromEntries(
  readFileSync(join(ROOT, ".env.local"), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
const PHB = readFileSync(join(ROOT, "ressources", "books", "Players Handbook.txt"), "utf8");

// Zauber-Auszug aus dem PHB: Fundstelle "<Name> (<Schule" = Beschreibungsanfang.
function phbExcerpt(name) {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  const re = new RegExp(esc + "\\s*\\((Conjuration|Alteration|Illusion|Iusion|Phantasm|Abjuration|Enchantment|Charm|Divination|Invocation|Evocation|Necromancy)", "i");
  const m = PHB.match(re);
  if (!m) return null;
  const start = m.index;
  return PHB.slice(start, start + 2600).replace(/\s+/g, " ").trim();
}

const SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["verdicts", "corrected_save", "corrected_rules_note", "corrected_stats"],
  properties: {
    verdicts: { type: "array", items: { type: "object", additionalProperties: false,
      required: ["claim", "verdict", "phb_quote"], properties: {
        claim: { type: "string", description: "the audit claim being judged (short)" },
        verdict: { type: "string", enum: ["CONFIRMED", "REJECTED", "UNCLEAR"] },
        phb_quote: { type: "string", description: "the exact PHB sentence that decides it (verbatim from the excerpt), or empty if not in excerpt" },
      } } },
    corrected_save: { type: "string", description: "the correct Saving Throw value per PHB (category + modifier, e.g. 'vs. Spell (neg.)', 'None'), or empty if the printed one is already right" },
    corrected_rules_note: { type: "string", description: "if the rules text has a CONFIRMED error, a corrected replacement sentence/phrase to fix ONLY that error; else empty" },
    corrected_stats: { type: "string", description: "any stat-block field that is CONFIRMED wrong per PHB, as 'field: correct metric value'; else empty" },
  },
};

const SYS =
  "You are an AD&D 2nd Edition rules judge. You are given: a printed spell card (name, stat block, rules text), a list of AUDIT CLAIMS alleging errors, and the VERBATIM Player's Handbook excerpt for that spell. " +
  "The PHB excerpt is the ONLY ground truth — judge every claim strictly against it, not against memory. For each claim return CONFIRMED (the PHB proves the card wrong), REJECTED (the PHB shows the card is fine / the claim is wrong), or UNCLEAR (excerpt doesn't cover it). " +
  "Quote the exact PHB sentence that decides each claim. Then give corrected values ONLY for what you CONFIRMED. Metric conversion: 1 yard = 0.9 m, 10 ft = 3 m, ranges like '10 yards/level' → '9 m/level'. A '1 turn' = 10 minutes = 1 hour is wrong (1 turn = 10 min); durations 'rounds' vs 'turns' matter. Be precise and conservative — do not confirm unless the PHB text clearly supports it.";

(async () => {
  const spr = await fetchIllusionistDeck({ maxLevel: 4 });
  const chars = await fetchCharacters();
  const now = await fetchLearnedWizardSpells(chars.find((c) => c.name.includes("Nowi")).id);
  const byName = new Map();
  for (const s of [...spr, ...now]) byName.set(englishName(s), s);
  const deck = [...byName.values()].sort((a, b) => a.level - b.level || englishName(a).localeCompare(englishName(b)));
  const audit = JSON.parse(readFileSync(join(HERE, "cache", "audit-v2.json"), "utf8"));

  const has = (f) => f && !f.ok && f.note && f.note.trim();
  const targets = [];
  audit.forEach((r, i) => {
    if (has(r.save) || has(r.rules) || has(r.stats)) {
      const claims = [];
      if (has(r.save)) claims.push("SAVE: " + r.save.note);
      if (has(r.rules)) claims.push("RULES: " + r.rules.note);
      if (has(r.stats)) claims.push("STATS: " + r.stats.note);
      targets.push({ spell: deck[i], claims });
    }
  });

  const out = [];
  let n = 0;
  for (const { spell, claims } of targets) {
    const nm = englishName(spell);
    const excerpt = phbExcerpt(nm);
    const { rules, stats } = await getContent(spell);
    if (!excerpt) { out.push({ name: nm, level: spell.level, no_phb: true, claims }); console.log(`  ⚠ ${nm}: nicht im PHB (evtl. Nicht-PHB-Zauber)`); continue; }
    try {
      const res = await anthropic.messages.create({
        model: "claude-opus-4-8", max_tokens: 1600, system: SYS,
        output_config: { format: { type: "json_schema", schema: SCHEMA } },
        messages: [{ role: "user", content:
          `SPELL: ${nm} (Level ${spell.level})\n` +
          `PRINTED STAT BLOCK — CT: ${stats.casting_time} | Range: ${stats.range} | Duration: ${stats.duration} | Area: ${stats.area_of_effect} | Save: ${stats.saving_throw} | Comp: ${(stats.components||[]).join(",")}\n` +
          `PRINTED RULES TEXT: ${rules}\n\nAUDIT CLAIMS:\n- ${claims.join("\n- ")}\n\nPHB EXCERPT (ground truth):\n${excerpt}` }],
      });
      const v = JSON.parse(res.content.find((b) => b.type === "text").text);
      out.push({ name: nm, level: spell.level, ...v });
    } catch (e) { out.push({ name: nm, level: spell.level, error: e.message.slice(0, 100) }); }
    if (++n % 5 === 0) console.log(`  ${n}/${targets.length}`);
  }
  writeFileSync(join(HERE, "cache", "verify.json"), JSON.stringify(out, null, 2));

  console.log(`\n=== VERIFIZIERTE BEFUNDE (${out.length} Zauber) ===`);
  for (const r of out) {
    if (r.error) { console.log(`\n✗ ${r.name}: FEHLER ${r.error}`); continue; }
    if (r.no_phb) { console.log(`\n? ${r.name} (L${r.level}): nicht im PHB — Claims:\n   - ${r.claims.join("\n   - ")}`); continue; }
    const conf = (r.verdicts || []).filter((v) => v.verdict === "CONFIRMED");
    if (!conf.length) { console.log(`\n✓ ${r.name}: alle Claims REJECTED/UNCLEAR (Karte ok)`); continue; }
    console.log(`\n● ${r.name} (L${r.level}) — ${conf.length} BESTÄTIGT`);
    for (const v of conf) console.log(`   ✔ ${v.claim}\n     PHB: "${v.phb_quote}"`);
    if (r.corrected_save) console.log(`   → Save korrigiert: ${r.corrected_save}`);
    if (r.corrected_stats) console.log(`   → Stats korrigiert: ${r.corrected_stats}`);
    if (r.corrected_rules_note) console.log(`   → Regeltext-Fix: ${r.corrected_rules_note}`);
  }
})();
