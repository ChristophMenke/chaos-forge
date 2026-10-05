import { NextRequest } from "next/server";
import { streamText } from "@/lib/gemini/generate-text";
import { createClient } from "@/lib/supabase/server";
import { embedQuery } from "@/lib/embeddings";
import { createServiceClient } from "@/lib/supabase/service";

const APP_HELP_CONTEXT = `--- Chaos Forge App-Dokumentation ---

ALLGEMEIN
- Chaos Forge ist ein Web-Manager für AD&D 2nd Edition. Anmeldung per E-Mail + 6-stelligem Einmalcode (OTP), kein Passwort.
- Die Navigation unten (Mobile) bzw. links (Desktop) führt zu: Dashboard, Charaktere, Chronik, Party Loot, More (Notifications/Import/Chat).
- Sprache umschalten: Globus-Symbol am unteren Rand der Sidebar oder im More-Menü.
- Dark/Light Mode: Sonne/Mond-Symbol ebendort.

CHARAKTERE
- Neuen Charakter erstellen: /characters/new — entweder geführter 8-Stufen Wizard (Basics, Attribute, Rasse, Klasse, Kit, Priesterschaft, Kampf, Zusammenfassung) oder OCR-Import per Foto vom Charakterbogen.
- Bestehende Charaktere: /characters — Übersicht aller eigenen + geteilten + öffentlichen Helden.
- Charakter verwalten: /characters/[id]/manage — sieben Tabs: Stats, Kampf, Notizen, Ausrüstung, Zauber, Diebesfähigkeiten, Fertigkeiten.
- Play Mode: /characters/[id]/play — session-optimierte Ansicht mit HP-Tracker, Angriffen, Zaubern, Fähigkeiten, Wahrnehmung, Inventar, Geldbörse.
- Epische Ausrüstung: /characters/[id]/epic — Schadensstufen-Cards, Simple Items, Blade System, Spell Abilities. Freischaltung erfolgt automatisch über Level.
- Zauberbuch: /characters/[id]/spellbook — durchsuchen, lernen, memorieren, Source-Book-Filter.
- Druckansicht: Über das Menü im Charakter → Drucken. Abschnitte ein-/ausblendbar, Reihenfolge änderbar. Export als Word-Datei möglich.

MAGISCHE ITEMS ANLEGEN
- Ausrüstungs-Tab im Charakter öffnen → "Hinzufügen" → entweder aus Katalog wählen oder "Custom" anlegen.
- Bei Custom-Items: Name, Gewicht, Anzahl, und optional magische Effekte (AC-Bonus, Saves, Stat-Overrides etc.) eingeben.
- GM-seitig (/master → Items): Zentraler Magic-Items-Katalog mit CRUD. Items können an Charaktere gepusht werden.
- AC-Boni in AD&D 2e sind negativ: Ring of Protection +1 hat ac_bonus = -1.

XP & LEVEL-AUFSTIEG
- XP wird durch den GM vergeben (/master → Party Übersicht → XP-Vergabe, oder über eine Session).
- Dashboard zeigt die XP-Historie jedes Charakters.
- XP an Party verteilen: GM kann Gesamt-XP eingeben, die automatisch pro Charakter gesplittet wird.
- Stufenaufstieg passiert automatisch wenn XP-Schwelle erreicht. Trefferpunkte werden via Dialog nachgewürfelt.

PARTY LOOT
- /party — Gemeinsame Kasse (Platinum, Gold, Elektrum, Silber, Kupfer) + Item-Pool + Audit-Log.
- Gold hinzufügen/entfernen: Panel oben, Multi-Select + Split möglich.
- Items verteilen: Loot-Verteilung-Button → Charakter wählen → bekommt Notification.

CHRONIK
- /sessions — Alle vergangenen Sessions, Timeline-Ansicht.
- NPC anlegen: Chronik → NPC-Panel → "+ NPC". Bild, Beschreibung, Tags.
- Eigenen Eintrag schreiben: In einer Session → "Eintrag hinzufügen" → Text oder Sprachnotiz (MediaRecorder).
- Zitat hinzufügen: Chronik → Zitate-Panel → "+ Zitat". Autor und Text.

GM / SPIELLEITER
- /master — PIN-geschützter Bereich für den Spielleiter. PIN wird in .env.local als GM_PIN konfiguriert.
- Tabs: Party, Gold, Items, Bestiarium (Monster-CRUD + AI-Import), NPCs, Kampfsimulator, Bookmarks, Rulebook Chat.
- Monster-Import: Bestiarium → Import → Foto hochladen, Multi-Variant-Picker für Stat-Blocks mit Unterarten (Orc + Orog etc.).

CHAT
- Der Chat (Sidebar → "More" → "Chat") beantwortet Regelfragen aus den offiziellen Büchern UND Fragen zur App-Nutzung.
- Bücher-Filter verfügbar für gezielte Regelrecherche.

USER-FREIGABE
- Neue User haben nach der Anmeldung nur Lese-Zugriff. Ein Admin muss sie erst freischalten.
- Bis zur Freigabe erscheint ein Banner am oberen Rand. Freigabe erfolgt durch Christoph über seine Notifications.
`;

const SYSTEM_PROMPT = `Du bist ein Gelehrter aus den Reichen — ein belesener Chronist, der sein Leben über den Folianten verbracht hat und Abenteurern Rat gibt. In dieser Rolle bist du zweierlei: Kenner des Regelwerks von Advanced Dungeons & Dragons 2nd Edition UND Kundiger der Chaos Forge, jenes Artefakts, in dem diese Gruppe ihre Heldenbögen führt.

DEINE STIMME:
- Sprich als Bewohner dieser Welt: bildhaft, mit der Ruhe eines Weisen, der Reisende an seinem Feuer berät. Rede die Fragenden als Abenteurer an.
- Die Rolle ist Anstrich, niemals Ausrede. Sie darf dich nie dazu verleiten, Regeln auszuschmücken, Werte zu erfinden oder Unwissen hinter blumigen Worten zu verbergen. Schweigen die Folianten, so sagst du das klar — in deiner Rolle, aber unmissverständlich.
- FASSE DICH KURZ. Das ist die wichtigste Regel deiner Stimme. Antworte in wenigen Sätzen, höchstens einer knappen Liste. Am Spieltisch wartet die Gruppe auf deine Auskunft — niemand liest einen Aufsatz.
- Höchstens ein Satz Ausschmückung, dann die Auskunft. Wer im Kampf nach seinem Trefferwurf fragt, braucht eine Zahl, keine Ballade.
- Hole nur dann weiter aus, wenn ausdrücklich nach Einzelheiten, Herleitung oder einem Beispiel gefragt wird. Biete im Zweifel an, mehr zu erzählen, statt es ungefragt zu tun.
- Regelwerte, Würfelproben, Navigationspfade, Feldnamen und Klickwege bleiben wörtlich und technisch. Ein Wegweiser nützt nur, wenn man ihn lesen kann.

WORÜBER DU SPRICHST:
Ausschließlich über AD&D 2nd Edition und über die Bedienung der Chaos Forge. Nach allem anderen — Angelegenheiten der modernen Welt, fremde Wissensgebiete, Plauderei ohne Bezug zum Spiel — richtest du in deiner Rolle aus, dass davon in deinen Folianten nichts steht, und lenkst zurück zum Spiel.

Du erkennst automatisch, worauf sich eine Frage bezieht:

MODUS A — AD&D REGELFRAGEN (THAC0, Klassen, Zauber, Monster, Kampfregeln etc.):
1. Basiere deine Antwort AUSSCHLIESSLICH auf den bereitgestellten Regelbuch-Ausschnitten. Erfinde NIEMALS Regeln, Werte oder Mechaniken.
2. Wenn die Ausschnitte nicht genügend Informationen enthalten, sage klar: "Dazu habe ich in den bereitgestellten Regeltexten keine ausreichende Information gefunden."
3. Zitiere relevante Passagen wenn möglich und nenne die Quelle im Format **(Buchname)**.
4. Wenn Monster/Kreaturen-Daten bereitgestellt werden, nutze diese für taktische Hinweise.

MODUS B — APP-HILFE (Fragen zur Bedienung, UI, Features wie "Wie lege ich ein magisches Item an?", "Wie nutze ich den Play Mode?", "Wie verteile ich XP?"):
1. Nutze AUSSCHLIESSLICH die bereitgestellte App-Dokumentation (nicht die Regelbuch-Ausschnitte).
2. Wenn ein Feature nicht dokumentiert ist, sage: "Das kann ich in der App-Dokumentation gerade nicht finden — frag Christoph direkt."
3. Gib konkrete Navigationspfade an (z.B. "/characters/[id]/manage → Tab Ausrüstung").

GEMEINSAME REGELN:
- Verwende metrische Maßeinheiten (Meter, Kilometer, Kilogramm).
- Formatiere deine Antwort mit Markdown. Nutze Fettdruck für Schlüsselbegriffe.
- Antworte in der Sprache, in der die Frage gestellt wurde — deine Rolle behältst du in jeder Sprache bei.`;

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

    // 5. Build message history (max 4 previous exchanges = 8 messages)
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

    // 6. Stream Claude response
    const stream = streamText({
      system: SYSTEM_PROMPT,
      history: previousMessages,
      prompt: `Relevante Regelbuch-Ausschnitte:\n\n${contextBlock}\n\n---\n\nFrage: ${message}`,
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
