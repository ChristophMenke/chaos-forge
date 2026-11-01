import { NextRequest } from "next/server";
import { streamText } from "@/lib/gemini/generate-text";
import { createClient } from "@/lib/supabase/server";
import { embedQuery } from "@/lib/embeddings";
import { createServiceClient } from "@/lib/supabase/service";
import { APP_HELP_CONTEXT, SYSTEM_PROMPT } from "@/lib/rulebook-chat/system-prompt";
import { API_HISTORY_LENGTH, MAX_HISTORY_CONTENT_LENGTH } from "@/lib/rulebook-chat/chat-history";
import { checkRateLimit } from "@/lib/rulebook-chat/rate-limit";
import { MAX_SUMMARY_LENGTH } from "@/lib/rulebook-chat/summary-request";

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
  const googleKey = process.env.GOOGLE_API_KEY;
  const voyageKey = process.env.VOYAGE_API_KEY;

  if (!googleKey || !voyageKey) {
    return Response.json(
      {
        error: "Regelbuch-Chat ist nicht konfiguriert (GOOGLE_API_KEY oder VOYAGE_API_KEY fehlt).",
      },
      { status: 503 }
    );
  }

  try {
    const { message, history, bookFilter, summary } = await request.json();

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

    // 3. Search for monster data if the question mentions creatures
    let monsterContext = "";
    try {
      const service = createServiceClient();
      // Extract potential monster names — min 4 chars to skip stop-words, max 5 terms
      const words = message
        .split(/[\s,;]+/)
        .filter((w: string) => w.length >= 4)
        .slice(0, 5);

      // Narrative sections can be long — truncate each to a reasonable budget
      // so three monster matches × four sections stay well within Claude's
      // input context.
      const MAX_SECTION_LEN = 800;
      const truncate = (text: string | null) => {
        if (!text) return "";
        return text.length > MAX_SECTION_LEN ? text.slice(0, MAX_SECTION_LEN) + "…" : text;
      };

      const matchedMonsters =
        words.length > 0
          ? (
              await service
                .from("monsters")
                .select(
                  "name, name_en, ac, hit_dice, thac0, damage, special_attacks, special_defenses, magic_resistance, movement, xp_value, no_appearing, intro_text, combat_tactics, habitat_society, ecology"
                )
                .or(words.map((w: string) => `name.ilike.%${w}%,name_en.ilike.%${w}%`).join(","))
                .limit(3)
            ).data
          : null;

      if (matchedMonsters && matchedMonsters.length > 0) {
        monsterContext =
          "\n\n--- Monster-Daten (Monstrous Manual) ---\n" +
          matchedMonsters
            .map(
              (m: {
                name: string;
                name_en: string | null;
                ac: number;
                hit_dice: string;
                thac0: number;
                damage: string;
                special_attacks: string | null;
                special_defenses: string | null;
                magic_resistance: number;
                movement: string;
                xp_value: number;
                no_appearing: string | null;
                intro_text: string | null;
                combat_tactics: string | null;
                habitat_society: string | null;
                ecology: string | null;
              }) => {
                const stats =
                  `${m.name}${m.name_en ? ` (${m.name_en})` : ""}: ` +
                  `RK ${m.ac}, TW ${m.hit_dice}, ETW0 ${m.thac0}, Schaden ${m.damage}, BW ${m.movement}` +
                  (m.no_appearing ? `, Auftreten: ${m.no_appearing}` : "") +
                  (m.special_attacks ? `, Spezialangriffe: ${m.special_attacks}` : "") +
                  (m.special_defenses ? `, Spezialverteidigung: ${m.special_defenses}` : "") +
                  (m.magic_resistance > 0 ? `, MR ${m.magic_resistance}%` : "") +
                  `, EP ${m.xp_value}`;

                const narrative = [
                  m.intro_text && `### Beschreibung\n${truncate(m.intro_text)}`,
                  m.combat_tactics && `### Kampf\n${truncate(m.combat_tactics)}`,
                  m.habitat_society &&
                    `### Lebensraum & Gesellschaft\n${truncate(m.habitat_society)}`,
                  m.ecology && `### Ökologie\n${truncate(m.ecology)}`,
                ]
                  .filter(Boolean)
                  .join("\n\n");

                return stats + (narrative ? "\n\n" + narrative : "");
              }
            )
            .join("\n\n---\n\n");
      }
    } catch {
      // Monster search is optional — continue without it
    }

    // 4. Build context from retrieved chunks + monster data + app help
    const rulesContext =
      chunks && chunks.length > 0
        ? chunks
            .map(
              (c: { book_title: string; content: string; similarity: number }) =>
                `--- Quelle: ${c.book_title} (Relevanz: ${(c.similarity * 100).toFixed(0)}%) ---\n${c.content}`
            )
            .join("\n\n")
        : "Keine relevanten Regeltexte gefunden.";

    const contextBlock = rulesContext + monsterContext + "\n\n" + APP_HELP_CONTEXT;

    // 5. Build message history (max 10 previous exchanges = API_HISTORY_LENGTH messages)
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
              m.content.length <= MAX_HISTORY_CONTENT_LENGTH
          )
          .slice(-API_HISTORY_LENGTH)
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
      : [];

    // Running summary of older messages (the last 10 exchanges come as history).
    const summaryBlock =
      typeof summary === "string" && summary.trim() && summary.length <= MAX_SUMMARY_LENGTH
        ? `Zusammenfassung des bisherigen Gesprächs (ältere Nachrichten):\n${summary.trim()}\n\n---\n\n`
        : "";

    // 6. Stream Claude response
    const stream = streamText({
      system: SYSTEM_PROMPT,
      history: previousMessages,
      prompt: `${summaryBlock}Relevante Regelbuch-Ausschnitte:\n\n${contextBlock}\n\n---\n\nFrage: ${message}`,
      // Auf Gemini 3 zählt das Nachdenken des Modells gegen dieses Budget,
      // deshalb spürbar mehr als die 2048 der früheren Claude-Anbindung.
      maxOutputTokens: 8192,
    });

    // Convert the Gemini stream to a ReadableStream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            controller.enqueue(encoder.encode(chunk));
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
