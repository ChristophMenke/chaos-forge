---
date: 2026-10-05T07:47:11+00:00
git_commit: 41d55189457c00e0cf25e6e9b2fe374044a8480a
branch: perf/page-load-optimization
topic: "Seitenaufbau-Performance: Auth, Waterfalls, Kataloge, Caching, Bundle"
tags: [plan, performance, auth, caching, supabase, spells, bundle]
status: draft
---

# Seitenaufbau-Performance Implementation Plan

## Overview

Seiten bauen sich langsam auf, weil jeder Aufruf mehrere sequenzielle Netzwerk-Roundtrips braucht (3× Auth, Profil, Query-Wellen), Kataloge wiederholt geladen werden und kaum etwas im Browser gecacht wird. Dieser Plan entfernt die Roundtrips mit dem größten Anteil, cacht Kataloge und statische Bilder und lädt selten genutzte GM-Panels erst bei Bedarf. Nebenbei behebt er einen Bug: Der Zauber-Lernen-Dialog zeigt höchstens 1000 Zauber an.

## Current State Analysis

Grundlage: `docs/agents/research/2026-10-05-page-load-performance.md`. Kernpunkte:

- **Auth:**
  - `getUser()` (HTTP an Supabase Auth) läuft pro Seitenaufruf 3× sequenziell: in Middleware, Segment-Layout und Page (`src/lib/supabase/middleware.ts:30`, `src/lib/supabase/auth.ts:31-34`).
  - `src/app/sessions/page.tsx:41-43` ruft `getUser()` direkt auf.
  - Im Browser kommen weitere `getUser()`-Calls dazu: `approval-banner.tsx:20`, `approval-gate.tsx:32` und `tutorial-overlay.tsx:189`.
  - Das Projekt nutzt ES256-Signing-Keys, `getClaims()` verifiziert damit lokal. `getClaims()` ruft intern zuerst `getSession()` auf und refresht abgelaufene Tokens wie bisher über `setAll`.
- **Approval:** Jede `useApprovalStatus`-Instanz macht eine eigene Profil-Query und öffnet einen eigenen Realtime-Channel (`use-approval-status.ts:29-71`). Instanzen gibt es im Banner und in jedem Gate, teils pro Listeneintrag. Die Channel-Namen brauchen das `useId`-Suffix (Fix aus #174).
- **Waterfalls:**
  - `sessions/[id]/page.tsx:24-104` hat 10 sequenzielle Queries.
  - `master/page.tsx:33` wartet auf `autoShareCharacters` (`cookies()` + Select + Upsert) vor allen Lese-Queries.
  - `master-dashboard.tsx:150-153` lädt Magic Items beim Mount erneut, obwohl SSR sie liefert.
  - `characters/[id]/epic/page.tsx` hat 3 Wellen: Charakter, dann Share-Check, dann `epic_items` (`:16-80`).
- **Realtime:** `use-realtime-refresh.ts` ruft bei jedem Event `router.refresh()` auf, auch in Hintergrund-Tabs. Das Dashboard hört ungefiltert auf `characters`.
- **Kataloge:**
  - `tab-equipment.tsx:140-158` lädt weapons, armor, general_items und magic_items bei jedem Tab-Mount neu.
  - `tab-spells.tsx:178-192` lädt `spells *` mit `limit(5000)`. PostgREST kappt bei 1000 Zeilen, es gibt aber 1.908 Magier- und 1.303 Priesterzauber. **Bug:** Hohe Stufen fehlen. Pro Öffnen kommen ~1,4 MB JSON.
  - `fetchAvailablePriestSpells` (`priest-spells.ts:57-85`) hat dasselbe Limit-Risiko.
  - Paging-Schleifen existieren bereits sequenziell in `rescan-view.tsx:36-51` und `characters/import/page.tsx:450-467`.
- **Browser-Caching:** `/images/*` und `/_next/image` werden mit `max-age=0, must-revalidate` ausgeliefert. `next.config.ts` hat weder `headers()` noch `minimumCacheTTL`.
- **Login-Bilder:** `fetchPriority="high"` steht auf dem Grimassen-Bild, das erst im Code-Schritt sichtbar wird (`login/page.tsx:147`).
- **Card-Priority:** `character-card.tsx:116` setzt `priority` auf jedem Avatar. `characters/page.tsx` rendert 4 Sektionen per `renderCard` (`:139`, `:158`, `:173`, `:188`).
- **Bundle:** `/master` hat 275 KB gzip, alle 8 Nicht-Party-Panels werden statisch importiert (`master-dashboard.tsx:7-16`). Sie rendern aber nur im aktiven Tab (`:382-460`). Play-Mode rendert auf Desktop alle Panels gleichzeitig (`play-mode.tsx:894-1010`), Lazy Loading brächte dort nichts.
- **Middleware-Datei:** Next 16 warnt beim Build, dass `middleware` zugunsten von `proxy` deprecated ist.

## Desired End State

- Ein Seitenaufruf braucht serverseitig **keinen Netzwerk-Roundtrip für Auth** (lokale JWT-Prüfung, im Render pro Request dedupliziert). Die API-Routen bleiben unverändert bei `getUser()`.
- Der Approval-Status wird pro Seite **einmal** geladen und abonniert.
- `/sessions/[id]` lädt in 2 parallelen Wellen, `/characters/[id]/epic` in 1 Welle. `/master` blockiert nicht mehr auf dem Auto-Share.
- Realtime-Refreshes laufen nur in sichtbaren Tabs. Ein verborgener Tab holt den Refresh beim Zurückkehren einmal nach.
- Zauber- und Ausrüstungskataloge werden pro Browser-Sitzung **einmal** geladen. Der Zauberkatalog ist vollständig, ohne 1000er-Kappung.
- Bilder aus `public/` und `/_next/image` sind im Browser einen Tag lang cachebar.
- GM-Panels werden erst geladen, wenn sie geöffnet werden.
- `npm run verify` ist grün.

## What We're NOT Doing

- **`experimental.staleTimes`:** Im Review verworfen. Die meisten Schreibzugriffe gehen direkt aus dem Browser an Supabase und invalidieren den Router-Cache nicht. Nach eigenen Änderungen würden bis zu 30 s veraltete Seiten erscheinen.
- **Lazy Loading der Play-Mode-Panels:** Auf Desktop werden alle Panels gleichzeitig gerendert, ein Gewinn ergäbe sich nur für den Mobile-Zweig.
- **Auth der API-Routen umbauen:** Die Routen behalten `getUser()` und damit die Prüfung gegen den Auth-Server.
- **i18n-Messages aufteilen:** komprimiert ~20 KB, hohes Risiko fehlender Keys. Ebenso keine Locale in der URL, keine `cacheComponents` / `'use cache'`.
- **Server-seitiger Data Cache für Zauber:** ~1,4 MB pro Typ, das liegt nahe an bzw. über dem 2-MB-Limit pro Eintrag.
- **Dashboard-Queries umbauen, DB-Indizes oder RLS-Umbau:** bei der Datenmenge nicht messbar.
- **Service Worker, CSS-Effekte, Kaltstarts.**
- **Trigger-Namensfehler `fighting_styles` in `00217`:** nur als Hinweis im PR.

## Architecture and Code Reuse

```
Request ──► proxy.ts ──► updateSession(): auth.getClaims()   (lokal; refresht Token bei Bedarf)
             │
             ▼
          Layout/Page ──► requireAuth() → getAuthUser() = cache(getClaims → AuthUser)
                                                         (1× pro Render-Request, lokal)

Browser ─► ApprovalProvider (Root-Layout, 1× getClaims, 1× Query, 1× Channel mit useId-Suffix)
             ├─ ApprovalBanner  ── useApproval()
             └─ ApprovalGate(n) ── useApproval()

Kataloge (Browser, Promise-Cache auf Modulebene pro Sitzung):
  getSpellCatalog(type) ──► fetchAllRows(spells, 1000er-Seiten parallel, order level,name,id)
  getEquipmentCatalogs() ─► weapons / armor / general_items / magic_items
  invalidate*() nach eigenen Inserts (Charakterbogen) und GM-CRUD
```

Wiederverwendung und Extraktion:

- `src/lib/supabase/auth.ts`: `requireAuth`/`getOptionalUser` bleiben als API erhalten (25 Aufrufer, alle nutzen nur `id` und `email`), intern auf `getClaims()` + React `cache()` umgestellt.
- `useApprovalStatus` wandert als Logik in den Provider, inklusive `useId`-Suffix für den Channel. Der bestehende Test `use-approval-status.test.ts` (Channel-Mock) wird zum Provider-Test.
- `fetchAllRows` (neu) ersetzt die sequenziellen Paging-Schleifen in `rescan-view.tsx` und `characters/import/page.tsx` und wird in Spell-Catalog und `fetchAvailablePriestSpells` genutzt.
- `use-realtime-refresh.ts` bekommt die Sichtbarkeitslogik zentral, alle 3 Nutzer profitieren ohne Änderung.
- Drittanbieter-APIs:
  - `supabase.auth.getClaims()`: `{ data: { claims } | null, error }`. Die JWKS wird 10 min pro Instanz gecacht.
  - `react` `cache()`: dedupliziert nur im Server-Render, nicht in Server Actions und nicht in Vitest.
  - `next/server` `after()`: Darin darf kein `cookies()` aufgerufen werden.
  - `next/dynamic`
  - `next.config` `headers()` und `images.minimumCacheTTL`

Betroffene Dateien:

- `src/middleware.ts` → **`src/proxy.ts`** (Codemod), Export `proxy`
- `src/lib/supabase/`
  - `middleware.ts`: `updateSession` nutzt `getClaims()`
  - `auth.ts`: `AuthUser`, `getAuthUser()` (cached), `requireAuth()`, `getOptionalUser()`
  - `fetch-all-rows.ts` (neu): `fetchAllRows<T>(count, page, pageSize = 1000)`
  - `priest-spells.ts`: nutzt `fetchAllRows`, behält `[]` bei Fehler
- `src/lib/catalog/` (neu)
  - `spell-catalog.ts`: `getSpellCatalog(type)`, `invalidateSpellCatalog()`
  - `equipment-catalog.ts`: `getEquipmentCatalogs()`, `invalidateEquipmentCatalogs()`
- `src/components/`
  - `approval-provider.tsx` (neu): `ApprovalProvider`, `useApproval()`
  - `approval-banner.tsx`, `approval-gate.tsx`: konsumieren den Context
  - `tutorial/tutorial-overlay.tsx`: `getClaims()`
  - `notifications/notification-bell.tsx`: Kommentar `:58` auf den neuen Provider verweisen
  - `character-sheet/tab-spells.tsx`: `getSpellCatalog`, Invalidierung nach Custom-Insert
  - `character-sheet/tab-equipment.tsx`: `getEquipmentCatalogs`, Invalidierung nach Inserts in weapons (`:488`) und armor (`:548`)
  - `character-rescan/rescan-view.tsx`: Paging-Schleife → `fetchAllRows`
  - `character-card.tsx`: Prop `priority?: boolean`
  - `master/master-dashboard.tsx`: Mount lädt nur die Distribution, Panels per `dynamic()`, Katalog-Invalidierung nach Item-CRUD
- `src/lib/hooks/use-realtime-refresh.ts`: Sichtbarkeitslogik
- `src/app/`
  - `layout.tsx`: `ApprovalProvider`
  - `sessions/page.tsx`: `requireAuth()`
  - `sessions/[id]/page.tsx`: 2 Wellen
  - `characters/[id]/epic/page.tsx`: 1 Welle
  - `master/page.tsx` + `master/actions.ts`: Auto-Share ohne `cookies()` in `after()`
  - `characters/page.tsx`: `priority` nur für die ersten Karten der ersten Sektion
  - `characters/import/page.tsx`: Paging-Schleife → `fetchAllRows`
  - `login/page.tsx`: `fetchPriority` korrigieren
- `next.config.ts`: `headers()`, `images.minimumCacheTTL`
- Doku: `CLAUDE.md` (Projektstruktur + Supabase-Abschnitt `proxy.ts`, Auth-Strategie, `src/lib/catalog/`, Roadmap)

## Performance Considerations

- `getClaims()` prüft per WebCrypto lokal. Middleware und Render teilen sich keinen Cache, prüfen aber beide ohne Netzwerk.
- Der Zauberkatalog wird weiterhin vollständig geladen (~450 KB gzip pro Typ), aber nur einmal pro Sitzung und mit parallelen Seiten. Der eindeutige Sortierschlüssel `id` verhindert Duplikate und Lücken an Seitengrenzen.
- Bild-Cache: `max-age=86400, stale-while-revalidate=604800` für `public/`-Bilder, `minimumCacheTTL: 86400` für `/_next/image`. Ein unter gleichem Namen ersetztes Bild ist höchstens einen Tag veraltet. Avatare tragen bereits `?t=`-Cache-Busting (`src/lib/avatar/upload.ts:58`).

## Migration Notes

- Keine DB-Migration. Jede Phase ist ein eigener Commit und einzeln revertierbar.
- Sicherheitsabwägung (vom User akzeptiert): Ein serverseitig widerrufenes Token bleibt bis zu seinem Ablauf (Default 1 h) für Seitenaufrufe gültig. PostgREST/RLS prüft schon heute nur die Signatur, und die sensiblen API-Routen behalten `getUser()`.

---

## Phase 1: Auth ohne Roundtrips & ein Approval-Provider

Entfernt die sequenziellen Auth-Roundtrips pro Seite sowie die doppelten Approval-Queries und -Channels im Browser.

**Tasks**:

- [x] `src/middleware.ts` per Codemod (`npx @next/codemod@canary middleware-to-proxy .`) zu `src/proxy.ts` migrieren. Matcher unverändert.
- [x] `src/lib/supabase/middleware.ts` `updateSession`: `getUser()` → `getClaims()`.
- [x] `src/lib/supabase/auth.ts`: Typ `AuthUser = { id: string; email: string | null }` und `getAuthUser = cache(async () => …)` anlegen. Die Funktion mappt `claims.sub` → `id` und `claims.email` → `email` und gibt bei Fehler oder fehlenden Claims `null` zurück. Der DEV_USER-Pfad bleibt.
  ```ts
  export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    return data?.claims ? { id: data.claims.sub, email: data.claims.email ?? null } : null;
  });
  ```
- [x] `requireAuth()` und `getOptionalUser()` auf `getAuthUser()` umstellen, mit Rückgabetyp `AuthUser`. TypeScript-Fehler der Aufrufer beheben.
- [x] `src/app/sessions/page.tsx:41-43`: direkten `getUser()`-Call durch `getOptionalUser()` ersetzen (Layout erzwingt Auth bereits; Semantik bleibt).
- [x] `src/components/approval-provider.tsx` (neu) anlegen: Der Client-Provider ermittelt die userId per `supabase.auth.getClaims()` und übernimmt die Logik aus `useApprovalStatus`: 1 Profil-Query, 1 Channel `approval-${userId}-${useId-Suffix}`, `removeChannel` im Cleanup. Er stellt `useApproval(): { userId, isApproved, isLoading }` bereit.
- [x] `src/app/layout.tsx`: `ApprovalProvider` innerhalb von `NextIntlClientProvider` um den App-Baum legen.
- [x] `approval-banner.tsx` und `approval-gate.tsx`: `getUser()` und `useApprovalStatus` entfernen und `useApproval()` nutzen. Das bisherige Verhalten bleibt: permissiv während des Ladens, Banner nicht auf `/login` und `/master`.
- [x] `use-approval-status.ts` entfernen, Importe anpassen und den Kommentar in `notification-bell.tsx:58` aktualisieren.
- [x] `tutorial/tutorial-overlay.tsx:189`: `getUser()` → `getClaims()` (`claims.sub`).

**Automated Verification**:

- [x] Unit (`auth.test.ts`, neu, mit gemocktem `createClient`):
  - `getAuthUser` mappt Claims auf `AuthUser` und gibt bei `error` oder `claims: null` `null` zurück.
  - `requireAuth` ruft ohne Claims `redirect("/login")` auf.
  - `getUser` wird nicht aufgerufen.
  - Die Deduplizierung wird mit gemocktem `react.cache` als Memo-Wrapper geprüft; das echte `cache()` ist in Vitest ein No-op.
- [x] Unit (`supabase/middleware.test.ts`, neu): `updateSession` ruft `getClaims` auf und nicht `getUser`.
- [x] Unit (`approval-provider.test.tsx`, aus `use-approval-status.test.ts` überführt, gleicher Channel-Mock):
  - Zwei `useApproval()`-Konsumenten erzeugen genau 1 Profil-Query und 1 Channel.
  - Ein Realtime-UPDATE setzt `isApproved`.
  - Der Unmount ruft `removeChannel` auf.
  - Ein StrictMode-Doppel-Mount wirft nicht (Regression #174).
- [x] Unit (`approval-gate.test.tsx`): Mit `isApproved=false` wird der Fallback gerendert, während des Ladens und bei Freigabe die Children.
- [x] `npm run verify` ist grün.
- ~~`npm run test:e2e`~~ entfällt (E2E-Suite am 2026-10-05 auf Wunsch entfernt)

**Manual Verification**:

- [ ] Login, Navigation und Logout funktionieren:
  1. Ausloggen, dann `/dashboard` aufrufen → Redirect auf `/login`.
  2. Einloggen → Dashboard lädt, Sidebar zeigt den Avatar.
  3. Zwischen Dashboard, Charaktere, Chronik und Party wechseln: keine Fehler, spürbar schneller.
- [ ] Ein nicht freigegebener Testnutzer sieht Banner und gesperrte Gates. Nach der Freigabe durch den Admin verschwinden beide ohne Reload.

---

## Phase 2: Waterfalls & Realtime-Refresh

Ersetzt sequenzielle Queries durch parallele, nimmt blockierende Writes aus dem Renderpfad und unterdrückt Refreshes in unsichtbaren Tabs.

**Tasks**:

- [x] `src/app/sessions/[id]/page.tsx`:
  - Welle 1 `Promise.all`: `sessions`, `session_entries`, `characters` (eigene, aktiv), `session_tags`, `tags`, `xp_history`, `session_participants` und `characters` (alle aktiven, nicht-NPC).
  - Danach `notFound()`.
  - Welle 2 `Promise.all`: `characters` `.in(entry ids)` und `characters` `.in(participant ids)`. Leere ID-Listen lösen keine Query aus.
- [x] `src/app/characters/[id]/epic/page.tsx`: Eine Welle `Promise.all` mit `characters`, `character_classes *`, `character_shares` (eigener Share) und `epic_items`. `classesForLevel` wird über den neuen, getesteten Helfer `getHighestActiveClassLevel()` (`src/lib/rules/multiclass.ts`) abgeleitet. Die Redirect-Logik für Nicht-Owner ohne Share bleibt gleich.
- [x] Cookie-freien Auto-Share als `shareActiveCharactersWith(userId)` in `src/lib/master/auto-share.ts` (`server-only`, **kein** Server-Action-Export, weil jede Funktion aus der `"use server"`-Datei `master/actions.ts` öffentlich aufrufbar wäre). `autoShareCharacters` entfernt (einziger Aufrufer war die Master-Page).
- [x] `src/app/master/page.tsx:33`: Nach dem bestehenden `isGm`-Check `after(() => shareActiveCharactersWith(user.id))` aus `next/server` aufrufen.
- [x] `src/components/master/master-dashboard.tsx:150-153`: Der Mount-Effekt lädt nur `fetchMagicItemDistribution()`. `refreshMagicItems` bleibt für CRUD.
- [x] `src/lib/hooks/use-realtime-refresh.ts`: Ist der Tab bei einem Event nicht sichtbar, wird `pendingRefresh` gesetzt. Ein `visibilitychange`-Listener holt den Refresh beim Sichtbarwerden einmal nach. Listener-Cleanup im Effekt.

**Automated Verification**:

- [x] Unit (`use-realtime-refresh.test.ts`, neu):
  - Ein Event im sichtbaren Tab ruft nach dem Debounce `router.refresh` auf.
  - Ein Event im verborgenen Tab ruft es nicht auf; nach `visibilitychange` → visible wird genau einmal refresht.
  - Mehrere verborgene Events führen zu genau 1 Refresh.
  - Der Listener wird beim Unmount entfernt.
- [x] Unit (`src/lib/master/auto-share.test.ts`): `shareActiveCharactersWith` upsertet alle aktiven Charakter-IDs mit `ignoreDuplicates` und ruft kein `cookies()` auf.
- [x] `npm run verify` ist grün.
- ~~`npm run test:e2e`~~ entfällt (E2E-Suite am 2026-10-05 auf Wunsch entfernt)

**Manual Verification**:

- [ ] Session-Detailseite: Einträge, Tags, XP und Teilnehmer erscheinen vollständig, eine nicht existente ID ergibt 404.
- [ ] Epische Ausrüstung: Als Owner sichtbar und bearbeitbar. Als Nutzer mit Share lesend sichtbar. Ohne Share erfolgt ein Redirect auf den Charakter.
- [ ] GM-Dashboard: Nach der PIN-Eingabe lädt es ohne Verzögerung, die Magic-Item-Verteilung wird angezeigt, und ein neu aktivierter Charakter taucht nach erneutem Aufruf auf.
- [ ] Dashboard in einem Tab öffnen, den Tab in den Hintergrund legen und in einem anderen Fenster TP eines Charakters ändern. Beim Zurückwechseln aktualisiert sich das Dashboard einmal.

---

## Phase 3: Kataloge einmal pro Sitzung & Zauber-Bugfix

Kataloge werden pro Browser-Sitzung im Speicher gehalten. Der Zauberkatalog wird vollständig geladen.

**Tasks**:

- [x] `src/lib/supabase/fetch-all-rows.ts` (neu) anlegen: Der Helper holt die Anzahl und lädt dann alle Seiten parallel per `range(from, to)`. Bei einem Fehler wirft er. Aufrufer müssen nach einem eindeutigen Schlüssel sortieren (Doc-Kommentar).
  ```ts
  export async function fetchAllRows<T>(
    count: () => PromiseLike<{ count: number | null; error: unknown }>,
    page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
    pageSize = 1000
  ): Promise<T[]>;
  ```
- [x] `src/lib/catalog/spell-catalog.ts` (neu) anlegen: `getSpellCatalog(type: "wizard" | "priest")` mit einem Promise-Cache auf Modulebene pro Typ (gleichzeitige Aufrufe teilen sich den Request). Abfrage: `select("*")`, `eq spell_type`, `order level, name, id`, über `fetchAllRows`. Bei Fehler wird der Cache-Eintrag verworfen. Dazu `invalidateSpellCatalog()`.
- [x] `src/lib/catalog/equipment-catalog.ts` (neu) anlegen: `getEquipmentCatalogs()` mit einem Promise-Cache für `{ weapons, armor, generalItems, magicItems }` (Queries und Sortierung wie in `tab-equipment.tsx:146-151`) und `invalidateEquipmentCatalogs()`.
- [x] `tab-spells.tsx` `loadAllSpells` auf `getSpellCatalog(spellType)` umstellen. Nach erfolgreichem Custom-Spell-Insert (`handleCreateCustomSpell`, `:521`) `invalidateSpellCatalog()` aufrufen und den neuen Zauber lokal in `allSpellsLoaded` ergänzen.
- [x] `tab-equipment.tsx:140-158`: Den Katalog-Effekt auf `getEquipmentCatalogs()` umstellen. Nach den Custom-Inserts in `weapons` (`:488`) und `armor` (`:548`) `invalidateEquipmentCatalogs()` aufrufen.
- [x] `master-dashboard.tsx`: In `refreshAllItems` bzw. den Item- und Magic-Item-CRUD-Callbacks `invalidateEquipmentCatalogs()` aufrufen.
- [x] `src/lib/supabase/priest-spells.ts`: Die Query mit `order(..., "id")` über `fetchAllRows` laufen lassen. Ein Fehler wird gefangen, geloggt und ergibt `[]` wie bisher.
- [x] `rescan-view.tsx:36-51` und `characters/import/page.tsx:450-467`: Die unsortierten, sequenziellen Paging-Schleifen durch das neue `getSpellNameIndex()` (`spell-catalog.ts`, `fetchAllRows` mit `order("id")`, Session-Cache) ersetzen.

**Automated Verification**:

- [x] Unit (`fetch-all-rows.test.ts`):
  - 0 Zeilen ergeben `[]` ohne Seitenabruf.
  - 1.908 Zeilen ergeben die Seitenaufrufe `(0,999)` und `(1000,1999)`; das Ergebnis enthält alle 1.908 Zeilen in Reihenfolge. Das ist die Regression zum 1000er-Bug.
  - Ein Fehler in Count oder einer Seite wirft.
- [x] Unit (`spell-catalog.test.ts`):
  - Ein zweiter Aufruf erzeugt keinen neuen Request.
  - Parallele Aufrufe teilen sich einen Request.
  - Nach `invalidateSpellCatalog()` wird neu geladen.
  - Ein Fehler wird nicht gecacht.
  - Die Query sortiert nach `level`, `name` und `id`.
- [x] Unit (`equipment-catalog.test.ts`): analog zum Spell-Catalog.
- [x] Unit (`priest-spells.test.ts`): Bei gemockten 1.200 passenden Zeilen kommen alle 1.200 zurück, ein DB-Fehler ergibt `[]`.
- [x] `npm run verify` ist grün.

**Manual Verification**:

- [ ] Magier-Charakter: Der Dialog „Zauber lernen“ findet Stufe-9-Zauber (z. B. „Wish“/„Wunsch“). Ein zweites Öffnen erscheint ohne Ladeanzeige.
- [ ] Priester-Charakter: Die Sphären-Zauberliste zeigt auch hohe Stufen. Ein eigener Zauber erscheint direkt nach dem Anlegen.
- [ ] Charakterbogen: Mehrmals zwischen den Tabs Ausrüstung und Werte wechseln. Die Waffen-Auswahl ist sofort da, im Network-Tab gibt es keine erneuten Katalog-Requests.
- [ ] Rescan und Import mit Zaubern auf dem Bogen: Die Zauber werden weiterhin erkannt.

---

## Phase 4: Browser-Caching & Bilder

Statische Bilder werden cachebar, und das sichtbare Bild bekommt die richtige Priorität.

**Tasks**:

- [x] `next.config.ts` `headers()`:
  - `/:file(.*\\.(?:webp|png|ico))` → `Cache-Control: public, max-age=86400, stale-while-revalidate=604800`. Das deckt auch `/images/**` ab.
  - `/:file(.*\\.webmanifest)` → `public, max-age=86400`.
- [x] `next.config.ts` `images.minimumCacheTTL: 86400` setzen.
- [x] `src/app/login/page.tsx:126-153`: `fetchPriority="high"` vom Grimassen-Bild auf das Party-Bild verschieben. Das Grimassen-Bild bekommt `fetchPriority="low"` und `decoding="async"`.
- [x] `src/components/character-card.tsx`: Neues Prop `priority?: boolean` (Default `false`), das `next/image` `priority` steuert.
- [x] `src/app/characters/page.tsx`: `priority` nur für die ersten 4 Karten der Sektion `ownActive` setzen. Andere Aufrufer setzen kein `priority`.

**Automated Verification**:

- [x] Unit (`next-config.test.ts`, neu): `headers()` enthält die Regel mit dem erwarteten `Cache-Control`-Wert für das Bild-Pattern, und `images.minimumCacheTTL === 86400`.
- [x] Unit (`character-card.test.tsx`, neu): Ohne Prop rendert das Avatar-Bild mit `loading="lazy"`, mit `priority` ohne. Lokal per `next start` geprüft: Bilder und `/_next/image` liefern `max-age=86400`, HTML bleibt `no-store`.
- [x] `npm run verify` ist grün.
- ~~E2E Login- und Landing-Specs~~ entfällt (E2E-Suite entfernt)

**Manual Verification**:

- [ ] Nach dem Preview-Deploy:
  - `curl -sI <preview>/images/login/login-party-landscape.webp` zeigt `max-age=86400`.
  - Ein erneuter Login-Aufruf im Browser lädt die Bilder aus dem Cache (Network-Tab: „disk cache“ bzw. „memory cache“).
  - Auf der Login-Seite lädt das Party-Bild zuerst (Network-Tab: Priority „High“).

---

## Phase 5: GM-Panels bei Bedarf laden

Verkleinert das initiale JS des GM-Dashboards.

**Tasks**:

- [ ] `src/components/master/master-dashboard.tsx:7-16`: Alle 8 Nicht-Party-Panels (Items, Gold, NPCs, Bestiarium, Combat Simulator, Chat, Bookmarks usw.) per `next/dynamic` laden, mit einem `Skeleton` als `loading`. Das Party-Panel bleibt statisch.
- [ ] Bundle-Größe vorher und nachher messen (gzip-Summe der Chunks aus `page_client-reference-manifest.js`, Skript aus der Research) und im PR dokumentieren.

**Automated Verification**:

- [ ] `npm run verify` ist grün.
- ~~`npm run test:e2e`~~ entfällt (E2E-Suite am 2026-10-05 auf Wunsch entfernt)
- [ ] Gemessenes initiales gzip-JS von `/master` ist kleiner als 275 KB.

**Manual Verification**:

- [ ] GM-Dashboard: Alle Panels öffnen (Items, Gold, NPCs, Bestiarium, Kampfsimulator, Chat, Lesezeichen). Jedes erscheint nach kurzem Skeleton und funktioniert.

---

## Abschluss

- [ ] `CLAUDE.md` aktualisieren:
  - Projektstruktur und Supabase-Abschnitt: `src/proxy.ts` statt `middleware.ts`
  - `src/lib/catalog/`
  - Auth-Strategie: `requireAuth` über `getClaims()` (lokal), API-Routen über `getUser()`
  - Roadmap-Eintrag 22 „Performance-Runde“
- [ ] Research-Dokument: Status-Notiz mit Verweis auf diesen Plan.
- [ ] Code Review und explorative QA laut Workflow in `CLAUDE.md`.

## References

- Research: `docs/agents/research/2026-10-05-page-load-performance.md`
- Vorgänger: `docs/agents/research/2026-04-03-performance-audit.md`, `docs/agents/plans/2026-04-09-ux-ui-performance-polish.md`
- Next-Doku (lokal):
  - `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md`
  - `.../02-guides/caching-without-cache-components.md`
  - `.../03-api-reference/02-components/image.md` (`minimumCacheTTL`)
- Supabase `getClaims`: `node_modules/@supabase/auth-js/dist/module/GoTrueClient.d.ts:2470-2560`
- Muster für Channel-Mock-Tests: `src/lib/hooks/use-approval-status.test.ts`
