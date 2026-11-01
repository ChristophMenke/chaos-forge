---
date: 2026-10-31T21:30:27+00:00
git_commit: 46083baba88b96f4eca5a3f52bce2be86452e8b3
branch: chore/shadcn-dev-dependency
topic: "Release Notes + SvenBot"
tags: [plan, rulebook-chat, svenbot, release-notes, profiles, settings, navigation]
status: ready
---

# PLAN: Release Notes + SvenBot

Zwei zusammenhängende Wünsche der Gruppe:

1. Der Regelbuch-Chat wird zu **SvenBot**: Er zeigt das Gesicht des Spielleiters Sven (aus dem
   Master-of-Chaos-Artwork) neben jeder Antwort, in der Navigation und im Chat-Kopf und antwortet
   leicht fies, aber regelkorrekt.
2. **Release Notes** erscheinen jedem Spieler einmal pro neuer Version als Dialog und sind in den
   Einstellungen nachlesbar.

Grundlage: `docs/agents/research/2026-10-31-release-notes-svenbot.md`.

Branch: `feature/release-notes-svenbot`, abgezweigt von `main`.

## Acceptance Criteria

- Der Chat (`/chat` und GM-Tab `chat`) zeigt SvenBot: Avatar neben jeder Antwort (auch beim
  Streamen), Avatar + „SvenBot“ im Kopf mit Untertitel „Regelwerk & App-Hilfe“, großes Avatar im
  leeren Chat, Ladezeile „SvenBot reibt sich die Hände…“.
- Alle vier Navigationen (App-Sidebar, Mobile-More-Menü, GM-Sidebar, GM-Bottom-Nav) zeigen statt
  `BookOpen` einen runden Mini-Avatar und das Label „SvenBot“.
- SvenBot antwortet als Spielleiter Sven: höchstens eine Stichelei pro Antwort, danach korrekte,
  knappe Auskunft; Quellen bleiben; nie beleidigend, nie über echte Personen; nichts erfinden;
  „frag Christoph“ bleibt der Fallback bei undokumentierten App-Fragen; gilt für Spieler und GM.
- Release Notes liegen versioniert im Code (DE/EN, Datum, Punkte mit Icon). Der erste Eintrag
  (`2026-10-31`) enthält SvenBot, Stufenaufstieg, temporäre Effekte, Rückgängig/Wiederherstellen,
  Sprockets Kondensator.
- Einstellungen → Sektion „Neuigkeiten“ zeigt alle Releases, die neueste oben.
- Auf eingeloggten Seiten (außer `/master/*`, öffentlichen Seiten, Druckansicht, Embed-Modus) öffnet
  sich einmal ein Dialog mit allen ungesehenen Releases (neueste oben). Jedes Schließen (Button,
  X, Escape, Klick daneben, Link zu den Einstellungen) setzt `profiles.last_seen_release` auf die
  neueste Release-ID.
- Spieler, deren Konto am oder nach dem Release-Datum (Kalendertag in Europe/Berlin) angelegt wurde,
  sehen diese Release nicht im Dialog (aber in den Einstellungen).
- Noch nicht freigegebene Spieler sehen den Dialog genauso (Lesen/Schreiben der eigenen Profilzeile
  ist nicht freigabepflichtig).
- Mehrere Spieler auf demselben Browser sehen den Dialog jeweils selbst (Cache pro Nutzer).

## Technical Key Decisions and Tradeoffs

1. **Sichtbarkeit über Datum + datumsartige ID:** Release-IDs sind `YYYY-MM-DD` (optional
   `-2` … `-9` bei mehreren am Tag, einstellig, damit der String-Vergleich stimmt) und damit
   lexikografisch sortierbar. Ungesehen ist eine Release, wenn `id > last_seen_release` (oder
   `last_seen_release` null) **und** `date > Kalendertag(created_at, GROUP_TIME_ZONE)`. Der
   Kalendertag wird wie in `src/lib/game-dates/index.ts:48-59` per
   `Intl.DateTimeFormat(…, { timeZone }).formatToParts` bestimmt — konkret
   `toDateInputValue(todayInGroupTimezone(new Date(createdAt)))` —, nicht per `slice(0, 10)` auf dem
   UTC-String.
   - Why: Kein Trigger-Eingriff, keine Migration pro Release, unbekannte/gelöschte IDs sind unkritisch.
   - Impact: Eine Migration (`last_seen_release text null`), reine Funktion `getUnseenReleases()`.
2. **Ein globaler Dialog im Root-Layout** statt pro Seite.
   - Why: Erscheint unabhängig vom Einstiegspunkt.
   - Impact: Ausnahme-Routen als reine Funktion `isReleaseNotesRoute(pathname)` (testbar);
     Embed-Modus über Klasse `embed-mode` auf `<html>`.
3. **localStorage-Cache pro Nutzer** `chaos-forge-release-seen:${userId}` (zuletzt gesehene ID)
   vor der DB-Abfrage.
   - Why: Kein zusätzlicher Query pro Seitenaufruf, sobald gesehen; pro Nutzer, damit geteilte
     Geräte niemanden überspringen.
   - Impact: Erst wenn lokal nicht die neueste ID steht, wird `profiles(last_seen_release, created_at)`
     gelesen. Ergibt sich nichts Ungesehenes, wird der Cache trotzdem gesetzt.
4. **Jedes Schließen = gesehen.** Base-UI `onOpenChange(false)` feuert für Escape, Klick daneben
   und X; „Verstanden“ ist ein `DialogClose`, der Link ein `DialogClose render={<Link href="/settings" />}`
   — damit läuft jedes Schließen über genau einen Pfad (`onOpenChange` → `markSeen`, idempotent über
   einen Ref). Schreiben per `update` auf die eigene Profilzeile (RLS erlaubt das, `profiles` hat
   kein `enforce_approval`). Schreibfehler werden geloggt, der Dialog bleibt zu (Cache gesetzt) —
   er soll nicht nerven.
   4a. **Schlanker Root-Bundle:** `ReleaseNotesDialog` im Layout ist nur ein kleiner Gate-Teil
   (Route, userId, Cache, Abfrage); der eigentliche Dialog-Inhalt (`RELEASES`, Liste, Icons) wird per
   `next/dynamic` erst geladen, wenn es Ungesehenes gibt.
   4b. **Kein Doppel-Overlay:** Während der Release-Dialog offen ist, startet das Tutorial-Overlay
   nicht automatisch. Umsetzung: `TutorialOverlay` wartet, solange
   `document.documentElement.dataset.releaseNotesOpen === "true"`, und startet nach dem Schließen
   (Event `chaos-forge:release-notes-closed`). Betrifft nur Nutzer, die Tutorials zurückgesetzt haben.
5. **Release-Texte als TS-Daten mit `de`/`en`-Feldern**, Ausgabe über `localized()`; nur die
   UI-Rahmentexte liegen in `messages/*.json`.
   - Why: Release-Inhalte sind Daten, keine UI-Strings; hält `messages/*.json` schlank.
6. **`SvenBotIcon`-Komponente** (`{ className?: string }`) ersetzt `BookOpen` drop-in in allen
   Navigationen; `SvenBotAvatar` (Größen `sm | md | lg`) für Chat.
7. **Persona in eigenes Modul** `src/lib/rulebook-chat/system-prompt.ts` ausgelagert, damit sie
   unit-testbar ist; `route.ts` importiert nur noch.
8. **Avatar-Asset** einmalig per `sharp` aus `master-pin-portrait.webp`
   (`extract {left:150, top:250, width:420, height:420}` → 256×256, WebP, nicht rund beschnitten;
   rund wird per CSS `rounded-full`). Ablage: `public/images/svenbot/svenbot-avatar.webp`.
   Skript `scripts/svenbot-avatar.ts` (wie die übrigen Skripte, wird gelintet) wird versioniert.
9. **Barrierefreiheit:** `SvenBotAvatar` hat `alt` = `rulebook.botName`; `SvenBotIcon` in den
   Navigationen ist dekorativ (`alt=""`), weil daneben Label bzw. `aria-label` stehen.
10. **Profil-Spaltenschutz (Sicherheitsfix, vom User am 2026-10-31 bestätigt):** siehe Phase 3.

## Current State

```
Root-Layout
 └─ ApprovalProvider (userId)
     └─ <main>
         ├─ /chat   → RulebookChat ─┐   Kopf: 📖 „Regelwerk & App-Hilfe“
         └─ /master → Tab "chat" ───┤   Antworten: nur Bubble, kein Avatar
                                    │   Laden: ✨ „Der Orakel-Krake denkt nach…“
                                    └→ /api/rulebook-chat  SYSTEM_PROMPT „Gelehrter aus den Reichen“
Navigation: NAV_ITEMS /chat icon BookOpen label nav.rulebook „Chat“; GM-Sidebar/-Bottom-Nav BookOpen
Release Notes: keine. profiles: kein last_seen_release.
```

## Desired End State

```
Root-Layout
 └─ ApprovalProvider (userId)
     ├─ ReleaseNotesDialog  ── isReleaseNotesRoute(pathname)? ── localStorage? ── profiles
     │                          └─ getUnseenReleases(RELEASES, profile) → Dialog → markSeen()
     └─ <main>
         ├─ /settings → … Tutorials · Neuigkeiten (ReleaseNotesList) · Danger Zone
         ├─ /chat, /master tab chat → RulebookChat (SvenBotAvatar überall)
         └─ /api/rulebook-chat → SYSTEM_PROMPT aus lib/rulebook-chat/system-prompt.ts (SvenBot)
Navigation: SvenBotIcon + „SvenBot“ in allen vier Navigationen
```

Chat (Mockup):

```
┌──────────────────────────────────────────────────────────┐
│ (Sven) SvenBot                          Bücher filtern   │
│        Regelwerk & App-Hilfe                             │
├──────────────────────────────────────────────────────────┤
│                    ( Sven groß )                         │
│      Na, wieder Fragen? Frag. Aber jammer nicht über     │
│      die Antwort.                                        │
│      Zum Beispiel: [ETW0 Kämpfer Stufe 5] …              │
│                                                          │
│                       ┌───────────────────────────────┐  │
│                       │ Was ist mein ETW0 …?          │  │
│                       └───────────────────────────────┘  │
│ (S) ┌─────────────────────────────────────┐              │
│     │ Stufe 5 und das immer noch nicht …  │              │
│     └─────────────────────────────────────┘              │
│ (S) SvenBot reibt sich die Hände…                        │
├──────────────────────────────────────────────────────────┤
│ [ Frag SvenBot zu AD&D oder der App… ]            [➤]    │
└──────────────────────────────────────────────────────────┘
```

Release-Notes-Dialog (Mockup):

```
┌────────────────────────────────────────────┐
│  ✦ Neu in der Chaos Forge               ✕  │
│  31. Oktober 2026                          │
│  (Sven) SvenBot lebt!                      │
│         Der Chat antwortet jetzt als Sven …│
│  ⬆  Stufenaufstieg-Assistent …             │
│  ✨ Temporäre Effekte …                     │
│  ↶  Rückgängig/Wiederherstellen …          │
│  ⚙  Sprockets Kondensator …                │
│  Alle Neuigkeiten in den Einstellungen →   │
│                          [ Verstanden ]    │
└────────────────────────────────────────────┘
```

Einstellungen, neue Sektion zwischen „Tutorials“ und „Danger Zone“:

```
┌ ✦ Neuigkeiten ───────────────────────────────┐
│ 31. Oktober 2026                             │
│  (Sven) SvenBot lebt! …                      │
│  ⬆ Stufenaufstieg-Assistent …                │
│  …                                           │
└──────────────────────────────────────────────┘
```

## Abstractions and Code Reuse

- `scripts/svenbot-avatar.ts` — neu, erzeugt das Avatar-WebP per `sharp`
- `public/images/svenbot/svenbot-avatar.webp` — neu
- `src/components/svenbot/`
  - `svenbot-avatar.tsx` — neu: `SvenBotAvatar({ size, className })` (`next/image`, `rounded-full`,
    `alt` aus `rulebook.botName`) und `SvenBotIcon({ className })` für Navigationen
  - `svenbot-avatar.test.tsx` — neu
- `src/components/rulebook-chat/`
  - `chat-message.tsx` — Avatar links neben Assistent-Bubble (`data-testid="svenbot-avatar"`)
  - `rulebook-chat.tsx` — Kopf, `WelcomeScreen`, Ladezeile mit Avatar
  - `chat-message.test.tsx`, `rulebook-chat.test.tsx` — neu
- `src/lib/navigation.ts` — `/chat`: `icon: SvenBotIcon`
- `src/components/master/master-sidebar.tsx`, `master-bottom-nav.tsx` — `BookOpen` → `SvenBotIcon`
- `src/lib/rulebook-chat/system-prompt.ts` — neu: `SYSTEM_PROMPT`, `APP_HELP_CONTEXT` (aus route.ts)
- `src/lib/rulebook-chat/system-prompt.test.ts` — neu
- `src/app/api/rulebook-chat/route.ts` — importiert die Konstanten
- `src/lib/release-notes/`
  - `releases.ts` — neu: Typen `Release`, `ReleaseItem`, `ReleaseIcon`; `RELEASES` (neueste zuerst),
    `LATEST_RELEASE_ID`
  - `index.ts` — neu: `getUnseenReleases()`, `isReleaseNotesRoute()`, `RELEASE_SEEN_STORAGE_KEY`,
    `readSeenRelease()`, `writeSeenRelease()`
  - `index.test.ts`, `releases.test.ts` — neu
- `src/components/release-notes/`
  - `release-notes-list.tsx` — neu: `ReleaseNotesList({ releases })` (Icon-Mapping auf lucide/SvenBotIcon,
    `localized()`), genutzt von Dialog und Einstellungen
  - `release-notes-dialog.tsx` — neu: `ReleaseNotesDialog()` (shadcn `Dialog`, `useApproval()`, `usePathname()`)
  - `release-notes-section.tsx` — neu: GlassCard-Sektion für Einstellungen
  - Tests je Komponente
- `src/app/layout.tsx` — `<ReleaseNotesDialog />` innerhalb `ApprovalProvider`
- `src/app/settings/settings-client.tsx` — `<ReleaseNotesSection />` nach Tutorials
- `supabase/migrations/00232_profiles_last_seen_release.sql` — neu
- `messages/de.json`, `messages/en.json` — Namespaces `rulebook`, `nav`, `landing`, `tutorial`, neu `releaseNotes`
- Doku: `CLAUDE.md`, `README.md`

## Logging & Observability

Nur ein Fehlerpfad: Schreibfehler beim Markieren als gesehen.

```
[ReleaseNotes] markSeen failed: { code: "42501", message: "…" }
```

## Implementation

### Phase 1: SvenBot im Chat und in der Navigation

Dependencies: None

Der Chat bekommt Svens Gesicht und Stimme; alle Navigationen heißen „SvenBot“.

**Tasks**:

- [x] Branch `feature/release-notes-svenbot` von `main` anlegen
- [x] `scripts/svenbot-avatar.ts` anlegen und ausführen (`npx tsx scripts/svenbot-avatar.ts`) → `public/images/svenbot/svenbot-avatar.webp` (256×256, quality 85)
- [x] TDD `src/components/svenbot/svenbot-avatar.test.tsx`: `SvenBotAvatar` rendert `img` mit `alt="SvenBot"`, Größenklassen `sm` (h-7 w-7), `md` (h-9 w-9), `lg` (h-20 w-20), `rounded-full`; `SvenBotIcon` reicht `className` durch und hat `alt=""`. Nur `alt`/Klassen prüfen, nicht `src` (`next/image` rendert `/_next/image?url=…`)
- [x] `src/components/svenbot/svenbot-avatar.tsx` implementieren (`next/image` mit festen `width`/`height`: 64 für `sm`/`md`/Icon, 160 für `lg`)
- [x] TDD `chat-message.test.tsx`: Assistent-Nachricht enthält `svenbot-avatar` (auch mit `isStreaming`), User-Nachricht nicht
- [x] `chat-message.tsx`: Avatar (`size="sm"`, `shrink-0 self-start`) vor der Assistent-Bubble
- [x] TDD `rulebook-chat.test.tsx`: Kopf zeigt `rulebook.botName` + `rulebook.title` und Avatar; leerer Chat zeigt großes Avatar + `welcome`; Ladezeile zeigt Avatar + `thinking`
- [x] `rulebook-chat.tsx`: Kopf (Avatar `md` + `<h1>` botName + Untertitel title), `WelcomeScreen` (Avatar `lg` statt `BookOpen`), Ladezeile (Avatar `sm` statt `Sparkles`)
- [x] `messages/de.json` / `en.json` `rulebook`: neu `botName` „SvenBot“; `thinking` „SvenBot reibt sich die Hände…“ / „SvenBot rubs his hands…“; `welcome` „Na, wieder Fragen? Frag. Aber jammer nicht über die Antwort.“ / „Questions again? Ask. Just don’t whine about the answer.“; `placeholder` „Frag SvenBot zu AD&D oder der App…“ / „Ask SvenBot about AD&D or the app…“
- [x] `messages/*.json` `nav.rulebook` → „SvenBot“; `landing.featureChatTitle` → „SvenBot“, `featureChatDesc` auf Sven umformulieren; genau die vier Keys `tutorial.{dashboard,characters,party,chronicle}.chatDesc` „Chat“ → „SvenBot“
- [x] `src/lib/navigation.ts`: `/chat` `icon: SvenBotIcon`
- [x] `master-sidebar.tsx` und `master-bottom-nav.tsx`: `BookOpen` → `SvenBotIcon`
- [x] Prüfen, ob `landing/feature-cards.tsx` das Icon `Sparkles` behält (ja, öffentliche Seite bleibt Icon-Stil)
- [x] `SYSTEM_PROMPT` + `APP_HELP_CONTEXT` nach `src/lib/rulebook-chat/system-prompt.ts` verschieben; `route.ts` importiert
- [x] TDD `system-prompt.test.ts`: Prompt nennt „SvenBot“ und „Sven“, enthält „höchstens eine Stichelei“, verbietet Beleidigungen, behält „AUSSCHLIESSLICH“ (Modus A und B), Quellenformat **(Buchname)**, „frag Christoph“, metrische Einheiten, kein „Gelehrter“ und keine „Folianten“ mehr; `APP_HELP_CONTEXT` nennt SvenBot statt „Rulebook Chat“/„Chat“ (Stellen: ALLGEMEIN „More (…/Chat)“, GM-Tab „Rulebook Chat“, CHAT-Abschnitt — dort Pfad korrigieren: Desktop direkt in der Sidebar, Mobil im More-Menü)
- [x] Neue Persona schreiben (Einleitung, „DEINE STIMME“ und die Folianten-Formulierung in „WORÜBER DU SPRICHST“ ersetzen; Modus A/B und gemeinsame Regeln inhaltlich unverändert):
  ```
  Du bist SvenBot — das digitale Abbild von Sven, dem Spielleiter dieser Gruppe („Master of Chaos“).
  DEINE STIMME:
  - Süffisant, schadenfroh, ein Spielleiter, der sich auf das Leid seiner Spieler freut.
  - HÖCHSTENS EINE Stichelei pro Antwort, dann die korrekte Auskunft. …
  - Erlaubte Ziele: Würfelpech, Heldentode, Gier nach Loot, Regelunkenntnis.
  - Niemals beleidigend, nie über echte Personen, Aussehen oder Privates. …
  - Sprich von dir als Sven oder „euer Spielleiter“, deute gern an, was du noch bereithältst.
  - FASSE DICH KURZ … (bestehende Kürzeregeln übernehmen)
  - Die Rolle ist Anstrich, niemals Ausrede … (übernehmen)
  ```
- [x] Doku: `CLAUDE.md` (API-Zeile „Realms-Persona“ → „SvenBot-Persona“, Roadmap-Punkt 21 Satz zur Persona bleibt historisch, Projektstruktur `components/svenbot/`, `lib/rulebook-chat/`), `README.md:50,59,60`; `src/app/datenschutz/page.tsx:52` „Regelbuch-Chat (SvenBot)“

**Automated Verification**:

- [x] `npx vitest run src/components/svenbot src/components/rulebook-chat src/lib/rulebook-chat` grün
- [x] `src/test/regression.test.ts` (i18n-Parität) grün
- [x] `npm run verify` grün

**Manual Verification**:

- [ ] `/chat`: Avatar im Kopf, im leeren Chat, neben Antworten (auch beim Streamen), Ladezeile
- [ ] `/master` Tab SvenBot: dieselbe Darstellung, Mini-Avatar in GM-Sidebar und -Bottom-Nav
- [ ] Zwei Probefragen (Regel + App) ergeben eine Stichelei + korrekte Antwort

### Phase 2: Release-Notes-Daten und Sektion „Neuigkeiten“

Dependencies: Phase 1 (SvenBotIcon für den SvenBot-Eintrag)

**Tasks**:

- [x] TDD `src/lib/release-notes/releases.test.ts`: IDs eindeutig, Format `^\d{4}-\d{2}-\d{2}(-[2-9])?$`, absteigend sortiert, `date` = ID-Datumsteil, alle Texte `de`/`en` nicht leer, `LATEST_RELEASE_ID === RELEASES[0].id`
- [x] `releases.ts`: Typen + `RELEASES` mit Eintrag `2026-10-31`:
  ```ts
  type ReleaseIcon = "svenbot" | "level-up" | "effects" | "undo" | "sprocket";
  interface ReleaseItem {
    icon: ReleaseIcon;
    title: { de: string; en: string };
    text: { de: string; en: string };
  }
  interface Release {
    id: string;
    date: string;
    items: ReleaseItem[];
  }
  ```
  Punkte: SvenBot lebt! · Stufenaufstieg-Assistent · Temporäre Effekte · Rückgängig/Wiederherstellen · Sprockets Kondensator (je 1–2 Sätze, Spielersprache)
- [x] TDD `src/lib/release-notes/index.test.ts` für `getUnseenReleases(releases, { lastSeenId, createdAt })`:
  - `lastSeenId` null + Konto älter → alle
  - `lastSeenId` = neueste → leer
  - `lastSeenId` älter → nur neuere, neueste zuerst
  - Konto am Release-Tag oder später angelegt → Release ausgeblendet
  - Zeitzone: `createdAt = "2026-10-31T23:30:00+00:00"` (= 1. Nov in Berlin) blendet Release `2026-10-31` aus; `"2026-10-30T22:30:00+00:00"` (= 30. Okt 23:30 Berlin) zeigt sie
  - unbekannte ältere ID (gelöscht) → Vergleich per String funktioniert
  - `createdAt` null → wie „alt“ (alle anzeigen)
- [x] `index.ts`: `getUnseenReleases` implementieren
- [x] TDD `release-notes-list.test.tsx`: rendert Datum lokalisiert (`de-DE`/`en-US`, lang) über `parseGameDate()` aus `src/lib/game-dates` (lokale Mitternacht, kein UTC-Versatz), Titel/Text in Locale, SvenBot-Punkt mit Avatar
- [x] `release-notes-list.tsx` implementieren (Icon-Map: `level-up` → `ArrowUpCircle`, `effects` → `Sparkles`, `undo` → `Undo2`, `sprocket` → `Cog`, `svenbot` → `SvenBotIcon`)
- [x] TDD `release-notes-section.test.tsx`: Sektion `data-testid="settings-section-release-notes"`, Überschrift `releaseNotes.sectionTitle`, alle Releases
- [x] `release-notes-section.tsx` + Einbindung in `settings-client.tsx` nach der Tutorials-Sektion
- [x] `messages/*.json` Namespace `releaseNotes`: `sectionTitle` („Neuigkeiten“/„What’s new“), `dialogTitle` („Neu in der Chaos Forge“/„New in Chaos Forge“), `confirm` („Verstanden“/„Got it“), `allNotesLink` („Alle Neuigkeiten in den Einstellungen“/„All updates in settings“)

**Automated Verification**:

- [x] `npx vitest run src/lib/release-notes src/components/release-notes` grün
- [x] `npm run verify` grün

**Manual Verification**:

- [ ] `/settings` zeigt „Neuigkeiten“ mit dem Eintrag vom 31. Oktober 2026 in DE und EN

### Phase 3: Automatischer Dialog und „gesehen“-Speicherung

Dependencies: Phase 2

**Tasks**:

- [x] Migration `supabase/migrations/00232_profiles_last_seen_release.sql`:
  ```sql
  -- Release notes: id of the newest release the user has dismissed (YYYY-MM-DD[-n]).
  -- NULL = never seen anything; visibility is additionally limited by created_at.
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen_release text;
  ```
- [x] TDD `isReleaseNotesRoute(pathname)`: `false` für `/`, `/login`, `/impressum`, `/datenschutz`, `/share/…`, `/master`, `/master/…`, `/admin/…`, `/characters/x/print`; `true` für `/dashboard`, `/characters/x`, `/chat`, `/settings`
- [x] TDD `readSeenRelease(userId)`/`writeSeenRelease(userId, id)` (localStorage-Key `chaos-forge-release-seen:${userId}`, zwei Nutzer getrennt, robust gegen fehlendes `window`/Exceptions)
- [x] TDD `release-notes-dialog.test.tsx` (Supabase-Client gemockt, `useApproval` gemockt):
  - kein `userId` → nichts, keine Abfrage
  - `userId` erst null, dann gesetzt → genau eine Abfrage (Effekt hängt an `[userId, pathname]`)
  - Ausnahme-Route → nichts, keine Abfrage
  - `embed-mode` auf `<html>` → nichts
  - localStorage = `LATEST_RELEASE_ID` → keine Abfrage, kein Dialog
  - Profil mit älterem `last_seen_release` → Dialog mit ungesehenen Releases
  - neues Konto (created_at ≥ Release) → kein Dialog, localStorage gesetzt
  - „Verstanden“ → `update({ last_seen_release: LATEST_RELEASE_ID }).eq("id", userId)`, localStorage gesetzt, Dialog zu
  - Schließen per Escape (`userEvent.keyboard("{Escape}")` + `waitFor`) → ebenso gespeichert, `update` genau einmal
  - Klick auf „Alle Neuigkeiten“ → gespeichert, Link `/settings`, Dialog danach geschlossen
  - während offen: `data-release-notes-open="true"` auf `<html>`; nach Schließen entfernt + Event `chaos-forge:release-notes-closed`
  - Update-Fehler → `console.error("[ReleaseNotes] markSeen failed:", …)`, Dialog bleibt zu
- [x] `release-notes-dialog.tsx` implementieren: Gate-Komponente + per `next/dynamic` geladener Inhalt (shadcn `Dialog`, `DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg"`, `data-testid="release-notes-dialog"`; Öffnen nach dem Laden, ohne Verzögerung)
- [x] `src/app/layout.tsx`: `<ReleaseNotesDialog />` nach `ApprovalErrorToast`
- [x] TDD `tutorial-overlay`: startet nicht, solange `data-release-notes-open="true"`; startet nach Event `chaos-forge:release-notes-closed`
- [x] `tutorial-overlay.tsx` entsprechend anpassen
- [x] Hinweis: `undo-coverage.test.ts` prüft nur einen festen `SCOPE` (ohne `release-notes`), `modal-portal-guard.test.ts` nur `fixed inset-0` — keine Ausnahme nötig
- [x] Sicherheitsfix in derselben Migration: BEFORE-UPDATE-Trigger `protect_profile_columns` auf `profiles`, der Änderungen an `is_approved`, `email` und `id` ablehnt (`42501`), wenn `current_user` = `authenticated` oder `anon`; `approve_user` (SECURITY DEFINER → Owner) und Service-Role bleiben erlaubt
  ```sql
  CREATE OR REPLACE FUNCTION public.protect_profile_columns() RETURNS trigger
  LANGUAGE plpgsql AS $$
  BEGIN
    IF current_user IN ('authenticated', 'anon') AND (
         NEW.is_approved IS DISTINCT FROM OLD.is_approved
      OR NEW.email IS DISTINCT FROM OLD.email
      OR NEW.id IS DISTINCT FROM OLD.id) THEN
      RAISE EXCEPTION 'protected profile column' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END $$;
  CREATE TRIGGER protect_profile_columns BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();
  ```
- [x] Migration auf Supabase anwenden (`supabase db push`)
- [x] Doku `CLAUDE.md`: Projektstruktur (`lib/release-notes/`, `components/release-notes/`), Supabase-Abschnitt (`profiles.last_seen_release`, Sichtbarkeitsregel, localStorage-Key), Migrationsanzahl 230, Roadmap-Punkt 29 „Release Notes & SvenBot“, Hinweis „Neue Release = Eintrag oben in `RELEASES`, ID `YYYY-MM-DD`“

**Automated Verification**:

- [x] `npx vitest run src/lib/release-notes src/components/release-notes` grün
- [x] `npm run verify` grün

**Manual Verification**:

- [ ] Bestandskonto: nach Login auf `/dashboard` erscheint der Dialog einmal; nach „Verstanden“ und Neuladen nicht mehr; auf einem zweiten Gerät auch nicht
- [ ] Direkter Einstieg auf `/master` zeigt keinen Dialog; danach `/dashboard` zeigt ihn
- [ ] Neu registriertes Konto sieht keinen Dialog, nur Tutorials
- [ ] Sicherheitsfix: im Browser `supabase.from("profiles").update({ is_approved: true })` auf das eigene Profil schlägt mit 42501 fehl; Anzeigename ändern und Freigabe über `/admin/approve/[id]` funktionieren weiter

## Implementation Notes

- 2026-10-31: Avatar-Ausschnitt (left 150, top 250, 420×420) vom User bestätigt.
- Phase 1: Veraltete App-Doku zum Stufenaufstieg („passiert automatisch“) im APP_HELP_CONTEXT mitkorrigiert, weil SvenBot daraus antwortet. Überschrift „SVENBOT (das bist du)“.
- Phase 3: `RELEASES` liegt im Gate-Bundle (klein, wird für die Prüfung gebraucht); per `next/dynamic` geladen wird nur die Dialog-Oberfläche.
- Phase 3: Bug beim eigenen Lesen gefunden und per Test abgesichert: Der Prüf-Merker wurde bei jeder Navigation zurückgesetzt → erneute Abfrage. Jetzt nur, solange die Abfrage noch läuft.
- Phase 3: `@testing-library/user-event` ist nicht installiert; Escape per `fireEvent.keyDown` getestet.
- Persona-Ton per Beispiel bestätigt („Stufe 5 und das immer noch nicht auswendig? Niedlich. …“).

## References

- `docs/agents/research/2026-10-31-release-notes-svenbot.md`
- `src/app/api/rulebook-chat/route.ts:7-90`
- `src/components/rulebook-chat/chat-message.tsx`, `rulebook-chat.tsx`
- `src/components/tutorial/tutorial-overlay.tsx:163-212` (Auto-Open-Muster)
- `src/components/approval-provider.tsx` (`useApproval`)
- `supabase/migrations/00218_skip_tutorials_existing_users.sql` (Spalten-Muster)
- `src/app/settings/settings-client.tsx:327-340` (Sektionsmuster)
