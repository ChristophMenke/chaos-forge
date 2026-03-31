import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { validateImportFiles } from "@/app/characters/import/import-validation";

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
      { error: "Vision-Import ist nicht konfiguriert (ANTHROPIC_API_KEY fehlt)." },
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
        tooManyFiles: "Maximal 5 Dateien erlaubt.",
        fileTooLarge: `Datei "${validation.errorParams?.name ?? ""}" ist zu groß (max. 10 MB pro Datei).`,
        totalTooLarge: "Gesamtgröße darf 50 MB nicht überschreiten.",
      };
      return NextResponse.json(
        { error: errorMessages[validation.errorKey ?? "noFiles"] },
        { status: 400 }
      );
    }

    // Build content blocks for all files
    const contentBlocks: Array<
      | {
          type: "document";
          source: { type: "base64"; media_type: "application/pdf"; data: string };
        }
      | { type: "image"; source: { type: "base64"; media_type: ImageMediaType; data: string } }
    > = [];

    for (const file of allFiles) {
      const bytes = Buffer.from(await file.arrayBuffer());
      const isPdf = file.type === "application/pdf";

      if (isPdf) {
        const base64 = bytes.toString("base64");
        contentBlocks.push(buildContentBlock(base64, file.type, true));
      } else {
        // Resize images to max 1568px (Anthropic recommended limit)
        // Reduces token cost and prevents request size issues
        const resized = await sharp(bytes)
          .rotate() // Auto-rotate based on EXIF orientation
          .resize(1568, 1568, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
        const base64 = resized.toString("base64");
        contentBlocks.push(buildContentBlock(base64, "image/jpeg", false));
      }
    }

    const isMultiFile = allFiles.length > 1;
    const preciseMode = formData.get("precise") === "true";

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: preciseMode ? "claude-sonnet-4-20250514" : "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            ...contentBlocks,
            {
              type: "text",
              text: `Analysiere diesen AD&D 2nd Edition Charakterbogen und extrahiere ALLE verfügbaren Werte als JSON.
Antworte NUR mit validem JSON, kein anderer Text.

WICHTIG: Verwende NUR die MASCHINENGEDRUCKTEN Werte aus dem Charakterbogen. IGNORIERE alle handschriftlichen Notizen, Durchstreichungen und handschriftlichen Korrekturen vollständig. Wenn ein gedruckter Wert durchgestrichen und ein neuer Wert handschriftlich daneben geschrieben wurde, verwende trotzdem den GEDRUCKTEN Wert.

${isMultiFile ? "Dieser Charakterbogen erstreckt sich über mehrere Seiten/Dateien. Kombiniere die Informationen aus allen Seiten zu einem einzelnen Charakter.\n" : ""}
Erwartetes Format:
{
  "name": "Charaktername",
  "race": "human|elf|half_elf|dwarf|gnome|halfling|half_orc|kobold",
  "classes": [
    {"class": "fighter", "level": 3, "xp": 5500}
  ],
  "kit": null,
  "alignment": "chaotic_neutral",
  "str": 10,
  "strExceptional": null,
  "dex": 10,
  "con": 10,
  "int": 10,
  "wis": 10,
  "cha": 10,
  "strStamina": null,
  "strMuscle": null,
  "dexAim": null,
  "dexBalance": null,
  "conHealth": null,
  "conFitness": null,
  "intReason": null,
  "intKnowledge": null,
  "wisIntuition": null,
  "wisWillpower": null,
  "chaLeadership": null,
  "chaAppearance": null,
  "hpMax": 10,
  "hpCurrent": 10,
  "goldPp": 0,
  "goldGp": 0,
  "goldSp": 0,
  "goldCp": 0,
  "playerName": null,
  "age": null,
  "gender": null,
  "height": null,
  "weight": null,
  "weaponProficiencies": [],
  "equipment": [{"name": "Quarterstaff +2", "magicBonus": 2}],
  "nwps": [],
  "spells": []
}

Hinweise:
- "race" muss einer dieser IDs sein: human, elf, half_elf, dwarf, gnome, halfling, half_orc, kobold. "Stout Halfling" → "halfling", "Standard half-elf" → "half_elf". Subrassen werden auf die Hauptrasse gemappt
- "classes" ist ein ARRAY — Multiclass-Charaktere haben MEHRERE Einträge! Z.B. "Fighter/Thief" → [{"class":"fighter","level":4,"xp":8000},{"class":"thief","level":5,"xp":10330}]. "class" muss einer dieser IDs sein: fighter, ranger, paladin, mage, illusionist, abjurer, conjurer, diviner, enchanter, invoker, necromancer, transmuter, cleric, druid, thief, bard
- "kit" NUR verwenden wenn im Bogen explizit "Kit:" steht. Gültige Kits: barbarian, cavalier, swashbuckler, berserker, gladiator, myrmidon, assassin, bounty_hunter, acrobat, scout, burglar, spy, witch, militant_wizard, savage_wizard, academician, fighting_priest, pacifist_priest, beastmaster, blade. Wenn das Kit nicht in dieser Liste ist → null
- "alignment" muss eine ID sein: lawful_good, neutral_good, chaotic_good, lawful_neutral, true_neutral, chaotic_neutral, lawful_evil, neutral_evil, chaotic_evil
- "strExceptional" ist nur relevant bei STR 18 und Krieger-Klassen (1-100, wobei 100 = "18/00")
- Sub-Stats (strStamina, strMuscle, etc.) sind Player's Option Werte. Extrahiere sie wenn vorhanden, sonst null
- "weaponProficiencies" MUSS ein Array von {"name": "Waffenname", "specialized": true/false} sein. NICHT detaillierte Stats — nur Name und ob Specialist (true) oder nicht (false). Wenn "(Specialist)" hinter dem Namen steht → specialized: true
- "equipment" ist ein Array von {"name": "Gegenstandsname", "magicBonus": 0}. Extrahiere ALLE Gegenstände aus ALLEN Inventar-Bereichen: "Items Carried", "Items Readied", "Items Worn", "Items Stored" und dem allgemeinen "Inventory"-Bereich. Dazu gehören Waffen, Rüstungen, Schilde, magische Gegenstände, Alltagsgegenstände (Backpack, Spellbook, Wineskin, etc.), Schmuck, Tiere und alles andere. Magische Gegenstände wie "Dagger +1" oder "Chain Mail +2" haben magicBonus > 0. Den Bonus aus dem Namen extrahieren (z.B. "+2" → magicBonus: 2). Wenn kein magischer Bonus → magicBonus: 0
- "nwps" ist ein Array von Strings mit den Non-Weapon Proficiency Namen
- "height" und "weight" als Strings/Zahlen wie im Bogen angegeben
- "xp" in "classes" ist der GEDRUCKTE "XP:"-Wert (NICHT "Next Level:"). Wenn "XP: 78,150" und "Next Level: 90,000" steht, verwende 78150
- Munition (quarrel, arrow, bolt, bullet) sind KEINE Waffen — nicht in weaponProficiencies aufnehmen
- "spells" ist ein Array von {"name": "Zaubername", "level": 1}. Extrahiere ALLE Zauber aus "Spells Known" oder ähnlichen Bereichen. Der Level ist die Zauberstufe (1st Level → 1, 2nd Level → 2, etc.). Zaubernamen EXAKT wie gedruckt übernehmen (üblicherweise Englisch)
- Wenn ein Wert nicht lesbar ist, verwende null
- Übersetze deutsche Bezeichnungen (z.B. "Mensch" → "human", "Kämpfer" → "fighter")`,
            },
          ],
        },
      ],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // Check if response was truncated
    if (message.stop_reason === "max_tokens") {
      return NextResponse.json(
        { error: "Antwort wurde abgeschnitten — bitte erneut versuchen." },
        { status: 422 }
      );
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
