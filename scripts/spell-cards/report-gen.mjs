// Baut den QA-Report (HTML-Tabelle) aus dem Text-Audit (cache/audit.json) +
// meiner visuellen Bild-Beurteilung.
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const HERE = dirname(fileURLToPath(import.meta.url));
const audit = JSON.parse(readFileSync(join(HERE, "cache", "audit.json"), "utf8"));

// ── Meine visuelle Bild-Beurteilung ──────────────────────────────────────────
const IMG_PENDING = new Set([
  "Armor", "Clairaudience", "Darkness, 15' Radius", "Fly", "Magic Mouth",
  "Ray of Enfeeblement", "Summon Swarm", "Water Breathing",
]); // fotorealistische Ausreißer → werden morgen ersetzt
const IMG_BORDERLINE = {
  "Extension I": "Galaxie-Motiv für einen reinen Dauer-Verlängerungszauber recht abstrakt (Zeit-/Sanduhr-Motiv träfe besser)",
};

// Vom Menschen geprüfte Fehlalarme des LLM (Name ist tatsächlich korrekt).
const NAME_FALSE_POSITIVE = new Set(["Wizard Mark", "Tasha's Hideous Laughter"]);

function imgVerdict(name) {
  if (IMG_PENDING.has(name)) return { ok: false, style: false, note: "Bild passt nicht / fotorealistisch – Neugenerierung eingeplant" };
  if (IMG_BORDERLINE[name]) return { ok: "borderline", style: true, note: IMG_BORDERLINE[name] };
  return { ok: true, style: true, note: "" };
}

const cell = (state) => {
  const map = { ok: ["✓", "#3ecf8e"], minor: ["!", "#e0b24e"], major: ["✗", "#fb5e6a"], borderline: ["~", "#e0b24e"], pending: ["⟳", "#e0b24e"] };
  const [sym, col] = map[state] || ["✓", "#3ecf8e"];
  return `<td class="c" style="color:${col}">${sym}</td>`;
};

const rows = audit
  .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
  .map((r) => {
    if (NAME_FALSE_POSITIVE.has(r.name)) r.name_ok = true; // Fehlalarm korrigieren
    const img = imgVerdict(r.name);
    const notes = [
      r.name_ok === false ? `Name: ${r.name_note}` : "",
      r.complete_ok === false ? `Text: ${r.complete_note}` : "",
      r.dup_ok === false ? `Doppelung: ${r.dup_note}` : "",
      img.note,
    ].filter(Boolean).join(" · ");
    const anyIssue = r.name_ok === false || r.complete_ok === false || r.dup_ok === false || img.ok !== true;
    return `<tr class="${anyIssue ? "flag" : ""}">
      <td class="nm">${r.name}</td><td class="lv">${r.level}</td><td class="sc">${r.school}</td>
      ${cell(r.name_ok === false ? "major" : "ok")}
      ${cell(r.complete_ok === false ? "minor" : "ok")}
      ${cell(r.dup_ok === false ? "minor" : "ok")}
      ${cell(img.ok === true ? "ok" : img.ok === "borderline" ? "borderline" : "pending")}
      ${cell(img.style ? "ok" : "pending")}
      <td class="note">${notes || "—"}</td></tr>`;
  }).join("\n");

const nName = audit.filter((r) => r.name_ok === false).length;
const nComplete = audit.filter((r) => r.complete_ok === false).length;
const nDup = audit.filter((r) => r.dup_ok === false).length;
const nImg = audit.filter((r) => IMG_PENDING.has(r.name)).length;
const nBorder = Object.keys(IMG_BORDERLINE).length;
const clean = audit.filter((r) => r.name_ok !== false && r.complete_ok !== false && r.dup_ok !== false && imgVerdict(r.name).ok === true).length;

const html = `<title>Chaos Forge — QA-Report</title>
<style>
:root{--bg:#0f0b17;--panel:#1c1630;--line:#2e2743;--ink:#f1ebe0;--muted:#a99fb8;--gold:#e0b24e;}
*{box-sizing:border-box;}
body{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,sans-serif;line-height:1.5;}
.wrap{max-width:1200px;margin:0 auto;padding:48px 22px 90px;}
h1{font-size:30px;margin:0 0 6px;}
.sub{color:var(--muted);margin:0 0 24px;}
.cards{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:28px;}
.k{border:1px solid var(--line);border-radius:10px;padding:12px 16px;background:var(--panel);min-width:130px;}
.k b{font-size:26px;display:block;line-height:1;}
.k.good b{color:#3ecf8e;}.k.warn b{color:var(--gold);}
.k span{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;}
table{width:100%;border-collapse:collapse;font-size:14px;}
th,td{text-align:left;padding:7px 8px;border-bottom:1px solid var(--line);}
th{position:sticky;top:0;background:#141019;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.06em;}
.c{text-align:center;font-weight:700;width:70px;}
.nm{font-weight:600;}.lv,.sc{color:var(--muted);}
.sc{font-size:12px;}
tr.flag{background:rgba(224,178,78,.05);}
.note{color:#cdc4d6;font-size:13px;}
.legend{margin:18px 0 10px;color:var(--muted);font-size:13px;}
.legend b{color:var(--ink);}
</style>
<div class="wrap">
<h1>QA-Report — alle Zauberkarten</h1>
<p class="sub">Experten-Review (AD&amp;D 2e) je Karte: Name gemäß Handbuch · Vollständigkeit des Regeltexts · keine Doppelung mit dem Stat-Block · Bildpassung &amp; Stil. ${audit.length} eindeutige Zauber.</p>
<div class="cards">
  <div class="k good"><b>${clean}</b><span>ohne Befund</span></div>
  <div class="k warn"><b>${nName}</b><span>Name</span></div>
  <div class="k warn"><b>${nComplete}</b><span>Text unvollständig</span></div>
  <div class="k warn"><b>${nDup}</b><span>Doppelung</span></div>
  <div class="k warn"><b>${nImg}</b><span>Bild (→ morgen)</span></div>
  <div class="k warn"><b>${nBorder}</b><span>Bild grenzwertig</span></div>
</div>
<p class="legend"><b>✓</b> ok · <b style="color:#e0b24e">!</b> kleinere Anmerkung · <b style="color:#e0b24e">~</b> grenzwertig · <b style="color:#e0b24e">⟳</b> Neugenerierung eingeplant · <b style="color:#fb5e6a">✗</b> falsch</p>
<table>
<thead><tr><th>Zauber</th><th>Grad</th><th>Schule</th><th>Name</th><th>Text&nbsp;vollst.</th><th>Keine&nbsp;Doppelung</th><th>Bild&nbsp;passt</th><th>Stil</th><th>Anmerkung</th></tr></thead>
<tbody>
${rows}
</tbody></table>
</div>`;
writeFileSync(join(HERE, "out", "qa-report.html"), html);
console.log(`→ out/qa-report.html (${audit.length} Zeilen, ${clean} ohne Befund)`);
