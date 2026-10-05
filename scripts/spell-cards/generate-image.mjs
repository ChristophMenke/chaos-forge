// Bilderzeugung für die Karten — über Gemini, mit Key-Rotation.
//
// Modell: gemini-3-pro-image-preview statt des früheren Imagen. Gemini folgt
// den Vorgaben spürbar genauer, vor allem beim wichtigsten Punkt: kein Text im
// Bild. Imagen malte mehrfach den Prompt als Bildunterschrift mit.
//
// Der Aufruf unterscheidet sich von Imagen: kein generateImages(), sondern
// generateContent() mit responseModalities: ["IMAGE"] — das Bild kommt als
// inlineData-Part zurück.
//
// Schlüssel kommen aus ZWEI Quellen, damit keiner übersehen wird:
//   .env.local   GOOGLE_API_KEY, GOOGLE_API_KEY_2, …  (Key=Wert)
//   keys.env     ein Schlüssel je Zeile, mit oder ohne NAME=
// Jeder Schlüssel aus einem eigenen Google-Projekt bringt ein eigenes
// Tageskontingent; bei Fehlern wandert der Aufruf zum nächsten weiter.
import { GoogleGenAI } from "@google/genai";
import { readFileSync, existsSync } from "fs";

const ROOT = "/Users/christoph.menke/PrivateProjects/Chaos Forge";

function readEnvFile(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
      .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
  );
}

function collectKeys() {
  const keys = [];
  const env = readEnvFile(`${ROOT}/.env.local`);
  for (const k of Object.keys(env).sort()) {
    if (/^GOOGLE_API_KEY(_\d+)?$/.test(k) && env[k]) keys.push(env[k]);
  }
  // keys.env: eine Zeile = ein Schlüssel, Zuweisungsform optional.
  const kp = `${ROOT}/keys.env`;
  if (existsSync(kp)) {
    for (const line of readFileSync(kp, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const val = t.includes("=") ? t.slice(t.indexOf("=") + 1).trim() : t;
      if (val) keys.push(val);
    }
  }
  return [...new Set(keys)]; // Dubletten raus — Key 3 steht in beiden Dateien
}

const KEYS = collectKeys();
if (!KEYS.length) throw new Error("Kein Google-API-Schlüssel gefunden (.env.local oder keys.env)");
const CLIENTS = KEYS.map((apiKey) => new GoogleGenAI({ apiKey }));
let keyIdx = 0;

/** Zum Protokollieren, ohne Schlüssel preiszugeben. */
export const KEY_COUNT = KEYS.length;
export const IMAGE_MODEL = "gemini-3-pro-image-preview";
/** Rückfallmodell, falls das Hauptmodell für ein Projekt nicht freigeschaltet ist. */
export const FALLBACK_MODEL = "gemini-2.5-flash-image";

/**
 * Erzeugt ein Bild und liefert es als Buffer. Schlägt ein Schlüssel fehl
 * (Kontingent, 401, gesperrtes Modell), übernimmt der nächste.
 *
 * Mit `refImage` wird das Bild aus einer Vorlage abgeleitet — so bleibt eine
 * bestimmte Person über mehrere Karten hinweg wiedererkennbar.
 *
 * @param {string} prompt
 * @param {{aspectRatio?: string, refImage?: Buffer, refMime?: string}} [opts]
 * @returns {Promise<Buffer>}
 */
export async function generateImage(prompt, { aspectRatio = "4:3", refImage, refMime = "image/webp" } = {}) {
  const contents = refImage
    ? [{ role: "user", parts: [{ inlineData: { mimeType: refMime, data: refImage.toString("base64") } }, { text: prompt }] }]
    : prompt;
  let lastErr;
  for (let tried = 0; tried < CLIENTS.length * 2; tried++) {
    const model = tried < CLIENTS.length ? IMAGE_MODEL : FALLBACK_MODEL;
    try {
      const r = await CLIENTS[keyIdx].models.generateContent({
        model,
        contents,
        config: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio } },
      });
      const parts = r.candidates?.[0]?.content?.parts || [];
      const part = parts.find((p) => p.inlineData);
      if (!part) {
        // Bei Ablehnung kommt Text statt Bild zurück — den zeigen wir an,
        // sonst rätselt man über ein leeres Ergebnis.
        const text = parts.map((p) => p.text).filter(Boolean).join(" ");
        throw new Error(`kein Bild${text ? `: ${text.slice(0, 140)}` : ""}`);
      }
      return Buffer.from(part.inlineData.data, "base64");
    } catch (e) {
      lastErr = e;
      keyIdx = (keyIdx + 1) % CLIENTS.length;
    }
  }
  throw lastErr;
}
