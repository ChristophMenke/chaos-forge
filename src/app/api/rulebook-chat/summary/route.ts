import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/gemini/generate-text";
import { checkRateLimit } from "@/lib/rulebook-chat/rate-limit";
import { SUMMARY_SYSTEM_PROMPT } from "@/lib/rulebook-chat/system-prompt";
import {
  MAX_SUMMARY_LENGTH,
  buildSummaryPrompt,
  parseSummaryRequest,
} from "@/lib/rulebook-chat/summary-request";

/**
 * Folds older SvenBot messages into the running summary that the browser
 * stores with the chat (src/lib/rulebook-chat/chat-store.ts).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }
  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ error: "Zu viele Anfragen." }, { status: 429 });
  }
  if (!process.env.GOOGLE_API_KEY) {
    return NextResponse.json({ error: "Nicht konfiguriert." }, { status: 503 });
  }

  const input = parseSummaryRequest(await request.json().catch(() => null));
  if (!input) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  try {
    const result = await generateText({
      system: SUMMARY_SYSTEM_PROMPT,
      prompt: buildSummaryPrompt(input.previousSummary, input.messages),
      // Gemini 3 thinking counts against this budget; the prompt keeps the text short.
      maxOutputTokens: 4096,
    });
    const summary = result.text.trim().slice(0, MAX_SUMMARY_LENGTH);
    if (result.truncated || !summary) {
      return NextResponse.json({ error: "Zusammenfassung unvollständig." }, { status: 502 });
    }
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("[SvenBot] summary failed:", error);
    return NextResponse.json({ error: "Zusammenfassung fehlgeschlagen." }, { status: 500 });
  }
}
