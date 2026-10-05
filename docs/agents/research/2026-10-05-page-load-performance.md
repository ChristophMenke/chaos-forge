---
date: 2026-10-05T07:23:46+00:00
git_commit: 41d55189457c00e0cf25e6e9b2fe374044a8480a
branch: main
topic: "Warum dauert der Seitenaufbau lange? — Server-Rendering, Bundle, Bilder, Caching, Supabase"
tags: [research, performance, caching, rendering, supabase, bundle, i18n]
status: complete
---

# Research: Seitenaufbau-Performance von Chaos Forge

> **Status:** Umgesetzt über `docs/agents/plans/2026-10-05-page-load-performance.md` (Branch `perf/page-load-optimization`).

## Research Question

Warum dauert der Aufbau der Seiten lange? Untersucht werden Server-Rendering (Server Components, DB-Waterfalls, Middleware/Auth pro Request, dynamisches Rendering), Client-Bundle, Bilder, Fonts, Caching (Browser, Next.js Data Cache, Static Generation, Prefetching, Streaming, Service Worker), Supabase-Query-Effizienz und Realtime.

Vorgänger: `2026-04-03-performance-audit.md` und `2026-04-09-ux-ui-performance-audit.md`. Viele der damaligen Funde sind umgesetzt (z. B. `Promise.all` auf den Charakterseiten, FK-Indizes in `00158`, `react-markdown` per `dynamic()`). Dieses Dokument beschreibt den Stand von Commit `41d5518`.

## Summary

Ein Seitenaufruf durchläuft heute diese Kette, und jedes Glied ist ein eigener Netzwerk-Roundtrip:

```
Browser ──► Vercel fra1
            │ Middleware: supabase.auth.getUser()          ← Roundtrip 1 (Supabase Auth)
            │ Root-Layout: getLocale + getMessages (alle ~85 KB i18n)
            │ Segment-Layout: requireAuth() → getUser()    ← Roundtrip 2
            │                 profiles.avatar_url          ← Roundtrip 3
            │ Page: requireAuth() → getUser()              ← Roundtrip 4
            │       Query-Welle 1..n (Promise.all je Welle) ← Roundtrip 5..(5+n)
            ▼
          HTML + RSC-Payload (~100 KB, davon ~85 KB Übersetzungen)
            │
Browser ──► JS laden (156–285 KB gzip je Route) → Hydration
            │ ApprovalBanner: getUser() + profiles + Realtime-Channel
            │ NotificationBell: notifications + Realtime-Channel
            │ ApprovalGate / TutorialOverlay: weitere getUser() + profiles
            │ Tab-Komponenten: Katalog-Loads (weapons/armor/items/spells)
```

Messwerte (2026-10-05, Live-Seite):

| Messung                                        | Wert                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| Vercel-Region / Supabase-Region                | `fra1` / `eu-central-1` (gleiche Stadt)                              |
| TTFB `/login`, `/` warm                        | 0,10–0,15 s                                                          |
| TTFB erster Aufruf (Kaltstart)                 | 1,8–1,9 s                                                            |
| `Cache-Control` aller HTML-Antworten           | `private, no-cache, no-store, max-age=0, must-revalidate`            |
| `Cache-Control` `/_next/static/*`              | `public,max-age=31536000,immutable`                                  |
| `Cache-Control` `/images/*` und `/_next/image` | `public, max-age=0, must-revalidate`                                 |
| HTML `/login`                                  | 109 KB, davon ~100 KB RSC-Payload; alle 38 i18n-Namespaces enthalten |
| Build: Rendering-Modus                         | alle 47 Routen `ƒ (Dynamic)`, auch `/impressum`, `/datenschutz`, `/` |
| Supabase-Roundtrip (lokal gemessen, inkl. TLS) | Auth 65–190 ms, REST 100–720 ms (erster Aufruf)                      |
| JWT-Signatur                                   | ES256 (asymmetrisch, JWKS öffentlich), Key-Format `sb_publishable_`  |

Client-JS pro Route (gzip, aus `page_client-reference-manifest.js` berechnet):

| Route                                                            | gzip       | raw         |
| ---------------------------------------------------------------- | ---------- | ----------- |
| `/characters/[id]/play`                                          | 285 KB     | 1016 KB     |
| `/characters/[id]/manage`                                        | 281 KB     | 1001 KB     |
| `/master`                                                        | 275 KB     | 1022 KB     |
| `/characters/[id]/print`, `/characters/new/wizard`               | 247–249 KB | ~880 KB     |
| `/party`, `/settings`, `/sessions/[id]`, `/characters/[id]/epic` | 192–196 KB | ~650 KB     |
| `/dashboard`, `/characters`, `/sessions`                         | 167–181 KB | ~570–610 KB |
| Basis (`/`, `/login`, `/impressum`)                              | 156–158 KB | ~530 KB     |

### Schlüsseldateien

```
src/
  middleware.ts                      # matcher: alle Pages, RSC-Prefetches und /api/*
  lib/supabase/
    middleware.ts                    # updateSession → auth.getUser() (Ergebnis verworfen)
    auth.ts                          # requireAuth / getOptionalUser → je ein getUser()
    server.ts                        # createClient() → cookies()
    nav-context.ts                   # profiles.avatar_url pro Layout-Render
    priest-spells.ts                 # spells-Abfrage für Priester auf play/print
  i18n/request.ts                    # Cookie NEXT_LOCALE → import(messages/<locale>.json)
  app/
    layout.tsx                       # NextIntlClientProvider messages={alle}
    {dashboard,characters,party,sessions,settings,chat}/layout.tsx  # requireAuth + nav-context
    dashboard/page.tsx               # 3 Query-Wellen, ~20 Queries, RealtimeRefresh
    sessions/[id]/page.tsx           # ~10 Queries strikt sequenziell
    master/page.tsx                  # 14 Voll-Tabellen-Queries (Service-Role)
    characters/[id]/{play,manage,print}/page.tsx  # requireAuth → character → Promise.all(8–12)
  components/
    approval-banner.tsx              # Root-Layout: getUser + profiles + Realtime
    notifications/notification-bell.tsx  # 2× gemountet (Sidebar + Nav)
    tutorial/tutorial-overlay.tsx    # getUser + profiles.skip_tutorials
    character-sheet/tab-equipment.tsx    # Katalog-Loads bei jedem Tab-Mount
    character-sheet/tab-spells.tsx       # spells * limit 5000 (Priester: beim Mount)
    master/master-dashboard.tsx      # statischer Import aller 6 Panels, Magic-Items doppelt
    play-mode/play-mode.tsx          # statischer Import aller 8 Panels
public/                              # 4,7 MB, Artwork als WebP
```

## Detailed Findings

### 1. Middleware und Auth pro Request

- `src/middleware.ts:16`: Der Matcher schließt nur `_next/static`, `_next/image`, `favicon.ico` und Bilddateien aus. Er läuft also für jede Seite, jeden RSC-/Prefetch-Request und jede `/api/*`-Route.
- `src/lib/supabase/middleware.ts:30`: `await supabase.auth.getUser()` ist ein HTTP-Call an Supabase Auth. Das Ergebnis wird verworfen; der Aufruf dient nur dem Token-Refresh.
- `src/lib/supabase/auth.ts:31-34` und `52-56`: `requireAuth()` und `getOptionalUser()` erzeugen jeweils einen neuen Client und rufen `getUser()` auf. Es gibt keine Deduplizierung über React `cache()`.
- **Pro Seitenaufruf** gibt es serverseitig 3 `getUser()`-Calls (Middleware, Segment-Layout, Page), auf `/` und `/master` sind es 2. Sie laufen sequenziell, weil Layout und Page jeweils zuerst auf Auth warten.
- **Nach der Hydration** im Browser folgen weitere `getUser()`-Calls: `approval-banner.tsx:20` (immer), `approval-gate.tsx:32` (je Gate-Instanz) und `tutorial-overlay.tsx:188` (wenn nicht in localStorage dismissed).
- `getClaims()` oder `getSession()` werden nirgends verwendet. Das Projekt signiert JWTs mit ES256, die JWKS ist unter `/auth/v1/.well-known/jwks.json` öffentlich abrufbar.

### 2. Root-Layout und i18n

- `src/app/layout.tsx:71-72`: `await getLocale()`, danach `await getMessages()`.
- `src/i18n/request.ts:5`: `cookies()` macht jede Route dynamisch.
- `src/app/layout.tsx:87`: `<NextIntlClientProvider messages={messages}>` bekommt die komplette Locale-Datei: `de.json` mit 84.508 Bytes und 2.024 Zeilen, `en.json` mit 78.880 Bytes. Gemessen sind alle 38 Namespaces (`master`, `wizard`, `playMode`, …) im HTML von `/login` enthalten.
- Da jede Navigation dynamisch ist, wird der Messages-Block bei jedem Full-Page-Load mitgeliefert. Bei Client-Navigationen bleibt er erhalten, weil das Root-Layout nicht neu rendert.
- `AppFooter` (`src/components/app-footer.tsx:5`) ist eine async Server Component mit `getTranslations("footer")`.

### 3. Segment-Layouts

- Die sechs Layouts `dashboard`, `characters`, `party`, `sessions`, `settings` und `chat` (`src/app/<seg>/layout.tsx:6-8`) sind identisch aufgebaut: `await requireAuth()`, danach sequenziell `await getUserNavContext()` (`profiles.select("avatar_url")`, `nav-context.ts:12-16`).
- Die `loading.tsx`-Dateien liegen **innerhalb** der Segmente. Das Skeleton erscheint daher erst, wenn das Layout mit Auth und Profil-Query fertig ist.
- `loading.tsx` gibt es für `dashboard`, `characters`, `characters/[id]`, `characters/[id]/play`, `characters/[id]/epic`, `party`, `sessions`, `sessions/[id]`, `master` und `chat`. Keine eigene haben `settings`, `characters/[id]/manage` und `characters/[id]/print`.
- `Suspense` wird nur für die Avatar-Crop-Dialoge verwendet, nicht in Pages oder Layouts.

### 4. Datenladen pro Seite (Server)

| Route                             | Sequenzielle DB-Wellen nach Auth   | Bemerkung                                                                                                                                                                                                                      |
| --------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/dashboard`                      | 3 (`page.tsx:178`, `:250`, `:409`) | ~20 Queries, viele ohne Filter (`chronicle_quotes *`, `xp_history`, `tags *`, `session_tags`, `character_spells`, `character_classes *`)                                                                                       |
| `/characters`                     | 1                                  | `characters *` ohne Filter (RLS), NPCs per JS gefiltert (`:57`)                                                                                                                                                                |
| `/characters/[id]`                | 2                                  | `characters` → `epic_items count`; leitet weiter zu `/manage`                                                                                                                                                                  |
| `/characters/[id]/play`, `/print` | 2–3                                | `characters *` → `Promise.all(8/9)` → optional `fetchAvailablePriestSpells`                                                                                                                                                    |
| `/characters/[id]/manage`         | 2                                  | `characters *` → `Promise.all(12)` inkl. `nonweapon_proficiencies *` (Vollkatalog)                                                                                                                                             |
| `/characters/[id]/epic`           | bis 3                              | `character_classes` doppelt abgefragt (`:16-49`)                                                                                                                                                                               |
| `/sessions`                       | 2                                  | Welle 2 lädt **alle** `session_entries` aller Sessions, gerendert werden 3 pro Session                                                                                                                                         |
| `/sessions/[id]`                  | **bis 10**                         | `page.tsx:24-104`: kein `Promise.all`, jede Query wartet auf die vorige                                                                                                                                                        |
| `/party`                          | 2                                  | `profiles` (alle), Party-Loot, eigene Charaktere                                                                                                                                                                               |
| `/settings`                       | 1                                  | zweiter `profiles`-Read zusätzlich zum Layout                                                                                                                                                                                  |
| `/master`                         | 2 + Upsert                         | `autoShareCharacters` (Select + Upsert, `actions.ts:191-208`) bei **jedem** Aufruf, dann 14 Voll-Tabellen (`characters`, `weapons`, `armor`, `general_items`, `monsters`, `magic_items`, `character_spells` mit `spells(*)` …) |

Zusätzlich gibt es nach der Hydration:

- **`/master`**: `master-dashboard.tsx:150-153` ruft `fetchMagicItems()` und `fetchMagicItemDistribution()` erneut auf, obwohl SSR die Magic Items schon geliefert hat.
- **`/characters/[id]/manage`**:
  - `tab-equipment.tsx:140-158` lädt `weapons *`, `armor *`, `general_items *` und `magic_items *` bei **jedem** Mount des Equipment-Tabs (`TabsContent` ohne `forceMount`, `catalogsLoadedRef` wird beim Remount zurückgesetzt).
  - `tab-spells.tsx:184-206` lädt `spells *` mit Filter `spell_type` und `limit(5000)`. Für Priester passiert das automatisch beim Mount, weil beide Manage-Pages `allSpells={[]}` übergeben.
- **`/characters/[id]/play`**: `play-mode.tsx:231-243` lädt die aktiven Charaktere für das Handeln.

### 5. Re-Fetch-Mechanismen (Realtime)

- `src/lib/hooks/use-realtime-refresh.ts:50-64`: Bei jedem `postgres_changes`-Event wird nach 150 ms `router.refresh()` ausgelöst. Das rendert die komplette Server-Seite inklusive aller Queries neu.
  - **Dashboard** (`page.tsx:697`): `characters`, `chronicle_quotes` und `chronicle_npcs`, **ohne Filter**. Jede HP-Änderung irgendeines Charakters löst ein vollständiges Dashboard-Rerender mit ~20 Queries aus.
  - **Party**: drei `party_loot`-Tabellen ohne Filter.
  - **`sessions/[id]`**: `session_entries` mit Filter auf die Session.
- `use-approval-status.ts:50-67`: Ein Channel pro Instanz. Das Root-Layout (ApprovalBanner) und jedes `ApprovalGate` öffnen jeweils einen. Gates sitzen teils in Listen, z. B. pro NPC und pro Zitat (`npc-manager.tsx:166,314`, `quote-section.tsx:180,311`).
- `notification-bell.tsx:59-73`: In `AppSidebar` immer gemountet, in `AppNav` gemountet, solange das Mobile-Menü offen ist. Jede Instanz hat einen eigenen Select (`notifications *`, limit 20) und einen eigenen Channel.
- `master-dashboard.tsx:196-249`: `gm-hp-updates` mit einem 10-Sekunden-Polling als Fallback.

### 6. Caching

- **HTML:** wird nicht gecacht (`no-store`), weil alle Routen dynamisch sind (`cookies()` in i18n und Auth).
- **Next.js Data Cache:** `unstable_cache`, `'use cache'`, `cacheLife`/`cacheTag`, React `cache()`, `revalidate`, `generateStaticParams`, `revalidatePath`/`revalidateTag` werden nirgends verwendet. `next.config.ts` enthält keine Cache-Konfiguration, kein `cacheComponents` und kein `staleTimes`.
- **Stammdaten:** `weapons`, `armor`, `general_items`, `nonweapon_proficiencies`, `spells`, `magic_items` und `monsters` werden bei jedem Bedarf frisch aus der DB geladen, teils serverseitig pro Page-Load, teils clientseitig pro Tab-Mount. `races` und `classes` kommen aus statischem TypeScript (`src/lib/rules/`).
- **Statische Assets:** `/_next/static/*` ist `immutable` für ein Jahr gecacht.
- **`public/`-Dateien:** `/images/login/*.webp` mit ~260–300 KB je Bild und `/_next/image` werden mit `max-age=0, must-revalidate` ausgeliefert. Der Browser muss sie bei jedem Aufruf revalidieren. In `next.config.ts` fehlen `headers()` und `images.minimumCacheTTL`.
- **Service Worker:** existiert nicht. Es gibt nur zwei Manifeste (`public/site.webmanifest`, `public/master-manifest.webmanifest`) für die Installation auf dem Homescreen.
- **Prefetching:** `next/link` prefetcht bei dynamischen Routen nur bis zur nächsten `loading.tsx`-Grenze. Weil Layout-Auth und Profil-Query vor dieser Grenze liegen, wird beim Prefetch bereits die Middleware ausgeführt (der Matcher schließt RSC-Requests nicht aus).

### 7. Client-Bundle

- 127 Dateien mit `"use client"`, zusammen 39.434 Zeilen. Die größten sind `tab-equipment.tsx` (2.438), `character-sheet.tsx` (2.329), `master-bestiary-panel.tsx` (1.609), `tab-spells.tsx` (1.585) und `master-npcs-panel.tsx` (1.522).
- Bereits lazy geladen:
  - `react-markdown` (`markdown-renderer.tsx:9`)
  - `docx` und `file-saver` (Click-Handler in `print-sheet.tsx:1283`)
  - `react-easy-crop` (`React.lazy`)
  - `TabEquipment` und `TabSpells` (`character-sheet.tsx:68-74`)
- Statisch importiert:
  - alle 6 Master-Panels (`master-dashboard.tsx:7-16`) und alle 8 Play-Panels (`play-mode.tsx:7-14`)
  - `TabProficiencies`, `TabThiefSkills` und die Dialoge im Charakterbogen (`character-sheet.tsx:75-78`)
  - `remark-breaks` in 4 Dateien
  - `avatar-crop-dialog.tsx:4` importiert `Cropper` statisch
- Die Basis von 156 KB gzip auf jeder Seite stammt aus React/Next, Supabase-Browser-Client (`GoTrueClient`, `RealtimeClient`), base-ui, sonner, next-intl und den Root-Layout-Komponenten.
- Ungenutzte schwere Libraries gibt es nicht (keine framer-motion, recharts, Datums-Libs oder PDF-Libs).

### 8. Bilder und Fonts

- Die Artwork-Bilder (Login, Landing, PIN-Gate) werden als rohes `<picture>`/`<img>` ausgeliefert, nicht über `next/image`.
  - `/login` lädt **zwei** Bildpaare (party und grimace, per Opacity getauscht), `login/page.tsx:126-153`. Das sind 2 × ~260 KB (Landscape) bzw. 2 × ~300 KB (Portrait).
  - `fetchPriority="high"` steht auf dem Grimace-Bild (`:147`).
- `header-logo.webp` ist 465 KB groß (2816×1536) und läuft über `next/image`. Ausgeliefert werden bei w=640 31 KB, sichtbar ist es mit 84 bzw. 168 px Höhe.
- `priority` auf jedem Avatar in `character-card.tsx:116`: Alle Karten einer Liste werden als High-Priority-Preload markiert.
- 21 rohe `<img>`, u. a. in Master-Panels, Sidebar/Nav-Avatar und Lightbox.
- Ohne Referenz in `src/`: `footer-logo.webp` (435 KB) und `images/textures/dungeon-stone.webp`.
- Fonts: 4 Familien über `next/font/google` (Cinzel, Crimson Text in 3 Gewichten, Geist, Geist Mono), alle mit `display: swap` und Subset `latin`, selbst gehostet über Next.

### 9. CSS-Effekte

- `.glass` nutzt `backdrop-filter: blur(16–20px) saturate(1.4–1.6)` (`globals.css:202,212`) und wird auf Dashboard, Charakterbogen und Master-Panels vielfach verwendet. Dazu kommen Tailwind-`backdrop-blur` in 13 Dateien.
- Endlos-Animationen: `stat-ambient-glow` (text-shadow, 3 s) und `pulse-glow` (opacity + brightness, 2 s).
- `prefers-reduced-motion` schaltet Animationen und Backdrop-Filter ab (`globals.css:520-545`).

### 10. Datenbank: RLS und Indizes

- **RLS-Policies** verwenden `auth.uid()`/`auth.role()` **ungewrappt** (kein `(select auth.uid())`). Die `characters`-SELECT-Policy (`00025:31-36`) enthält zusätzlich eine `EXISTS`-Subquery auf `character_shares`.
- **Fehlende Indizes:**
  - `characters.user_id` hat keinen Index, wird aber in RLS, `is_character_owner()` und mehreren `.eq("user_id")` verwendet.
  - `characters.is_active` und `characters.is_public` haben ebenfalls keinen Index.
  - Ebenso ohne Index: `xp_history.session_id` und `session_tags.tag_id`.
- **Doppelte Indizes:** Mehrere Indizes aus `00158` duplizieren Unique- bzw. PK-Constraints mit gleicher führender Spalte.
- **Approval-Trigger:** `enforce_approval` läuft `FOR EACH ROW` und betrifft nur Writes. Die Trigger-Liste nennt `fighting_styles` statt `character_fighting_styles` (`00217`), dadurch fehlt der Trigger auf dieser Tabelle. Das ist kein Performance-Thema, wurde aber beim Mapping gefunden.
- **Datenvolumen:** Die Gruppe ist klein (max. 10 Nutzer). Die größten Tabellen sind Stammdaten: `spells` (~3.200), `monsters` (~350+), `rulebook_chunks`.

### 11. Infrastruktur

- Vercel Hobby, Funktionen in `fra1`, Supabase in Frankfurt.
- Kaltstart ~1,8 s, gemessen beim ersten Aufruf nach Inaktivität.
- `@vercel/speed-insights` ist eingebunden (`layout.tsx:104`). Echte Nutzerdaten (LCP, INP, TTFB je Route) liegen damit im Vercel-Dashboard vor.
- Im Build erscheint die Warnung: `middleware` ist in Next 16 deprecated zugunsten von `proxy`.

## Code References

- `src/middleware.ts:16` – Matcher (inkl. RSC-Prefetch und `/api/*`)
- `src/lib/supabase/middleware.ts:30` – `auth.getUser()` pro Request
- `src/lib/supabase/auth.ts:22-41` – `requireAuth()` ohne Deduplizierung
- `src/lib/supabase/nav-context.ts:9-25` – Profil-Query pro Layout
- `src/i18n/request.ts:4-12` – Cookie-Locale, vollständige Messages
- `src/app/layout.tsx:70-106` – Root-Layout, `NextIntlClientProvider messages={messages}`
- `src/app/dashboard/layout.tsx:6-8` – Muster aller Segment-Layouts
- `src/app/dashboard/page.tsx:178,250,409,697` – 3 Query-Wellen + RealtimeRefresh ohne Filter
- `src/app/sessions/[id]/page.tsx:24-104` – 10 sequenzielle Queries
- `src/app/sessions/page.tsx:70-85` – alle Session-Entries aller Sessions
- `src/app/master/page.tsx:38-82` – 14 Voll-Tabellen-Queries
- `src/app/master/actions.ts:191-208` – `autoShareCharacters` bei jedem Aufruf
- `src/components/master/master-dashboard.tsx:150-153` – doppelter Magic-Item-Fetch
- `src/components/character-sheet/tab-equipment.tsx:140-158` – Katalog-Loads pro Tab-Mount
- `src/components/character-sheet/tab-spells.tsx:184-206` – `spells *` limit 5000
- `src/lib/hooks/use-realtime-refresh.ts:50-64` – `router.refresh()` bei jedem Event
- `src/lib/hooks/use-approval-status.ts:36-67` – Profil-Query + Channel pro Instanz
- `src/components/notifications/notification-bell.tsx:38-79` – doppelt gemountet
- `src/components/approval-banner.tsx:20` – Browser-`getUser()` auf jeder Seite
- `src/components/tutorial/tutorial-overlay.tsx:175-195` – `getUser()` + Profil-Query
- `src/app/login/page.tsx:126-153` – zwei Artwork-Bildpaare
- `src/components/character-card.tsx:116` – `priority` auf jedem Avatar
- `next.config.ts` – keine `headers()`, kein `minimumCacheTTL`, keine Cache-Flags

## Architecture Documentation

- **Rendering:** Alle Seiten sind dynamische Server Components mit Datenladen auf dem Server. Interaktive Teile sind große Client Components, die Props aus der Page erhalten. Mutationen gehen direkt aus dem Browser an Supabase. Danach wird lokal aktualisiert oder `router.refresh()` aufgerufen.
- **Auth:** `@supabase/ssr` mit Cookie-Session. Die Middleware refresht den Token, Layouts und Pages verifizieren erneut über `getUser()`.
- **i18n:** Locale aus dem Cookie, kein Locale-Segment in der URL. Alle Messages gehen an den Client-Provider.
- **Master-Bereich:** Service-Role-Client (RLS-Bypass) mit GM-Session-Cookie. Lädt den kompletten Spielstand auf einmal.
- **Realtime:** Pro Seite und Komponente eigene `postgres_changes`-Channels. Seiten-Refresh über `router.refresh()`.

## Open Questions

- Wie verteilen sich die echten Ladezeiten der Nutzer über die Routen? Die Speed-Insights-Daten im Vercel-Dashboard (LCP/TTFB je Route) sind nicht ausgewertet.
- Wie lange dauert eine Supabase-Query **von Vercel aus**? Die Messung oben lief vom lokalen Rechner. Ein Server-Timing-Header oder Logging in einer Route würde das klären.
- Wie oft treten Kaltstarts tatsächlich auf? Bei max. 10 Nutzern mit Session-Abenden dürfte fast jeder erste Aufruf kalt sein. Fluid Compute im Vercel-Projekt ist nicht geprüft.
- Wie hoch ist der Rendering-Aufwand auf schwachen Mobilgeräten (iPhone) durch `backdrop-filter` und Endlos-Animationen? Das ist nicht gemessen.
