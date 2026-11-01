import { strToU8, zipSync, type Zippable } from "fflate";
import { toDateInputValue, todayInGroupTimezone } from "@/lib/game-dates";
import { CUSTOM_ROW_TABLES, EXCLUDED_TABLES } from "./tables";

export interface ArchiveImage {
  bucket: string;
  path: string;
  data: Uint8Array;
}

export interface FailedImage {
  bucket: string;
  path: string;
  reason: string;
}

export interface ArchiveInput {
  generatedAt: string;
  tables: Record<string, unknown[]>;
  images: ArchiveImage[];
  failedImages: FailedImage[];
}

const json = (value: unknown) => strToU8(JSON.stringify(value, null, 2));

function readme({ generatedAt, tables, images, failedImages }: ArchiveInput): string {
  const tableLines = Object.entries(tables)
    .map(([name, rows]) => {
      const note = (CUSTOM_ROW_TABLES as readonly string[]).includes(name)
        ? " (nur eigene Einträge, is_custom)"
        : "";
      return `  - data/${name}.json — ${rows.length} Zeilen${note}`;
    })
    .join("\n");
  const excluded = Object.entries(EXCLUDED_TABLES)
    .map(([name, reason]) => `  - ${name}: ${reason}`)
    .join("\n");

  return `Chaos Forge — Backup vom ${generatedAt}

Dieses Archiv sichert die Daten der Spielgruppe „Chaos RPG“.
Es gibt keine automatische Wiederherstellung: Die Dateien sind gewöhnliches
JSON (eine Datei pro Tabelle, ein Array von Zeilen) und lassen sich bei Bedarf
per Skript wieder in eine Supabase-Datenbank einspielen.

Enthalten
${tableLines}
  - images/<bucket>/<pfad> — ${images.length} hochgeladene Bilder (Avatare, NPCs, Session-Bilder)
  - manifest.json — Zeitpunkt, Zeilenzahlen, nicht geladene Bilder (${failedImages.length})

Nicht enthalten
${excluded}
  - Monster-Bilder (Bucket monster-images), neu erzeugbar
  - Login-Konten (auth.users): Benutzer-IDs in den Daten verweisen auf Konten,
    die bei einer Wiederherstellung neu angelegt werden müssten
  - Sprachnotizen (session_entries.audio_url): Es gibt keinen Speicher-Bucket dafür

Die Daten enthalten persönliche Angaben (Profile mit E-Mail-Adressen,
Benachrichtigungen). Bitte privat aufbewahren und nach spätestens 12 Monaten löschen.
`;
}

/** The backup as a ZIP (JSON compressed, images stored as-is). */
export function buildArchive(input: ArchiveInput): Uint8Array {
  const files: Zippable = {};
  for (const [table, rows] of Object.entries(input.tables)) {
    files[`data/${table}.json`] = json(rows);
  }
  for (const image of input.images) {
    // Images are already compressed; deflating them again only costs time.
    files[`images/${image.bucket}/${image.path}`] = [image.data, { level: 0 }];
  }
  files["manifest.json"] = json({
    app: "Chaos Forge",
    generatedAt: input.generatedAt,
    rowCounts: Object.fromEntries(
      Object.entries(input.tables).map(([table, rows]) => [table, rows.length])
    ),
    imageCount: input.images.length,
    failedImages: input.failedImages,
  });
  files["LIESMICH.txt"] = strToU8(readme(input));
  return zipSync(files, { level: 6 });
}

/** chaos-forge-backup-YYYY-MM-DD.zip, dated on the group's calendar day. */
export function backupFileName(now: Date = new Date()): string {
  return `chaos-forge-backup-${toDateInputValue(todayInGroupTimezone(now))}.zip`;
}
