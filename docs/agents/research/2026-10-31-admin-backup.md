---
date: 2026-10-31T22:02:42+00:00
git_commit: c23a0538edb85046beba7761799415a12e2bf241
branch: feature/icloud-backup
topic: "Admin-Backup (ZIP: Gruppendaten + Uploads) — Ist-Zustand"
tags: [research, codebase, backup, admin, supabase, storage, sessions, settings]
status: complete
---

# Research: Admin-Backup — Ist-Zustand

## Research Question

Welche bestehenden Bausteine betreffen ein Admin-Backup als ZIP (Gruppendaten als JSON pro
Tabelle + hochgeladene Bilder aus öffentlichen Buckets), einen Download-Button in den
Einstellungen nur für den Admin und ein Angebot nach dem Anlegen einer Session bzw. dem Speichern
eines Session-Eintrags? Untersucht: Admin-Erkennung, Tabellen (Stammdaten vs. Gruppendaten),
Bild-URLs/Buckets, Session-Abläufe, `fetchAllRows`, Service-Client in API-Routen, ZIP-/Share-
Bibliotheken, Datenschutzseite.

## Summary

- **Admin** ist überall per festem E-Mail-Vergleich mit `christoph.menke@gmail.com` erkannt
  (Konstante `ADMIN_EMAIL` pro Datei, kein DB-Flag). Einstellungen haben bereits
  `isAdmin = email === ADMIN_EMAIL` (`settings-client.tsx:42,172`).
- **Tabellen:** 39 public-Tabellen. Reine Stammdaten: `races`, `classes`,
  `race_class_restrictions`, `rulebook_chunks` (3437 Zeilen mit `vector(1536)`). Gemischt
  (Seeds + `is_custom`/`created_by`): `spells` (3211, davon 2 custom), `weapons` (106/3),
  `armor` (28/4), `nonweapon_proficiencies` (70/0), `general_items` (145/0), `monsters` (406/0),
  `magic_items` (26/1). Alles andere sind Gruppendaten bzw. Link-Tabellen (Zeilenzahlen 0–75).
- **Bilder:** Alle Buckets sind `public`. Gespeichert wird jeweils die volle öffentliche URL
  (teils mit `?t=`). Hochgeladene Bilder: `avatars` (27 Dateien, 2,7 MB), `npc-avatars` (28, 1,2 MB),
  `profile-avatars` (1, 0,3 MB), `session-images` (2, 0,1 MB). `monster-images` (580, 75 MB) sind
  generierte/ingestierte Bilder der kanonischen Monster. Bucket `voice-notes` existiert in der
  Live-DB nicht; `session_entries.audio_url` ist in 0 Zeilen gesetzt.
- **Sessions:** Anlegen ist ein Client-Insert in `/sessions/new` mit `router.push` auf die
  Detailseite, ohne Toast. Einträge speichert `SessionEntryForm` per Client-Insert, Erfolg über
  den Callback `onEntryCreated` in `SessionDetail`, ohne Toast.
- **Bibliotheken:** `file-saver` (dynamisch importiert in `print-sheet.tsx`), keine ZIP-Bibliothek,
  `navigator.share` nirgends genutzt.
- **API-Routen** liefern bisher nur JSON bzw. einen Text-Stream; Admin-Routen prüfen per
  `auth.getUser()` + E-Mail-Vergleich und nutzen dann `createServiceClient()`.
- **Datenschutz** ist eine deutschsprachige, hartcodierte Seite mit Abschnitt „5. Eingesetzte
  Dienste“ und „7. Speicherdauer“.

```
src/
  app/
    settings/{page,settings-client}.tsx      # isAdmin (E-Mail), Sektionen als GlassCards, toast
    sessions/new/page.tsx                     # Client-Insert sessions → router.push(/sessions/[id])
    sessions/[id]/page.tsx                    # rendert SessionDetail
    sessions/actions.ts                       # distributeSessionXp (requireAuth + Service-Client)
    admin/approve/[id]/page.tsx               # Admin-Seite: requireAuth + profiles.email === ADMIN_EMAIL
    api/admin/reject-user/route.ts            # getUser + profiles.email-Check → Service-Client
    api/account/delete/route.ts               # getUser + user.email-Check
    api/generate-session-image/route.ts       # getUser + is_approved → Service-Client, Storage-Upload
    datenschutz/page.tsx                      # DE, hartcodiert
  components/
    session/session-entry-form.tsx            # Client-Insert session_entries, onEntryCreated
    session/session-detail.tsx                # bindet Form ein (nur ohne eigenen Eintrag)
    print-sheet/print-sheet.tsx               # await import("file-saver") → saveAs
  lib/supabase/{service,fetch-all-rows,auth}.ts
supabase/migrations/                          # Tabellen, Buckets, approve_user
```

```
Admin (Christoph)
  ├─ /sessions/new ──insert sessions──► router.push(/sessions/[id])
  ├─ /sessions/[id] → SessionDetail → SessionEntryForm ──insert session_entries──► onEntryCreated
  └─ /settings → SettingsClient (isAdmin) … Sektionen

Daten:  public.* (Postgres, RLS) ── Service-Client umgeht RLS (nur Server)
Bilder: storage.objects (alle Buckets public) ── URL steht in *_url-Spalten
```

## Detailed Findings

### Admin-Erkennung

- SQL: `approve_user` (`00216_user_approval.sql:28-47`) vergleicht `profiles.email` zu `auth.uid()`
  mit dem Literal; `handle_new_user` (`00216:51-86`) und `00219:16` suchen den Admin per E-Mail.
  Seit `00232` (Branch `feature/release-notes-svenbot`, PR #185) können Clients `profiles.email`
  nicht mehr ändern.
- Server:
  - `src/lib/supabase/auth.ts:33-50` `requireAuth`/`getAuthUser` per `getClaims()` → `{id, email}`.
  - `src/app/admin/approve/[id]/page.tsx:14,18-31`: `requireAuth()` + `profiles.email` per
    User-Client, sonst `redirect("/dashboard")`.
  - `src/app/api/admin/reject-user/route.ts:5,13-29`: `auth.getUser()` + `profiles.email`
    vs. `ADMIN_EMAIL` → 403.
  - `src/app/api/account/delete/route.ts:5,18,25`: `auth.getUser()` + `user.email`.
- Client: `src/app/settings/settings-client.tsx:42` `ADMIN_EMAIL`, `:172` `isAdmin`,
  `:349-351` Verwendung; `email` kommt aus `profile.email ?? user.email` (`settings/page.tsx:35`).
  `notification-item.tsx:71,113,240` zeigt Admin-Aktionen anhand des Notification-Typs.

### Tabellen (Live-Zeilenzahlen vom 2026-10-31)

| Kategorie                            | Tabellen                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stammdaten                           | `races` 9, `classes` 19, `race_class_restrictions` 57, `rulebook_chunks` 3437 (Embeddings, befüllt per `scripts/embed-books.ts`)                                                                                                                                                                                                           |
| Gemischt (`is_custom`, `created_by`) | `spells` 3211 (2 custom), `weapons` 106 (3), `armor` 28 (4), `nonweapon_proficiencies` 70 (0), `general_items` 145 (0), `monsters` 406 (0; GM darf auch kanonische Monster bearbeiten, Spalte `updated_at` vorhanden), `magic_items` 26 (1; Default `is_custom = true`, Seed-Zeilen `false`)                                               |
| Gruppendaten                         | `profiles` 6, `characters` 11, `sessions` 3, `session_entries` 3, `chronicle_npcs` 29, `chronicle_quotes` 31, `xp_history` 12, `epic_items` 10, `party_loot_gold` 1, `party_loot_items` 0, `party_loot_log` 0, `notifications` 18, `gm_bookmarks` 0, `game_dates` 2, `character_effects` 1, `tags` 0                                       |
| Link-Tabellen (Gruppe)               | `character_equipment` 35, `character_spells` 75, `character_weapon_proficiencies` 34, `character_nonweapon_proficiencies` 65, `character_inventory` 27, `character_classes` 14, `character_languages` 11, `character_fighting_styles` 1, `character_shares` 12, `session_tags` 0, `chronicle_quote_reactions` 8, `session_participants` 12 |

- Kits und Kampfstile liegen im TS-Code (`src/lib/rules/kits.ts`, `fighting-styles.ts`), keine Tabellen.
- Link-Tabellen verweisen per FK auf Stammdaten (z. B. `character_spells.spell_id` → `spells`,
  `character_equipment` → `weapons`/`armor`/`magic_items`, `character_inventory.item_id` → `general_items`).

### Bild-URLs und Buckets

| Spalte                      | Bucket                          | Objektpfad                    | Upload                                                    |
| --------------------------- | ------------------------------- | ----------------------------- | --------------------------------------------------------- |
| `characters.avatar_url`     | `avatars`                       | `{userId}/{characterId}.webp` | `src/lib/avatar/upload.ts:39-59`                          |
| `profiles.avatar_url`       | `profile-avatars`               | `{userId}/profile.webp`       | `src/lib/avatar/profile-upload.ts:24-46`                  |
| `chronicle_npcs.avatar_url` | `npc-avatars`                   | `{npcId}.webp`                | `src/lib/avatar/npc-upload.ts:23-42`                      |
| `sessions.image_url`        | `session-images`                | `{sessionId}.webp`            | `src/app/api/generate-session-image/route.ts:85-104` (KI) |
| `monsters.image_url`        | `monster-images`                | `{monsterId}.{ext}`           | `src/app/master/actions.ts:977-1007`, Skripte             |
| `session_entries.audio_url` | `voice-notes` (nicht vorhanden) | `voice-{uuid}.webm`           | `session-entry-form.tsx:76-92`                            |

- Gespeichert wird die volle öffentliche URL (`getPublicUrl`), bei Avataren mit `?t=`-Cache-Buster.
- Live-Größen: `avatars` 27 Dateien/2,7 MB, `npc-avatars` 28/1,2 MB, `profile-avatars` 1/0,3 MB,
  `session-images` 2/0,1 MB, `monster-images` 580/75 MB.

### Session-Abläufe

- `src/app/sessions/new/page.tsx:20-58` (`"use client"`): `auth.getUser()`, Insert in `sessions`
  (`title`, `session_date`, `created_by`) mit `.select("id").single()`, dann
  `router.push(`/sessions/${data.id}`)`. Fehler über lokalen State.
- `src/components/session/session-entry-form.tsx:66-125`: Insert in `session_entries`, optional
  Audio-Upload, fire-and-forget Transkription, `onEntryCreated?.(…)`, Formular-Reset.
- `src/components/session/session-detail.tsx:401-416`: Form nur, wenn Nutzer noch keinen
  Eintrag und eigene Charaktere hat; `onEntryCreated` hängt an `entries` an.
- KI-Zusammenfassung: `session-detail.tsx:138-169` (`/api/summarize-session`), Speichern
  `:130-137` (Update `sessions.summary`).
- Keine Toasts in diesen Abläufen.

### Datenabruf und Server

- `src/lib/supabase/fetch-all-rows.ts:23-48` `fetchAllRows(count, page, pageSize=1000)` — Seiten
  parallel, `page` muss eindeutig sortieren; im Produktivcode bisher nicht genutzt.
- `src/lib/supabase/service.ts:7-12` `createServiceClient()` (RLS-Bypass, nur Server).
- Antwortformen bisher: `NextResponse.json` überall, Text-Stream in `rulebook-chat/route.ts:307`.
  Keine Binär- oder `Content-Disposition`-Antwort.

### Bibliotheken

- `package.json`: `file-saver` ^2.0.5 (+ Typen), `docx`, `sonner`. Keine ZIP-Bibliothek.
- `src/components/print-sheet/print-sheet.tsx:1284,1300`: `await import("file-saver")` → `saveAs(blob, name)`.
- `navigator.share` wird nicht verwendet.

### Einstellungen

- `src/app/settings/page.tsx:10-45`: Server-Komponente, `requireAuth`, Profil-Select, Props an
  `SettingsClient` (`userId`, `email`, `initialDisplayName`, `initialAvatarUrl`, `gameDatesSlot`).
- `settings-client.tsx`: Sektionen als `GlassCard`, Admin-Bedingung vorhanden.

### Datenschutz

- `src/app/datenschutz/page.tsx` (169 Zeilen, nur Deutsch): 3. Welche Daten (`:37-59`), 5. Eingesetzte Dienste (`:76ff`: Vercel, Supabase EU, Google Gemini, Voyage AI, Discord), 7. Speicherdauer (`:135-140`), 8. Rechte (`:142`).

## Code References

- `src/app/settings/settings-client.tsx:42,172,349-351` — `ADMIN_EMAIL`, `isAdmin`
- `src/app/api/admin/reject-user/route.ts:5-29` — Muster Admin-API (getUser + profiles.email)
- `src/app/sessions/new/page.tsx:37-53` — Session-Insert + Navigation
- `src/components/session/session-entry-form.tsx:85-125` — Eintrag-Insert + Callback
- `src/components/session/session-detail.tsx:401-416` — Einbindung Eintragsformular
- `src/lib/supabase/fetch-all-rows.ts:23` — Paginierung über 1000 Zeilen
- `src/components/print-sheet/print-sheet.tsx:1284-1300` — `file-saver` per dynamischem Import
- `supabase/migrations/00011_custom_items_and_languages.sql:6-68` — `is_custom`/`created_by`
- `supabase/migrations/00060_*` — `rulebook_chunks` mit Embeddings
- `src/app/datenschutz/page.tsx:76,135` — Dienste, Speicherdauer

## Architecture Documentation

- Admin ist eine Identität (E-Mail), kein Rollenmodell; jede Stelle prüft selbst.
- Nutzer-Schreibvorgänge laufen meist direkt aus dem Browser (RLS), Server-Routen nur für
  privilegierte oder externe Aufrufe (Service-Client nach Auth-Prüfung).
- Mischtabellen unterscheiden Buch-Stammdaten und Gruppen-Ergänzungen über `is_custom`.
- Medien liegen in öffentlichen Buckets; die DB hält nur die öffentliche URL.

## Open Questions

- Kanonische Monster, die der GM bearbeitet hat, sind nicht über `is_custom` erkennbar
  (`updated_at` vorhanden). Ob sie ins Backup gehören, ist eine Planungsfrage.
- Ob Sprachnotizen künftig gespeichert werden sollen, ist offen (Bucket fehlt live).
