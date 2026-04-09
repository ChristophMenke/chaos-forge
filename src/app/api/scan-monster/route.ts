import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";

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

    const contentBlocks: Array<
      | {
          type: "document";
          source: { type: "base64"; media_type: "application/pdf"; data: string };
        }
      | { type: "image"; source: { type: "base64"; media_type: ImageMediaType; data: string } }
    > = [];

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file
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

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            ...contentBlocks,
            {
              type: "text",
              text: `Analyze this AD&D 2nd Edition monster stat block and extract ALL available values as JSON.
Reply ONLY with valid JSON, no other text.

Expected format:
{
  "name": "Monster Name (German if visible, otherwise English)",
  "name_en": "Monster Name (English)",
  "climate_terrain": "Any",
  "frequency": "Common",
  "organization": "Pack",
  "activity_cycle": "Any",
  "diet": "Omnivore",
  "intelligence": "Low (5-7)",
  "treasure": "Nil",
  "alignment": "Neutral",
  "ac": 7,
  "movement": "12",
  "hit_dice": "3+3",
  "hit_dice_value": 3,
  "thac0": 17,
  "attacks_per_round": 1,
  "damage": "1d8",
  "special_attacks": "None",
  "special_defenses": "None",
  "magic_resistance": "Nil",
  "size": "M",
  "morale": "Steady (11-12)",
  "morale_value": 11,
  "xp_value": 120,
  "description": "A short description of the monster...",
  "has_ranged_attack": false,
  "typical_spells": null,
  "default_zone": "melee"
}

Notes:
- "ac" must be a number (e.g. AC 5 → 5, AC -2 → -2)
- "hit_dice" is the string as written (e.g. "3+3", "1/2", "4", "8+8")
- "hit_dice_value" is the numeric HD value (e.g. "3+3" → 3, "1/2" → 0.5, "8+8" → 8)
- "thac0" must be a number
- "size" must be one of: T (Tiny), S (Small), M (Medium), L (Large), H (Huge), G (Gargantuan)
- "morale_value" is the minimum value from the range (e.g. "Steady (11-12)" → 11)
- "default_zone" is "melee" or "ranged" based on the monster's primary attack mode
- "has_ranged_attack" is true if the monster has any ranged attacks
- "typical_spells" is a brief note about spell capabilities, null if none
- If a value is not visible or readable, use null
- Translate German monster names to English for name_en if the source is German
- If the stat block spans multiple pages, combine all information`,
            },
          ],
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

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, responseText];
    const jsonString = (jsonMatch[1] ?? responseText).trim();

    const parsed = JSON.parse(jsonString);
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
