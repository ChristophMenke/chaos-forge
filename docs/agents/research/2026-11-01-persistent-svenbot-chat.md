---
date: 2026-11-01T14:13:48+00:00
git_commit: ddcee63bff6a047fb2a7c3fb71516804b256134e
branch: feature/persistent-svenbot-chat
topic: "SvenBot-Chatverlauf dauerhaft speichern — Ist-Zustand"
tags: [research, codebase, rulebook-chat, svenbot, local-storage, master-dashboard]
status: complete
---

# Research: SvenBot-Chatverlauf dauerhaft speichern — Ist-Zustand

## Research Question

Wie verwaltet der SvenBot-Chat heute Verlauf und Streaming, wann wird er ausgehängt, welche
Muster für modulweiten Client-State und localStorage gibt es, woher kommt die User-ID und was
passiert beim Logout? (Grundlage für: Verlauf im Browser pro Nutzer und Bereich speichern,
laufende Antwort beim Verlassen weiterlaufen lassen, „Neuer Chat“.)

## Summary

- Der gesamte Chat-Zustand (`messages`, `isLoading`, `streamingContent`, `selectedBooks`,
  `showFilter`) liegt in `useState` der Komponente `RulebookChat`. Beim Aushängen bricht ein
  Effect den laufenden Request per `AbortController` ab; der Verlauf geht verloren.
- `/chat` rendert `RulebookChat` als Seite; ein Seitenwechsel hängt sie aus. Im Master-Dashboard
  wird der Chat-Tab bedingt gerendert (`activeTab === "chat" &&`) und beim Tab-Wechsel ebenfalls
  ausgehängt.
- Es gibt einen etablierten Store-Stil: Modul-State + `Set` von Listenern + `useSyncExternalStore`
  (`view-mode.ts`/`use-view-mode.ts`, `theme-provider.tsx`, `locale-toggle.tsx`), plus Modul-Caches
  in `src/lib/catalog/`. localStorage-Keys tragen das Präfix `chaos-forge-`; pro Nutzer wird ein
  `:${userId}`-Suffix verwendet (`release-notes`).
- Die User-ID ist im Client über `useApproval().userId` verfügbar (Root-Layout-Provider).
  `RulebookChat` nutzt das bisher nicht.
- Logout (`signOut()` + `router.push("/login")`) leert weder localStorage noch Modul-Caches.
  Eine Ausnahme ist die Kontolöschung mit vollem Reload.

```
src/
  components/rulebook-chat/
    rulebook-chat.tsx        # State, handleSend (fetch + Stream), Abort bei Unmount, UI
    chat-message.tsx         # eine Nachricht (Avatar bei Assistent)
    chat-input.tsx           # Eingabe, Enter sendet
    book-filter.tsx          # ALL_SLUGS, Filter-UI
    *.test.tsx               # chat-message, rulebook-chat
  app/chat/page.tsx          # <RulebookChat />
  components/master/master-dashboard.tsx  # Tab "chat" bedingt gerendert (:522)
  lib/view-mode.ts + lib/hooks/use-view-mode.ts   # Store-Muster mit useSyncExternalStore
  components/approval-provider.tsx        # useApproval() → userId
  app/api/rulebook-chat/route.ts          # nimmt message, history (max 8), bookFilter
```

```
heute:
 RulebookChat (mount) ── useState(messages=[]) ──► handleSend ──fetch/stream──► setStreamingContent
        │                                                              │
        └── unmount ──► abortRef.abort() ──► Stream endet, State weg ◄─┘
```

## Detailed Findings

### RulebookChat (`src/components/rulebook-chat/rulebook-chat.tsx`)

- State `:17-23`: `messages: {role, content}[]`, `isLoading`, `streamingContent`,
  `selectedBooks` (leer = alle Bücher), `showFilter`, `scrollRef`, `abortRef`.
- `:26-30` Effect-Cleanup bricht beim Unmount ab.
- `:33-37` Auto-Scroll bei `messages`/`streamingContent`.
- `:39-56` Buchfilter-Logik (`ALL_SLUGS` aus `book-filter.tsx`).
- `:58-125` `handleSend`: hängt User-Nachricht an, bricht vorigen Request ab, schickt
  `history = messages.slice(-8)` und `bookFilter` an `/api/rulebook-chat`, liest den Stream,
  hängt am Ende die Assistenten-Nachricht an; Fehler (außer `AbortError`) als
  Assistenten-Nachricht `**{error}:** …`; `finally` → `isLoading=false`.
- `:127` `isEmpty` steuert den `WelcomeScreen` (`:195-227`) mit vier Beispielfragen.
- Kopf `:132-148` (Avatar, Name, Untertitel, Button „Bücher filtern“); kein Reset-Button.
- Nachrichten werden mit `key={i}` gerendert (`:169-171`).

### Einbindung

- `src/app/chat/page.tsx` → `<RulebookChat />`; Layout mit Sidebar/Nav, `requireAuth`.
- `src/components/master/master-dashboard.tsx`: Panels per `dynamic()` (`:27-52`, Chat `:47-50`),
  Tab-State `:119`, alle Panels bedingt gerendert (u. a. Chat `:522`), Chat-Container
  `fixed inset-0` (`:387`), GM-Header bei Chat ausgeblendet (`:395`).

### Client-State-Muster

- `src/lib/view-mode.ts:39-72`: `getViewMode()` (localStorage, `try/catch`), `listeners` als
  `Set`, `setViewMode()` schreibt + benachrichtigt, `subscribeViewMode()` inkl.
  `storage`-Event für andere Tabs. `src/lib/hooks/use-view-mode.ts` nutzt
  `useSyncExternalStore(subscribe, get, serverSnapshot)`.
- Weitere `useSyncExternalStore`: `theme-provider.tsx:44`, `locale-toggle.tsx:27`,
  `modal-portal.tsx:17`.
- Modul-Caches: `src/lib/catalog/equipment-catalog.ts:11-13,49`, `spell-catalog.ts:10,15,64-65`.
- Undo-Historie: React-State im `UndoProvider` (`undo-provider.tsx:30-38`), pro Charakter geschlüsselt.
- Kein React-Compiler-Setup gefunden; `eslint-plugin-react-hooks` 7 ist aktiv
  (Kommentare zu Ref-Zuweisungen in Effects, z. B. `undo-context.ts:44-53`).

### localStorage-Keys (vorhanden)

`chaos-forge-theme`, `chaos-forge-view-mode`, `chaos-forge-print-<characterId>`,
`chaos-forge-tutorial-dismissed`, `chaos-forge-release-seen:<userId>`,
`chaos-forge-backup-offered`. Muster pro Nutzer: `src/lib/release-notes/index.ts:45-61`.

### User-ID und Logout

- `useApproval()` (`src/components/approval-provider.tsx:101`) → `{ userId, isApproved, isLoading }`;
  `userId` ist `null`, bis `getClaims()` aufgelöst ist.
- Logout: `app-sidebar.tsx:28-29`, `master-sidebar.tsx:27-28`, `logout-button.tsx:14-15`
  (`signOut()` → `router.push("/login")`). Kein Leeren von Storage/Caches.
  `settings-client.tsx:164-168` (Kontolöschung) nutzt `window.location.href = "/"`.

### API

- `/api/rulebook-chat` erwartet `{ message, history, bookFilter }`; History wird serverseitig
  auf 8 Nachrichten bereinigt (`route.ts`, Abschnitt History).

### Tests

- `src/components/rulebook-chat/rulebook-chat.test.tsx`: Kopf, Willkommensbildschirm, Ladezeile
  (fetch per `vi.stubGlobal` als nie auflösendes Promise).
- `chat-message.test.tsx`: Avatar-Darstellung.

### i18n

- Namespace `rulebook` (`messages/de.json`/`en.json`): `title`, `botName`, `placeholder`, `send`,
  `thinking`, `welcome`, `exampleQuestions`, `example1-4`, `noAnswer`, `error`, `filterBooks`,
  `allBooks`, `source`. Kein Key für „Neuer Chat“.

## Code References

- `src/components/rulebook-chat/rulebook-chat.tsx:17-30` — State und Abort beim Unmount
- `src/components/rulebook-chat/rulebook-chat.tsx:58-125` — `handleSend` mit Stream
- `src/components/master/master-dashboard.tsx:522` — Chat-Tab bedingt gerendert
- `src/lib/view-mode.ts:48-72` — Listener-Store mit `storage`-Event
- `src/lib/hooks/use-view-mode.ts:8` — `useSyncExternalStore`
- `src/lib/release-notes/index.ts:45-61` — localStorage-Key pro Nutzer
- `src/components/approval-provider.tsx:101` — `useApproval()`
- `src/components/app-sidebar.tsx:28` — Logout ohne Storage-Bereinigung

## Architecture Documentation

- Kurzlebiger UI-State in Komponenten; geräteweite Einstellungen als Modul-Store mit
  localStorage + Listenern + `useSyncExternalStore`.
- localStorage-Zugriffe sind durchgehend in `try/catch` gekapselt (privater Modus).
- Panels im GM-Bereich und Seiten werden beim Wechsel ausgehängt, nicht versteckt.

## Open Questions

- Keine; Verhalten bei Logout/geteilten Geräten ist eine Planungsentscheidung.
