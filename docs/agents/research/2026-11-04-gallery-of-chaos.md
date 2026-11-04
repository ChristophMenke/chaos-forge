---
date: 2026-11-04T19:30:48.032745+00:00
git_commit: 302ca456e73d8e1b52e61f5a8afc821346683199
branch: feature/gallery-of-chaos
topic: "Ist-Zustand für eine „Galerie des Chaos“ (GM lädt Szenenbilder hoch, Spieler sehen sie)"
tags: [research, codebase, master, storage, upload, navigation, lightbox, notifications, backup]
status: complete
---

# Research: Ist-Zustand für eine „Galerie des Chaos“

## Research Question

Dokumentation des Ist-Zustands für sechs Bereiche:

1. Aufbau des Master-Bereichs `/master`: PIN-Gate, Panel-Struktur, Datenzugriff der GM-Panels und Prüfung der GM-Session.
2. Bild-Uploads: Buckets, Storage-Policies, Client-Kompression, Upload- und Lösch-Code sowie Größenlimits.
3. Spieler-Navigation und wie eine neue Seite eingebunden wird.
4. Vorhandene Vollbild- und Galerie-Komponenten.
5. Benachrichtigungen.
6. Pflichtstellen, die bei einer neuen Tabelle anzupassen sind.

## Summary

- **Wer als GM gilt:** Es gibt keine GM-Rolle in der Datenbank. GM ist jeder eingeloggte Nutzer, der zusätzlich ein gültiges `gm_session`-Cookie aus der PIN-Eingabe hat.
  - Das Cookie gilt nur für den Pfad `/master` und läuft nach 24 Stunden ab.
  - GM-Schreibzugriffe laufen über Server Actions in `src/app/master/actions.ts`. Jede Action prüft zuerst `checkGmSession()` und schreibt dann mit dem Service-Client, also unter Umgehung von RLS.
  - RLS selbst unterscheidet den GM nicht.
- **Panels im Master-Bereich:** Welcher Reiter offen ist, steht im lokalen State (`TabId`) von `MasterDashboard`, nicht in der URL. Die Panels werden per `next/dynamic` nachgeladen.
  - Einen Reiter gibt es an drei Stellen: in der Sidebar (`tabs`), in der Bottom-Nav (`primaryTabs` bzw. `moreTabs` plus `MORE_TABS`) und im Render-Zweig des Dashboards.
- **Buckets:** Alle Buckets sind öffentlich lesbar. Keiner setzt ein Größen- oder MIME-Limit.
  - Bilder werden auf zwei Wegen hochgeladen:
    - im Browser mit dem Nutzer-Client: Avatare, NPC-Avatare, Profilbilder
    - in einer Server Action oder API-Route mit dem Service-Client: Monsterbilder, Session-Bilder
  - Ein Upload per Server Action unterliegt dem Next-Standardlimit von **1 MB** pro Request. `next.config.ts` setzt kein `serverActions.bodySizeLimit`.
- **Kompression:** `compressImageIfNeeded()` ist zurzeit nur vor dem KI-Monster-Scan im Einsatz, mit maximal 1920 px, JPEG und 3 MB.
- **Spieler-Navigation:** Sie kommt aus einem gemeinsamen Array `NAV_ITEMS`. Sidebar und Bottom-Nav lesen beide daraus; über `mobileBar` wird zwischen Leiste und „Mehr“-Menü entschieden.
- **Vollbild:** Es gibt nur `ImageLightbox` für ein einzelnes Bild mit Escape zum Schließen. Pfeiltasten-Navigation, Wischen oder eine Karussell-Bibliothek gibt es nicht.
- **Benachrichtigungen:** Sie entstehen auf zwei Wegen, beide schreiben in `notifications`.
  - Server-seitig über `createNotification(service, …)` aus GM-Actions. Diese Variante kennt nur einen Empfänger pro Aufruf.
  - Über einen DB-Trigger, wie bei `game_dates`. Er schreibt eine Zeile für alle freigegebenen Nutzer außer dem Auslöser.
  - Die Glocke übersetzt den Typ über `messageMap` und legt fest, wohin ein Klick führt.

```
src/
  app/
    master/
      page.tsx                 # requireAuth → checkGmSession → PinGate | Dashboard; lädt Daten mit Service-Client
      actions.ts               # "use server": verifyPin, checkGmSession, alle GM-Writes (Service-Client)
      npcs/…                   # weitere Seiten mit checkGmSession()
    party/layout.tsx           # Muster-Layout: requireAuth + AppSidebar + AppNav
    party/page.tsx             # Muster-Seite: requireAuth, getTranslations, TutorialOverlay
    sessions/page.tsx          # getOptionalUser + ApprovalGate
    api/generate-session-image/route.ts  # Session-Bild (Service-Client Upload)
    datenschutz/page.tsx       # Abschnitte zu Bildern / Backup
  components/
    master/
      master-dashboard.tsx     # TabId, dynamic imports, Render-Zweige
      master-sidebar.tsx       # tabs-Array (Desktop)
      master-bottom-nav.tsx    # primaryTabs / moreTabs / MORE_TABS (Mobil)
      master-bestiary-panel.tsx # Bild-Upload via Server Action, Fullscreen-Overlay
      master-pin-gate.tsx
    image-lightbox.tsx         # Einzelbild-Lightbox (Escape, Klick schließt)
    app-sidebar.tsx / app-nav.tsx  # lesen NAV_ITEMS
    notifications/notification-bell.tsx / notification-item.tsx
  lib/
    navigation.ts              # NAV_ITEMS
    notifications.ts           # createNotification()
    utils/image-compression.ts # compressImageIfNeeded()
    avatar/upload.ts, npc-upload.ts, profile-upload.ts, resize.ts
    backup/tables.ts (+ tables.test.ts)
    release-notes/releases.ts, index.ts
    tutorial/steps.ts
    supabase/types.ts          # Row-Typen, NotificationType
supabase/migrations/
  00005 avatars · 00065 npc-avatars · 00184 monster-images · 00188 session-images · 00220 profile-avatars
  00177 notifications · 00217 enforce_approval · 00229 game_dates (RLS + Notify-Trigger)
  höchste Nummer: 00232_profiles_last_seen_release.sql
```

### Ablauf eines GM-Uploads heute (Monsterbild)

```
Browser (master-bestiary-panel)           Server Action (actions.ts)            Supabase
──────────────────────────────           ──────────────────────────            ────────
<input type=file accept=image/*>
  FormData{file}  ───────────────────▶  uploadMonsterImage(id, fd)
  (keine Kompression,                     checkGmSession()  (Cookie /master)
   Next-Limit 1 MB pro Request)           service.storage.upload(upsert) ───▶  monster-images/<id>.<ext>
                                          getPublicUrl()
                                          service.from("monsters").update ──▶  monsters.image_url
  ◀──────────────── { imageUrl } ───────
  setImageUrl(url + "?t=" + now)
```

## Detailed Findings

### 1. Master-Bereich `/master`

**PIN-Gate und GM-Session**

- `src/app/master/page.tsx:28-32`: Die Seite ruft zuerst `requireAuth()` auf, eine normale Anmeldung ist also Pflicht. Danach folgt `checkGmSession()`. Ohne gültige Session wird `<MasterPinGate />` gerendert.
- `src/app/master/actions.ts` ist eine `"use server"`-Datei:
  - `:19-20`: das Cookie `gm_session`, Max-Age 24 h.
  - `:22-25`: ein Rate-Limit im Speicher. Nach 5 Fehlversuchen ist 15 Minuten gesperrt.
  - `:27-31`: `createToken()`, ein HMAC-SHA256 über `"gm-authenticated"` mit `GM_SESSION_SECRET` (ersatzweise `GM_PIN`).
  - `:33-64`: `verifyPin()` vergleicht mit `GM_PIN` und setzt ein httpOnly-Cookie mit `sameSite: lax` und `path: "/master"`.
  - `:66-80`: `checkGmSession()` vergleicht das Cookie per `timingSafeEqual`. Das ist der einzige GM-Prüf-Helfer.
- `checkGmSession()` wird außerdem in diesen Dateien aufgerufen:
  - `src/app/master/npcs/layout.tsx:10`
  - `npcs/[id]/play/page.tsx:28`
  - `npcs/[id]/manage/page.tsx:32`
  - `npcs/[id]/print/page.tsx:29`
- Keine API-Route unter `src/app/api/*` ruft `checkGmSession` auf. Wegen `path: "/master"` erreicht das Cookie `/api/*` auch gar nicht.
- **Wer als GM gilt:** In den Migrationen gibt es keine Spalte wie `is_gm`.
  - `/master` prüft nicht auf den Admin. `isAdminEmail` (`src/lib/admin.ts:6-10`) kommt in Einstellungen, Admin-Freigabe, Backup, Kontolöschung und Session-Seite vor.
  - RLS unterscheidet den GM ebenfalls nicht. Ein Beispiel ist `chronicle_npcs`: `FOR ALL TO authenticated USING (true)` in `00039_chronicle_npcs.sql:16-18`.

**Panel-Struktur**

- `src/components/master/master-dashboard.tsx`:
  - `:26-55`: Jedes Panel wird per `next/dynamic` geladen, mit `PanelSkeleton` als Ladeanzeige. Nur `MasterPartyPanel` ist statisch importiert (`:11`).
  - `:101-102`: `export type TabId = "party" | "items" | "gold" | "chat" | "npcs" | "bestiary" | "combat" | "bookmarks"`.
  - `:119`: Der offene Reiter steht in `useState<TabId>("party")`. Es gibt keinen URL-Parameter.
  - `:445-522`: Die Panels werden mit `{activeTab === "x" && <Panel …/>}` gerendert.
- `src/components/master/master-sidebar.tsx:31-39`: das `tabs`-Array mit Id, Lucide-Icon und Label aus `t("…Tab")`. Der Chat ist ein eigener Button (`:76-95`).
- `src/components/master/master-bottom-nav.tsx`:
  - `:18`: `MORE_TABS`
  - `:38-43`: `primaryTabs` mit party, items, gold und chat
  - `:45-50`: `moreTabs` mit npcs, bestiary, bookmarks und combat
- i18n: Der Namespace `master` beginnt in `messages/de.json:1493`. Die Reiter-Labels heißen `partyTab`, `bestiaryTab`, `combatTab` usw.
- Startdaten: `page.tsx:41-96` lädt sie mit dem Service-Client (`:39`) und reicht sie als Props an `MasterDashboard` weiter (`:174-187`).
- Auto-Share: `page.tsx:36` ruft `shareActiveCharactersWith(user.id)` in `after()` auf.

**Datenzugriff der GM-Panels**

- Geschrieben wird über Server Actions mit `createServiceClient()` nach `checkGmSession()`. Der Browser-Client kommt im Dashboard nur für Realtime bzw. HP-Polling und den Logout vor.
- **Bestiarium:**
  - `master-bestiary-panel.tsx:1135-1155`: `handleImageUpload` schickt `FormData{file}` an `uploadMonsterImage`, ohne Kompression.
  - `actions.ts:977-1009`: Pfad `${monsterId}.${ext}`, Upload mit `upsert: true` ohne `contentType`, dann `getPublicUrl` und ein Update von `monsters.image_url`. Der Client hängt `?t=` an.
  - `deleteMonsterGm` (`:1180-1186`) löscht nur die Zeile, die Datei im Storage bleibt.
- **NPCs:**
  - `master-npcs-panel.tsx` ruft `createNpc`, `updateNpc`, `deleteNpc` und `createNpcFromCharacter` auf (`actions.ts:797-923`).
  - Das Panel hat keinen Avatar-Upload. Den gibt es nur in der Session-UI, siehe Abschnitt 2.

### 2. Bild-Uploads und Storage

**Buckets** (keiner setzt `file_size_limit` oder `allowed_mime_types`, keine Policy prüft die Freigabe)

| Bucket          | Migration                               | Lesen | Schreiben                                                                 |
| --------------- | --------------------------------------- | ----- | ------------------------------------------------------------------------- |
| avatars         | `00005_avatar_storage.sql:5-37`         | alle  | INSERT/UPDATE/DELETE nur im eigenen Ordner (`foldername[1] = auth.uid()`) |
| npc-avatars     | `00065_npc_avatars.sql:5-30`            | alle  | INSERT/UPDATE/DELETE für `authenticated`, nur `bucket_id` wird geprüft    |
| monster-images  | `00184_monster_images.sql:5-24`         | alle  | INSERT/UPDATE/DELETE für `authenticated`, nur `bucket_id` wird geprüft    |
| session-images  | `00188_session_image.sql:6-23`          | alle  | INSERT/UPDATE für `authenticated`, **keine DELETE-Policy**                |
| profile-avatars | `00220_profile_avatars_bucket.sql:5-34` | alle  | eigener Ordner                                                            |
| voice-notes     | keine                                   | –     | im Dashboard angelegt (Kommentar in `00030_voice_notes.sql`)              |

Gelesen wird über `getPublicUrl()`. `next.config.ts` erlaubt `next/image` für `https://<supabase-host>/storage/v1/object/public/**` und setzt `minimumCacheTTL: 86400`.

**Client-Kompression** (`src/lib/utils/image-compression.ts`)

- Einziger Export ist `compressImageIfNeeded(file, { maxDimension = 1920, quality = 0.85, maxSizeBytes = 3 MB })` (`:28`).
- Verhalten:
  - Dateien, die keine Bilder sind oder schon unter dem Limit liegen, gibt die Funktion unverändert zurück (`:39`, `:42`).
  - Größere Bilder werden auf `maxDimension` skaliert und als JPEG gespeichert, mit absteigender Qualität 0,85 → 0,30.
  - Liegt das Ergebnis danach noch über dem Limit, kommt trotzdem der letzte Versuch zurück (`:58-77`).
- Die JSDoc in `:12` nennt 8 MB, der Code verwendet 3 MB.
- Einzige Aufrufstelle ist `master-bestiary-panel.tsx:188` vor dem KI-Scan.

**WebP-Pipeline für Avatare** (`src/lib/avatar/`)

- `upload.ts`:
  - `validateFile` lässt JPEG, PNG und WebP bis 10 MB zu (`:5-6`).
  - Zuschnitt auf 400×400 WebP über `resize.ts`.
  - Pfad `${userId}/${characterId}.webp`, erst `remove`, dann `upload` mit upsert, dann `getPublicUrl`.
- `npc-upload.ts`:
  - Pfad `${npcId}.webp`, upsert, `contentType: "image/webp"`.
  - Cache-Buster `?t=`, danach Update von `chronicle_npcs.avatar_url`.
  - `deleteNpcAvatar` entfernt die Datei (`:57-61`). `npc-manager.tsx:117` entfernt sie auch, wenn der NPC gelöscht wird.
- `profile-upload.ts`: Pfad `${userId}/profile.webp`.

**Session-Bild**

- `src/app/api/generate-session-image/route.ts`:
  - `getUser()` (`:11-14`)
  - KI-Bild 1200×450 (`:82`)
  - Upload mit dem Service-Client nach `${sessionId}.webp` (`:85-88`)
  - `getPublicUrl()` (`:96`)
- In der Session-Detailansicht gibt es keine Lightbox (`session-detail.tsx:99`).

**Größenlimits**

- Server Actions: Das Next-Standardlimit liegt bei 1 MB, siehe `node_modules/next/dist/server/app-render/action-handler.js:514-540`. Größere Requests scheitern mit 413 „Body exceeded … limit“. Im Projekt ist `serverActions.bodySizeLimit` nicht gesetzt.
- API-Routen auf Vercel: Grenze 4,5 MB. Darauf verweisen `image-compression.ts:18-21` und `api/scan-monster/route.ts:1-4`.
- Direkte Browser-Uploads in Supabase Storage (Nutzer-Client) laufen nicht über Vercel.

**Mehrfach-Upload** (`<input multiple>`)

- Es gibt ihn an drei Stellen:
  - `master-bestiary-panel.tsx:403-412`
  - `character-rescan/scan-upload-panel.tsx:106`
  - `characters/import/page.tsx:508`
- Alle drei schicken FormData an eine API-Route, nicht in den Storage.

### 3. Spieler-Navigation und neue Seiten

- `src/lib/navigation.ts:4-47`: `NAV_ITEMS` mit den Feldern `{ href, icon, labelKey, testId, mobileBar }`.
  - Die vier Einträge mit `mobileBar: true` stehen in der Leiste: /dashboard, /characters, /sessions, /party.
  - Die Einträge mit `mobileBar: false` erscheinen im „Mehr“-Menü: /characters/import, /chat.
  - Die Icons stammen aus `lucide-react`, dazu kommt `SvenBotIcon`.
- `src/components/app-sidebar.tsx`:
  - Schleife über `NAV_ITEMS` in `:40`.
  - Ein Eintrag gilt nicht als aktiv, wenn eine spezifischere Route passt (`:41-49`).
  - Labels über `useTranslations("nav")` (`:22`).
- `src/components/app-nav.tsx`:
  - `barItems` und `moreNavItems` (`:27-28`), das „Mehr“-Menü in `:54-125`.
  - Die Glocke sitzt in `:83`.
- Andere Stellen mit Routenlisten:
  - `src/lib/release-notes/index.ts:31`: `SKIPPED_PREFIXES`. Eine neue Spielerseite außerhalb dieser Liste zeigt den Release-Dialog.
  - `src/components/app-header.tsx:7` und `approval-banner.tsx:8`: immersive Routen `["/login", "/master"]`.
  - `src/proxy.ts` hat keine Routenliste.
- Musterseite:
  - `src/app/party/layout.tsx` ruft `requireAuth()` und `getUserNavContext()` auf und rendert `AppSidebar` und `AppNav` mit Versatz `sm:ml-[4rem…] xl:ml-[12rem…]`.
  - `src/app/party/page.tsx`: `requireAuth()` (`:28`), `getTranslations("party")` (`:29`), `createClient()` mit Queries und `<TutorialOverlay page="party" />` (`:123`).
  - `src/app/sessions/page.tsx` nutzt dagegen `getOptionalUser()` (`:42`) und `<ApprovalGate>` für Schreib-Bedienelemente (`:110-114`).
- `ApprovalProvider` ist im Root-Layout eingebunden (`src/app/layout.tsx:93`). `useApproval()` liefert `{ userId, isApproved, isLoading }` (`approval-provider.tsx:101`).
- Tutorial: Es ist seitenbezogen in `src/lib/tutorial/steps.ts:18` definiert, mit den Schlüsseln dashboard, characters, party und chronicle.

### 4. Vollbild- und Galerie-Komponenten

- `src/components/image-lightbox.tsx`: `ImageLightbox({ src, alt, onClose })`.
  - Portal mit `role="dialog"` und `aria-modal`.
  - Escape und ein Klick auf den Hintergrund schließen es. Das Bild ist `80vh × 80vw`, `object-contain`.
  - Es gibt kein Blättern.
  - Benutzt in `character-sheet.tsx:2266` und `session/npc-manager.tsx:381`.
- Im Bestiarium gibt es ein eigenes Vollbild-Overlay: `master-bestiary-panel.tsx:1193-1226` mit Escape und Taste P.
- Wischen kommt nur im Play Mode vor, zum Wechseln der Panels: `play-mode/play-mode.tsx:983-1000` (touchstart/touchend), eingebunden in `:1239`.
- In `package.json` steht keine Karussell- oder Lightbox-Bibliothek, weder embla noch swiper.
- In der Memory ist eine Nutzerpräferenz festgehalten: Kartengalerien immer mit Vollbild und Pfeiltasten-Navigation.

### 5. Benachrichtigungen

- **Tabelle:** `supabase/migrations/00177_notifications.sql:2-44`.
  - Spalten: `id`, `user_id` (→ auth.users), `character_id` (nullable), `type text`, `details jsonb`, `is_read`, `created_at`.
  - RLS: Jeder liest und ändert nur die eigenen Zeilen, einfügen darf jeder `authenticated`.
  - Die Tabelle ist Teil der Realtime-Publication (`:44`).
- **TypeScript:**
  - `NotificationType`-Union in `src/lib/supabase/types.ts:630-642`
  - `NotificationRow` in `:644-652`
- **Server-Helfer:** `src/lib/notifications.ts`.
  - `createNotification(supabase, { userId, characterId?, type, details })` fügt eine Zeile ein.
  - Ein Fehler wird nur geloggt.
  - Aufgerufen wird er aus GM-Actions mit dem Service-Client, etwa `actions.ts:150` für `gm_item_received`.
- **Trigger-Muster** `notify_game_date_change()` in `00229_game_dates.sql:58-126`:
  - Die Funktion ist `SECURITY DEFINER` und läuft `AFTER INSERT OR UPDATE OR DELETE`.
  - Ausnahmen:
    - `auth.uid()` ist NULL: System-Kontext, auch Service-Role (`:71`).
    - Die E-Mail des Auslösers endet auf `@qa.chaosforge.test` (`:77-82`).
  - Empfänger sind alle `profiles` mit `is_approved = true AND id <> actor` (`:116-118`).
  - Wichtig für GM-Actions mit dem Service-Client: Dort ist `auth.uid()` NULL, ein solcher Trigger würde also keine Benachrichtigung erzeugen.
- **Glocke:**
  - `notification-bell.tsx:54-66` hört über den Realtime-Kanal `user-notifications-${instanceId}` auf INSERT.
  - `notification-item.tsx`:
    - `messageMap` (`:59-77`) übersetzt im Namespace `notifications`. Unbekannte Typen erscheinen als Rohtext (`:80`).
    - Untertitel `:88-104`, Icon-Wahl `:113-121`.
    - Ein Klick auf `game_date*` führt zu `/settings` (`:133-135`), einer auf `session_xp_awarded` zum XP-Dialog (`:139-147`). Andere Typen haben kein Ziel.

### 6. Pflichtstellen bei neuen Tabellen

- **Backup:** `src/lib/backup/tables.ts` hat `FULL_TABLES` (`:8`), `CUSTOM_ROW_TABLES` (`:40`) und `EXCLUDED_TABLES` mit Begründung (`:50`). `tables.test.ts:26-35` liest die Migrationen und schlägt fehl, wenn eine Tabelle in keiner oder mehreren Listen steht.
  - Bilder lädt der Browser in `src/lib/backup/images.ts`. Avatare, NPCs und Session-Bilder kommen dort aus den öffentlichen Buckets.
- **Freigabe:** `enforce_approval()` ist in `00217_approval_enforcement_triggers.sql:10-83` definiert und prüft `public.is_approved_user()`.
  - Spätere Tabellen hängen den Trigger selbst an, zum Beispiel `00229_game_dates.sql:48-50` (BEFORE INSERT/UPDATE/DELETE).
  - Für den Service-Client ist `auth.uid()` NULL. `enforce_approval()` lässt solche Writes deshalb ohne Prüfung durch (`00217:18-20`). `is_approved_user()` selbst (`00216_user_approval.sql:15-25`) liest `profiles.is_approved` für `auth.uid()`, ohne Treffer ergibt es `false`.
- **RLS-Muster:** in `00229_game_dates.sql:29-45`. RLS ist aktiv, dazu vier Policies, jeweils `auth.role() = 'authenticated'`. Hinzu kommt ein `set_updated_at`-Trigger (`:21`).
- **Realtime:** über `ALTER PUBLICATION supabase_realtime ADD TABLE …`. Beispiele:
  - `00230_character_effects.sql:57`
  - `00231_…:123`
  - `00203_enable_realtime_shared_tables.sql:4-9`
  - `game_dates` ist nicht Teil der Publication.
- **Row-Typen:** in `src/lib/supabase/types.ts`, zum Beispiel `GameDateRow` (`:619`), `NotificationRow` (`:644`) und `CharacterEffectRow` (`:720`).
- **Release Notes:** in `src/lib/release-notes/releases.ts`. Der neueste Eintrag ist `id: "2026-11-02"` (`:32`), getestet wird in `releases.test.ts`.
- **Datenschutz:**
  - `src/app/datenschutz/page.tsx` nennt in §3 die verarbeiteten Daten (`:37`) mit Profilbild bzw. Avatar (`:41`).
  - Gemini-Bilder stehen in `:59`, Backup mit hochgeladenen Bildern in `:63-67`, Bildgenerierung unter §5 (`:86`, `:112`).
- **CLAUDE.md:** In den Abschnitten Projektstruktur, Supabase (Storage-Buckets, Migrationszahl 230) und Roadmap steht der Stand jedes Features.
- **Migrationen:** Es gibt 230 Dateien, die höchste ist `00232_profiles_last_seen_release.sql`.

## Code References

- `src/app/master/actions.ts:19-80` – GM-Cookie, `verifyPin`, `checkGmSession`
- `src/app/master/actions.ts:150` – `createNotification` aus einer GM-Action
- `src/app/master/actions.ts:977-1009` – `uploadMonsterImage` (Service-Client, upsert)
- `src/app/master/page.tsx:28-96,174-187` – Gate, Datenladen, Props
- `src/components/master/master-dashboard.tsx:26-55,101-102,119,445-522` – Panels und TabId
- `src/components/master/master-sidebar.tsx:31-39` – Sidebar-Tabs
- `src/components/master/master-bottom-nav.tsx:18,38-50` – Mobile-Tabs
- `src/components/master/master-bestiary-panel.tsx:188,1135-1155,1193-1226` – Kompression, Upload, Vollbild
- `src/lib/utils/image-compression.ts:7-77` – `compressImageIfNeeded`
- `src/lib/avatar/upload.ts`, `npc-upload.ts`, `resize.ts` – WebP-Pipeline und Lösch-Code
- `src/lib/navigation.ts:4-47` – `NAV_ITEMS`
- `src/app/party/layout.tsx`, `src/app/party/page.tsx` – Muster für eine Spielerseite
- `src/components/image-lightbox.tsx` – Einzelbild-Lightbox
- `src/lib/notifications.ts` – `createNotification`
- `src/components/notifications/notification-item.tsx:59-147` – Typ → Text, Icon, Link
- `src/lib/supabase/types.ts:630-652` – `NotificationType`, `NotificationRow`
- `supabase/migrations/00229_game_dates.sql:21-126` – RLS, enforce_approval, Notify-Trigger
- `supabase/migrations/00184_monster_images.sql`, `00065_npc_avatars.sql`, `00188_session_image.sql` – Bucket-Policies
- `src/lib/backup/tables.ts`, `tables.test.ts` – Backup-Guard
- `src/lib/release-notes/index.ts:31` – `SKIPPED_PREFIXES`
- `node_modules/next/dist/server/app-render/action-handler.js:514-540` – 1-MB-Standardlimit für Server Actions

## Architecture Documentation

- **Rechte im GM-Bereich:** Die GM-Rechte werden auf Anwendungsebene über Server Actions mit PIN-Cookie und Service-Client durchgesetzt, nicht über RLS. Die Tabellen und Buckets, die der GM-Bereich nutzt, haben großzügige `authenticated`-Policies.
- **Bildablage:** Bilder liegen in öffentlichen Buckets. In der DB steht die öffentliche URL (`*_url`), oft mit dem Cache-Buster `?t=`. Pfade bauen sich aus der Entitäts-Id mit Endung, überschrieben wird per `upsert`.
- **Initialdaten im Master-Bereich:** Sie werden auf dem Server geladen und als Props übergeben. Die Panels halten danach lokalen State und aktualisieren ihn optimistisch bzw. aus dem Rückgabewert der Action.
- **Benachrichtigungen an die ganze Gruppe:** Dafür gibt es bisher nur das Trigger-Muster. Es setzt einen Nutzer-Kontext voraus (`auth.uid()`).

## Open Questions

Keine. Die Frage, wie sich `enforce_approval()` beim Service-Client verhält, ist in Abschnitt 6 beantwortet: Bei NULL-`auth.uid()` greift er nicht.
