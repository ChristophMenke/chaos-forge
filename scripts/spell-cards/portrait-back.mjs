// Rendert eine individuelle Portrait-Rückseite pro Charakter (gleiches Produkt-
// Design wie die Grimoire-Rückseite, aber mit Charakterbild + Name).
// Nutzung: node portrait-back.mjs <deckKey>
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { mkdirSync, readFileSync, readdirSync, existsSync } from "fs";
import { fontFaceCss, fetchCharacters, fetchIllusionistDeck, fetchLearnedWizardSpells, slug } from "./lib.mjs";
import { TAROT_BACK_FMT, IS_TAROT, DIR_SUFFIX } from "./tarot.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const PORTRAITS = join(HERE, "cache", "portraits");
const FONT_CSS = fontFaceCss();
const LOGO_B64 = readFileSync(join(ROOT, "public", "header-logo.webp")).toString("base64");

const CLASS_LABEL = { illusionist: "Illusionist", mage: "Mage", wizard: "Mage", thief: "Rogue", fighter: "Fighter", cleric: "Priest", ranger: "Ranger" };
const CASTER_CLASS = new Set(["illusionist", "mage", "wizard"]);

// Runenkreis-Ornament (identisch zur Grimoire-Rückseite → Produkt-Wiedererkennung).
function sealSVG() {
  const cx = 300, cy = 300;
  const ticks = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * Math.PI * 2, r1 = 250, r2 = i % 3 === 0 ? 275 : 264;
    return `<line x1="${cx + Math.cos(a) * r1}" y1="${cy + Math.sin(a) * r1}" x2="${cx + Math.cos(a) * r2}" y2="${cy + Math.sin(a) * r2}" stroke="url(#g)" stroke-width="${i % 3 === 0 ? 3 : 1.2}"/>`;
  }).join("");
  const runes = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2, r = 220;
    const glyph = "ᚠᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛗ"[i];
    return `<text x="${cx + Math.cos(a) * r}" y="${cy + Math.sin(a) * r + 9}" text-anchor="middle" font-size="28" fill="#e0b24e" opacity=".45" font-family="serif">${glyph}</text>`;
  }).join("");
  return `<svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e6c667"/><stop offset=".55" stop-color="#3ec7bd"/><stop offset="1" stop-color="#b98729"/>
    </linearGradient></defs>
    <circle cx="${cx}" cy="${cy}" r="280" fill="none" stroke="url(#g)" stroke-width="2" opacity=".4"/>
    ${ticks}<circle cx="${cx}" cy="${cy}" r="192" fill="none" stroke="url(#g)" stroke-width="1" opacity=".3"/>${runes}
  </svg>`;
}

function findPortrait(charSlug, tarot) {
  const files = readdirSync(PORTRAITS);
  // Bei Tarot die höher aufgelöste `-tarot`-Variante bevorzugen (sonst matschig).
  const f = (tarot && files.find((n) => n === `${charSlug}-tarot.webp`))
    || files.find((n) => n.startsWith(charSlug) && !n.includes("-tarot"))
    || files.find((n) => n.startsWith(charSlug));
  return f ? join(PORTRAITS, f) : null;
}
const dataUri = (p) => `data:image/${p.split(".").pop()};base64,${readFileSync(p).toString("base64")}`;

export function renderBack({ name, classLabel, portraitPath, fmt, subtitle = "Arcane Spellbook" }) {
  const F = fmt || { W: 768, H: 1146, fs: 1 };
  const px = (n) => Math.round(n * F.fs);
  const portrait = portraitPath ? dataUri(portraitPath) : null;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${FONT_CSS}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:${F.W}px;height:${F.H}px;}
body{position:relative;overflow:hidden;font-family:'Cinzel',serif;color:#f1ebe0;--gold:#e0b24e;--teal:#3ec7bd;}
.bleed{position:absolute;inset:0;background:
    radial-gradient(70% 45% at 50% 30%, rgba(224,178,78,.15), transparent 62%),
    radial-gradient(80% 55% at 50% 86%, rgba(62,199,189,.12), transparent 60%),
    linear-gradient(165deg,#221a30 0%,#171122 55%,#0f0b17 100%);}
.bleed::after{content:"";position:absolute;inset:0;background:radial-gradient(150% 100% at 50% 45%,transparent 52%,rgba(0,0,0,.6));mix-blend-mode:multiply;}
.frame{position:absolute;left:66px;top:66px;right:66px;bottom:66px;border-radius:22px;
  border:2px solid color-mix(in srgb,var(--gold) 60%,#3a3350);
  box-shadow:0 0 46px rgba(224,178,78,.12) inset,0 0 0 1px rgba(0,0,0,.5) inset;}
.frame::before{content:"";position:absolute;inset:7px;border-radius:18px;border:1px solid rgba(224,178,78,.28);}
.seal{position:absolute;top:${px(322)}px;left:50%;transform:translate(-50%,-50%) scale(${F.fs});opacity:.85;z-index:1;}
.portrait{position:absolute;top:${px(150)}px;left:50%;transform:translateX(-50%);z-index:2;
  width:${px(372)}px;height:${px(404)}px;border-radius:${px(186)}px ${px(186)}px ${px(26)}px ${px(26)}px;overflow:hidden;
  border:3px solid var(--gold);
  box-shadow:0 12px 40px rgba(0,0,0,.6),0 0 34px rgba(224,178,78,.22),0 0 0 8px rgba(15,11,23,.75);}
.portrait img{width:100%;height:100%;object-fit:cover;object-position:center 22%;}
.portrait::after{content:"";position:absolute;inset:0;box-shadow:0 -60px 70px -30px rgba(15,11,23,.9) inset;}
.name{position:absolute;top:${px(600)}px;left:84px;right:84px;text-align:center;z-index:3;
  font-weight:700;font-size:${px(46)}px;line-height:1.05;color:#fbf6ea;text-wrap:balance;
  text-shadow:0 2px 14px rgba(0,0,0,.6);}
.klass{position:absolute;top:${px(690)}px;left:84px;right:84px;text-align:center;z-index:3;
  font-family:'EB Garamond',serif;font-size:${px(20)}px;letter-spacing:.36em;text-transform:uppercase;color:var(--teal);}
.rule{position:absolute;top:${px(742)}px;left:50%;transform:translateX(-50%);width:220px;height:1px;
  background:linear-gradient(90deg,transparent,var(--gold),transparent);z-index:3;}
.foot{position:absolute;bottom:${px(120)}px;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:16px;z-index:3;}
.logo{width:${px(300)}px;filter:drop-shadow(0 6px 24px rgba(0,0,0,.6));}
.sub{font-family:'EB Garamond',serif;font-size:${px(15)}px;letter-spacing:.34em;text-transform:uppercase;color:#8f84a0;}
</style></head><body>
<div class="bleed"></div>
<div class="seal">${sealSVG()}</div>
<div class="frame"></div>
${portrait ? `<div class="portrait"><img src="${portrait}" alt=""></div>` : ""}
<div class="name">${name}</div>
<div class="klass">${classLabel}</div>
<div class="rule"></div>
<div class="foot">
  <img class="logo" src="data:image/webp;base64,${LOGO_B64}" alt="Chaos Forge">
  <div class="sub">${subtitle}</div>
</div>
</body></html>`;
}

async function resolveChar(key) {
  if (key === "sprocket") return { name: "Sprocket Tanglewire", slug: "sprocket", classLabel: "Illusionist", subtitle: "Arcane Spellbook" };
  const chars = await fetchCharacters();
  const c = chars.find((x) => x.name.toLowerCase().includes(key.toLowerCase()));
  if (!c) throw new Error("Charakter nicht gefunden: " + key);
  // Caster (auch Multiclass wie Nowi) → "Arcane Spellbook"; sonst generische Helden-Rückseite.
  const castsWizard = CASTER_CLASS.has(c.class_id) || (await fetchLearnedWizardSpells(c.id)).length > 0;
  return {
    name: c.name.replace(/\s*\(NPC\)/, ""),
    slug: slug(c.name),
    classLabel: CLASS_LABEL[c.class_id] || "Adventurer",
    subtitle: castsWizard ? "Arcane Spellbook" : "Hero of Chaos RPG",
  };
}

// Direkt ausführbar (Pfad kann Leerzeichen enthalten → nicht über file://-Vergleich)
if (process.argv[1] && process.argv[1].endsWith("portrait-back.mjs")) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--tarot"));
  const TAROT = IS_TAROT;
  const key = args[0] || "sprocket";
  const fmt = TAROT ? TAROT_BACK_FMT : undefined;
  const CW = TAROT ? TAROT_BACK_FMT.W : 768, CH = TAROT ? TAROT_BACK_FMT.H : 1146;
  const ch = await resolveChar(key);
  const portraitPath = findPortrait(ch.slug, TAROT);
  const outDir = join(HERE, "out", TAROT ? `decks${DIR_SUFFIX}` : "decks", ch.slug);
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: CW, height: CH }, deviceScaleFactor: 1 });
  await page.setContent(renderBack({ name: ch.name, classLabel: ch.classLabel, portraitPath, fmt, subtitle: ch.subtitle }), { waitUntil: "networkidle" });
  await page.screenshot({ path: join(outDir, "card-back.png"), clip: { x: 0, y: 0, width: CW, height: CH } });
  await browser.close();
  console.log(`→ ${join(outDir, "card-back.png")} (Portrait: ${portraitPath ? "ja" : "nein"})`);
}
