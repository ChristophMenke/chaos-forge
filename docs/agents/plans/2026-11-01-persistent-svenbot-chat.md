---
date: 2026-11-01T14:16:27+00:00
git_commit: ddcee63bff6a047fb2a7c3fb71516804b256134e
branch: feature/persistent-svenbot-chat
topic: "SvenBot-Chatverlauf dauerhaft speichern + „Neuer Chat“"
tags: [plan, rulebook-chat, svenbot, local-storage, master-dashboard]
status: ready
---

# PLAN: SvenBot-Chatverlauf dauerhaft speichern + „Neuer Chat“

Heute geht der SvenBot-Verlauf verloren, sobald man die Seite oder den GM-Tab verlässt, und eine
laufende Antwort wird abgebrochen. Künftig bleibt der Chat im Browser gespeichert, bis man
„Neuer Chat“ wählt.

Grundlage: `docs/agents/research/2026-11-01-persistent-svenbot-chat.md`.

## Acceptance Criteria

- Der Verlauf bleibt bei Seitenwechsel, GM-Tab-Wechsel, Neuladen und Browser-Neustart erhalten,
  bis „Neuer Chat“ bestätigt wird.
- Getrennte Verläufe für `/chat` (Spieler) und den GM-Bereich, jeweils pro angemeldetem Nutzer.
- Eine laufende Antwort läuft beim Verlassen weiter und steht beim Zurückkommen vollständig da;
  kommt man während des Streamens zurück, läuft sie sichtbar weiter.
- Wird Tab/Browser während einer Antwort geschlossen, bleibt der empfangene Teil mit
  „Antwort wurde unterbrochen.“ stehen.
- „Neuer Chat“ im Kopf (nur bei vorhandenem Verlauf) mit Rückfrage; bricht eine laufende Antwort
  ab, leert den Verlauf, behält den Buchfilter.
- Höchstens 200 Nachrichten pro Chat; nach Kürzung oben „Ältere Nachrichten wurden entfernt.“
- SvenBot bekommt als Kontext die letzten 20 vollständigen Nachrichten (10 Frage-Antwort-Paare,
  ohne Fehler- und unterbrochene Antworten) — auch nach Seitenwechsel oder Neuladen. Der Server
  begrenzt ebenfalls auf 20 (bisher 8).
- Blockierter oder voller Speicher bricht den Chat nicht (Verlauf gilt dann bis zum Neuladen).
- Ein zweiter offener Tab übernimmt Änderungen (Storage-Event), solange er selbst nicht streamt;
  eine dort laufende Antwort erscheint nicht als „unterbrochen“. Senden beide Tabs gleichzeitig,
  gewinnt der letzte Schreiber (akzeptiert).
- Ältere Nachrichten, die aus dem 20er-Fenster fallen, fließen in eine unsichtbare laufende
  Zusammenfassung, die SvenBot bei jeder Frage zusätzlich bekommt; „Neuer Chat“ löscht sie mit.
- Bei Kontolöschung werden die Chat-Einträge des Nutzers aus dem Browser entfernt.
- Die Datenschutzerklärung erwähnt, dass SvenBot-Verläufe lokal im Browser liegen.

## Technical Key Decisions and Tradeoffs

1. **Chat-Store auf Modulebene** (`src/lib/rulebook-chat/chat-store.ts`) nach dem Muster von
   `src/lib/view-mode.ts`: Zustand pro Schlüssel `${scope}:${userId}` in einer `Map`,
   Listener-`Set`, Hook `useRulebookChat(scope)` mit `useSyncExternalStore`.
   - Why: Der Stream lebt im Modul weiter, wenn die Komponente ausgehängt wird.
   - Impact: Senden/Streaming wandert aus `rulebook-chat.tsx` in den Store; kein Abort beim Unmount.
     Snapshots sind unveränderliche Objekte (neues Objekt bei jeder Änderung), damit
     `useSyncExternalStore` nicht in Schleifen läuft.
2. **Persistenz** in localStorage `chaos-forge-svenbot-chat:<scope>:<userId>` als
   `{ version: 1, messages, selectedBooks, truncated }`. Während des Streamens gedrosselt
   (höchstens 1× pro Sekunde), am Ende sofort. Beim Laden wird eine Nachricht mit Status
   `streaming` zu `interrupted`. Schreibfehler (Quota, privat) werden geschluckt.
3. **Reine Logik getrennt** in `src/lib/rulebook-chat/chat-history.ts`:
   `appendMessage` (Kürzung auf 200 + `truncated`), `apiHistory` (letzte 8 mit Status `done`),
   `restoreChat` (Validierung, `streaming` → `interrupted`, kaputte Daten → leer).
4. **Nachrichten mit ID und Status**: `{ id, role, content, status: "done" | "streaming" |
"interrupted" | "error" }`. IDs via `crypto.randomUUID()`, als React-Keys statt Index.
5. **Scope und userId per Prop vom Server**: `<RulebookChat scope="player" | "gm" userId={…} />`.
   `/chat/page.tsx` wird async und holt `requireAuth()` (per `cache()` dedupliziert),
   `master-dashboard.tsx` hat `userId` bereits (`:98`). Kein Warten auf `useApproval`, kein
   Aufblitzen des Willkommensbildschirms.
6. **„Neuer Chat“** über den vorhandenen `ConfirmDialog` (`open`, `title`, `message`,
   `confirmLabel`, `onConfirm`, `onCancel`).
7. **Robustheit des Stores** (Review):
   - Abbruch erkennen über `err.name === "AbortError" || signal.aborted`; nach jedem
     `reader.read()` `signal.aborted` prüfen und `reader.cancel()` aufrufen.
   - Nach jedem `await` nur schreiben, wenn `controllers.get(key) === controller` (sonst hat ein
     „Neuer Chat“ oder ein Test-Reset den Request abgelöst). `resetChat` löscht auch den
     Drossel-Timer. `__resetChatStoreForTests` erhöht einen Generationszähler.
   - `streaming` → `interrupted` nur beim ersten Laden (`restoreChat`); das Storage-Event nutzt
     `parseChat` ohne Umwandlung, ignoriert nicht geladene Schlüssel, `newValue === null` → leer.
   - `isLoading` nur aus dem lokalen Controller, nie aus dem Nachrichtenstatus; nicht gespeichert.
   - Fehler mitten im Stream: Teilantwort bleibt, Status `error`, Fehlertext in `errorMessage`.
     Gespeichert wird nur der Fehlertext; „Fehler:“ setzt die UI beim Rendern davor (Sprachwechsel).
   - Leere `interrupted`-Antwort zeigt nur den Hinweis, keine leere Blase.
   - `getSnapshot` liefert für fehlende Schlüssel die Modul-Konstante `EMPTY_CHAT`; Lazy-Laden ist
     idempotent (einmal lesen, Ergebnis in die Map, nie in `getSnapshot` schreiben); `subscribe`
     per `useCallback([key])`.
   - IDs per Zähler (`${Date.now()}-${n++}`) statt `crypto.randomUUID` (fehlt bei HTTP über LAN-IP).
   - `QuotaExceededError`: weiter kürzen (Hälfte der Nachrichten) und erneut schreiben, notfalls aufgeben.
8. **API-History paarweise**: `apiHistory` nimmt nur vollständige Paare (Frage + Antwort `done`),
   verwirft eine Frage samt fehlgeschlagener/unterbrochener Antwort, beginnt mit `user`, höchstens
   20 Nachrichten (User-Entscheidung 2026-11-01, bisher 8), Inhalte über 10.000 Zeichen werden samt Partner verworfen (Server würde sie still
   filtern, `route.ts:191`) — Gemini erwartet abwechselnde Rollen.
9. **Laufende Zusammenfassung** (User-Wunsch 2026-11-01): `StoredChat` bekommt `summary` und
   `summarizedUpTo` (ID der letzten zusammengefassten Nachricht). Sobald mindestens 8 vollständige
   Nachrichten (4 Paare) außerhalb des 20er-Fensters noch nicht zusammengefasst sind, ruft der
   Store nach einer fertigen Antwort im Hintergrund `POST /api/rulebook-chat/summary`
   (`{ previousSummary, messages }` → `{ summary }`, Gemini Flash, max. ~250 Wörter, Prompt in
   `system-prompt.ts`) auf. Fehler werden ignoriert (nächster Versuch nach der nächsten Antwort).
   Höchstens ein Zusammenfassungs-Request pro Chat gleichzeitig; Ergebnis nur übernehmen, wenn der
   Chat nicht inzwischen zurückgesetzt wurde. `send` schickt `summary` mit; der Server validiert
   (String, ≤ 4.000 Zeichen) und stellt sie als „Zusammenfassung des bisherigen Gesprächs“ vor
   die Regelbuch-Ausschnitte. Datenschutz unverändert (Chat-Inhalte gehen ohnehin an Google).
10. **Logout** löscht nichts (Schlüssel enthält die userId; auf geteilten Geräten sieht jeder nur
    seinen Verlauf).

## Current State

```
RulebookChat
  useState: messages · isLoading · streamingContent · selectedBooks · showFilter
  handleSend ──fetch──► Stream ──► setStreamingContent ──► setMessages
  Unmount ──► abortRef.abort() ──► alles weg
Einbindung: /chat → <RulebookChat/> · master-dashboard.tsx:522 → <RulebookChat/> (bedingt)
```

## Desired End State

```
chat-store.ts (Modul, lebt über Unmounts hinweg)
  chats: Map<"player:<uid>" | "gm:<uid>", ChatState>  ──persist──► localStorage
  send(key, text) ──fetch/stream──► update(key) ──► listeners
  reset(key) · setBooks(key)
        ▲ useSyncExternalStore
useRulebookChat(scope) ◄── RulebookChat scope="player" (/chat) | scope="gm" (master-dashboard)
```

Chat-Kopf und Verlauf (Mockup):

```
┌──────────────────────────────────────────────────────────────┐
│ (Sven) SvenBot                    [↺ Neuer Chat] Bücher filtern │
│        Regelwerk & App-Hilfe                                 │
├──────────────────────────────────────────────────────────────┤
│        Ältere Nachrichten wurden entfernt.                   │
│                         ┌──────────────────────────────┐     │
│                         │ Was ist mein ETW0?           │     │
│                         └──────────────────────────────┘     │
│ (S) ┌───────────────────────────────────────┐                │
│     │ Stufe 5 und das immer noch nicht …     │                │
│     │ ⚠ Antwort wurde unterbrochen.          │                │
│     └───────────────────────────────────────┘                │
├──────────────────────────────────────────────────────────────┤
│ [ Frag SvenBot zu AD&D oder der App… ]                [➤]    │
└──────────────────────────────────────────────────────────────┘

Rückfrage:  ┌ Neuer Chat? ─────────────────────────────────┐
            │ Der bisherige Verlauf wird gelöscht.         │
            │                 [Abbrechen]  [Neuer Chat]    │
            └──────────────────────────────────────────────┘
```

## Abstractions and Code Reuse

- `src/lib/rulebook-chat/`
  - `chat-history.ts` — neu: Typen `ChatMessage`, `StoredChat`; `appendMessage`, `apiHistory`,
    `restoreChat`, `MAX_STORED_MESSAGES = 200`, `API_HISTORY_LENGTH = 20`
  - `chat-store.ts` — neu: `getChat(key)`, `subscribeChat(key, listener)`, `sendMessage(key, text,
{ fetchImpl, errorLabel })`, `resetChat(key)`, `setSelectedBooks(key, books)`,
    `chatKey(scope, userId)`, `CHAT_STORAGE_PREFIX`; nur für Tests `__resetChatStoreForTests()`
  - Tests je Datei
- `src/components/rulebook-chat/`
  - `use-rulebook-chat.ts` — neu: Hook (`useSyncExternalStore`, Schlüssel aus Props)
  - `rulebook-chat.tsx` — State entfernt, Hook genutzt, Prop `scope`, „Neuer Chat“, Hinweise
  - `chat-message.tsx` — Prop `interrupted` → Hinweiszeile
  - Tests anpassen/erweitern
- `src/app/chat/page.tsx` — async, `requireAuth()`, `scope="player" userId={user.id}`
- `src/components/master/master-dashboard.tsx` — `scope="gm" userId={userId}`
- `src/app/settings/settings-client.tsx` — Kontolöschung entfernt `chaos-forge-svenbot-chat:*:<userId>`
- `src/app/datenschutz/page.tsx` — Abschnitt 6/7: lokaler Browser-Speicher für SvenBot-Verläufe
- `messages/*.json` (`rulebook`): `newChat`, `newChatConfirmTitle`, `newChatConfirmText`,
  `interrupted`, `truncated` (Abbrechen-Beschriftung kommt aus `confirm.cancel` des ConfirmDialog)
- `CLAUDE.md`, App-Doku im Prompt (`APP_HELP_CONTEXT`, Abschnitt SVENBOT: Verlauf bleibt bis „Neuer Chat“)

## Logging & Observability

Keine neuen Logs; Fehler der API landen wie bisher als Assistenten-Nachricht mit Status `error`.

## Implementation

### Phase 1: Dauerhafter Verlauf

Dependencies: None

**Tasks**:

- [x] TDD `chat-history.test.ts`:
  - `appendMessage` hängt an; ab 201 Nachrichten werden die ältesten entfernt und `truncated = true`
  - `apiHistory` liefert nur vollständige Paare (user + assistant `done`), beginnt mit `user`,
    max. 20; verwirft Frage samt `error`/`interrupted`/`streaming`-Antwort; verwirft Paare mit
    Inhalt > 10.000 Zeichen; Rollen wechseln immer ab
  - `parseChat`: gültige Daten unverändert (auch `streaming`); ungültiges JSON, falsche Version,
    fehlende Felder → leerer Chat; unbekannte Buch-Slugs bleiben (Server filtert)
  - `restoreChat` = `parseChat` + `streaming` → `interrupted`
- [x] `chat-history.ts` implementieren
- [x] `src/app/api/rulebook-chat/route.ts`: History-Grenze 8 → 20 als Konstante `API_HISTORY_LENGTH` aus `chat-history.ts` (Kommentar „max 10 exchanges“); Test in `chat-history.test.ts`, dass die Konstante 20 ist und der Server sie importiert (`route.ts` per `readFileSync` auf `API_HISTORY_LENGTH` prüfen)
- [x] TDD `chat-store.test.ts` (gemocktes `fetch` mit steuerbarem `ReadableStream`, Fake-Timer):
  - Senden hängt Frage + Streaming-Antwort an, Listener werden benachrichtigt, Snapshot-Objekt ändert sich
  - Antwort endet → Status `done`, sofort gespeichert unter `chaos-forge-svenbot-chat:player:u1`
  - während des Streamens höchstens 1 Speichervorgang pro Sekunde
  - Stream läuft weiter, auch wenn alle Listener abgemeldet sind (Unmount), und ist danach gespeichert
  - zweiter Store-Zugriff nach „Modul-Neustart“ (`__resetChatStoreForTests`) lädt aus localStorage;
    gespeicherte `streaming`-Nachricht erscheint als `interrupted`
  - API-Fehler → Assistenten-Nachricht mit Status `error`, `errorMessage` = Servertext
  - Fehler mitten im Stream (`controller.error`) → Teilantwort bleibt, Status `error`
  - Abbruch per Signal mit gemocktem Stream: kein spätes Anhängen, `reader.cancel()` aufgerufen
  - abgelöster Request (Generationswechsel) schreibt nichts mehr in die neue Map
  - schickt `history` aus `apiHistory` und `bookFilter` (leer → `undefined`)
  - getrennte Schlüssel `player:u1`, `gm:u1`, `player:u2` beeinflussen sich nicht
  - `setItem` wirft `QuotaExceededError` → kürzt und schreibt erneut; wirft immer → Chat funktioniert weiter
  - `storage`-Event eines anderen Tabs übernimmt den Verlauf, wenn hier gerade nicht gestreamt wird;
    dessen `streaming`-Nachricht bleibt `streaming` (nicht `interrupted`); `newValue === null` → leer;
    Event für nicht geladenen Schlüssel → ignoriert
  - Fake-Timer mit `await vi.advanceTimersByTimeAsync()`
  - zweites Senden während einer laufenden Antwort wird ignoriert (Eingabe ist ohnehin gesperrt)
- [x] `chat-store.ts` implementieren
- [x] `use-rulebook-chat.ts`: `useRulebookChat(scope, userId)` → `{ chat, isLoading, send, reset, setBooks }`;
      `getServerSnapshot` = `EMPTY_CHAT`
- [x] `chat-message.tsx` + Test: Prop `status`; `interrupted` zeigt „⚠ {interrupted}“ unter dem Text
      (leerer Inhalt → nur Hinweis); `error` zeigt „**{error}:** {errorMessage}“ (+ Teilantwort davor)
- [x] TDD `rulebook-chat.test.tsx` erweitern (`afterEach`: `__resetChatStoreForTests()`,
      `localStorage.clear()`; alle Renders mit `scope` + `userId`): gespeicherter Verlauf wird beim
      Mount angezeigt; Aushängen während des Streamens und erneutes Einhängen zeigt die fertige
      Antwort; Hinweis `truncated` oben; Willkommensbildschirm nur bei leerem Verlauf; Beispielfragen
      und Eingabe gesperrt, solange eine Antwort läuft; bestehende Tests bleiben grün
- [x] `rulebook-chat.tsx` umstellen: Prop `scope`, State/Abort/`handleSend` entfernen, Hook nutzen,
      `key={msg.id}`, Ladezeile solange `streaming` ohne Inhalt, Buchfilter aus dem Store
- [x] `src/app/chat/page.tsx` async + `requireAuth()` → `scope="player" userId={user.id}`;
      `master-dashboard.tsx:522` → `scope="gm" userId={userId}`
- [x] TDD `settings-client`-Hilfsfunktion `clearSvenBotChats(userId)` in `chat-store.ts` (entfernt
      beide Scopes, nur dieses Nutzers); Aufruf bei Kontolöschung vor dem Reload
- [x] `src/app/datenschutz/page.tsx` Abschnitt 6: „SvenBot-Verläufe werden nur lokal in deinem
      Browser gespeichert (localStorage), bis du ‚Neuer Chat‘ wählst; sie werden nicht auf unseren
      Servern abgelegt.“
- [x] `messages/*.json` `rulebook.interrupted` („Antwort wurde unterbrochen.“ / „The answer was
      interrupted.“), `rulebook.truncated` („Ältere Nachrichten wurden entfernt.“ / „Older messages
      were removed.“)
- [x] `CLAUDE.md`: Projektstruktur (`lib/rulebook-chat/chat-history.ts`, `chat-store.ts`),
      localStorage-Key in die Key-Liste, Verhalten (Stream läuft im Modul weiter), Hinweis „History nur
      paarweise mit wechselnden Rollen an die API“

**Automated Verification**:

- [x] `npx vitest run src/lib/rulebook-chat src/components/rulebook-chat` grün
- [x] `npm run verify` grün

**Manual Verification**:

- [ ] `/chat`: Frage stellen, zum Dashboard wechseln, zurück → Verlauf da; Neuladen → Verlauf da
- [ ] Während einer Antwort die Seite wechseln und zurückkommen → Antwort vollständig
- [ ] GM-Bereich: eigener Verlauf, bleibt beim Tab-Wechsel erhalten

### Phase 2: „Neuer Chat“

Dependencies: Phase 1

**Tasks**:

- [x] TDD `chat-store.test.ts`: `resetChat` bricht laufende Antwort ab (kein spätes Anhängen),
      leert Nachrichten und `truncated`, behält `selectedBooks`, speichert sofort
- [x] `resetChat` implementieren (AbortController pro Schlüssel)
- [x] TDD `rulebook-chat.test.tsx`: Button „Neuer Chat“ nur bei Verlauf; Klick öffnet Rückfrage;
      `confirm-cancel` behält Verlauf; `confirm-delete` (Beschriftung `newChat`) leert und zeigt
      Willkommensbildschirm; „Neuer Chat“ + sofort neue Frage → alte Antwort taucht nicht auf
- [x] Button im Kopf + `ConfirmDialog` (`confirmLabel={t("newChat")}`) in `rulebook-chat.tsx`
- [x] `messages/*.json` `rulebook.newChat` („Neuer Chat“/„New chat“), `newChatConfirmTitle`
      („Neuer Chat?“/„New chat?“), `newChatConfirmText` („Der bisherige Verlauf wird gelöscht.“/
      „The current conversation will be deleted.“)
- [x] `src/lib/rulebook-chat/system-prompt.ts` `APP_HELP_CONTEXT` (SVENBOT): „Der Verlauf bleibt
      gespeichert, bis du oben ‚Neuer Chat‘ wählst; Spieler- und GM-Chat sind getrennt.“ + Test
- [x] `CLAUDE.md`: „Neuer Chat“, Roadmap-Punkt 31 „SvenBot merkt sich den Chat“

**Automated Verification**:

- [x] `npx vitest run src/lib/rulebook-chat src/components/rulebook-chat` grün
- [x] `npm run verify` grün

**Manual Verification**:

- [ ] „Neuer Chat“ → Rückfrage → Verlauf leer, nach Neuladen weiterhin leer
- [ ] „Neuer Chat“ während einer laufenden Antwort → Antwort erscheint nicht nachträglich

### Phase 3: Laufende Zusammenfassung älterer Nachrichten

Dependencies: Phase 1 (Phase 2 nur für `resetChat`)

**Tasks**:

- [x] TDD `chat-history.test.ts`: `pendingForSummary(chat)` liefert vollständige Paare außerhalb
      des 20er-Fensters nach `summarizedUpTo`; erst ab 8 Nachrichten nicht leer; `applySummary(chat,
summary, upToId)` setzt beide Felder; `parseChat` übernimmt `summary`/`summarizedUpTo`
      (Default `""`/`null`)
- [x] `chat-history.ts` erweitern
- [x] TDD `src/lib/rulebook-chat/summary-request.test.ts`: `buildSummaryPrompt(previousSummary,
messages)` enthält vorherige Zusammenfassung + neue Nachrichten, kürzt Einzelnachrichten auf
      2.000 Zeichen; `SUMMARY_SYSTEM_PROMPT` verlangt Deutsch/Sprache der Fragen, ≤ 250 Wörter,
      Regeln/Werte/Charaktere, keine Erfindungen
- [x] `summary-request.ts` + `SUMMARY_SYSTEM_PROMPT` in `system-prompt.ts`
- [x] Route `src/app/api/rulebook-chat/summary/route.ts`: `getUser()` → 401, gemeinsames Rate-Limit
      mit dem Chat (Funktion aus `route.ts` in `src/lib/rulebook-chat/rate-limit.ts` auslagern),
      Validierung (max. 40 Nachrichten, Rollen, Länge), `generateText` mit `gemini-flash-latest`,
      `maxOutputTokens: 600` → `{ summary }`
- [x] TDD `chat-store.test.ts`: nach fertiger Antwort mit ≥ 8 ausstehenden Nachrichten genau ein
      Aufruf von `/api/rulebook-chat/summary`; Ergebnis gespeichert; Fehler → Chat unverändert;
      `resetChat` während laufender Zusammenfassung → Ergebnis verworfen; `send` schickt `summary`
- [x] `chat-store.ts` erweitern
- [x] `src/app/api/rulebook-chat/route.ts`: `summary` validieren (String ≤ 4.000) und als Block
      „Zusammenfassung des bisherigen Gesprächs (ältere Nachrichten):“ in den Prompt
- [x] `CLAUDE.md`: Zusammenfassung, Endpunkt

**Automated Verification**:

- [x] `npx vitest run src/lib/rulebook-chat src/components/rulebook-chat` grün
- [x] `npm run verify` grün

**Manual Verification**:

- [ ] Nach mehr als 14 Fragen bezieht sich SvenBot auf eine der ersten Fragen, wenn man danach fragt

## Implementation Notes

- 2026-11-01: User-Entscheidungen: Speicher im Browser, getrennte Verläufe Spieler/GM, laufende
  Antwort läuft weiter, „Neuer Chat“ mit Rückfrage, max. 200 Nachrichten, unterbrochene Antworten
  bleiben mit Hinweis stehen.
- 2026-11-01: Review eingearbeitet (Abort-Erkennung, abgelöste Requests, Tab-Sync, paarweise
  API-History, Quota, userId per Prop, Kontolöschung, Datenschutz).
- 2026-11-01: `ChatMessage.isStreaming` entfernt (ersetzt durch `status`); Markdown wird in Tests nachgeladen (`findByText`). CLAUDE.md wird am Ende für alle Phasen gemeinsam gepflegt.
- 2026-11-01: Zusammenfassung mit `maxOutputTokens: 4096` statt 600 (Gemini-3-Thinking zählt mit); Länge über den Prompt begrenzt.
- 2026-11-01: User: zusätzlich laufende Zusammenfassung älterer Nachrichten (unsichtbar), 10 Paare wörtlich → Phase 3.
- 2026-11-01: User: Kontext von 8 auf 20 Nachrichten (10 Paare) erhöhen; Regelbuch-Suche bleibt bei der aktuellen Frage.

## References

- `docs/agents/research/2026-11-01-persistent-svenbot-chat.md`
- `src/lib/view-mode.ts`, `src/lib/hooks/use-view-mode.ts` (Store-Muster)
- `src/components/confirm-dialog.tsx`
