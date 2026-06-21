// NOTE: Next.js 16 App Router Route Handlers have no built-in body size config.
// On Vercel Free-Tier, requests > 4.5 MB are rejected with 413 BEFORE this code runs.
// Client-side image compression (src/lib/utils/image-compression.ts) targets 3 MB per
// file so that a multi-file upload stays within the platform limit.
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { MONSTER_SCAN_PROMPT, parseScanResponse } from "@/lib/scan/monster-scan-prompt";

type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

function buildContentBlock(
  base64: string,
  mediaType: string,
  isPdf: boolean
):
  | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } }
  | { type: "image"; source: { type: "base64"; media_type: ImageMediaType; data: string } } {
  if (isPdf) {
    return {
      type: "document" as const,
      source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64 },
    };
  }
  return {
    type: "image" as const,
    source: {
      type: "base64" as const,
      media_type: mediaType as ImageMediaType,
      data: base64,
    },
  };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI-Import ist nicht konfiguriert (ANTHROPIC_API_KEY fehlt)." },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();

    const allFiles: File[] = [];
    for (const [key, value] of formData.entries()) {
      if ((key === "files" || key === "image") && value instanceof File) {
        allFiles.push(value);
      }
    }

    if (allFiles.length === 0) {
      return NextResponse.json({ error: "Keine Dateien hochgeladen." }, { status: 400 });
    }

    if (allFiles.length > 5) {
      return NextResponse.json({ error: "Maximal 5 Dateien erlaubt." }, { status: 400 });
    }

    // MIME-Type Whitelist (Defense-in-Depth gegen Browser-Spoofing)
    const ALLOWED_TYPES = new Set<string>([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ]);
    for (const file of allFiles) {
      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json(
          { error: `Dateityp "${file.type}" wird nicht unterstützt.` },
          { status: 400 }
        );
      }
    }

    // Aggregate size limit (Vercel Free-Tier Body-Limit beachten)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file
    const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20 MB aggregate
    const totalSize = allFiles.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { error: "Gesamtgröße aller Dateien überschreitet 20 MB." },
        { status: 400 }
      );
    }

    const contentBlocks: Array<
      | {
          type: "document";
          source: { type: "base64"; media_type: "application/pdf"; data: string };
        }
      | { type: "image"; source: { type: "base64"; media_type: ImageMediaType; data: string } }
    > = [];

    for (const file of allFiles) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Datei "${file.name}" ist zu groß (max. 10 MB).` },
          { status: 400 }
        );
      }
      const bytes = Buffer.from(await file.arrayBuffer());
      const isPdf = file.type === "application/pdf";

      if (isPdf) {
        const base64 = bytes.toString("base64");
        contentBlocks.push(buildContentBlock(base64, file.type, true));
      } else {
        const resized = await sharp(bytes)
          .rotate()
          .resize(1568, 1568, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
        const base64 = resized.toString("base64");
        contentBlocks.push(buildContentBlock(base64, "image/jpeg", false));
      }
    }

    const preciseMode = formData.get("precise") === "true";
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: preciseMode ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: [...contentBlocks, { type: "text", text: MONSTER_SCAN_PROMPT }],
        },
      ],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    if (message.stop_reason === "max_tokens") {
      return NextResponse.json(
        { error: "Antwort wurde abgeschnitten — bitte erneut versuchen." },
        { status: 422 }
      );
    }

    try {
      const parsed = parseScanResponse(responseText);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(
        { error: "KI-Antwort konnte nicht verarbeitet werden — bitte erneut versuchen." },
        { status: 422 }
      );
    }
  } catch (err) {
    // Log server-side details but don't leak them to the client
    console.error("[scan-monster]", err);
    return NextResponse.json(
      { error: "Interner Fehler beim Verarbeiten der Datei. Bitte erneut versuchen." },
      { status: 500 }
    );
  }
}
