---
date: 2026-11-04T19:39:37.896208+00:00
git_commit: 302ca456e73d8e1b52e61f5a8afc821346683199
branch: feature/gallery-of-chaos
topic: "Die Galerie des Chaos + Push-Benachrichtigungen aufs Handy"
tags: [plan, master, gallery, storage, upload, lightbox, notifications, web-push, settings]
status: ready
---

# PLAN: Die Galerie des Chaos + Push-Benachrichtigungen

Der GM lädt im Master-Bereich Szenenbilder aus dem Spiel hoch und verwaltet sie unter dem Reiter „Die Galerie des Chaos“. Die Spieler sehen dieselben Bilder unter `/gallery`, ebenfalls „Die Galerie des Chaos“, als Raster mit Vollbild. Neue Bilder lösen eine Benachrichtigung in der Glocke aus.

Zusätzlich kann jede Benachrichtigung aus der Glocke als Push aufs Handy gehen. Das lässt sich in den Einstellungen pro Gerät ein- und ausschalten.

Grundlage ist die Recherche `docs/agents/research/2026-11-04-gallery-of-chaos.md`.

## Acceptance Criteria

**Galerie im Master-Bereich**

- Neuer Reiter „Die Galerie des Chaos“: in der GM-Sidebar und auf dem Handy im „Mehr“-Menü der GM-Bottom-Nav.
- Mehrere Bilder lassen sich auf einmal hochladen. Der Browser erzeugt pro Bild zwei WebP-Fassungen: Vollbild mit längster Seite 2560 px, Vorschau mit 640 px.
  - Während des Uploads gibt es eine Fortschrittsanzeige („3 / 5“ mit Dateiname).
  - Scheitert ein Bild, laufen die anderen weiter. Am Ende kommt eine Zusammenfassung, zum Beispiel „4 von 5 hochgeladen, szene_03.heic fehlgeschlagen“.
- Neue Bilder erscheinen oben, in der Reihenfolge der Auswahl. ▲/▼ verschiebt ein Bild um eine Position. Am Rand ist der jeweilige Button deaktiviert.
- Titel und Beschreibung sind optional. Bearbeitet werden sie in einem Dialog über ✎.
- 🗑 fragt nach („Szene endgültig löschen?“) und entfernt dann die Zeile und beide Dateien.
- Jeder Schreibzugriff läuft über Server Actions mit `checkGmSession()`.
  - Normale Nutzer haben weder auf den Bucket noch auf die Tabelle Schreibrechte.

**Galerie für Spieler**

- `/gallery` erscheint als Menüpunkt „Galerie“ in der App-Sidebar und im „Mehr“-Menü. Die mobile Leiste behält ihre vier Einträge.
- Die Seite zeigt ein Raster mit Vorschaubildern, 2, 3 oder 4–5 Spalten je nach Breite, in derselben Reihenfolge wie im Master-Bereich. Ist ein Titel vorhanden, steht er einzeilig darunter.
- Ein Tipp öffnet das Vollbild:
  - Blättern mit ←/→, Wischen und den Buttons ‹ ›.
  - Schließen mit Esc oder ✕.
  - Angezeigt werden Titel, Beschreibung und „3 / 12“.
  - Am Ende geht es nicht wieder von vorne los, der jeweilige Pfeil wird ausgeblendet.
- Leerer Zustand: „Noch keine Szenen – der Meister hat die Galerie noch nicht bestückt.“

**Benachrichtigungen**

- Pro Upload-Vorgang geht genau eine Benachrichtigung `gallery_images_added` an alle freigegebenen Nutzer außer dem hochladenden Konto: „Der Meister hat N neue Szene(n) in die Galerie gehängt“. Ein Klick führt zu `/gallery`.

**Push aufs Handy**

- In den Einstellungen gibt es eine Sektion „Benachrichtigungen“ mit dem Schalter „Push-Benachrichtigungen auf diesem Gerät“ und dem Button „Test-Benachrichtigung senden“.
- Jede Zeile, die in `notifications` eingefügt wird, erzeugt einen Push an alle Geräte des Empfängers, die ihn abonniert haben.
  - Das gilt unabhängig davon, wo die Zeile entsteht: Browser, Server oder DB-Trigger.
  - Text und Sprache entsprechen der Glocke. Ein Tipp auf den Push öffnet dasselbe Ziel wie die Glocke.
- Spezialfälle:
  - iPhone/iPad in Safari ohne Installation auf dem Homescreen: Hinweis „Füge Chaos Forge zum Home-Bildschirm hinzu, um Push zu erhalten“.
  - Kein Push-Support: Der Schalter ist deaktiviert, mit Begründung.
  - Berechtigung verweigert: Hinweis, wie man sie in den Browser-Einstellungen wieder freigibt.
- Abos, die der Push-Dienst mit 404 oder 410 ablehnt, werden automatisch gelöscht.
- Ausschalten kündigt das Abo im Browser und löscht die Zeile in der DB.

**Querschnitt**

- `gallery_images` kommt komplett ins Backup, die Bilddateien nicht. `push_subscriptions` ist ausgeschlossen, mit Begründung.
- Anzupassen sind:
  - Datenschutz: Szenenbilder sowie die Push-Dienste von Apple, Google und Mozilla.
  - Release Note.
  - `CLAUDE.md`.
  - App-Hilfe von SvenBot.

## Technical Key Decisions and Tradeoffs

1. **Upload über signierte Upload-URLs**
   - Ablauf:
     - `prepareGalleryUpload(count)` prüft die GM-Session und erzeugt pro Bild zwei signierte URLs per `service.storage.createSignedUploadUrl(path)`.
     - Der Browser lädt mit `supabase.storage.from("gallery-images").uploadToSignedUrl(path, token, blob, { contentType: "image/webp" })` hoch.
     - `registerGalleryImages(items)` legt die Zeilen an.
   - Warum:
     - Nur der GM schreibt, der Bucket bekommt keine `authenticated`-Schreib-Policy.
     - Das 1-MB-Limit der Server Actions und das 4,5-MB-Limit von Vercel greifen nicht.
   - Impact:
     - Bucket `gallery-images` ist `public` und hat nur eine SELECT-Policy.
     - Pfade sind `<uuid>.webp` und `<uuid>-thumb.webp`. Die UUID erzeugt der Server.
     - `registerGalleryImages` akzeptiert nur Pfade, die genau diesem Muster entsprechen und im Bucket existieren. Die Existenz prüft `service.storage.from(...).list()` bzw. ein `exists`-Check.

2. **Zwei WebP-Fassungen werden im Browser erzeugt**
   - Warum:
     - Das Raster bleibt auch im mobilen Netz schnell.
     - Pro Bild fallen nur etwa 0,6 MB an.
     - Das Kontingent von `next/image` wird nicht belastet, weil die Bilder als einfache `<img>` mit öffentlicher URL laden.
   - Impact:
     - Reine Funktion `fitWithin(w, h, max)` plus ein dünner Canvas-Layer `renderWebp(file, maxSide, quality)` in `src/lib/gallery/image-variants.ts`.
     - Die Qualität liegt bei 0,82 für das Vollbild und 0,75 für die Vorschau.
     - HEIC wandelt iOS Safari beim Auswählen über `accept="image/*"` selbst in JPEG um. Kann der Browser ein Bild nicht dekodieren, schlägt nur dieses Bild fehl.

3. **Tabelle `gallery_images` mit `sort_order`**
   - Spalten:
     - `id uuid PK`
     - `title text NULL`, `description text NULL`
     - `image_path text NOT NULL`, `thumb_path text NOT NULL`
     - `width int`, `height int`
     - `sort_order int NOT NULL`
     - `created_by uuid NULL REFERENCES auth.users ON DELETE SET NULL`
     - `created_at`, `updated_at`
   - Sortierung:
     - Sortiert wird nach `sort_order DESC`, das größte Element steht oben.
     - Ein neuer Batch bekommt `max+n … max+1` in der Reihenfolge der Auswahl, das erste ausgewählte Bild landet also ganz oben.
     - ▲/▼ tauscht `sort_order` mit dem Nachbarn. Das läuft über einen RPC `swap_gallery_order(a uuid, b uuid)`, `SECURITY DEFINER`, nur für `service_role` ausführbar, damit der Tausch atomar ist.
   - Warum: Ganze Zahlen mit Tausch sind die einfachste robuste Lösung für Hoch und Runter.
   - Impact:
     - RLS: Nur SELECT für `authenticated`. Es gibt keine Schreib-Policies, alle Writes laufen über den Service-Client.
     - Kein `enforce_approval`-Trigger: Er würde beim Service-Client ohnehin durchlassen (Recherche §6), und Clients können nicht schreiben.

4. **Die Galerie-Benachrichtigung entsteht in der Server Action, nicht in einem DB-Trigger**
   - Warum: Beim Service-Client ist `auth.uid()` NULL. Ein Trigger nach dem Muster von `game_dates` würde daher nichts senden.
   - Impact:
     - Neuer Helper `notifyApprovedUsers(service, { exceptUserId, type, details })` in `src/lib/notifications.ts`.
     - Er schreibt eine Zeile pro Empfänger in einem einzigen Insert.
     - Die hochladende Person bestimmt `getAuthUser()` in der Server Action.

5. **Push per Web Push mit VAPID, Paket `web-push`, ausgelöst über einen DB-Webhook**
   - Ablauf:
     - Ein `AFTER INSERT`-Trigger auf `notifications` ruft `net.http_post` auf (pg_net, asynchron, blockiert den Insert nicht).
     - Ziel ist `/api/push/dispatch` mit dem Body `{ notification_id }` und dem Header `x-push-secret`.
     - URL und Secret stehen in Supabase Vault (`push_dispatch_url`, `push_dispatch_secret`).
     - Fehlt eines davon, oder hat der Empfänger kein Abo, macht der Trigger nichts.
   - Warum: Alle Quellen sind abgedeckt, ohne die fünf Einfügestellen im Code anzufassen. Es entstehen keine Kosten, und kein Secret liegt im Repo.
   - Impact:
     - Die Route vertraut nur der `notification_id` und lädt die Zeile selbst mit dem Service-Client.
     - Das Secret wird mit `timingSafeEqual` verglichen.
     - Die Route nutzt `runtime = "nodejs"`.
     - Lokal und ohne Vault-Einträge passiert nichts.

6. **Ein Push-Abo pro Gerät in `push_subscriptions`**
   - Spalten:
     - `id`
     - `user_id → auth.users ON DELETE CASCADE`
     - `endpoint text UNIQUE`
     - `p256dh`, `auth`
     - `locale text CHECK (locale IN ('de','en'))`
     - `user_agent`
     - `created_at`, `last_used_at`
   - Warum: Ein Abo gilt technisch pro Browser und Gerät. In der Sprache des Abos wird der Push-Text erzeugt.
   - Impact:
     - RLS: Jeder liest und löscht nur die eigenen Abos.
     - Insert und Upsert laufen über die Route `/api/push/subscribe` (POST/DELETE), mit `getUser()` und Nutzer-Client.
     - Der Endpoint ist UNIQUE. Meldet sich ein anderes Konto auf demselben Gerät an, übernimmt es das Abo per Upsert.
     - Alle Writes (Upsert, Löschen) laufen über den Service-Client in der Route, nachdem `getUser()` geprüft hat. Gelöscht wird immer mit `.eq("user_id", user.id)`. Die RLS-Policies SELECT/DELETE für eigene Zeilen bleiben nur als Sicherheitsnetz, der Client liest seinen Status aus dem `PushManager`.
     - Beim Abmelden ruft die App `disablePush()` auf, damit ein geteiltes Gerät keine Pushs des vorherigen Kontos mehr bekommt.

7. **Text- und Ziel-Logik der Glocke wird zur reinen Funktion**
   - Funktion: `describeNotification(notification, t, locale) → { message, subtitle, href }` in `src/lib/notifications/describe.ts`.
   - Wer sie nutzt:
     - Die Glocke mit `useTranslations`.
     - Der Push-Versand mit `createTranslator({ locale, messages, namespace: "notifications" })` aus `next-intl`.
   - Warum: Push und Glocke zeigen garantiert denselben Text.
   - Impact:
     - `notification-item.tsx` verliert `messageMap`, Untertitel und Klickziel und behält Icon, UI und Approve/Reject.
     - `src/lib/notifications.ts` wird zu `src/lib/notifications/index.ts`. Der Importpfad `@/lib/notifications` bleibt.

8. **Service Worker `public/sw.js`**
   - Er ist von Hand geschrieben, ohne Build-Schritt, mit Scope `/`.
   - Er reagiert nur auf `push` (`showNotification`) und `notificationclick`: offenes Fenster fokussieren und dort per `navigate(href)` zum Ziel, sonst `clients.openWindow(href)`.
   - `install` → `skipWaiting()`, `activate` → `clients.claim()`, damit offene Fenster kontrolliert sind und `navigate()` funktioniert. Fallback bei Fehlern: `focus()` + `clients.openWindow(url)`.
   - Er cacht nichts und braucht keinen Fetch-Handler. Am Ladeverhalten der App ändert sich deshalb nichts.
   - Registriert wird er erst, wenn jemand Push einschaltet bzw. den Status abfragt (`navigator.serviceWorker.getRegistration()`).

## Current State

```
GM-Upload heute (Bestiarium)
Browser ──FormData──▶ Server Action uploadMonsterImage ──Service──▶ monster-images + monsters.image_url
                      (checkGmSession, Next-Limit 1 MB)

Spieler-Navigation:  src/lib/navigation.ts NAV_ITEMS ──▶ app-sidebar.tsx / app-nav.tsx
Vollbild:            image-lightbox.tsx (ein Bild, Esc), kein Blättern/Wischen
Glocke:              notifications ──Realtime INSERT──▶ notification-bell ──▶ notification-item (messageMap, Ziel)
Benachrichtigungs-Quellen:
  Browser:  distribute-item-sheet, distribute-gold-dialog, send-gold-dialog, send-item-dialog
  Server:   master/actions.ts, sessions/actions.ts, api/notify-new-user
  Trigger:  00229 game_dates, 00216/00219 Freigabe
Push:        nicht vorhanden (kein Service Worker; site.webmanifest display: standalone)
```

## Desired End State

```
GM /master ─ Reiter „Galerie des Chaos“ (master-gallery-panel)
  Dateien wählen ─▶ createImageVariants() (WebP 2560 + 640)
                 ─▶ prepareGalleryUpload(n)          [Server Action, checkGmSession, Service]
                 ◀─ [{id, imagePath, imageToken, thumbPath, thumbToken}]
                 ─▶ uploadToSignedUrl() × 2 pro Bild  [Browser → Supabase Storage gallery-images]
                 ─▶ registerGalleryImages(items)     [Insert gallery_images, notifyApprovedUsers]
  ✎ updateGalleryImage · 🗑 deleteGalleryImage (Zeile + 2 Dateien) · ▲▼ moveGalleryImage (RPC swap)

Spieler /gallery (Server Component, Nutzer-Client, RLS SELECT)
  GalleryGrid (Thumbs) ─Tipp─▶ GalleryLightbox (← → Wischen Esc, Zähler, Titel/Text)

notifications INSERT ─┬─▶ Realtime ─▶ Glocke (describeNotification)
                      └─▶ Trigger dispatch_push_notification (pg_net, Vault)
                              ─▶ POST /api/push/dispatch (x-push-secret)
                                   ─▶ describeNotification(locale des Abos)
                                   ─▶ web-push sendNotification × Abos ─▶ Handy (sw.js)
                                   ─▶ 404/410 → Abo löschen

Einstellungen ─ Sektion „Benachrichtigungen“ (PushSettingsSection)
  Schalter ─▶ sw.js registrieren ─▶ PushManager.subscribe(VAPID) ─▶ POST /api/push/subscribe
  Test     ─▶ POST /api/push/test ─▶ notifications-Zeile „push_test“ an sich selbst (läuft über denselben Webhook)
```

### UI-Mockups

**GM-Panel**

```
┌─ Die Galerie des Chaos ─────────────────────────── [＋ Bilder hochladen] ┐
│  Upload läuft:  3 / 5  ████████░░░░  szene_04.jpg …                      │
│  ┌──────────┐  Der Fall von Burg Grauzahn                 [▲] [▼]      │
│  │  [thumb] │  Die Helden stürmen das Tor …               [✎] [🗑]     │
│  └──────────┘  hochgeladen 04.11.2026                                  │
│  ┌──────────┐  (ohne Titel)                               [▲] [▼]      │
│  │  [thumb] │                                             [✎] [🗑]     │
│  └──────────┘  hochgeladen 04.11.2026                                  │
│  Leer: „Noch keine Szenen. Lade die ersten Bilder hoch.“               │
└─────────────────────────────────────────────────────────────────────────┘
```

**Spielerseite und Vollbild**

```
┌─ Die Galerie des Chaos ───────────────────────────────┐
│  Szenen aus unseren Abenteuern · 12 Bilder             │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐               │
│  │ thumb │ │ thumb │ │ thumb │ │ thumb │               │
│  │Burg G…│ │       │ │Der Dr…│ │       │               │
│  └───────┘ └───────┘ └───────┘ └───────┘               │
└────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────── [✕] ┐
│  [‹]           [ Bild, object-contain ]         [›] │
│  Der Fall von Burg Grauzahn                   3 / 12 │
│  Die Helden stürmen das Tor, während …              │
└─────────────────────────────────────────────────────┘
```

**Einstellungen → Benachrichtigungen**

```
┌─ Benachrichtigungen ─────────────────────────────────┐
│ 📱 Push-Benachrichtigungen auf diesem Gerät   [ An ] │
│    Du bekommst alles, was auch in der Glocke steht.  │
│    [Test-Benachrichtigung senden]                    │
│ ⓘ iPhone: Füge Chaos Forge zum Home-Bildschirm hinzu │
│   (Teilen → „Zum Home-Bildschirm“), dann hier        │
│   einschalten.                         (nur iOS-Safari)│
└──────────────────────────────────────────────────────┘
```

## Abstractions and Code Reuse

- `supabase/migrations/`
  - `00233_gallery_images.sql`:
    - Tabelle `gallery_images` mit `set_updated_at`-Trigger und Index `(sort_order DESC)`.
    - RLS nur SELECT.
    - RPC `swap_gallery_order`.
    - Bucket `gallery-images` (public) mit SELECT-Policy.
  - `00234_push_subscriptions.sql`:
    - Tabelle `push_subscriptions` mit RLS: SELECT und DELETE nur eigene.
    - `CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions`.
    - Funktion und Trigger `dispatch_push_notification` (Vault).
- `src/lib/gallery/`
  - `image-variants.ts`: `fitWithin()` (rein), `renderWebp()`, `createImageVariants(file)` (Canvas).
  - `paths.ts`: `galleryPaths(id)`, `isGalleryPath()`, `galleryPublicUrl(path)` (rein).
  - `order.ts`: `nextSortOrders(currentMax, count)` (rein). Für die Pfeile ermittelt der Client mit `neighbourFor(list, id, direction)` nur, ob ▲/▼ aktiv ist. Den Nachbarn für den Tausch bestimmt allein der Server per Query.
  - `upload.ts`: `uploadGalleryFiles(files, onProgress)`, orchestriert prepare → upload → register und sammelt Fehler pro Datei. I/O ist injizierbar für Tests.
- `src/app/master/actions.ts`: `prepareGalleryUpload`, `registerGalleryImages`, `updateGalleryImage`, `deleteGalleryImage`, `moveGalleryImage`. Alle beginnen mit `checkGmSession()`.
- `src/app/master/page.tsx`: lädt `gallery_images` mit und gibt sie als Prop `initialGalleryImages` weiter.
- `src/components/master/`
  - `master-gallery-panel.tsx` (neu): Liste, Upload-Button `<input multiple accept="image/*">`, Fortschritt, ▲▼✎🗑, Edit-Dialog und Bestätigungsdialog.
  - `master-dashboard.tsx`: `TabId` um `"gallery"` erweitern, dynamic import, Render-Zweig.
  - `master-sidebar.tsx`, `master-bottom-nav.tsx`: Tab `gallery` mit dem Icon `Images` (lucide) in `tabs`, `moreTabs` und `MORE_TABS`.
- `src/app/gallery/`
  - `layout.tsx`, nach dem Muster von `party/layout.tsx`.
  - `page.tsx`: `requireAuth`, `getTranslations("gallery")`, Query mit Nutzer-Client, sortiert nach `sort_order DESC`.
  - `loading.tsx`.
- `src/components/gallery/`
  - `gallery-grid.tsx`: Client, öffnet die Lightbox.
  - `gallery-lightbox.tsx`: Portal, Tasten, Wischen, Zähler. Als Muster dienen `image-lightbox.tsx` und das Wischen in `play-mode.tsx:983-1000`.
  - `use-swipe.ts`: kleiner Hook für horizontales Wischen, Schwelle 50 px, vertikale Bewegung dominiert nicht.
- `src/lib/navigation.ts`: neuer Eintrag `{ href: "/gallery", icon: Images, labelKey: "gallery", testId: "nav-gallery", mobileBar: false }` vor `/chat`.
- `src/lib/notifications/`
  - `index.ts`, bisher `notifications.ts`: `createNotification` bleibt, dazu kommt `notifyApprovedUsers`.
  - `describe.ts` (neu): `describeNotification`.
- `src/components/notifications/notification-item.tsx`: nutzt `describeNotification`. Neues Icon `Images` für `gallery_images_added`, `BellRing` für `push_test`.
- `src/lib/supabase/types.ts`:
  - `GalleryImageRow`, `PushSubscriptionRow`.
  - `NotificationType` erweitert um `gallery_images_added` und `push_test`.
- `src/lib/push/`
  - `client.ts`: Browser-Code mit `getPushSupport()` (supported | ios-needs-install | unsupported | denied), `getCurrentSubscription()`, `enablePush(locale)`, `disablePush()`, `urlBase64ToUint8Array()`.
  - `payload.ts`: rein, `buildPushPayload(notification, locale)` → `{ title, body, url, tag }`, nutzt `describeNotification` und `createTranslator`.
  - `send.ts`: Server, `sendPushToUser(service, userId, payload)` mit `web-push`, entfernt 404/410-Abos und aktualisiert `last_used_at`.
- `src/app/api/push/`
  - `subscribe/route.ts`: POST mit Upsert per Endpoint, DELETE per Endpoint. Beide prüfen zuerst `getUser()`.
  - `dispatch/route.ts`: POST mit Secret-Prüfung, lädt die Notification und ruft `sendPushToUser` auf.
  - `test/route.ts`: POST mit `getUser()`, fügt eine `push_test`-Notification für sich selbst ein (Service-Client).
- `public/sw.js`: Push und Klick auf die Benachrichtigung.
- `src/components/settings/push-settings-section.tsx` (neu), eingebunden in `settings-client.tsx` direkt nach der Sektion „Darstellung“.
- `src/lib/backup/tables.ts`: `gallery_images` → `FULL_TABLES`. `push_subscriptions` → `EXCLUDED_TABLES` mit der Begründung „Geräte-Abos, erneuerbar durch Wiedereinschalten“.
- `messages/de.json`, `messages/en.json`: Namespaces `gallery` (neu), `master.gallery*`, `nav.gallery`, `notifications.galleryImagesAdded` und `pushTest`, `settings.push*`.
- `next.config.ts`: Header für `/sw.js`: `Cache-Control: no-cache, no-store, must-revalidate`.

## Bekannte Risiken

- Die bestehende INSERT-Policy auf `notifications` (`00177_notifications.sql:39-41`) erlaubt jedem angemeldeten Nutzer, Benachrichtigungen für beliebige Nutzer anzulegen. Mit Push landen solche Zeilen auf dem Handy. In einer privaten Gruppe mit maximal 10 Nutzern wird das bewusst hingenommen und nicht in diesem PR geändert; die Browser-Einfügestellen (Gold/Item senden) brauchen die Policy weiterhin.

## Logging & Observability

- `/api/push/dispatch`:
  - `console.info("[push] sent", { notificationId, devices: n, removed: k })`
  - `console.error("[push] send failed", { notificationId, statusCode })`
  - Endpoints und Schlüssel werden nie geloggt.
- `registerGalleryImages`:
  - `console.error("[gallery] register failed", error.message)`
  - `notifyApprovedUsers` loggt Fehler wie `createNotification` und bricht den Upload nicht ab.
- pg_net speichert Antworten in `net._http_response`, dort lassen sich Fehler im Supabase-Dashboard nachsehen.

## Implementation

### Phase 1: GM-Galerie (Upload und Verwaltung)

Dependencies: None

Der GM kann im Master-Bereich Bilder hochladen, bearbeiten, sortieren und löschen. Nach einem Upload bekommen die Spieler eine Benachrichtigung in der Glocke. Bis Phase 2 erscheint sie dort noch als Rohtext.

**Tasks**:

- [x] Migration `supabase/migrations/00233_gallery_images.sql` anlegen:
  - Tabelle `gallery_images` mit:
    - CHECKs: `title` höchstens 120 Zeichen, `description` höchstens 2000 Zeichen.
    - `sort_order` mit `UNIQUE … DEFERRABLE INITIALLY DEFERRED`, damit der Tausch im RPC in einer Transaktion erlaubt ist und es keine Gleichstände gibt.
    - `set_updated_at`-Trigger.
    - Index auf `sort_order DESC`.
  - RLS mit genau einer Policy `gallery_images_select`: `FOR SELECT TO authenticated USING (true)`.
  - RPC `swap_gallery_order(a uuid, b uuid)`: `SECURITY DEFINER`, `REVOKE ALL … FROM PUBLIC, authenticated, anon`, `GRANT EXECUTE … TO service_role`.
  - Bucket: `INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('gallery-images','gallery-images', true, 5242880, ARRAY['image/webp']) ON CONFLICT (id) DO NOTHING`.
  - Keine Policy auf `storage.objects`: Öffentliche Buckets liefern `/object/public/` ohne SELECT-Policy aus, und eine Policy ohne Rolle würde anonymes Auflisten erlauben. Uploads autorisiert das signierte Token.
- [x] Typ `GalleryImageRow` in `src/lib/supabase/types.ts` ergänzen, außerdem `"gallery_images_added"` in `NotificationType`.
- [x] `gallery_images` in `FULL_TABLES` von `src/lib/backup/tables.ts` aufnehmen. Kein Eintrag in `src/lib/backup/images.ts`, die Bilddateien bleiben außen vor.
- [x] TDD `src/lib/gallery/paths.test.ts` → `paths.ts`:
  - `galleryPaths(id)` liefert `{ image: "<id>.webp", thumb: "<id>-thumb.webp" }`.
  - `isGalleryPath` akzeptiert nur UUID-Pfade ohne `/` und `..`.
  - `galleryPublicUrl(path)` setzt die URL aus `NEXT_PUBLIC_SUPABASE_URL` zusammen.
- [x] TDD `src/lib/gallery/order.test.ts` → `order.ts`:
  - `nextSortOrders(max, n)`: Das erste ausgewählte Bild bekommt den höchsten Wert. Eine leere Galerie startet bei `max = 0`.
  - `neighbourFor(list, id, "up" | "down")`: Am Rand kommt `null`.
- [x] TDD `src/lib/gallery/image-variants.test.ts` → `image-variants.ts`:
  - `fitWithin`: Querformat, Hochformat und Bilder, die schon klein genug sind (nie hochskalieren).
  - `createImageVariants` mit gemocktem `createImageBitmap` und Canvas: liefert zwei WebP-Blobs mit Maßen. Scheitert das Dekodieren, kommt ein Fehler mit Dateiname.
- [x] Server Actions in `src/app/master/actions.ts`. Jede beginnt mit `checkGmSession()` und arbeitet mit dem Service-Client.
  - `prepareGalleryUpload(count: number)`:
    - `count` zwischen 1 und 20.
    - Pro Bild `crypto.randomUUID()` und zwei `createSignedUploadUrl(path)`.
    - Rückgabe: `{ id, imagePath, imageToken, thumbPath, thumbToken }[]`.
  - `registerGalleryImages(items: { id, width, height }[])`:
    - Pfade aus der `id` neu ableiten, dem Client nicht vertrauen.
    - Prüfen, dass beide Dateien existieren, per `service.storage.from("gallery-images").exists(path)`. Fehlende Einträge auslassen und als `failedIds` melden.
    - `sort_order` per `nextSortOrders` vergeben, Insert mit `created_by = (await getAuthUser())?.id`.
    - Danach `notifyApprovedUsers(service, { exceptUserId, type: "gallery_images_added", details: { count } })`.
    - Rückgabe: die neuen Zeilen.
  - `updateGalleryImage(id, { title, description })`: trimmen, leere Werte zu `null`, Längen prüfen.
  - `deleteGalleryImage(id)`: Zeile laden, `storage.remove([image_path, thumb_path])`, dann Zeile löschen. Kann eine Datei nicht entfernt werden, nur loggen und die Zeile trotzdem löschen.
  - `moveGalleryImage(id, direction)`: Nachbarn per Query ermitteln: „up“ = `sort_order > x` mit `order(sort_order, ascending)`, „down“ = `sort_order < x` mit `order(sort_order, descending)`, jeweils `limit 1`. Dann `rpc("swap_gallery_order")`. Rückgabe: die neue Liste.
- [x] TDD `src/app/master/gallery-actions.test.ts`. Es gibt noch keine Tests für `actions.ts`, und `checkGmSession` lässt sich nicht per `vi.mock` ersetzen, weil es im selben Modul aufgerufen wird. Deshalb:
  - `next/headers` mocken wie in `src/lib/master/auto-share.test.ts:15`, `GM_PIN` setzen und als Cookie `HMAC-SHA256(GM_PIN, "gm-authenticated")` liefern.
  - `@/lib/supabase/service` und `@/lib/supabase/auth` (`getAuthUser`) mocken.
  - Fälle:
  - Ohne Session kommt `Unauthorized`.
  - `count` außerhalb 1..20 wird abgelehnt.
  - `register` ignoriert gefälschte Pfade und Einträge ohne Datei.
  - Es wird genau ein `notifyApprovedUsers` pro Aufruf ausgelöst.
  - `delete` entfernt beide Dateien.
  - `move` am Rand ändert nichts.
- [x] `src/lib/notifications.ts` nach `src/lib/notifications/index.ts` verschieben, inklusive des Tests nach `index.test.ts` (dort den Import `./notifications` auf `./index` ändern; alle anderen Importe nutzen `@/lib/notifications` und bleiben). TDD `notifyApprovedUsers`:
  - Ein Insert mit allen `profiles.is_approved = true` außer `exceptUserId`.
  - Gibt es keine Empfänger, erfolgt kein Insert.
  - Ein Fehler wird nur geloggt.
- [x] TDD `src/lib/gallery/upload.test.ts` → `upload.ts`. `uploadGalleryFiles(files, deps, onProgress)` mit injizierten Abhängigkeiten `prepare`, `upload` und `register`:
  - Fortschritt pro Datei.
  - Eine fehlgeschlagene Datei (Dekodieren oder Upload) landet in `failed[]`, die anderen laufen weiter.
  - `register` wird einmal mit allen erfolgreichen Bildern aufgerufen, in der Reihenfolge der Auswahl.
  - Schlagen alle fehl, wird `register` nicht aufgerufen.
- [x] Komponente `src/components/master/master-gallery-panel.tsx`, laut Mockup:
  - Upload-Button mit `<input type="file" multiple accept="image/*">`.
  - Fortschrittsleiste.
  - Liste der Thumbs als `<img loading="lazy">` (mit `eslint-disable-next-line @next/next/no-img-element` wie in `image-lightbox.tsx:39`) mit Titel, Datum, ▲▼ (deaktiviert am Rand), ✎ (Dialog) und 🗑 (Bestätigung).
  - Fehler und Ergebnis per `toast`.
  - Lokaler State aus `initialGalleryImages`, aktualisiert aus den Rückgabewerten der Actions.
- [x] TDD `src/components/master/master-gallery-panel.test.tsx`:
  - Liste rendert in der richtigen Reihenfolge.
  - ▲ beim ersten und ▼ beim letzten Bild sind deaktiviert.
  - Der Edit-Dialog speichert `null` für leere Felder.
  - Löschen fragt nach.
  - Der leere Zustand zeigt seinen Hinweis.
- [x] Reiter einbinden:
  - `master-dashboard.tsx`: `TabId` um `"gallery"` erweitern, dynamic import, Render-Zweig, Prop `initialGalleryImages`.
  - `master-sidebar.tsx`: `tabs`.
  - `master-bottom-nav.tsx`: `moreTabs` und `MORE_TABS`.
  - `src/app/master/page.tsx`: `gallery_images` im bestehenden `Promise.all` laden.
- [x] i18n `master.galleryTab` und `master.gallery*` (Titel, Upload, Fortschritt, Ergebnis, leerer Zustand, Dialoge) in `messages/de.json` und `messages/en.json`.

**Automated Verification**:

- [x] `npx vitest run src/lib/gallery src/app/master/gallery-actions.test.ts src/lib/notifications src/components/master/master-gallery-panel.test.tsx` ist grün.
- [x] `npx vitest run src/lib/backup/tables.test.ts` ist grün, `gallery_images` ist eingeordnet.
- [x] `npm run verify` ist grün.

**Manual Verification**:

- [ ] Nach Freigabe von `supabase db push` lädt der GM unter `/master` → „Die Galerie des Chaos“ mehrere Handyfotos hoch. Sie erscheinen oben in der Auswahlreihenfolge, die Dateien in Storage sind WebP mit weniger als 1 MB.
- [ ] ✎, ▲▼ und 🗑 funktionieren. Nach 🗑 sind beide Dateien aus dem Bucket verschwunden.

### Phase 2: Spieler-Galerie und Glocke

Dependencies: Phase 1

Spieler sehen die Galerie unter `/gallery` mit Vollbild. Die Glocke zeigt die neue Benachrichtigung verständlich an und führt zur Galerie. Die Text- und Ziel-Logik wird dabei als reine Funktion herausgelöst, Phase 3 nutzt sie wieder.

**Tasks**:

- [x] Zuerst `src/components/notifications/notification-item.test.tsx` als Sicherheitsnetz vor dem Umbau schreiben (bisher gibt es keine Tests der Glocke): Text, Untertitel und Klickziel für `game_date_created`, `session_xp_awarded` und einen Gold-Typ.
- [x] TDD `src/lib/notifications/describe.test.ts` → `describe.ts`. `t` wird als minimaler Typ `(key: string, values?: Record<string, unknown>) => string` übergeben, weil `useTranslations` und `createTranslator` unterschiedliche Generics liefern:
  - Zuerst Charakterisierungstests für alle bestehenden Typen. Message, Untertitel und Ziel müssen dem heutigen Verhalten aus `notification-item.tsx:55-147` entsprechen:
    - `game_date*` führt zu `/settings`.
    - `session_xp_awarded` führt zu `/characters/{id}/manage?openXp=1…`.
    - Gold-Untertitel, Mengen-Untertitel und unbekannte Typen (Rohtext) bleiben gleich.
    - Einzige gewollte Änderung: Die XP-Zahl wird mit `toLocaleString(locale)` formatiert statt ohne Locale (heute `notification-item.tsx:68`), damit der Push auf dem Server „1.000“ statt „1,000“ zeigt.
  - Danach `gallery_images_added`: Text mit `count` (Plural über ICU) und Ziel `/gallery`.
- [x] `notification-item.tsx` auf `describeNotification(notification, t, locale)` umstellen. Klick nutzt `href`. Icon `Images` für `gallery_images_added`. Der neue `notification-item.test.tsx` bleibt grün.
- [x] i18n `notifications.galleryImagesAdded`, zum Beispiel `"{count, plural, one {Der Meister hat eine neue Szene in die Galerie gehängt} other {Der Meister hat # neue Szenen in die Galerie gehängt}}"`, Englisch entsprechend.
- [x] `src/lib/navigation.ts`: Eintrag `/gallery` mit dem Icon `Images` und `mobileBar: false` vor `/chat`. i18n `nav.gallery`: „Galerie“ bzw. „Gallery“.
- [x] `src/app/gallery/layout.tsx` nach dem Muster von `party/layout.tsx`, dazu `loading.tsx` mit Raster-Skeleton.
- [x] `src/app/gallery/page.tsx`:
  - `requireAuth()` und `getTranslations("gallery")`.
  - Nutzer-Client: `from("gallery_images").select("*").order("sort_order", { ascending: false })`.
  - Überschrift „Die Galerie des Chaos“, Untertitel mit Anzahl, `GalleryGrid` oder leerer Zustand.
- [x] TDD `src/components/gallery/use-swipe.test.ts` → `use-swipe.ts`:
  - Links wischen heißt „weiter“, rechts wischen „zurück“.
  - Unter 50 px passiert nichts.
  - Überwiegend vertikale Bewegung wird ignoriert.
- [x] TDD `src/components/gallery/gallery-lightbox.test.tsx` → `gallery-lightbox.tsx`:
  - `createPortal` wie in `image-lightbox.tsx:22` (sonst schlägt `src/test/modal-portal-guard.test.ts` wegen `fixed inset-0` fehl), `<img>` mit ESLint-Disable-Kommentar.
  - Portal mit `role="dialog"`, `aria-modal` und `aria-label` = Titel oder „Szene 3 von 12“.
  - ←/→ blättern. Am ersten Bild gibt es kein ‹, am letzten kein ›, und es wird nicht umgebrochen.
  - Esc und ✕ schließen.
  - Zähler „3 / 12“, Titel und Beschreibung werden nur angezeigt, wenn vorhanden.
  - Der Fokus liegt beim Öffnen auf ✕ und kehrt beim Schließen zur Kachel zurück.
  - `body` scrollt nicht, solange das Vollbild offen ist.
  - Das nächste Vollbild wird vorgeladen (`new Image().src`).
- [x] TDD `src/components/gallery/gallery-grid.test.tsx` → `gallery-grid.tsx`:
  - Raster `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`.
  - Kacheln sind Buttons mit `alt` = Titel oder „Szene N“.
  - Thumbs als `<img loading="lazy">` mit `aspect-[4/3] object-cover` und ESLint-Disable-Kommentar.
  - Ein Tipp öffnet die Lightbox am richtigen Index.
- [x] i18n-Namespace `gallery`: `title`, `subtitle` (Plural), `empty`, `sceneLabel`, `counter`, `previous`, `next`, `close`.

**Automated Verification**:

- [x] `npx vitest run src/lib/notifications src/components/gallery src/components/notifications src/test/modal-portal-guard.test.ts` ist grün.
- [x] `npx vitest run src/test/view-mode-guard.test.ts` ist grün, es gibt kein direktes `matchMedia(min-width)`.
- [x] `npm run verify` ist grün.

**Manual Verification**:

- [ ] Als Spieler am Handy: „Mehr“ → „Galerie“. Das Raster lädt schnell. Im Vollbild funktionieren Wischen, ‹ › und ✕. Am Desktop funktionieren ← → und Esc.
- [ ] Nach einem Upload durch den GM steht in der Glocke des Spielers „Der Meister hat N neue Szenen …“, und ein Klick öffnet `/gallery`.

### Phase 3: Push-Benachrichtigungen aufs Handy

Dependencies: Phase 2, weil `describeNotification` gebraucht wird.

Jede Glocken-Benachrichtigung kommt zusätzlich als Push auf alle Geräte, die das in den Einstellungen eingeschaltet haben.

**Tasks**:

- [x] `npm install web-push` und `npm install -D @types/web-push`.
- [x] Migration `supabase/migrations/00234_push_subscriptions.sql`:
  - Tabelle `push_subscriptions`, siehe Entscheidung 6. RLS mit `SELECT` und `DELETE` `USING (user_id = auth.uid())`, keine INSERT- oder UPDATE-Policy (die Route schreibt mit Service-Client).
  - `CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;`
  - Funktion `public.dispatch_push_notification()`:
    - `SECURITY DEFINER`, `SET search_path = public, extensions`.
    - Liest `push_dispatch_url` und `push_dispatch_secret` aus `vault.decrypted_secrets`.
    - Bricht still ab, wenn einer der Werte fehlt oder `NOT EXISTS (SELECT 1 FROM push_subscriptions WHERE user_id = NEW.user_id)`.
    - Sonst `PERFORM net.http_post(url := url, body := jsonb_build_object('notification_id', NEW.id), headers := jsonb_build_object('Content-Type','application/json','x-push-secret', secret), timeout_milliseconds := 10000)` (10 s wegen Kaltstarts auf Vercel).
  - Trigger `dispatch_push_notification_trigger AFTER INSERT ON public.notifications FOR EACH ROW`.
  - `REVOKE EXECUTE ON FUNCTION public.dispatch_push_notification() FROM PUBLIC, anon, authenticated`. Der Trigger läuft trotzdem.
- [x] Typ `PushSubscriptionRow` und `"push_test"` in `NotificationType` in `src/lib/supabase/types.ts` ergänzen. `push_subscriptions` mit Begründung in `EXCLUDED_TABLES` aufnehmen.
- [x] `describeNotification` und `notification-item.tsx` um `push_test` erweitern: Text `notifications.pushTest`, Ziel `/settings`, Icon `BellRing`. Test in `describe.test.ts`.
- [x] TDD `src/lib/push/payload.test.ts` → `payload.ts`. `buildPushPayload(notification, locale)` nutzt `createTranslator` mit `messages/{locale}.json` und `describeNotification`:
  - Titel „Chaos Forge“.
  - Body = Message, bei Untertitel als „Message – Untertitel“.
  - `url` = `href` oder `/dashboard`.
  - `tag` = Notification-ID.
  - Getestet für `de` und `en`, `gallery_images_added` und `game_date_created`.
  - `push_test` liefert „Push funktioniert! Sven hört mit.“
- [x] TDD `src/lib/push/send.test.ts` → `send.ts`. `sendPushToUser(service, userId, payload, sender)` mit injiziertem `sender` (Default `webpush.sendNotification`):
  - Sendet an alle Abos.
  - Löscht bei `statusCode` 404 oder 410.
  - Andere Fehler zählen nur.
  - Aktualisiert `last_used_at`.
  - Liefert `{ sent, removed, failed }`.
  - VAPID wird per `webpush.setVapidDetails("mailto:" + ADMIN_EMAIL, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)` gesetzt.
  - Fehlen die Env-Variablen, wird geloggt und es kommt `{ sent: 0 }` zurück.
- [x] TDD `src/app/api/push/dispatch/route.test.ts` → `route.ts`:
  - `runtime = "nodejs"`.
  - Ein falsches oder fehlendes `x-push-secret` ergibt 401. Verglichen wird mit `timingSafeEqual` gegen `PUSH_WEBHOOK_SECRET`.
  - Eine unbekannte ID ergibt 404.
  - Sonst wird die Notification geladen und an jedes Abo ein Push in dessen `locale` geschickt, Antwort 200 mit Zählern.
  - Das Payload kommt nur aus der DB, nicht aus dem Request-Body.
- [x] TDD `src/app/api/push/subscribe/route.test.ts` → `route.ts`:
  - POST: `getUser()`, sonst 401. Body mit Endpoint (nur `https://`), Schlüsseln und `locale` validieren. Upsert `onConflict: "endpoint"` mit `user_id = user.id` über den Service-Client.
  - DELETE: löscht über den Service-Client per `endpoint` und `.eq("user_id", user.id)`.
- [x] TDD `src/app/api/push/test/route.test.ts` → `route.ts`: `getUser()`, sonst 401. Zuerst prüfen, ob der Nutzer Abos hat; wenn nicht, 409 mit `noSubscription` und kein Insert. Sonst `createNotification(service, { userId: user.id, type: "push_test", details: {} })`.
- [x] `public/sw.js`:
  - `push`: `event.data.json()` → `self.registration.showNotification(title, { body, tag, icon: "/icon-192x192.png", badge: "/icon-192x192.png", data: { url } })`.
  - `install`: `self.skipWaiting()`. `activate`: `event.waitUntil(self.clients.claim())`.
  - `notificationclick`: Benachrichtigung schließen, `clients.matchAll({ type: "window", includeUncontrolled: true })`, ein gleiches Origin-Fenster fokussieren und `navigate(url)`; schlägt das fehl oder gibt es keins, `clients.openWindow(url)`.
  - Kein Fetch-Handler.
- [x] `next.config.ts`: Header-Regel für `/sw.js` mit `Cache-Control: no-cache, no-store, must-revalidate`. Test in `src/test/next-config.test.ts` ergänzen.
- [x] TDD `src/lib/push/client.test.ts` → `client.ts`:
  - `getPushSupport(env)` mit injizierten `navigator` und `window`:
    - kein `serviceWorker` oder `PushManager` → `unsupported`
    - iOS ohne `display-mode: standalone` bzw. ohne `navigator.standalone` → `ios-needs-install`
    - `Notification.permission === "denied"` → `denied`
    - sonst `supported`
  - `urlBase64ToUint8Array`.
  - `enablePush`: registriert `/sw.js`, fordert die Berechtigung an, `subscribe({ userVisibleOnly: true, applicationServerKey })` und POST an `/api/push/subscribe` mit `locale`.
  - `disablePush`: `unsubscribe` und DELETE.
- [x] TDD `src/components/settings/push-settings-section.test.tsx` → `push-settings-section.tsx`:
  - `GlassCard` „Benachrichtigungen“ mit `Switch`.
  - Der Status wird beim Mounten über `getCurrentSubscription()` ermittelt.
  - Je nach Support-Status gibt es Hinweise für iOS-Installation, abgelehnte Berechtigung und fehlenden Support. In diesen Fällen ist der Schalter deaktiviert.
  - Testbutton nur, wenn eingeschaltet, mit Toast bei Erfolg oder Fehler.
  - Besteht beim Mounten ein Abo, wird es mit der aktuellen `locale` erneut gepostet (Upsert ist idempotent). So passt die Push-Sprache nach einem Sprachwechsel, der die Seite neu lädt (`settings-client.tsx:138-149`).
- [x] `settings-client.tsx`: `<PushSettingsSection />` direkt nach der Sektion „Darstellung“ einbinden.
- [x] Abmelden: In den Logout-Handlern (`app-sidebar.tsx`, `app-nav.tsx`, `master-sidebar.tsx` bzw. dem gemeinsamen Logout-Button) vor `signOut()` `disablePush()` aufrufen, Fehler ignorieren. Test für den Handler.
- [x] i18n `settings.push*` (Titel, Schalter, Hinweistexte, Test, Erfolg, Fehler) und `notifications.pushTest` in de und en.
- [x] `.env.local.example` sowie CLAUDE.md-Env-Liste: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `PUSH_WEBHOOK_SECRET`.

**Automated Verification**:

- [x] `npx vitest run src/lib/push src/app/api/push src/components/settings src/test/next-config.test.ts src/lib/backup` ist grün.
- [x] `npm run verify` ist grün.

**Manual Verification**:

- [ ] Einmalige Einrichtung durch den User:
  - `npx web-push generate-vapid-keys` ausführen.
  - In Vercel `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` und `PUSH_WEBHOOK_SECRET` (zufällig, zum Beispiel `openssl rand -hex 32`) setzen.
  - Nach Freigabe `supabase db push` ausführen.
  - Im SQL-Editor anlegen: `select vault.create_secret('https://adnd-chaos-forge.vercel.app/api/push/dispatch', 'push_dispatch_url');` und `select vault.create_secret('<PUSH_WEBHOOK_SECRET>', 'push_dispatch_secret');`
- [ ] iPhone mit der App auf dem Homescreen: Einstellungen → Push einschalten → Test-Benachrichtigung kommt an. Ein Tipp darauf öffnet die App.
- [ ] Ein GM-Upload in die Galerie erzeugt auf dem Handy eines Spielers einen Push. Ein Tipp öffnet `/gallery`.
- [ ] Nach dem Ausschalten kommt kein Push mehr. In Safari ohne Homescreen erscheint der Installationshinweis.

### Phase 4: Dokumentation, Datenschutz, Release

Dependencies: Phase 3

Nutzerdokumentation und Rechtstexte werden nachgezogen. Danach folgen Code Review und QA laut CLAUDE.md.

**Tasks**:

- [x] `src/app/datenschutz/page.tsx`:
  - §3: Szenenbilder des GM, die Personen am Spieltisch zeigen können, sichtbar für alle angemeldeten Mitglieder und über die Bild-URL abrufbar.
  - §3/§5: Push-Abos (Geräte-Endpoint, Sprache, Browserkennung) und Zustellung über die Push-Dienste des Browsers (Apple, Google, Mozilla). Abschalten jederzeit möglich, das Abo wird beim Ausschalten bzw. mit dem Konto gelöscht.
  - Ein bestehender Datenschutz-Test wird ergänzt, falls vorhanden.
- [x] `src/lib/rulebook-chat/system-prompt.ts` → `APP_HELP_CONTEXT`: Abschnitte „GALERIE“ (wo, wer lädt hoch, Vollbild-Bedienung) und „PUSH“ (Einstellungen, iPhone-Homescreen). Test in `system-prompt.test.ts` ergänzen.
- [x] `src/lib/release-notes/releases.ts`:
  - `ReleaseIcon` (`releases.ts:10`) um `"gallery"` und `"push"` erweitern, dazu das `ICONS`-Mapping in `src/components/release-notes/release-notes-list.tsx:10`.
  - Neuer Eintrag oben mit dem Release-Tag als ID: „Die Galerie des Chaos“ und „Push aufs Handy“, de und en.
  - `releases.test.ts` ist grün.
- [x] `CLAUDE.md`:
  - Projektstruktur: `app/gallery`, `components/gallery`, `lib/gallery`, `lib/push`, `lib/notifications/describe.ts`, `public/sw.js`, `api/push/*`.
  - Supabase:
    - Storage: Bucket `gallery-images`.
    - Neue Absätze „Galerie des Chaos“ (signierte Uploads, nur GM, sort_order/Swap-RPC, Benachrichtigung aus der Action, Dateien nicht im Backup) und „Push“ (Webhook/pg_net/Vault, VAPID-Env, Abo pro Gerät, 404/410-Aufräumen, Texte über `describeNotification`).
    - Migrationszahl anpassen.
  - Env-Variablen ergänzen.
  - Roadmap: Punkt 33.
- [x] Phase 3 laut CLAUDE.md, Code Review: eigenen Diff prüfen, Mängel beheben.
- [x] ~~Phase 4 laut CLAUDE.md, QA: explorative Tour mit dem Agent `exploratory-tester` (GM-Upload, Spieler-Galerie mobil und Desktop, Glocke, Einstellungen Push). Für jeden Bug zuerst einen roten Test schreiben.~~ — auf Wunsch des Users am 2026-11-04 entfallen.

**Automated Verification**:

- [x] `npx vitest run src/lib/release-notes src/lib/rulebook-chat/system-prompt.test.ts` ist grün.
- [x] `npm run verify` ist grün.

**Manual Verification**:

- [ ] Nach dem Login erscheint der Release-Dialog mit „Die Galerie des Chaos“ und „Push aufs Handy“. Die Datenschutzseite enthält die neuen Abschnitte.

## Implementation Notes

- Phase 1: Die Galerie-Actions liegen in `src/app/master/gallery-actions.ts` statt in `actions.ts` (das schon über 1.200 Zeilen hat). Sie importieren `checkGmSession` aus `./actions`; dadurch lässt sich die GM-Prüfung im Test per `vi.mock("./actions")` ersetzen, ohne Cookie-HMAC nachzubauen.
- Phase 4: Release-Eintrag hat die ID `2026-11-04`. Wird an einem späteren Tag gemergt, ID und Datum auf den Merge-Tag anpassen.
- Phase 4: Migrationen 00233/00234 nach Freigabe am 2026-11-04 per `supabase db push` ins Live-Projekt eingespielt (Bucket, Tabelle, pg_net, Trigger geprüft). Die explorative QA-Tour hat der User gestrichen.
- Phase 3: Abmelden läuft über den neuen Helfer `src/lib/supabase/sign-out.ts` (`disablePush()` → `auth.signOut()`), genutzt von `app-sidebar.tsx`, `logout-button.tsx` (Mobile-Nav, GM-Bottom-Nav) und `master-sidebar.tsx`. Die Kontolöschung braucht das nicht: `push_subscriptions` hängt per `ON DELETE CASCADE` am Konto.
- Phase 3: `enablePush` fragt zuerst die Berechtigung ab und registriert erst danach den Service Worker, weil Safari den Dialog nur direkt nach einem Tipp zeigt.
- Phase 1: `createImageVariants` liest Fotos mit `imageOrientation: "from-image"` (EXIF-Drehung von Handyfotos) und lehnt ab, wenn der Browser statt WebP auf PNG zurückfällt. Mehr als 20 ausgewählte Bilder: die ersten 20 werden hochgeladen, mit Hinweis.

- Freigaben aus dem Planungsgespräch am 2026-11-04:
  - Upload über signierte URLs (A).
  - Push im selben PR (B).
  - Ein Schalter pro Gerät (A).
  - Zwei WebP-Fassungen (A).
  - GM-Panel und Spieleransicht wie im Mockup, neue Bilder oben, kein Umlauf beim Blättern, kein Download-Button.
- Bilder sofort sichtbar. Titel und Beschreibung optional. Bilddateien nicht im Backup.
- Regeln aus früheren Sessions:
  - Vor `supabase db push` gegen das Live-Projekt immer die Bestätigung des Users einholen.
  - Commits und PRs nur auf ausdrücklichen Wunsch.

## References

- Research: `docs/agents/research/2026-11-04-gallery-of-chaos.md`
- Supabase Storage: `createSignedUploadUrl` / `uploadToSignedUrl` in `node_modules/@supabase/storage-js/dist/index.d.mts:946-1001` (Upsert über `createSignedUploadUrl({ upsert })`, signierte URLs 2 h gültig)
- Next Server-Action-Limit: `node_modules/next/dist/server/app-render/action-handler.js:514-540`
- Muster: `src/app/master/actions.ts:977-1009` (Upload), `supabase/migrations/00229_game_dates.sql` (RLS, Empfänger), `src/components/image-lightbox.tsx`, `src/components/play-mode/play-mode.tsx:983-1000` (Wischen)
- Web Push auf iOS: ab iOS 16.4 nur für zum Home-Bildschirm hinzugefügte Web-Apps
