// Prüft ein frisch erzeugtes Artwork, bevor es auf einer Karte landet.
//
// Imagen liefert gelegentlich Ausschuss, der beim Rendern nicht auffällt: den
// Prompt-Text als Bildinhalt (Necklace of Fireballs), ein Stockfoto-Porträt
// statt des Gegenstands (Belt of Giant Strength), ein völlig anderes Motiv. Auf
// einer gedruckten Karte ist das nicht mehr zu korrigieren.
//
// Die Prüfung läuft über Gemini, nicht über Claude: derselbe Schlüssel wie die
// Bildgenerierung, also eine Abhängigkeit weniger.
import { GoogleGenAI } from "@google/genai";
import { readFileSync } from "fs";
import sharp from "sharp";

const ROOT = "/Users/christoph.menke/PrivateProjects/Chaos Forge";
const env = Object.fromEntries(
  readFileSync(`${ROOT}/.env.local`, "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const genai = new GoogleGenAI({ apiKey: env.GOOGLE_API_KEY });

const SCHEMA = {
  type: "object",
  properties: {
    shows_subject: { type: "boolean" },
    has_real_text: { type: "boolean" },
    has_people: { type: "boolean" },
    subject_seen: { type: "string" },
    reason: { type: "string" },
  },
  required: ["shows_subject", "has_real_text", "has_people", "subject_seen", "reason"],
};

/**
 * @param {Buffer} buf      Bilddaten
 * @param {string} subject  Was zu sehen sein soll
 * @returns {Promise<{ok: boolean, reason: string, detail: object}>}
 */
export async function checkArt(buf, subject) {
  const jpg = await sharp(buf).resize(600).jpeg({ quality: 80 }).toBuffer();
  const r = await genai.models.generateContent({
    model: "gemini-flash-latest",
    config: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0 },
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: jpg.toString("base64") } },
          {
            text:
              `Dies ist Artwork für eine gedruckte Fantasy-Spielkarte. Zu sehen sein soll: ${subject}\n\n` +
              `Bewerte:\n` +
              `- shows_subject: Zeigt das Bild eindeutig diesen Gegenstand?\n` +
              `- has_real_text: NUR true bei echtem lesbarem Text — lateinische Wörter, Ziffern, ` +
              `Wasserzeichen, eingeblendete Prompt- oder Parameterzeilen. ` +
              `Dekorative Fantasy-Runen, Glyphen und Ornamente auf dem Gegenstand sind ERWÜNSCHT und ergeben false.\n` +
              `- has_people: Ist ein Mensch, Gesicht oder eine Hand zu sehen?\n` +
              `- subject_seen: was tatsächlich abgebildet ist, in wenigen Worten\n` +
              `- reason: ein kurzer Satz`,
          },
        ],
      },
    ],
  });
  let out = {};
  try { out = JSON.parse((r.text || "{}").replace(/^```json\s*|\s*```$/g, "")); } catch { /* unlesbar → verwerfen */ }
  const ok = out.shows_subject === true && out.has_real_text === false && out.has_people === false;
  return { ok, reason: out.reason || out.subject_seen || "keine Antwort", detail: out };
}
