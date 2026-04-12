import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateImage } from "@/lib/gemini/generate-image";
import { sessionPrompt } from "@/lib/gemini/prompts";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  // Approval gate — unapproved users can view but not regenerate mood images.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_approved")
    .eq("id", user.id)
    .maybeSingle();
  if (profile && profile.is_approved === false) {
    return NextResponse.json(
      { error: "Du musst erst freigeschaltet werden, bevor du Bilder generieren kannst." },
      { status: 403 }
    );
  }

  if (!process.env.GOOGLE_API_KEY) {
    return NextResponse.json(
      { error: "Bildgenerierung ist nicht konfiguriert (GOOGLE_API_KEY fehlt)." },
      { status: 503 }
    );
  }

  try {
    const { sessionId } = await request.json();

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!sessionId || typeof sessionId !== "string" || !UUID_RE.test(sessionId)) {
      return NextResponse.json({ error: "Ungültige sessionId." }, { status: 400 });
    }

    // Load session
    const service = createServiceClient();
    const { data: session, error: sessionError } = await service
      .from("sessions")
      .select("id, title, summary, created_by")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session nicht gefunden." }, { status: 404 });
    }

    if (session.created_by !== user.id) {
      return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
    }

    // Load entries with character names for better image context
    const { data: entries } = await service
      .from("session_entries")
      .select("content, character_id")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    const characterIds = [...new Set((entries ?? []).map((e) => e.character_id))];
    const { data: characters } =
      characterIds.length > 0
        ? await service.from("characters").select("id, name").in("id", characterIds)
        : { data: [] };

    const charMap = Object.fromEntries((characters ?? []).map((c) => [c.id, c.name]));
    const entryContext = (entries ?? []).map((e) => ({
      characterName: charMap[e.character_id] ?? "?",
      content: e.content,
    }));

    // Generate image
    const prompt = sessionPrompt(session.title, session.summary, entryContext);
    const buffer = await generateImage(prompt, { width: 1200, height: 450 });

    // Upload to Supabase Storage (upsert)
    const path = `${sessionId}.webp`;
    const { error: uploadErr } = await service.storage.from("session-images").upload(path, buffer, {
      upsert: true,
      contentType: "image/webp",
    });

    if (uploadErr) {
      return NextResponse.json({ error: uploadErr.message }, { status: 500 });
    }

    // Get public URL (store clean URL in DB, cache-bust only in response)
    const { data: urlData } = service.storage.from("session-images").getPublicUrl(path);
    const imageUrl = urlData.publicUrl;

    // Update session with image URL and timestamp
    const { error: updateErr } = await service
      .from("sessions")
      .update({
        image_url: imageUrl,
        image_generated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ imageUrl: `${imageUrl}?t=${Date.now()}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
