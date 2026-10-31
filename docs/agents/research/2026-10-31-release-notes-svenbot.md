---
date: 2026-10-31T21:24:44+00:00
git_commit: 46083baba88b96f4eca5a3f52bce2be86452e8b3
branch: chore/shadcn-dev-dependency
topic: "Release Notes (einmal pro Version) + Chatbot als SvenBot (Avatar, Persona) — Ist-Zustand"
tags: [research, codebase, rulebook-chat, tutorial-overlay, profiles, settings, i18n, dialog]
status: complete
---

# Research: Release Notes + SvenBot — Ist-Zustand

## Research Question

Welche bestehenden Bausteine betreffen (a) Release Notes, die pro Version einmal erscheinen
(`profiles`, Overlays nach Login, Einstellungen), und (b) den Rulebook-Chat, der künftig als
„SvenBot“ (Spielleiter Sven, Avatar aus `master-pin-portrait.webp`, fiese Persona) auftritt?

## Summary

- **Chat:** Ein Endpoint (`/api/rulebook-chat`) mit Persona „Gelehrter aus den Reichen“ im
  `SYSTEM_PROMPT`. Eine Client-Komponente `RulebookChat` wird an zwei Stellen genutzt:
  `/chat` (Spieler) und im Master-Dashboard (Tab `chat`). Assistent-Nachrichten rendern
  **ohne Avatar**; Header und Leerzustand nutzen das Icon `BookOpen`. Keine Tests für Chat/Prompt.
- **Overlays nach Login:** Es gibt keinen automatisch öffnenden shadcn-Dialog. Einziges
  Auto-Open-Muster ist `TutorialOverlay` (pro Seite eingebunden, prüft localStorage +
  `profiles.skip_tutorials`, öffnet nach 600 ms). Global nach Login steht nur das Root-Layout zur
  Verfügung; dort liefert `ApprovalProvider` die `userId` und lädt bereits die eigene Profilzeile.
- **profiles:** Spalten `id, display_name, avatar_url, email, created_at, updated_at,
last_login_at, is_approved, skip_tutorials`. RLS: SELECT für alle Authentifizierten, UPDATE nur
  eigene Zeile. Kein `enforce_approval` auf `profiles`. Höchste Migration: `00231`.
- **Einstellungen:** Gestapelte `GlassCard`-Sektionen in `settings-client.tsx`
  (Profil → Darstellung → Spieltermine → Tutorials → Danger Zone).
- **Versionen:** Keine Versions-/Changelog-Quelle außer `package.json` `"version": "0.1.0"`.

```
src/
  app/
    layout.tsx                         # Root: Intl → Theme → Approval → Tooltip; Header, Banner, Toaster
    api/rulebook-chat/route.ts         # APP_HELP_CONTEXT (7–59), SYSTEM_PROMPT (61–90), POST
    chat/{page,layout}.tsx             # /chat → <RulebookChat/>, requireAuth + Sidebar/Nav
    settings/{page,settings-client}.tsx# Sektionen als GlassCards
    master/page.tsx                    # requireAuth + GM-Session, sonst PIN-Gate
    datenschutz/page.tsx               # 52–55 Regelbuch-Chat → Google/Voyage (ohne Persona)
  components/
    rulebook-chat/{rulebook-chat,chat-message,chat-input,book-filter}.tsx
    master/{master-dashboard,master-sidebar,master-bottom-nav,master-pin-gate}.tsx
    tutorial/tutorial-overlay.tsx      # einziges Auto-Open-Overlay
    approval-provider.tsx              # userId + profiles.is_approved + Realtime
    app-header.tsx                     # IMMERSIVE_ROUTES ["/login","/master"]
    ui/dialog.tsx                      # shadcn/Base-UI Dialog
  lib/tutorial/steps.ts                # localStorage-Key, dismiss/reset
public/images/gm-panels/master-pin-portrait.webp  # Artwork des Spielleiters (704×1524)
supabase/migrations/00001,00042,00209,00216–00219 # profiles
messages/{de,en}.json                  # Namespace "rulebook" ab Z. 1368, nav.rulebook
```

```
Root-Layout
 └─ ApprovalProvider (userId, is_approved; Realtime auf profiles)
     ├─ AppHeader (aus auf /login, /master)
     ├─ ApprovalBanner (aus auf /login, /master/*)
     └─ <main> → Bereichs-Layouts (requireAuth + Sidebar/Nav)
                  ├─ /dashboard  → TutorialOverlay page="dashboard"
                  ├─ /chat       → RulebookChat ─┐
                  └─ /master     → MasterDashboard tab "chat" → RulebookChat (dynamic)
                                                 └─ fetch /api/rulebook-chat (Stream)
```

## Detailed Findings

### Rulebook-Chat — API

- `src/app/api/rulebook-chat/route.ts:7-59` `APP_HELP_CONTEXT`: App-Doku als Freitext
  (u. a. Z. 49 GM-Tab „Rulebook Chat“, Z. 52–54 Chat unter „Sidebar → More → Chat“).
- `:61-90` `SYSTEM_PROMPT`: Persona „Gelehrter aus den Reichen … Chronist“ (Z. 61), Abschnitt
  „DEINE STIMME“ (Kürze, max. ein Satz Ausschmückung, Werte wörtlich), Themenbegrenzung,
  MODUS A (nur Regel-Ausschnitte, Quelle **(Buchname)**), MODUS B (nur App-Doku, Fallback
  „frag Christoph direkt“), gemeinsame Regeln (metrisch, Markdown, Sprache der Frage).
- `:92-105` In-Memory-Rate-Limit 20/min. `:107-319` POST: Auth → Rate-Limit → Key-Check →
  Voyage-Embedding → RPC `match_rulebook_chunks` → optionale Monster-Suche → Kontext →
  History (max. 8) → `streamText` (Gemini) → `ReadableStream`.
- Keine Unterscheidung zwischen Spieler- und GM-Aufruf; derselbe Prompt für beide.

### Rulebook-Chat — UI

- `src/components/rulebook-chat/chat-message.tsx:14-44`: Flex-Zeile `gap-3`,
  `justify-start` für Assistent; einzige Kind-Komponente ist die Bubble
  (`glass border border-border/50`, Markdown via `MarkdownRenderer` + `remarkBreaks`,
  `convertImperialText`). Streaming-Cursor Z. 40. Kein Avatar.
- `src/components/rulebook-chat/rulebook-chat.tsx`: Header mit `BookOpen` + `<h1 font-cinzel>`
  `t("title")` und Filter-Button; Container `glass glow-neutral`; Nachrichtenliste rendert
  `ChatMessage` für History und Streaming; Ladezeile mit `Sparkles` + `t("thinking")`;
  `WelcomeScreen` mit großem `BookOpen`-Icon, `t("welcome")` und vier Beispiel-Buttons.
- `src/app/chat/page.tsx` rendert nur `<RulebookChat />`; `src/app/chat/layout.tsx` Standard-Shell.
- `src/components/master/master-dashboard.tsx:47-50` lädt `RulebookChat` per `dynamic()`,
  `:386-395` Vollflächen-Container + GM-Header ausgeblendet, `:522` Render.
  `master-sidebar.tsx:75-92` und `master-bottom-nav.tsx:31,51` zeigen Tab mit `BookOpen` und
  `nav.rulebook`.
- `src/lib/navigation.ts:39-45`: Eintrag `/chat`, Icon `BookOpen`, `labelKey: "rulebook"`.

### Persona-/Chat-Erwähnungen in Texten

- `messages/de.json` / `en.json` Namespace `rulebook` (ab Z. 1368): `title` „Regelwerk &
  App-Hilfe“, `thinking` „Der Orakel-Krake denkt nach...“, `welcome` „Grüße, Abenteurer! …“,
  `example1–4`, `error`, `filterBooks`, `allBooks`, (`noAnswer`, `source` ungenutzt).
- `nav.rulebook` = „Chat“ (Z. 78). Landing `featureChatTitle/Desc` („Regelbuch-KI“),
  Tutorial-Texte `tutorial.*.chat*` sprechen neutral von „dem Chat“.
- `src/app/datenschutz/page.tsx:52-55`: „Regelbuch-Chat“ → Google (Gemini), Voyage AI.
- `CLAUDE.md:54` („Realms-Persona“), `:425` („Der Chat spricht als Gelehrter aus den Reichen …“);
  `README.md:50,60`, `Roadmap.md:126,164` nennen „Rulebook Chat“.
- Nicht Chat-bezogen: `summarize-session/route.ts:61` („erfahrener Chronist“), Kit „Gelehrter“
  in `src/lib/rules/kits.ts`.

### Bild-Asset

- `public/images/gm-panels/master-pin-portrait.webp` (704×1524) wird vom PIN-Gate genutzt
  (`master-pin-gate.tsx:100-101`), daneben `master-pin-landscape.webp`. Ausschnitt
  `extract({left:150, top:250, width:420, height:420})` zeigt Kopf mit Brille und Grinsen
  (vom User bestätigt). `sharp` ist in `node_modules` vorhanden.

### Overlays nach Login / Tutorial

- `src/components/tutorial/tutorial-overlay.tsx:163-212`: Auto-Open-Logik — localStorage
  (`isTutorialDismissed`), dann `getClaims()` + `profiles.skip_tutorials`; `true` → lokal als
  erledigt cachen; sonst `setTimeout(…, 600)`. Eigenes `fixed inset-0 z-[100]` Overlay
  (Allowlist in `src/test/modal-portal-guard.test.ts:21-26`).
- `src/lib/tutorial/steps.ts:105-134`: Key `chaos-forge-tutorial-dismissed`, `dismissTutorial`,
  `resetTutorials` (nur localStorage).
- Eingebunden pro Seite: `dashboard/page.tsx:720`, `party/page.tsx:123`,
  `sessions/page.tsx:224`, `characters/[id]/manage/page.tsx:125`.

### Root-Layout & ApprovalProvider

- `src/app/layout.tsx`: `NextIntlClientProvider` → `ThemeProvider` → `ApprovalProvider` →
  `TooltipProvider` → `SkipToMain`, `AppHeader`, `ApprovalBanner`, `ApprovalErrorToast`,
  `<main>`, `AppFooter`; `Toaster` außerhalb des ApprovalProviders.
- `src/components/approval-provider.tsx:24-99`: `getClaims()` → `userId`; lädt
  `profiles.is_approved, email` der eigenen Zeile; Realtime-Channel
  `approval-${userId}-${instanceId}` auf UPDATE. `useApproval()` → `{userId, isApproved, isLoading}`;
  außerhalb: permissiv mit `userId: null`.
- `app-header.tsx:7` `IMMERSIVE_ROUTES = ["/login","/master"]`; `approval-banner.tsx:8-21`
  analog ausgeblendet.
- Öffentliche Seiten ohne `requireAuth`: `/`, `/login`, `/impressum`, `/datenschutz`,
  `/share/sessions/[id]`. Druckansicht `characters/[id]/print` ist authentifiziert; Druck-CSS
  `globals.css:655` blendet header/footer/nav aus; Embed-Modus `globals.css:598`.

### profiles & Migrationen

- `00001_initial_schema.sql:2-8` Tabelle; `:24-30` RLS select/update eigene Zeile;
  `:50-61` `handle_new_user` + Trigger.
- `00042`: `email` + Policy SELECT für alle Authentifizierten.
- `00209`: `last_login_at` + Trigger `on_auth_session_created`.
- `00216`: `is_approved` (Default false, Backfill true); neueste `handle_new_user` (Z. 52–80).
- `00217`: `enforce_approval`-Trigger — `profiles` ausgenommen.
- `00218`: `skip_tutorials` (Default false, Backfill true). `00219`: Heilung fehlender Profile.
- `src/app/api/notify-new-user/route.ts:33-41` legt ggf. Profil mit `skip_tutorials: false` an.
- `src/lib/supabase/types.ts` enthält `skip_tutorials` nicht.
- Höchste Nummer `00231_sprocket_overclock_crafting.sql`; Schema `NNNNN_snake_case.sql`.

### Einstellungen

- `src/app/settings/page.tsx:14-45`: lädt Profil + Spieltermine, übergibt `gameDatesSlot`.
- `src/app/settings/settings-client.tsx`: Sektionen als `GlassCard hover={false}` mit
  `data-testid="settings-section-*"`, Kopf = Icon + `<h2 font-heading text-lg text-primary>`.
  Tutorials-Sektion Z. 327–340 (Hinweis + Outline-Button → `resetTutorials()` + Toast).
- `src/components/settings/game-dates-panel.tsx` als Beispiel einer eigenständigen Panel-Komponente mit Tests.

### Dialoge

- `src/components/ui/dialog.tsx`: Base-UI-basierter shadcn-Dialog (`Dialog`, `DialogContent`,
  `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, …), Portal an `body` (#182).
- Gesteuerte Dialoge mit `open`/`onOpenChange`: `level-up-dialog.tsx:177`,
  `effect-dialog.tsx:134`, `skill-check-dialog.tsx:60` u. a.; alle klickgesteuert.

### Versionen

- `package.json:3` `"version": "0.1.0"`; kein CHANGELOG, keine `*VERSION`-Env-Variablen.
  Roadmap-Einträge in `CLAUDE.md` sind nummeriert (1–28).

## Code References

- `src/app/api/rulebook-chat/route.ts:61-90` — SYSTEM_PROMPT mit Persona
- `src/components/rulebook-chat/chat-message.tsx:20-43` — Nachrichtenzeile ohne Avatar
- `src/components/rulebook-chat/rulebook-chat.tsx` (Header, WelcomeScreen, Ladezeile)
- `src/components/master/master-dashboard.tsx:47-50,386-395,522` — GM-Einbindung
- `src/components/tutorial/tutorial-overlay.tsx:163-212` — Auto-Open + skip_tutorials
- `src/components/approval-provider.tsx:24-99` — userId + Profil-Query + Realtime
- `src/app/layout.tsx` — globale Provider/Komponenten
- `src/app/settings/settings-client.tsx:327-340` — Tutorials-Sektion als Muster
- `supabase/migrations/00218_skip_tutorials_existing_users.sql` — Spalten-+Backfill-Muster
- `messages/de.json:1368ff` — Namespace `rulebook`

## Architecture Documentation

- Auto-Overlays werden pro Seite eingebunden und prüfen zuerst localStorage, dann die DB.
- Profil-Flags folgen dem Muster „Spalte mit Default + Backfill für Bestandsnutzer“ (00216, 00218).
- Globaler Nutzerkontext im Client kommt aus `ApprovalProvider` (eine Query, ein Channel).
- Chat ist eine einzige Komponente + ein Endpoint für Spieler und GM.
- Eigene `fixed inset-0`-Overlays brauchen `ModalPortal` oder einen Allowlist-Eintrag
  (`modal-portal-guard.test.ts`); shadcn-Dialoge portalen selbst.

## Open Questions

- `src/lib/supabase/types.ts` führt `skip_tutorials` nicht — ob die Typen generiert oder
  handgepflegt sind, wurde nicht geprüft.
- Ob der Master-Bereich (`/master`) als Ort für Release Notes zählt, ist Planungsfrage.
