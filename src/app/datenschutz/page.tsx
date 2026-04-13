import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutz — Chaos Forge",
};

export default function DatenschutzPage() {
  return (
    <div
      className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6 sm:py-16"
      data-testid="datenschutz-page"
    >
      <h1 className="font-heading mb-6 text-3xl text-primary sm:text-4xl">Datenschutzerklärung</h1>

      <section className="space-y-5 text-sm leading-relaxed text-foreground/90">
        <h2 className="font-heading text-lg text-primary">1. Verantwortlicher</h2>
        <address className="not-italic">
          Christoph Menke
          <br />
          Waterloostraße 65
          <br />
          28201 Bremen
          <br />
          E-Mail:{" "}
          <a href="mailto:Chris.toph.menke@gmail.com" className="text-primary hover:underline">
            Chris.toph.menke@gmail.com
          </a>
        </address>

        <h2 className="font-heading text-lg text-primary">2. Zweck &amp; Art der App</h2>
        <p>
          Chaos Forge ist ein privates, nicht-kommerzielles Tool zur Organisation einer
          geschlossenen Pen-&amp;-Paper-Rollenspielgruppe (Advanced Dungeons &amp; Dragons 2nd
          Edition). Neue Registrierungen werden manuell vom Betreiber freigegeben.
        </p>

        <h2 className="font-heading text-lg text-primary">3. Welche Daten wir verarbeiten</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Account-Daten:</strong> E-Mail-Adresse (für Login per Einmalcode), Anzeigename,
            optional Profilbild (Avatar).
          </li>
          <li>
            <strong>Spielinhalte:</strong> Charakterdaten (Attribute, Ausrüstung, Zauber, Notizen),
            Session-Einträge, Kampagnen-NPCs, Zitate, Tags, Sprachnotizen (optional aufgenommen).
          </li>
          <li>
            <strong>Technische Daten:</strong> Login-Zeitpunkt, Session-Cookies zur
            Authentifizierung.
          </li>
          <li>
            <strong>KI-Interaktionen:</strong> Deine Fragen an den Regelbuch-Chat und Ergebnis-Texte
            werden zur Bearbeitung an Anthropic (Claude) und Voyage AI (Embeddings) übermittelt.
            Charakter-/NPC-Bilder werden via Google Gemini generiert. Keine dauerhafte Speicherung
            durch die Anbieter im Rahmen der Standardverträge.
          </li>
        </ul>

        <h2 className="font-heading text-lg text-primary">4. Rechtsgrundlagen (DSGVO)</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Art. 6 Abs. 1 lit. b DSGVO — Vertragserfüllung (Bereitstellung der App für registrierte
            Nutzer).
          </li>
          <li>
            Art. 6 Abs. 1 lit. f DSGVO — berechtigte Interessen (Sicherheit, Betrieb,
            Missbrauchsabwehr).
          </li>
          <li>
            Art. 6 Abs. 1 lit. a DSGVO — Einwilligung bei optionalen Funktionen (Sprachnotizen).
          </li>
        </ul>

        <h2 className="font-heading text-lg text-primary">5. Eingesetzte Dienste</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Vercel Inc.</strong> (USA) — Hosting der App.{" "}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              Datenschutzerklärung
            </a>
          </li>
          <li>
            <strong>Supabase Inc.</strong> (EU-Region) — Datenbank, Auth, Storage.{" "}
            <a
              href="https://supabase.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              Datenschutzerklärung
            </a>
          </li>
          <li>
            <strong>Anthropic PBC</strong> (USA) — KI-Chat, Charakter-Import, Monster-Import.{" "}
            <a
              href="https://www.anthropic.com/legal/privacy"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              Datenschutzerklärung
            </a>
          </li>
          <li>
            <strong>Google LLC / Google Gemini</strong> (USA) — Bildgenerierung.{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              Datenschutzerklärung
            </a>
          </li>
          <li>
            <strong>Voyage AI</strong> (USA) — Text-Embeddings für Regelbuch-Suche.{" "}
            <a
              href="https://www.voyageai.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              Datenschutzerklärung
            </a>
          </li>
          <li>
            <strong>Discord Inc.</strong> (USA) — Benachrichtigung des Administrators per Webhook
            bei neuen Registrierungen.
          </li>
        </ul>

        <h2 className="font-heading text-lg text-primary">6. Cookies</h2>
        <p>
          Wir setzen ausschließlich technisch notwendige Cookies (Supabase-Auth-Session,
          Theme-Preference, Sprache). Keine Tracking- oder Marketing-Cookies.
        </p>

        <h2 className="font-heading text-lg text-primary">7. Speicherdauer</h2>
        <p>
          Daten werden gespeichert, solange der Account aktiv ist. Nach Löschung des Accounts werden
          alle personenbezogenen Daten innerhalb von 30 Tagen entfernt; anonymisierte Charakterdaten
          aus gemeinsamen Sessions können für die Gruppenchronik erhalten bleiben.
        </p>

        <h2 className="font-heading text-lg text-primary">8. Deine Rechte</h2>
        <p>Du hast jederzeit das Recht auf:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Auskunft über deine gespeicherten Daten (Art. 15 DSGVO)</li>
          <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
          <li>Löschung deiner Daten (Art. 17 DSGVO)</li>
          <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
          <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
          <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
          <li>Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO)</li>
        </ul>
        <p>
          Für alle Anfragen kontaktiere den Verantwortlichen per E-Mail an{" "}
          <a href="mailto:Chris.toph.menke@gmail.com" className="text-primary hover:underline">
            Chris.toph.menke@gmail.com
          </a>
          .
        </p>

        <h2 className="font-heading text-lg text-primary">9. Sicherheit</h2>
        <p>
          Alle Datenübertragungen erfolgen verschlüsselt (TLS). Zugriff auf die Datenbank ist per
          Row-Level-Security abgesichert.
        </p>
      </section>
    </div>
  );
}
