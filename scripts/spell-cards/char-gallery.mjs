// Vorschau-Galerie der Charakter-Karten (fertig geschnitten: Beschnitt weg, Ecken rund).
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import sharp from "sharp";

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = join(HERE, "out", "char-cards");
const fonts = JSON.parse(readFileSync(join(HERE, "fonts", "fonts.json"), "utf8"));
const face = (fam, key, w) => (fonts[key] ? `@font-face{font-family:'${fam}';font-weight:${w};src:url(data:font/ttf;base64,${fonts[key]}) format('truetype');}` : "");
const MM = 11.811;
async function thumb(f) {
  const inset = Math.round(3 * MM), W = Math.round(59 * MM), H = Math.round(91 * MM), r = Math.round(5 * MM);
  const trimmed = await sharp(readFileSync(join(DIR, f))).extract({ left: inset, top: inset, width: W, height: H }).png().toBuffer();
  const mask = Buffer.from(`<svg width="${W}" height="${H}"><rect width="${W}" height="${H}" rx="${r}" ry="${r}"/></svg>`);
  const rounded = await sharp(trimmed).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  return (await sharp(rounded).resize(430).webp({ quality: 80 }).toBuffer()).toString("base64");
}
const EPIC = [
  ["epic-blade-of-water.png", "Blade of Water", "Larry · Epic-Waffe"],
  ["epic-shadowdancer.png", "Shadowdancer", "Isolde · Umhang"],
  ["epic-ring-of-many-faces.png", "Ring of Many Faces", "Isolde · Ring"],
  ["epic-constitution-condenser.png", "Constitution Condenser", "Sprocket · Gerät"],
  ["epic-mix-and-match-blades.png", "Mix-and-Match Blades", "Sprocket · Wurfklingen"],
  ["epic-sharpvision-goggles.png", "Sharpvision Goggles", "Sprocket · Brille"],
];
const REF = [
  ["reference-larry.png", "Larry", "Human Fighter"],
  ["reference-sprocket-fixit-tanglewire.png", "Sprocket", "Gnome Illusionist"],
  ["reference-nowi-tarja.png", "Nowi Tarja", "Elf Thief/Mage"],
  ["reference-isolde.png", "Isolde", "Tiefling Thief"],
];

(async () => {
  const card = async (f, n, m, a) => `<figure class="card" style="--a:${a}"><img src="data:image/webp;base64,${await thumb(f)}"><figcaption><span class="n">${n}</span><span class="m">${m}</span></figcaption></figure>`;
  const epicHtml = (await Promise.all(EPIC.map((e) => card(...e, "#e0b24e")))).join("");
  const refHtml = (await Promise.all(REF.map((e) => card(...e, "#5b8def")))).join("");
  const html = `<title>Chaos Forge — Charakter-Karten</title>
<style>
${face("Cinzel", "Cinzel|700|normal", 700)}${face("EB Garamond", "EB Garamond|400|normal", 400)}
:root{--bg:#0f0b17;--panel:#1c1630;--line:#2e2743;--ink:#f1ebe0;--muted:#a99fb8;--gold:#e0b24e;}
*{box-sizing:border-box;}body{margin:0;background:radial-gradient(90% 55% at 50% -5%,rgba(224,178,78,.09),transparent 60%),var(--bg);color:var(--ink);font-family:'EB Garamond',Georgia,serif;}
.wrap{max-width:1240px;margin:0 auto;padding:60px 24px 90px;}
.eyebrow{font-family:system-ui;font-size:12px;letter-spacing:.32em;text-transform:uppercase;color:var(--gold);margin:0 0 12px;}
h1{font-family:'Cinzel',serif;font-size:clamp(28px,5vw,48px);margin:0 0 14px;}
.lede{max-width:66ch;color:#cdc4d6;font-size:18px;margin:0 0 8px;}
h2{font-family:'Cinzel',serif;font-size:22px;margin:50px 0 20px;padding-bottom:10px;border-bottom:1px solid var(--line);}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:30px;}
.card{margin:0;}.card img{width:100%;display:block;filter:drop-shadow(0 10px 26px rgba(0,0,0,.6));}
figcaption{display:flex;flex-direction:column;gap:2px;margin-top:12px;}
.n{font-family:'Cinzel',serif;font-size:17px;}.m{font-size:14px;color:var(--a);}
</style>
<div class="wrap">
<p class="eyebrow">Chaos Forge · Charakter-Karten</p>
<h1>Epic Items & Helden-Referenz</h1>
<p class="lede">Charakterspezifische Karten für die aktiven Helden — Epic Items mit je passendem Layout und Helden-Referenzkarten mit stabilen Werten (Attribute + Modifikatoren), Portrait groß.</p>
<h2>Epic Items</h2><div class="grid">${epicHtml}</div>
<h2>Helden-Referenz</h2><div class="grid">${refHtml}</div>
</div>`;
  writeFileSync(join(HERE, "out", "char-preview.html"), html);
  console.log("→ out/char-preview.html");
})();
