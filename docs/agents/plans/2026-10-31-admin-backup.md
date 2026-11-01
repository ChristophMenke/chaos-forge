---
date: 2026-10-31T22:02:42+00:00
git_commit: c23a0538edb85046beba7761799415a12e2bf241
branch: feature/icloud-backup
topic: "Admin-Backup als ZIP (iCloud)"
tags: [plan, backup, admin, settings, sessions, storage]
status: ready
---

# PLAN: Admin-Backup als ZIP (iCloud)

Der Admin (Christoph) soll die Daten der Gruppe langfristig in seiner iCloud sichern können:
per Button in den Einstellungen und als Angebot direkt nach dem Schreiben eines Session-Textes.
Eine Web-App kann nicht selbst in iCloud Drive schreiben; das ZIP entsteht im Browser und wird
über das Teilen-Menü („In Dateien sichern“) oder als Download abgelegt.

Grundlage: `docs/agents/research/2026-10-31-admin-backup.md`. Keine Wiederherstellung (bewusst).

## Acceptance Criteria

- Einstellungen → Sektion „Backup“ ist nur für den Admin sichtbar.
- „Backup erstellen“ lädt Daten und hochgeladene Bilder mit Fortschrittsanzeige und baut
  `chaos-forge-backup-YYYY-MM-DD.zip` (Datum in Europe/Berlin) im Browser.
- Danach: „In iCloud sichern“ (Teilen-Menü, nur wenn `navigator.canShare({ files })` true) und
  „Herunterladen“ (immer).
- ZIP-Inhalt:
  - `data/<tabelle>.json` für alle Gruppen- und Link-Tabellen,
  - `data/<tabelle>.json` mit nur den `is_custom`-Zeilen aus `spells`, `weapons`, `armor`,
    `nonweapon_proficiencies`, `general_items`, `magic_items`,
  - `images/<bucket>/<pfad>` für Charakter-, Profil-, NPC-Avatare und Session-Bilder,
  - `manifest.json` (Erstellzeit, App-Version, Zeilenzahlen, Bildanzahl, fehlgeschlagene Bilder),
  - `LIESMICH.txt` (was drin ist, was fehlt, Hinweis „keine automatische Wiederherstellung“).
- Nicht enthalten: Monster (Daten und Bilder), `rulebook_chunks`, Buch-Stammdaten
  (`races`, `classes`, `race_class_restrictions`, nicht-custom Zeilen).
- Ein Bild, das nicht lädt, bricht nicht ab: es steht in `manifest.json` und die UI zeigt
  „N Bilder konnten nicht geladen werden“.
- `GET /api/admin/backup` liefert die Daten nur dem Admin (401 ohne Login, 403 sonst).
- Nach dem Speichern eines Session-Eintrags oder der Session-Zusammenfassung öffnet sich beim
  Admin der Dialog „Backup sichern?“ mit demselben Ablauf, höchstens einmal pro Session
  (localStorage). Nach dem bloßen Anlegen einer Session nicht (noch kein Text). Andere Spieler
  sehen ihn nie.
- Die Datenschutzerklärung nennt die Sicherungskopien (Inhalt inkl. Profile/E-Mails,
  Speicherort Apple iCloud, Rechtsgrundlage, Aufbewahrung, Entfernen auf Anfrage).

## Technical Key Decisions and Tradeoffs

1. **Daten per Admin-API, ZIP im Browser.** `GET /api/admin/backup` prüft `auth.getUser()` und
   `user.email === ADMIN_EMAIL` (Auth-E-Mail, nicht änderbar durch Clients), liest per
   `createServiceClient()` + `fetchAllRows` und antwortet mit JSON (~0,3 MB). Der Browser lädt
   die Bilder direkt (Storage sendet `access-control-allow-origin: *`) und zippt mit **fflate**
   (neue Abhängigkeit, 0.8.x, ~8 kB gzip).
   - Why: Vercel-Antwortlimit 4,5 MB; Bilder müssen nicht durch den Server.
   - Impact: Service-Client-Lesen auch von `notifications` (RLS nur eigene) ist so möglich.
2. **Explizite Tabellen-Klassifikation** in `src/lib/backup/tables.ts`: `FULL_TABLES`,
   `CUSTOM_ROW_TABLES`, `EXCLUDED_TABLES` (mit Begründung). Ein Guard-Test liest alle
   `CREATE TABLE` aus `supabase/migrations/*.sql` und verlangt, dass jede Tabelle genau einer
   Liste angehört — neue Tabellen fallen so auf.
   - Sortierschlüssel pro Tabelle (`id`, sonst PK-Spalten: `character_spells` →
     `character_id, spell_id`; `session_tags` → `session_id, tag_id`).
3. **Bildliste aus den URL-Spalten** (`characters.avatar_url`, `profiles.avatar_url`,
   `chronicle_npcs.avatar_url`, `sessions.image_url`). Pfad wird aus
   `/storage/v1/object/public/<bucket>/<pfad>` abgeleitet, Query (`?t=`) entfernt, Duplikate
   entfernt (nur für den ZIP-Pfad — geladen wird die Original-URL mit `cache: "no-store"`),
   Duplikate entfernt, fremde Hosts und ungültige URLs ignoriert (`new URL` in `try`). Rein + TDD.
4. **Zwei Schritte** (Erstellen → Teilen), weil Safari das Teilen-Menü nur direkt nach einem Tipp
   öffnet. Geteilt wird nur `{ files: [file] }` (ohne `title`/`text`, sonst bietet iOS teils kein
   „In Dateien sichern“), `new File([zip], name, { type: "application/zip" })`. `AbortError`
   (Nutzer bricht Teilen ab) ist kein Fehler.
5. **Eine Komponente `BackupPanel`** (Zustandsmaschine `idle → building → ready | error`) für
   Einstellungen und Dialog; I/O in `src/lib/backup/build-backup.ts` (fetch + zip), testbar mit
   injiziertem `fetch`.
6. **Bilder ohne Kompression** in das ZIP (`level: 0` für `images/`), JSON mit Level 6.
7. **`ADMIN_EMAIL` zentral** in `src/lib/admin.ts` (`ADMIN_EMAIL`, `isAdminEmail()`); genutzt von
   der neuen API, `settings-client.tsx` und der Session-Seite. Bestehende Duplikate in
   `admin/approve`, `reject-user`, `account/delete` werden auf den Import umgestellt (kleine,
   risikolose Vereinheitlichung).
8. **Angebot per Dialog** nach `onEntryCreated` und nach erfolgreichem `handleSaveSummary` in
   `SessionDetail`. Logik im Hook `useBackupOffer({ isAdmin, sessionId })` →
   `{ open, offer(), close() }` (testbar ohne die vielen Abhängigkeiten von `SessionDetail`).
   „Einmal pro Session“ über localStorage `chaos-forge-backup-offered` (JSON-Liste von
   Session-IDs, max. 50). Kein Angebot nach dem Anlegen (User-Entscheidung 2026-11-01).
9. **Admin immer über die Auth-E-Mail** (`user.email` aus `requireAuth`/`getUser`), serverseitig
   berechnet und als Prop `isAdmin` an Client-Komponenten gegeben. `admin/approve` und
   `reject-user` werden dabei von `profiles.email` auf `user.email` umgestellt (Härtung; die
   Profil-E-Mail ist live bereits per Trigger aus PR #185 geschützt, der Code auf `main` kennt
   die Migration aber erst nach dem Merge). `isAdminEmail` vergleicht case-insensitiv — macht den
   Schutz „Admin nicht ablehnen“ (`reject-user:48`) minimal strenger, sonst keine Änderung.
10. **Route dünn, Logik testbar:** `loadBackupTables(service)` in `src/lib/backup/load-tables.ts`
    (pro Tabelle `try/catch`, Count- und Seiten-Callback mit identischem Filter), die Route macht
    nur Auth + Antwort. Es gibt bisher keine Route-Tests; getestet wird die Funktion mit einem
    Supabase-Mock (`select(..., { count, head })` und `.order().range()`).

## Current State

```
/settings  → SettingsClient (isAdmin per lokaler ADMIN_EMAIL)  Profil · Darstellung · Termine · Tutorials · Danger
/sessions/new → insert sessions → router.push(/sessions/[id])
/sessions/[id] → SessionDetail → SessionEntryForm → insert → onEntryCreated
Kein Backup, keine ZIP-Bibliothek, keine Datei-Antworten in API-Routen.
```

## Desired End State

```
/settings  → … Tutorials · [Backup (nur Admin) → BackupPanel] · Danger Zone
/sessions/[id] → SessionDetail (isAdmin) ─┬─ onEntryCreated ─────┐
                                          └─ handleSaveSummary ok ┴→ useBackupOffer → BackupOfferDialog → BackupPanel

BackupPanel ──GET /api/admin/backup──► { tables, generatedAt }   (Service-Client, Admin-Check)
           ──fetch public image URLs──► Storage (CORS *)
           ──fflate zipSync──► Blob ──► navigator.share({files}) | file-saver saveAs
```

Einstellungen (Mockup):

```
┌ 💾 Backup ─────────────────────────────────────────┐
│ Sichert alle Gruppendaten und hochgeladenen Bilder │
│ als ZIP. Auf dem iPhone: „In iCloud sichern“ →     │
│ „In Dateien sichern“ → iCloud Drive.               │
│ [ Backup erstellen ]                               │
│   Lade Bilder … 34 / 58                            │
│ ✓ chaos-forge-backup-2026-11-07.zip · 4,8 MB       │
│   2 Bilder konnten nicht geladen werden.           │
│ [ Herunterladen ]          [ In iCloud sichern ]   │
└────────────────────────────────────────────────────┘
```

Dialog nach dem Speichern (Mockup):

```
┌ 💾 Backup sichern? ──────────────────────────── ✕ ┐
│ Dein Text ist gespeichert. Sichere jetzt alle     │
│ Gruppendaten und Bilder in deine iCloud.          │
│ [ Später ]                  [ Backup erstellen ]  │
│   → danach wie in den Einstellungen               │
└───────────────────────────────────────────────────┘
```

## Abstractions and Code Reuse

- `src/lib/admin.ts` — neu: `ADMIN_EMAIL`, `isAdminEmail(email)`
- `src/lib/backup/`
  - `tables.ts` — neu: `FULL_TABLES`, `CUSTOM_ROW_TABLES`, `EXCLUDED_TABLES`, `orderColumns(table)`
  - `images.ts` — neu: `collectBackupImages(tables, supabaseUrl)` → `{ bucket, path, url }[]`
  - `archive.ts` — neu: `buildArchiveFiles({ tables, images, generatedAt, failedImages })` →
    `Record<string, Uint8Array>` (+ `manifest.json`, `LIESMICH.txt`), `backupFileName(date)`
  - `load-tables.ts` — neu: `loadBackupTables(service)` → `Record<string, unknown[]>` (Server)
  - `build-backup.ts` — neu: `buildBackup({ fetchImpl, onProgress })` → `{ blob, fileName, failedImages }`
  - `offer.ts` — neu: `shouldOfferBackup(sessionId)`, `markBackupOffered(sessionId)`
  - Tests je Datei, `tables.test.ts` mit Migrations-Guard
- `src/app/api/admin/backup/route.ts` — neu, nutzt `fetchAllRows`, `createServiceClient`
- `src/components/backup/`
  - `backup-panel.tsx` — neu (nutzt `buildBackup`, `file-saver`)
  - `backup-section.tsx` — neu (GlassCard für Einstellungen)
  - `backup-offer-dialog.tsx` — neu (shadcn `Dialog`)
  - `use-backup-offer.ts` — neu (Hook)
  - Tests je Komponente
- `src/app/settings/page.tsx` — `isAdmin = isAdminEmail(user.email)` als Prop
- `src/app/settings/settings-client.tsx` — lokale `ADMIN_EMAIL` entfernt, `isAdmin`-Prop, `<BackupSection />` für Admin
- `src/app/sessions/[id]/page.tsx` — `isAdmin` an `SessionDetail`
- `src/components/session/session-detail.tsx` — `useBackupOffer` verdrahten
- `src/app/admin/approve/[id]/page.tsx`, `src/app/api/admin/reject-user/route.ts`,
  `src/app/api/account/delete/route.ts` — `ADMIN_EMAIL` importieren
- `src/app/datenschutz/page.tsx`, `messages/*.json` (Namespace `backup`), `CLAUDE.md`, `package.json`

## Logging & Observability

- API: `console.error("[Backup] table failed:", table, error)` bei Lesefehlern → 500 `{ error }`.
- Client: fehlgeschlagene Bilder nur im Manifest und als UI-Hinweis, kein Log-Spam.

## Implementation

### Phase 1: Backup in den Einstellungen

Dependencies: None

**Tasks**:

- [x] `npm install fflate` (prüfen: `zipSync`, `strToU8` exportiert, Typen enthalten)
- [x] `src/lib/admin.ts` + Test (`isAdminEmail` case-insensitiv, `null`/`undefined` → false)
- [x] `admin/approve/[id]/page.tsx` und `api/admin/reject-user/route.ts`: Admin-Check über `user.email` + `isAdminEmail` statt `profiles.email`; `account/delete` auf Import umstellen; `reject-user:48` nutzt `isAdminEmail(target.email)`
- [x] `settings/page.tsx`: `isAdmin` serverseitig berechnen und an `SettingsClient` geben; lokale Konstante in `settings-client.tsx` entfernen
- [x] TDD `tables.test.ts` (`// @vitest-environment node`, `fs` wie `src/test/modal-portal-guard.test.ts`): jede Tabelle aus `/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:\w+\.)?(\w+)/gi` über `supabase/migrations/*.sql` (39 Tabellen; `CREATE TEMP TABLE` passt nicht) liegt in genau einer Liste (28 FULL, 6 CUSTOM, 5 EXCLUDED); umgekehrt existiert jeder Listeneintrag in den Migrationen; `monsters`, `rulebook_chunks`, `races`, `classes`, `race_class_restrictions` sind ausgeschlossen; `orderColumns` liefert PK-Spalten für `character_spells`, `session_tags`, sonst `["id"]`
- [x] `tables.ts` implementieren
- [x] TDD `images.test.ts`: sammelt URLs aus den vier Spalten; ZIP-Pfad ohne `?t=`, Lade-URL unverändert; leitet `bucket`/`path` ab (auch verschachtelt `avatars/<user>/<char>.webp`); ignoriert `null`, fremde Hosts, ungültige URLs; entfernt Duplikate
- [x] `images.ts` implementieren
- [x] TDD `archive.test.ts` (auf `Uint8Array` mit `zipSync`/`unzipSync`, nicht über `Blob`): Dateinamen `data/<t>.json`, `images/<bucket>/<path>`, `manifest.json` (Zeilenzahlen, `failedImages`, `generatedAt`), `LIESMICH.txt`; `backupFileName` mit Berlin-Datum (`2026-10-31T23:30Z` → `chaos-forge-backup-2026-11-01.zip`); ZIP via `unzipSync` round-trip
- [x] `archive.ts` implementieren (JSON mit 2 Leerzeichen eingerückt, Bilder `[u8, { level: 0 }]`); `LIESMICH.txt` nennt: enthaltene Tabellen, fehlende Teile (Monster, Stammdaten, Embeddings, Login-Konten `auth.users`, Sprachnotizen ohne Bucket), keine automatische Wiederherstellung
- [x] TDD `build-backup.test.ts` (gemocktes `fetch`): ruft `/api/admin/backup`, lädt Bilder mit `cache: "no-store"` und Fortschritt `onProgress(phase, done, total)`, sammelt fehlgeschlagene (404/Netzfehler), wirft bei API-Fehler mit Status; parallel max. 6 Bild-Downloads; liefert `Uint8Array` + Dateiname (Blob/File erst in der UI; ggf. Cast `as Uint8Array<ArrayBuffer>` für `BlobPart`)
- [x] `build-backup.ts` implementieren
- [x] TDD `load-tables.test.ts` (Supabase-Mock mit Count- und Range-Kette): lädt alle `FULL_TABLES` ungefiltert und `CUSTOM_ROW_TABLES` mit `.eq("is_custom", true)` in Count **und** Seite, sortiert nach `orderColumns`; Fehler einer Tabelle → wirft mit Tabellennamen und loggt `[Backup] table failed:`
- [x] `load-tables.ts` implementieren (`fetchAllRows`)
- [x] Route `src/app/api/admin/backup/route.ts`: `getUser()` → 401, `isAdminEmail(user.email)` → 403, `loadBackupTables(createServiceClient())` → 200 `{ generatedAt, tables }` mit `Cache-Control: no-store`, Fehler → 500 `{ error }`
- [x] TDD `backup-panel.test.tsx` (`buildBackup` gemockt; `navigator.share`/`canShare` per `Object.defineProperty(..., { configurable: true })` setzen und entfernen; `vi.mock("file-saver")`): Start → Fortschritt → fertig mit Dateiname/Größe; „In iCloud sichern“ nur bei `canShare` true und ruft `navigator.share({ files: [File] })` ohne `title`; `AbortError` → kein Fehler; „Herunterladen“ ruft `saveAs`; Fehlerzustand mit „Erneut versuchen“; Hinweis bei fehlgeschlagenen Bildern
- [x] `backup-panel.tsx` implementieren (`autoStart`-Prop für den Dialog nicht nötig — Start immer per Tipp)
- [x] `backup-section.tsx` + Test; Einbindung in `settings-client.tsx` nach Tutorials nur `isAdmin`
- [x] `messages/*.json` Namespace `backup` (DE/EN): `sectionTitle`, `hint`, `create`, `loadingData`, `loadingImages` (`{done} / {total}`), `zipping`, `ready` (`{name} · {size}`), `failedImages` (`{count}`), `share`, `download`, `error`, `retry`, `offerTitle`, `offerText`, `later`
- [x] `src/app/datenschutz/page.tsx`:
  - Abschnitt 3: neuer Punkt „Datensicherung“: Der Administrator erstellt nach Spielabenden Sicherungskopien aller Spieldaten (inkl. Profilen mit E-Mail-Adressen, Benachrichtigungen und hochgeladener Bilder), ausschließlich zur Wiederherstellung nach Datenverlust.
  - Abschnitt 4: Rechtsgrundlage Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an Datensicherung).
  - Abschnitt 5: Apple (iCloud) als Speicherort der Sicherungen, für EU-Nutzer Apple Distribution International Ltd., Irland, mit Link zur Apple-Datenschutzrichtlinie.
  - Abschnitt 7: Sicherungen werden höchstens 12 Monate aufbewahrt; Daten gelöschter Konten entfernt der Administrator auf Anfrage auch aus vorhandenen Sicherungen.
- [x] `CLAUDE.md`: Projektstruktur (`lib/backup/`, `components/backup/`, `lib/admin.ts`, `api/admin/backup`), Abschnitt Supabase/Backup (Tabellenlisten pflegen, Guard-Test), Datenschutz-Hinweis

**Automated Verification**:

- [x] `npx vitest run src/lib/backup src/lib/admin src/components/backup src/app/api/admin/backup` grün
- [x] `npm run verify` grün

**Manual Verification**:

- [ ] iPhone Safari: Einstellungen → Backup erstellen → In iCloud sichern → „In Dateien sichern“ → ZIP liegt in iCloud Drive und lässt sich öffnen (Daten + Bilder)
- [ ] Mac: Herunterladen liefert dasselbe ZIP
- [ ] Nicht-Admin sieht keine Backup-Sektion; `/api/admin/backup` antwortet 403

### Phase 2: Angebot nach dem Speichern

Dependencies: Phase 1

**Tasks**:

- [x] TDD `offer.test.ts`: `shouldOfferBackup` true für neue Session, false nach `markBackupOffered`; Liste auf 50 begrenzt (älteste fallen raus); robust gegen kaputtes JSON/fehlenden Storage
- [x] `offer.ts` implementieren
- [x] TDD `use-backup-offer.test.ts` (`renderHook`): Nicht-Admin → `offer()` öffnet nie; Admin → `offer()` öffnet und markiert; zweites `offer()` in derselben Session öffnet nicht; `close()` schließt
- [x] `use-backup-offer.ts` implementieren
- [x] TDD `backup-offer-dialog.test.tsx`: zeigt Titel/Text, „Später“ schließt (`onOpenChange(false)`), „Backup erstellen“ zeigt den `BackupPanel`-Ablauf im Dialog
- [x] `backup-offer-dialog.tsx` implementieren (shadcn `Dialog`, `BackupPanel` eingebettet)
- [x] `src/app/sessions/[id]/page.tsx`: `isAdmin={isAdminEmail(user.email)}` an `SessionDetail`
- [x] `session-detail.tsx`: Prop `isAdmin`, `useBackupOffer`; `offer()` nach `onEntryCreated` und nach erfolgreichem Speichern der Zusammenfassung; `<BackupOfferDialog>` rendern
- [x] `CLAUDE.md`: Angebot nach dem Speichern, localStorage-Key; Roadmap-Punkt „Backup in iCloud“

**Automated Verification**:

- [x] `npx vitest run src/lib/backup src/components/backup` grün
- [x] `npm run verify` grün

**Manual Verification**:

- [ ] Als Admin Eintrag speichern → Dialog erscheint; nach „Später“ und erneutem Speichern der Zusammenfassung in derselben Session nicht erneut
- [ ] Als Admin Zusammenfassung in einer anderen Session speichern → Dialog erscheint einmal
- [ ] Als Spieler: kein Dialog

## Implementation Notes

- 2026-10-31: User wünscht zwei Schritte (Erstellen → Teilen), Dialog statt Toast, keine Monster, keine Wiederherstellung.
- 2026-11-01: Roadmap-Eintrag als Nr. 30, weil PR #185 die Nr. 29 belegt.
- 2026-11-01: `handleSaveSummary` prüft jetzt den Fehler des Updates; das Angebot kommt nur bei Erfolg.
- 2026-11-01: Review: Angebot nicht nach dem Anlegen (leere Session), sondern nach Eintrag + Zusammenfassung (User bestätigt). Admin-Checks auf Auth-E-Mail. Datenschutz um Apple, Rechtsgrundlage und Aufbewahrung (12 Monate) ergänzt.

## References

- `docs/agents/research/2026-10-31-admin-backup.md`
- `src/lib/supabase/fetch-all-rows.ts`, `src/lib/supabase/service.ts`
- `src/app/api/admin/reject-user/route.ts` (Admin-API-Muster)
- `src/components/print-sheet/print-sheet.tsx:1284-1300` (`file-saver`)
- fflate: https://github.com/101arrowz/fflate
