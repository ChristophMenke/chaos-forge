import "server-only";
import { GoogleGenAI } from "@google/genai";

function getApiKey(): string {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("GOOGLE_API_KEY not set");
  return key;
}

let _genAI: GoogleGenAI | null = null;

export function getGenAI(): GoogleGenAI {
  if (!_genAI) {
    _genAI = new GoogleGenAI({ apiKey: getApiKey() });
  }
  return _genAI;
}
