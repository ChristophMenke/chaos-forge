// Note: This module must only be used from server code (API routes, server actions, scripts).
// We don't use `import "server-only"` here because that breaks CLI scripts under tsx/node.
// Next.js will still fail to bundle this into client code due to the GOOGLE_API_KEY check.
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
