// Transpiliert die @/-freien Regel-Engine-Dateien nach JS (CommonJS), damit die
// Kartenskripte korrekte Modifikatoren/Diebeswerte berechnen können.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, "..", "..", "src", "lib", "rules");
const OUT = join(HERE, "rules-js");

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "package.json"), JSON.stringify({ type: "commonjs" }));

let built = 0, skipped = [];
for (const f of readdirSync(SRC)) {
  if (!f.endsWith(".ts") || f.endsWith(".test.ts") || f.endsWith(".d.ts")) continue;
  const code = readFileSync(join(SRC, f), "utf8");
  if (/from ["']@\//.test(code)) { skipped.push(f); continue; } // @/-Dateien überspringen
  const out = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  writeFileSync(join(OUT, f.replace(/\.ts$/, ".js")), out);
  built++;
}
console.log(`Transpiliert: ${built} Dateien. Übersprungen (@/): ${skipped.join(", ")}`);

// Smoke-Test
try {
  const ab = require(join(OUT, "abilities.js"));
  const races = require(join(OUT, "races.js"));
  const thief = require(join(OUT, "thief.js"));
  console.log("STR8:", JSON.stringify(ab.getStrengthModifiers(8)));
  console.log("Gnome:", races.getRace ? races.getRace("gnome")?.name : "?");
  console.log("Thief L9 base:", thief.getBaseThiefSkills ? JSON.stringify(thief.getBaseThiefSkills(9)) : "?");
} catch (e) {
  console.log("Smoke-Test-Fehler:", e.message.slice(0, 200));
}
