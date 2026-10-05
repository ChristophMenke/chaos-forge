import { NextRequest, NextResponse } from "next/server";
import { generateText, type AiInputFile } from "@/lib/gemini/generate-text";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { validateImportFiles } from "@/app/characters/import/import-validation";
import {
  buildCharacterScanPrompt,
  parseUpdateScanResponse,
} from "@/lib/scan/character-scan-prompt";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  // Approval gate — nicht freigegebene Nutzer scheitern ohnehin am
  // enforce_approval-Trigger beim Schreiben. Der Check hier verhindert, dass
  // vorher unnötig Vision-Tokens verbraucht werden.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_approved")
    .eq("id", user.id)
    .maybeSingle();
  if (profile && profile.is_approved === false) {
    return NextResponse.json(
      { error: "Du musst erst freigeschaltet werden, bevor du Charakterbögen scannen kannst." },
      { status: 403 }
    );
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Vision-Import ist nicht konfiguriert (GOOGLE_API_KEY fehlt)." },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();

    // Collect all uploaded files — iterate entries() for robustness
    // (formData.getAll() can be unreliable in some Next.js versions)
    const allFiles: File[] = [];
    for (const [key, value] of formData.entries()) {
      if ((key === "files" || key === "image") && value instanceof File) {
        allFiles.push(value);
      }
    }

    const validation = validateImportFiles(allFiles);
    if (!validation.valid) {
      const errorMessages: Record<string, string> = {
        noFiles: "Keine Dateien hochgeladen.",
        tooManyFiles: "Maximal 15 Dateien erlaubt.",
        fileTooLarge: `Datei "${validation.errorParams?.name ?? ""}" ist zu groß (max. 10 MB pro Datei).`,
        totalTooLarge: "Gesamtgröße darf 50 MB nicht überschreiten.",
      };
      return NextResponse.json(
        { error: errorMessages[validation.errorKey ?? "noFiles"] },
        { status: 400 }
      );
    }

    // Build the file parts for all uploads
    const files: AiInputFile[] = [];

    for (const file of allFiles) {
      const bytes = Buffer.from(await file.arrayBuffer());
      const isPdf = file.type === "application/pdf";

      if (isPdf) {
        files.push({ data: bytes.toString("base64"), mimeType: "application/pdf" });
      } else {
        // Auf 1568px verkleinern: hält die Token-Kosten unten und die Anfrage
        // klein genug, ohne der Handschrift-Erkennung Auflösung zu nehmen.
        const resized = await sharp(bytes)
          .rotate() // Auto-rotate based on EXIF orientation
          .resize(1568, 1568, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
        files.push({ data: resized.toString("base64"), mimeType: "image/jpeg" });
      }
    }

    const isMultiFile = allFiles.length > 1;
    const preciseMode = formData.get("precise") === "true";
    const mode = formData.get("mode") === "update" ? "update" : "create";

    const { text: responseText, truncated } = await generateText({
      precise: preciseMode,
      files,
      prompt: buildCharacterScanPrompt({ mode, isMultiFile }),
      // Der Update-Modus liefert zwei Blöcke plus fünf annotierte Listen und
      // braucht damit spürbar mehr Platz als der flache Create-Payload. Auf
      // Gemini 3 zählt zusätzlich das Nachdenken gegen dieses Budget.
      maxOutputTokens: mode === "update" ? 24000 : 16000,
      // Erzwingt rohes JSON statt eines Markdown-Blocks. Die Parser kommen mit
      // beidem klar, aber so entfällt eine Fehlerquelle.
      json: true,
    });

    // Check if response was truncated
    if (truncated) {
      return NextResponse.json(
        { error: "Antwort wurde abgeschnitten — bitte erneut versuchen." },
        { status: 422 }
      );
    }

    // Update mode returns the two-block payload, parsed by the shared helper.
    if (mode === "update") {
      try {
        return NextResponse.json({ payload: parseUpdateScanResponse(responseText) });
      } catch (parseErr) {
        return NextResponse.json(
          {
            error:
              parseErr instanceof Error
                ? parseErr.message
                : "Konnte keine Charakterdaten aus dem Bild extrahieren.",
          },
          { status: 422 }
        );
      }
    }

    // Extract JSON from response (handle potential markdown code blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Konnte keine Charakterdaten aus dem Bild extrahieren." },
        { status: 422 }
      );
    }

    let extracted;
    try {
      extracted = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { error: "Ungültiges JSON vom Scanner — bitte erneut versuchen." },
        { status: 422 }
      );
    }

    return NextResponse.json({ character: extracted });
  } catch (err) {
    console.error("Scan error:", err);
    const errorMessage = err instanceof Error ? err.message : "Scan fehlgeschlagen.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
