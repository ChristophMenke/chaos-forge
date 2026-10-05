// Baut die Regel-Referenzkarten für den Spieltisch. Jeder Wert wird aus
// rules-js/ BERECHNET, nicht abgeschrieben — die Karten können damit nicht
// gegenüber der App auseinanderlaufen.
//
// Nutzung: node build-rules-cards.mjs [--tarot70|--tarot] [--only=thac0]
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { renderRulesCard } from "./template-rules.mjs";
import { TAROT_RULES_FMT, IS_TAROT as TAROT, DIR_SUFFIX } from "./tarot.mjs";

const require = createRequire(import.meta.url);
const combat = require("./rules-js/combat.js");
const ab = require("./rules-js/abilities.js");
const thief = require("./rules-js/thief.js");
const undead = require("./rules-js/turn-undead.js");
const equip = require("./rules-js/equipment.js");
const slots = require("./rules-js/spellslots.js");
const prof = require("./rules-js/proficiencies.js");
const races = require("./rules-js/races.js");
const styles = require("./rules-js/fighting-styles.js");

const HERE = dirname(fileURLToPath(import.meta.url));
const F = TAROT ? TAROT_RULES_FMT : undefined;
const CW = F?.W ?? 768, CH = F?.H ?? 1146;
const OUT = join(HERE, "out", `rules-cards${TAROT ? DIR_SUFFIX : ""}`);
mkdirSync(OUT, { recursive: true });

// Akzentfarben wie im Rest des Sets: Klassengruppen-Farben, Gold für Allgemeines.
const A = {
  gold: ["#e0b24e", "#a1782f"],
  warrior: ["#e0524e", "#8f2f2b"],
  wizard: ["#3ec7bd", "#0d7d75"],
  rogue: ["#5b8def", "#2f4fa0"],
  priest: ["#e0b24e", "#a1782f"],
};
const sgn = (n) => (n >= 0 ? `+${n}` : `${n}`);
const pct = (n) => `${n}%`;

const cards = [];
const add = (key, accent, data) => cards.push({ key, ...data, accent: A[accent][0], accent2: A[accent][1] });

// ── 1. THAC0 ────────────────────────────────────────────────────────────────
{
  const levels = Array.from({ length: 15 }, (_, i) => i + 1);
  const groups = ["warrior", "priest", "rogue", "wizard"];
  add("thac0", "warrior", {
    title: "THAC0",
    subtitle: "To Hit Armor Class 0 · by level",
    sections: [
      {
        table: {
          head: ["Lvl", "Warrior", "Priest", "Rogue", "Wizard"],
          align: ["", "c", "c", "c", "c"],
          rows: levels.map((l) => [l, ...groups.map((g) => combat.getThac0(g, l))]),
        },
      },
      {
        notes: [
          "Roll d20, add all modifiers. Hit if the result ≥ THAC0 − target AC.",
          "Example: THAC0 15 against AC 4 needs an 11 or better.",
        ],
      },
    ],
    footer: "PHB Tables 51–54",
  });
}

// ── 2./3. Rettungswürfe ─────────────────────────────────────────────────────
const SAVE_KEYS = [
  ["paralyzation", "Para/Poison/Death"],
  ["rod", "Rod/Staff/Wand"],
  ["petrification", "Petrify/Polymorph"],
  ["breath", "Breath Weapon"],
  ["spell", "Spell"],
];
for (const [group, label] of [["warrior", "Warrior"], ["priest", "Priest"], ["rogue", "Rogue"], ["wizard", "Wizard"]]) {
  const levels = [1, 3, 5, 7, 9, 11, 13, 15];
  add(`saves-${group}`, group, {
    title: `Saving Throws · ${label}`,
    subtitle: "lower is better · roll d20",
    sections: [
      {
        table: {
          head: ["Lvl", "Par", "Rod", "Pet", "Bre", "Spl"],
          align: ["", "c", "c", "c", "c", "c"],
          rows: levels.map((l) => {
            const s = combat.getSavingThrows(group, l);
            return [l, s.paralyzation, s.rod, s.petrification, s.breath, s.spell];
          }),
        },
      },
      {
        heading: "Categories",
        notes: SAVE_KEYS.map(([k, v]) => `${v.split("/")[0].slice(0, 3)} — ${v}`),
      },
    ],
    footer: "PHB Table 60",
  });
}

// ── 4. Angriffe pro Runde ───────────────────────────────────────────────────
{
  const rows = [];
  for (const l of [1, 7, 13]) {
    rows.push([
      `Warrior ${l}`,
      combat.getAttacksPerRound("warrior", l, false),
      combat.getAttacksPerRound("warrior", l, true),
    ]);
  }
  for (const g of ["priest", "rogue", "wizard"]) {
    rows.push([g[0].toUpperCase() + g.slice(1), combat.getAttacksPerRound(g, 1, false), "—"]);
  }
  add("attacks", "warrior", {
    title: "Attacks per Round",
    subtitle: "melee · single weapon",
    sections: [
      { table: { head: ["Class / Level", "Normal", "Specialized"], align: ["", "c", "c"], rows } },
      {
        heading: "Specialization",
        notes: [
          "Specialists gain +1 to hit and +2 damage with the chosen weapon.",
          "Only warriors may specialize; rangers and paladins may not.",
          "A rate of 3/2 means three attacks every two rounds.",
        ],
      },
    ],
    footer: "PHB Table 58 · Chapter 5",
  });
}

// ── 5.–10. Attributstabellen ────────────────────────────────────────────────
add("str", "warrior", {
  title: "Strength",
  subtitle: "hit · damage · doors · bars",
  sections: [
    {
      table: {
        head: ["Str", "Hit", "Dmg", "Weight", "Doors", "Bars"],
        align: ["", "c", "c", "r", "c", "r"],
        rows: [3, 5, 7, 9, 11, 13, 15, 16, 17, 18].map((v) => {
          const m = ab.getStrengthModifiers(v);
          return [v, sgn(m.hitAdj), sgn(m.dmgAdj), `${Math.round(m.weightAllow * 0.4536)} kg`, m.openDoors, pct(m.bendBars)];
        }),
      },
    },
    { notes: ["Weight is the unencumbered allowance. Doors: roll d20 ≤ value."] },
  ],
  footer: "PHB Table 1",
});

add("str-exceptional", "warrior", {
  title: "Exceptional Strength",
  subtitle: "warriors with STR 18 only",
  sections: [
    {
      table: {
        head: ["18/", "Hit", "Dmg", "Weight", "Doors", "Bars"],
        align: ["", "c", "c", "r", "c", "r"],
        rows: [1, 50, 75, 90, 99, 100].map((p) => {
          const m = ab.getStrengthModifiers(18, p);
          return [p === 100 ? "00" : `${p}`.padStart(2, "0"), sgn(m.hitAdj), sgn(m.dmgAdj), `${Math.round(m.weightAllow * 0.4536)} kg`, m.openDoors, pct(m.bendBars)];
        }),
      },
    },
    {
      notes: [
        "Roll d100 when a warrior rolls STR 18. The percentile is rolled once and never re-rolled.",
        "Non-warriors never gain exceptional strength.",
      ],
    },
  ],
  footer: "PHB Table 2",
});

add("dex", "rogue", {
  title: "Dexterity",
  subtitle: "reaction · missile · defense",
  sections: [
    {
      table: {
        head: ["Dex", "React", "Missile", "Defense"],
        align: ["", "c", "c", "c"],
        rows: [3, 5, 7, 9, 12, 15, 16, 17, 18, 19].map((v) => {
          const m = ab.getDexterityModifiers(v);
          return [v, sgn(m.reactionAdj), sgn(m.missileAdj), sgn(m.defensiveAdj)];
        }),
      },
    },
    { notes: ["Defense adjustment applies to armor class — negative is better."] },
  ],
  footer: "PHB Table 3",
});

add("con", "warrior", {
  title: "Constitution",
  subtitle: "hit points · shock · resurrection",
  sections: [
    {
      table: {
        head: ["Con", "HP/HD", "Shock", "Resurrect"],
        align: ["", "c", "r", "r"],
        rows: [3, 5, 7, 9, 12, 15, 16, 17, 18, 19].map((v) => {
          const m = ab.getConstitutionModifiers(v);
          return [v, sgn(m.hpAdj), pct(m.systemShock), pct(m.resurrectionSurvival)];
        }),
      },
    },
    {
      notes: [
        "The HP bonus is capped at +2 for non-warriors, +4 for warriors.",
        "System shock is rolled when the body is magically stressed (polymorph, petrification).",
      ],
    },
  ],
  footer: "PHB Table 4",
});

add("int", "wizard", {
  title: "Intelligence",
  subtitle: "languages · spell learning",
  sections: [
    {
      table: {
        head: ["Int", "Lang", "Max Lvl", "Learn", "Max/Lvl"],
        align: ["", "c", "c", "r", "c"],
        rows: [9, 11, 13, 15, 16, 17, 18, 19].map((v) => {
          const m = ab.getIntelligenceModifiers(v);
          return [v, m.numberOfLanguages, m.spellLevel, pct(m.chanceToLearn), m.maxSpellsPerLevel >= 99 ? "all" : m.maxSpellsPerLevel];
        }),
      },
    },
    {
      notes: [
        "Learn: chance to add a spell to the spellbook. A failed roll bars that spell until the next level.",
        "Max Lvl is the highest spell level the wizard can ever cast.",
      ],
    },
  ],
  footer: "PHB Table 4",
});

add("wis", "priest", {
  title: "Wisdom",
  subtitle: "magic defense · bonus spells",
  sections: [
    {
      table: {
        head: ["Wis", "Mag Def", "Bonus Spells", "Fail"],
        align: ["", "c", "", "r"],
        rows: [3, 9, 13, 14, 15, 16, 17, 18, 19].map((v) => {
          const m = ab.getWisdomModifiers(v);
          const bonus = (m.bonusSpells || []).length
            ? m.bonusSpells.map((n, i) => `${n}×L${i + 1}`).join(" ")
            : "—";
          return [v, sgn(m.magicalDefenseAdj), bonus, pct(m.spellFailure)];
        }),
      },
    },
    {
      notes: [
        "Magic defense adjusts saves against mind-affecting magic.",
        "Bonus spells are granted to priests only, and only once the level allows that spell level.",
        "Our group uses spell points instead of slots — see the Spell Points card.",
      ],
    },
  ],
  footer: "PHB Table 5",
});

add("cha", "rogue", {
  title: "Charisma",
  subtitle: "henchmen · loyalty · reaction",
  sections: [
    {
      table: {
        head: ["Cha", "Henchmen", "Loyalty", "Reaction"],
        align: ["", "c", "c", "c"],
        rows: [3, 5, 7, 9, 12, 15, 16, 17, 18].map((v) => {
          const m = ab.getCharismaModifiers(v);
          return [v, m.maxHenchmen, sgn(m.loyaltyBase), sgn(m.reactionAdj)];
        }),
      },
    },
    { notes: ["Henchmen are loyal followers, not hirelings. Reaction adjusts the NPC's first impression."] },
  ],
  footer: "PHB Table 6",
});

// ── 11./12. Diebesfähigkeiten ───────────────────────────────────────────────
const THIEF_SKILLS = [
  ["pickLocks", "Pick Locks"],
  ["findTraps", "Find/Remove Traps"],
  ["moveSilently", "Move Silently"],
  ["hideInShadows", "Hide in Shadows"],
  ["detectNoise", "Detect Noise"],
  ["climbWalls", "Climb Walls"],
  ["readLanguages", "Read Languages"],
];
add("thief-base", "rogue", {
  title: "Thief Skills",
  subtitle: "base scores by level",
  sections: [
    {
      table: {
        head: ["Skill", "1", "4", "7", "10", "13"],
        align: ["", "r", "r", "r", "r", "r"],
        rows: THIEF_SKILLS.map(([k, label]) => [
          label,
          ...[1, 4, 7, 10, 13].map((l) => pct(thief.getBaseThiefSkills(l)[k])),
        ]),
      },
    },
    {
      heading: "Backstab",
      table: {
        head: ["Level", "1–4", "5–8", "9–12", "13+"],
        align: ["", "c", "c", "c", "c"],
        rows: [["Multiplier", ...[1, 5, 9, 13].map((l) => `×${thief.getBackstabMultiplier(l)}`)]],
      },
    },
    { notes: ["Add racial adjustments, then the 60 discretionary points spent at level 1."] },
  ],
  footer: "PHB Tables 25–27",
});

{
  const RACES = ["dwarf", "elf", "gnome", "halfling", "half_elf", "human"];
  const present = RACES.filter((r) => thief.getRacialThiefAdjustments(r));
  add("thief-racial", "rogue", {
    title: "Thief Skills · Racial",
    subtitle: "adjustments in percent",
    sections: [
      {
        table: {
          head: ["Skill", ...present.map((r) => (r.startsWith("half") ? "H-" + r.slice(5, 8) : r.slice(0, 4)))],
          align: ["", "r", "r", "r", "r", "r", "r"],
          rows: THIEF_SKILLS.map(([k, label]) => [
            label,
            ...present.map((r) => {
              const v = thief.getRacialThiefAdjustments(r)?.[k] ?? 0;
              return v === 0 ? "—" : sgn(v);
            }),
          ]),
        },
      },
      { notes: [`Columns: ${present.join(", ")}.`, "Adjustments apply once, at character creation."] },
    ],
    footer: "PHB Table 28",
  });
}

// ── 13. Untote vertreiben ───────────────────────────────────────────────────
{
  const types = undead.UNDEAD_TYPES.slice(0, 12);
  const levels = [1, 3, 5, 7, 9, 11];
  add("turn-undead", "priest", {
    title: "Turning Undead",
    subtitle: "roll d20 · priest level",
    sections: [
      {
        table: {
          head: ["Undead", ...levels.map((l) => `L${l}`)],
          align: ["", "c", "c", "c", "c", "c", "c"],
          rows: types.map((t) => [
            (undead.UNDEAD_LABELS?.[t]?.name_en ?? t).replace(/^./, (c) => c.toUpperCase()),
            ...levels.map((l) => undead.getTurnTarget(t, l) ?? "—"),
          ]),
        },
        font: 21,
      },
      {
        notes: [
          "Number = roll d20 equal or higher. T = turned automatically. D = destroyed.",
          "D* additionally destroys 2d4 extra undead of that type.",
          "Success turns 2d6 undead; evil priests command instead of turning.",
        ],
      },
    ],
    footer: "PHB Table 61",
  });
}

// ── 14. Belastung & Bewegung ────────────────────────────────────────────────
{
  const allow = ab.getStrengthModifiers(13).weightAllow;
  const steps = [0.4, 0.8, 1.2, 1.6, 2.2].map((f) => Math.round(allow * f));
  add("encumbrance", "warrior", {
    title: "Encumbrance",
    subtitle: "carried weight vs. movement",
    sections: [
      {
        table: {
          head: ["Load", "Move 12", "Move 9", "Move 6"],
          align: ["", "c", "c", "c"],
          rows: ["none", "light", "moderate", "heavy", "severe"].map((lvl) => [
            lvl.replace(/^./, (c) => c.toUpperCase()),
            equip.getMovementRate(12, lvl),
            equip.getMovementRate(9, lvl),
            equip.getMovementRate(6, lvl),
          ]),
        },
      },
      {
        heading: "Example · STR 13",
        table: {
          head: ["Weight", "Level"],
          align: ["r", "c"],
          rows: steps.map((w) => [`${Math.round(w * 0.4536)} kg`, equip.calculateEncumbrance(w, allow)]),
        },
      },
      { notes: ["Movement rate is in tens of metres per round. Attacks suffer as the load grows."] },
    ],
    footer: "PHB Tables 47–48",
  });
}

// ── 15. Magier-Zauberslots ──────────────────────────────────────────────────
add("wizard-slots", "wizard", {
  title: "Wizard Spell Slots",
  subtitle: "spells memorizable per level",
  sections: [
    {
      table: {
        head: ["Lvl", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
        align: ["", "c", "c", "c", "c", "c", "c", "c", "c", "c"],
        rows: Array.from({ length: 14 }, (_, i) => i + 1).map((l) => [
          l,
          ...slots.getWizardSpellSlots(l).map((n) => (n ? n : "—")),
        ]),
        font: 21,
      },
    },
    { notes: ["Specialists gain one extra slot per level, usable only for their school."] },
  ],
  footer: "PHB Table 21",
});

// ── 16. Priester-Zauberpunkte (Hausregel) ───────────────────────────────────
add("spell-points", "priest", {
  title: "Priest Spell Points",
  subtitle: "house rule · Player's Option",
  sections: [
    {
      heading: "Points by level",
      table: {
        head: ["Lvl", "Points", "Lvl", "Points"],
        align: ["", "r", "", "r"],
        rows: Array.from({ length: 8 }, (_, i) => [
          i + 1,
          slots.getPriestSpellPoints(i + 1),
          i + 9,
          slots.getPriestSpellPoints(i + 9),
        ]),
      },
    },
    {
      heading: "Cost per spell level",
      table: {
        head: ["Spell", "1", "2", "3", "4", "5", "6", "7"],
        align: ["", "c", "c", "c", "c", "c", "c", "c"],
        rows: [["Cost", ...Array.from({ length: 7 }, (_, i) => slots.getPriestSpellCost(i + 1))]],
      },
    },
    { notes: ["We use spell points instead of slots for priests. Wisdom bonus points are added on top."] },
  ],
  footer: "PO: Spells & Magic · house rule",
});

// ── 17. Fertigkeiten-Slots ──────────────────────────────────────────────────
add("proficiencies", "gold", {
  title: "Proficiency Slots",
  subtitle: "weapon and nonweapon",
  sections: [
    {
      heading: "Weapon slots",
      table: {
        head: ["Lvl", "War", "Pri", "Rog", "Wiz"],
        align: ["", "c", "c", "c", "c"],
        rows: [1, 3, 5, 7, 9, 12].map((l) => [
          l,
          ...["warrior", "priest", "rogue", "wizard"].map((g) => prof.getWeaponProficiencySlots(g, l)),
        ]),
      },
    },
    {
      heading: "Nonweapon slots",
      table: {
        head: ["Lvl", "War", "Pri", "Rog", "Wiz"],
        align: ["", "c", "c", "c", "c"],
        rows: [1, 3, 5, 7, 9, 12].map((l) => [
          l,
          ...["warrior", "priest", "rogue", "wizard"].map((g) => prof.getNonweaponProficiencySlots(g, l)),
        ]),
      },
    },
    {
      notes: [
        `Attacking without weapon proficiency: warrior ${prof.getNonproficiencyPenalty("warrior")}, priest ${prof.getNonproficiencyPenalty("priest")}, rogue ${prof.getNonproficiencyPenalty("rogue")}, wizard ${prof.getNonproficiencyPenalty("wizard")} to hit.`,
      ],
    },
  ],
  footer: "PHB Tables 34–37",
});

// ── 18. Level-Limits ────────────────────────────────────────────────────────
{
  const CLASSES = ["fighter", "ranger", "cleric", "thief", "mage"];
  const RACES = ["dwarf", "elf", "gnome", "halfling", "half_elf", "half_orc"];
  add("level-limits", "gold", {
    title: "Racial Level Limits",
    subtitle: "maximum attainable level",
    sections: [
      {
        table: {
          head: ["Race", ...CLASSES.map((c) => c.slice(0, 4).replace(/^./, (x) => x.toUpperCase()))],
          align: ["", "c", "c", "c", "c", "c"],
          rows: RACES.map((r) => [
            r.replace("_", "-").replace(/^./, (c) => c.toUpperCase()),
            ...CLASSES.map((c) => {
              const lim = races.getLevelLimit(r, c);
              return lim == null ? "—" : lim >= 99 ? "U" : lim;
            }),
          ]),
        },
      },
      {
        notes: [
          "U = unlimited. — = class not available to that race.",
          "House rule: we never block a combination — the app only warns.",
          "Humans are unlimited in every class.",
        ],
      },
    ],
    footer: "PHB Table 7 · house rule",
  });
}

// ── 19. Kampfstile ──────────────────────────────────────────────────────────
{
  const all = styles.getAllFightingStyles();
  add("fighting-styles", "warrior", {
    title: "Fighting Styles",
    subtitle: "Player's Option",
    sections: [
      ...all.slice(0, 4).map((s) => ({
        heading: s.name_en || s.name,
        notes: [(s.description_en || s.description || "").slice(0, 190)],
      })),
    ],
    footer: "PO: Combat & Tactics",
  });
}

// ── 20. Hausregeln ──────────────────────────────────────────────────────────
add("house-rules", "gold", {
  title: "House Rules",
  subtitle: "Chaos RPG",
  sections: [
    {
      heading: "Perception",
      notes: ["Perception score = (INT + WIS) ÷ 2, rounded down. Roll d20 equal or under."],
    },
    {
      heading: "Multi- and dual-class",
      notes: ["Any race may take any combination. The engine warns but never blocks."],
    },
    {
      heading: "Priest magic",
      notes: ["Priests use the Player's Option spell point system instead of slots."],
    },
    {
      heading: "Units",
      notes: ["All distances and weights are metric at the table. The rulebooks' imperial values are converted."],
    },
    {
      heading: "Restrictions",
      notes: ["Class/race combinations and proficiency groups are never blocked — only flagged."],
    },
  ],
  footer: "Chaos RPG",
});

// ── Rendern ─────────────────────────────────────────────────────────────────
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];
const todo = ONLY ? cards.filter((c) => c.key.includes(ONLY)) : cards;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: CW, height: CH }, deviceScaleFactor: 1 });
let n = 0;
for (const c of todo) {
  await page.setContent(renderRulesCard({ ...c, fmt: F }), { waitUntil: "networkidle" });
  const file = join(OUT, `${String(++n).padStart(2, "0")}_${c.key}.png`);
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: CW, height: CH } });
  // Überlauf melden statt still abschneiden — die Karte ist sonst unbrauchbar.
  const over = await page.evaluate(() => {
    const b = document.querySelector(".body");
    return b.scrollHeight - b.clientHeight;
  });
  console.log(`  ✓ ${c.key}${over > 4 ? `   ⚠ ${over}px Überlauf` : ""}`);
}
await browser.close();
console.log(`\nFertig: ${n} Regelkarten → ${OUT}`);
