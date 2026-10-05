// Baut Karten für die magischen Gegenstände, die die aktiven Helden WIRKLICH
// besitzen — Quelle ist character_equipment, nicht der magic_items-Katalog.
// Ein Katalogeintrag, den niemand trägt, ergibt keine Karte für den Spieltisch.
//
// Epic Items bleiben außen vor: die haben ihre eigenen, aufwendigeren Karten
// (siehe build-char-cards.mjs).
//
// Nutzung: node build-item-cards.mjs [--tarot70|--tarot] [--only=cloak] [--force]
import { chromium } from "playwright";
import sharp from "sharp";
import { readFileSync, existsSync, mkdirSync, rmSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { supa, slug } from "./lib.mjs";
import { checkArt } from "./check-art.mjs";
import { generateImage, IMAGE_MODEL } from "./generate-image.mjs";
import { renderItemCard } from "./template-item.mjs";
import { TAROT_EPIC_FMT, IS_TAROT as TAROT, DIR_SUFFIX } from "./tarot.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const F = TAROT ? TAROT_EPIC_FMT : undefined;
const CW = F?.W ?? 768, CH = F?.H ?? 1146;
const A_W = TAROT ? 898 : 768, A_H = TAROT ? 610 : 470;
const SUF = TAROT ? "-tarot" : "";
const OUT = join(HERE, "out", `item-cards${TAROT ? DIR_SUFFIX : ""}`);
const ITEMART = join(HERE, "cache", "art-items");
[OUT, ITEMART].forEach((d) => mkdirSync(d, { recursive: true }));

const STYLE =
  " — a single magic item as the clear subject, centered on dark stone, dark fantasy painterly digital illustration," +
  " deep indigo-purple atmosphere with teal and gold arcane light, dramatic rim lighting, highly detailed," +
  " no people, no hands, no faces, no text, no letters, no numbers, no watermark, no logo.";

// Bildmotiv je Art des Gegenstands. Waffen bekommen ihr echtes Motiv, damit ein
// Kampfstab nicht wie ein Schwert aussieht.
const MOTIF = {
  "Short Sword": "an ornate magical short sword",
  "Throwing Dagger": "an ornate magical throwing dagger",
  Dagger: "an ornate magical dagger",
  Quarterstaff: "an ornate magical quarterstaff of dark polished wood",
  "Long Sword": "an ornate magical long sword",
  "Bracers of Protection": "a pair of enchanted bracers",
  Ring: "an ornate magical ring",
  Cloak: "a flowing enchanted cloak",
};
const ACCENT = {
  weapon: ["#e0524e", "#8f2f2b"],
  armor: ["#5b8def", "#2f4fa0"],
  wondrous: ["#e0b24e", "#a1782f"],
};

const sgn = (n) => (n >= 0 ? `+${n}` : `${n}`);

async function artB64(key, prompt, subject) {
  const f = join(ITEMART, `${key}${SUF}.webp`);
  const srcCache = join(ITEMART, `${key}.src.webp`);
  if (!existsSync(f) || process.argv.includes("--force")) {
    let srcBuf;
    if (existsSync(srcCache) && !process.argv.includes("--force")) {
      srcBuf = readFileSync(srcCache);
    } else {
      // Jedes frisch erzeugte Bild wird geprüft, bevor es auf die Karte darf:
      // Imagen liefert gelegentlich den Prompt als Bildinhalt oder ein
      // Stockfoto-Porträt. Auf einer gedruckten Karte ist das nicht heilbar.
      let last = "";
      for (let attempt = 1; attempt <= 4; attempt++) {
        const buf = await generateImage(prompt + STYLE);
        const check = await checkArt(buf, subject);
        if (check.ok) { srcBuf = buf; console.log(`      Bildprüfung ok (Versuch ${attempt})`); break; }
        last = check.reason;
        console.log(`      Versuch ${attempt} verworfen: ${check.reason}`);
      }
      if (!srcBuf) return null; // aufgeben, Karte wird übersprungen
      await sharp(srcBuf).webp({ quality: 95 }).toFile(srcCache);
    }
    await sharp(srcBuf).resize(A_W, A_H, { fit: "cover", position: "attention" }).webp({ quality: 88 }).toFile(f);
  }
  return readFileSync(f).toString("base64");
}

const sb = supa();
const { data: chars } = await sb.from("characters").select("id,name").eq("is_active", true).eq("is_npc", false);
const byId = Object.fromEntries(chars.map((c) => [c.id, c.name]));
const { data: eq } = await sb.from("character_equipment").select("*").in("character_id", Object.keys(byId));
const { data: weapons } = await sb.from("weapons").select("id,name,name_en");
const { data: armors } = await sb.from("armor").select("id,name,name_en,ac");
const { data: epics } = await sb.from("epic_items").select("name,name_en");
const wById = Object.fromEntries(weapons.map((x) => [x.id, x]));
const aById = Object.fromEntries(armors.map((x) => [x.id, x]));
// Epic Items haben eigene Karten — hier nicht doppeln.
const epicNames = new Set(epics.flatMap((e) => [e.name, e.name_en].filter(Boolean).map((n) => n.toLowerCase())));

function describe(e) {
  const base = wById[e.weapon_id] || aById[e.armor_id];
  const isWeapon = !!e.weapon_id;
  const baseEn = base?.name_en || base?.name || "";
  const fx = e.magic_effects || {};
  const custom = (e.custom_label || "").trim();

  // Name: Eigenname wenn vorhanden, sonst Basiswaffe mit Bonus in AD&D-Schreibweise.
  let name;
  if (custom) {
    name = custom.replace(/\s*\((Ring|Cloak|Schürze|Bracers?)\)\s*$/i, "");
  } else if (e.hit_bonus && e.hit_bonus === e.damage_bonus) {
    name = `${baseEn} ${sgn(e.hit_bonus)}`;
  } else if (e.hit_bonus || e.damage_bonus) {
    name = `${baseEn} ${sgn(e.hit_bonus || 0)}/${sgn(e.damage_bonus || 0)}`;
  } else {
    name = baseEn;
  }

  const kind = isWeapon ? "weapon" : e.armor_id ? "armor" : "wondrous";
  const motif = MOTIF[baseEn] || (custom.match(/cloak/i) ? MOTIF.Cloak : custom.match(/ring/i) ? MOTIF.Ring : MOTIF[baseEn] || "an ornate magic item");

  const effects = [];
  if (e.hit_bonus) effects.push({ label: "Trefferwurf", value: sgn(e.hit_bonus) });
  if (e.damage_bonus) effects.push({ label: "Schaden", value: sgn(e.damage_bonus) });
  if (typeof fx.ac_bonus === "number") effects.push({ label: "Rüstungsklasse", value: `${sgn(-fx.ac_bonus)} (RK ${sgn(fx.ac_bonus)})` });
  if (typeof fx.save_all === "number") effects.push({ label: "Alle Rettungswürfe", value: sgn(fx.save_all) });
  if (base?.ac != null && !isWeapon && !custom) effects.push({ label: "Rüstungsklasse", value: String(base.ac) });
  for (const [k, v] of Object.entries(fx.stat_overrides || {})) {
    if (k === "str_exceptional") continue;
    effects.push({ label: k.toUpperCase(), value: String(v) });
  }
  // Ladungen bewusst OHNE Zahl: die Spielenden führen den Verbrauch selbst,
  // eine gedruckte Zahl wäre ab der ersten Sitzung falsch.
  if (fx.max_charges != null) effects.push({ label: "Art", value: "Verbrauchsgegenstand" });

  // Beschreibung und Kurzfassung überlappen oft (Shadow Cloak nennt die
  // 50%-Chance in beiden). Die längere Fassung gewinnt, die enthaltene fällt weg.
  const notes = [];
  const d = (fx.description || fx.description_en || "").trim();
  for (const p of fx.passive_abilities || []) {
    const kern = String(p).slice(0, 24).toLowerCase();
    if (d && d.toLowerCase().includes(kern)) continue;
    notes.push(p);
  }
  if (d) notes.push(d);

  return { name, owner: byId[e.character_id], kind, motif, effects, notes, base: baseEn };
}

const ONLY = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1]?.toLowerCase();
if (!ONLY) { rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true }); }

// Magisch = Bonus, Effekte, Katalog-Verweis, Eigenname oder eine Basis, die
// schon dem Namen nach magisch ist (Bracers of Protection).
const candidates = eq
  .map((e) => ({ e, d: describe(e) }))
  .filter(({ e, d }) => {
    const magic =
      e.hit_bonus || e.damage_bonus || e.magic_item_id || (e.magic_effects && Object.keys(e.magic_effects).length) ||
      e.custom_label || /Bracers of|of Protection/i.test(d.base);
    return magic && !epicNames.has(d.name.toLowerCase());
  })
  .sort((a, b) => a.d.owner.localeCompare(b.d.owner) || a.d.name.localeCompare(b.d.name));

console.log(`Kandidaten: ${candidates.length}`);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: CW, height: CH }, deviceScaleFactor: 1 });
let n = 0;
const failed = [];
for (const { d } of candidates) {
  if (ONLY && !d.name.toLowerCase().includes(ONLY)) continue;
  console.log(`  → ${d.name} (${d.owner})`);
  const key = slug(`${d.owner.split(" ")[0]}-${d.name}`);
  // Bewusst ohne den Kartennamen: "Short Sword +1/-1" landete sonst als
  // Schriftzug im Bild. Die Prüfung bekommt das Motiv als Sollbild.
  const b64 = await artB64(key, d.motif, d.motif);
  if (!b64) { failed.push(d.name); console.log("     ✗ kein brauchbares Bild — Karte übersprungen"); continue; }
  const card = (artH) =>
    renderItemCard({
      name: d.name, category: d.owner, artB64: b64,
      accent: ACCENT[d.kind][0], accent2: ACCENT[d.kind][1],
      effects: d.effects, notes: d.notes, footer: d.base || "",
      fmt: artH ? { ...F, artH, bodyTop: artH - 14 } : F,
    });
  await page.setContent(card(null), { waitUntil: "networkidle" });
  const needed = await page.evaluate(() => {
    const b = document.querySelector(".body");
    return [...b.children].reduce((sum, el) => sum + el.offsetHeight, 0) + 44;
  });
  const artH = Math.max(520, Math.min(1010, CH - (F?.bodyBottom ?? 78) - needed - 36));
  await page.setContent(card(artH), { waitUntil: "networkidle" });
  await page.screenshot({ path: join(OUT, `${String(++n).padStart(2, "0")}_${key}.png`), clip: { x: 0, y: 0, width: CW, height: CH } });
  const over = await page.evaluate(() => {
    const b = document.querySelector(".body");
    return b.scrollHeight - b.clientHeight;
  });
  console.log(`     ✓ ${over > 4 ? `⚠ ${over}px Überlauf` : "fertig"}`);
}
await browser.close();
console.log(`\nFertig: ${n} Item-Karten → ${OUT}`);
if (failed.length) console.log(`⚠ ohne Bild geblieben: ${failed.join(", ")}`);
