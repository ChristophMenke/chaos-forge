// Morgen (nach Quota-Reset des dauerhaften AIza-Keys) einmal ausführen:
//   node fix-remaining.mjs
// Regeneriert die 7 beanstandeten Bilder mit den neuen Prompts und rendert
// beide Decks neu. Braucht nur ~7 Imagen-Bilder (Limit 70/Tag).
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const HERE = dirname(fileURLToPath(import.meta.url));
const WRONG = ["Clairaudience", "Darkness, 15' Radius", "Fly", "Magic Mouth", "Ray of Enfeeblement", "Summon Swarm", "Water Breathing", "Armor"];

console.log("1) Bilder neu generieren …");
execSync(`node "${join(HERE, "regen-art.mjs")}" ${WRONG.map((n) => `"${n}"`).join(" ")}`, { stdio: "inherit" });

console.log("\n2) Decks + Rückseiten neu rendern …");
execSync(`node "${join(HERE, "generate-deck.mjs")}" sprocket --force`, { stdio: "inherit" });
execSync(`node "${join(HERE, "generate-deck.mjs")}" Nowi --force`, { stdio: "inherit" });
execSync(`node "${join(HERE, "portrait-back.mjs")}" sprocket`, { stdio: "inherit" });
execSync(`node "${join(HERE, "portrait-back.mjs")}" Nowi`, { stdio: "inherit" });

console.log("\n3) Review-Galerie …");
execSync(`node "${join(HERE, "review-gallery.mjs")}"`, { stdio: "inherit" });
console.log("\n✅ Fertig.");
