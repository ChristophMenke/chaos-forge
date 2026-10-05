import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/gemini/generate-text";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // Verify authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  // Approval gate — unapproved users can read but not create summaries.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_approved")
    .eq("id", user.id)
    .maybeSingle();
  if (profile && profile.is_approved === false) {
    return NextResponse.json(
      {
        error: "Du musst erst freigeschaltet werden, bevor du Zusammenfassungen erstellen kannst.",
      },
      { status: 403 }
    );
  }

  // Check API key
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "KI-Zusammenfassung ist nicht konfiguriert (GOOGLE_API_KEY fehlt)." },
      { status: 503 }
    );
  }

  try {
    const { entries } = await request.json();

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: "Keine Beiträge zum Zusammenfassen vorhanden." },
        { status: 400 }
      );
    }

    // Format entries for the prompt
    const formattedEntries = entries
      .map(
        (e: { characterName: string; content: string }) => `### ${e.characterName}\n${e.content}`
      )
      .join("\n\n---\n\n");

    const { text: summary, truncated } = await generateText({
      // 200-400 Wörter Deutsch ≈ 400-800 Tokens; auf Gemini 3 zählt das
      // Nachdenken des Modells mit, deshalb reichlich Puffer.
      maxOutputTokens: 6000,
      system: `Du bist ein erfahrener Chronist einer AD&D 2nd Edition Rollenspielgruppe namens "Chaos RPG".
Erstelle aus den verschiedenen Charakter-Perspektiven eine zusammenhängende, stimmungsvolle Zusammenfassung der Spielsitzung auf Deutsch.
- Fasse die wichtigsten Ereignisse, Begegnungen und Entscheidungen zusammen
- Behalte wichtige Namen (NPCs, Orte) bei
- Schreibe in der dritten Person
- Halte die Zusammenfassung auf 200-400 Wörter (max. 400 Wörter — nicht überschreiten!)
- Das Hardlimit für deine Antwort sind ~1500 Tokens, deine Zusammenfassung darf also nicht länger sein. Wenn du sicher nicht abschließen kannst, kürze statt abzubrechen.
- Nutze Markdown-Formatierung (Fettdruck für wichtige Namen)`,
      prompt: `Fasse die folgenden Charakter-Beiträge zu einer Session-Zusammenfassung zusammen:\n\n${formattedEntries}`,
    });

    if (truncated) {
      return NextResponse.json(
        { error: "Zusammenfassung wurde abgeschnitten — bitte erneut versuchen." },
        { status: 422 }
      );
    }

    return NextResponse.json({ summary });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Zusammenfassung fehlgeschlagen.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
