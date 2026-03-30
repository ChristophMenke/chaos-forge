import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { embedQuery } from "@/lib/embeddings";

const SYSTEM_PROMPT = `Du bist ein Regelwerk-Nachschlageassistent für Advanced Dungeons & Dragons 2nd Edition.
Du antwortest AUSSCHLIESSLICH auf Basis der bereitgestellten Regelbuch-Ausschnitte.

STRIKTE REGELN:
1. Basiere deine Antwort AUSSCHLIESSLICH auf den bereitgestellten Ausschnitten. Erfinde NIEMALS Regeln, Werte oder Mechaniken.
2. Wenn die Ausschnitte nicht genügend Informationen enthalten, sage klar: "Dazu habe ich in den bereitgestellten Regeltexten keine ausreichende Information gefunden."
3. Antworte so KOMPAKT wie möglich. Gib die Kerninfo in 1-3 Sätzen. Keine Einleitungen, keine Wiederholungen, kein Fülltext.
4. Verwende metrische Maßeinheiten (Meter, Kilometer, Kilogramm) — rechne imperiale Werte um.
5. Nenne die Quelle kurz am Ende: **(PHB)**, **(CFH)** etc.
6. Nutze Markdown nur wenn nötig (Tabellen, Listen). Keine Überschriften für kurze Antworten.
7. Antworte in der Sprache, in der die Frage gestellt wurde.`;

// Simple in-memory rate limiter (sufficient for ~10 users)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_WINDOW);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  rateLimitMap.set(userId, recent);
  return true;
}

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  // Rate limit
  if (!checkRateLimit(user.id)) {
    return Response.json(
      { error: "Zu viele Anfragen. Bitte warte einen Moment." },
      { status: 429 }
    );
  }

  // API key checks
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const voyageKey = process.env.VOYAGE_API_KEY;

  if (!anthropicKey || !voyageKey) {
    return Response.json(
      {
        error:
          "Regelbuch-Chat ist nicht konfiguriert (ANTHROPIC_API_KEY oder VOYAGE_API_KEY fehlt).",
      },
      { status: 503 }
    );
  }

  try {
    const { message, history, bookFilter } = await request.json();

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return Response.json({ error: "Leere Nachricht." }, { status: 400 });
    }

    if (message.length > 5000) {
      return Response.json({ error: "Nachricht zu lang (max. 5000 Zeichen)." }, { status: 400 });
    }

    // 1. Embed the user's question via Voyage AI
    const queryEmbedding = await embedQuery(message);

    // 2. Vector similarity search
    const { data: chunks, error: searchError } = await supabase.rpc("match_rulebook_chunks", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: 0.3,
      match_count: 8,
      filter_books: bookFilter?.length ? bookFilter : null,
    });

    if (searchError) {
      console.error("Vector search error:", searchError);
      return Response.json({ error: "Fehler bei der Regelsuche." }, { status: 500 });
    }

    // 3. Build context from retrieved chunks
    const contextBlock =
      chunks && chunks.length > 0
        ? chunks
            .map(
              (c: { book_title: string; content: string; similarity: number }) =>
                `--- Quelle: ${c.book_title} (Relevanz: ${(c.similarity * 100).toFixed(0)}%) ---\n${c.content}`
            )
            .join("\n\n")
        : "Keine relevanten Regeltexte gefunden.";

    // 4. Build message history (max 4 previous exchanges = 8 messages)
    // Validate and sanitize history entries
    const previousMessages: Array<{ role: "user" | "assistant"; content: string }> = Array.isArray(
      history
    )
      ? history
          .filter(
            (m: unknown): m is { role: string; content: string } =>
              typeof m === "object" &&
              m !== null &&
              "role" in m &&
              "content" in m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string" &&
              m.content.length <= 10000
          )
          .slice(-8)
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
      : [];

    // 5. Stream Claude response
    const anthropic = new Anthropic({ apiKey: anthropicKey });

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        ...previousMessages,
        {
          role: "user",
          content: `Relevante Regelbuch-Ausschnitte:\n\n${contextBlock}\n\n---\n\nFrage: ${message}`,
        },
      ],
    });

    // Convert Anthropic stream to ReadableStream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Regelbuch-Abfrage fehlgeschlagen.";
    console.error("Rulebook chat error:", errorMessage);
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
