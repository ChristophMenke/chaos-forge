---
date: 2026-04-12T13:56:48.539234+00:00
git_commit: 2457301cf8610ae590632158d2b8c0a35a187593
branch: fix/i18n-audit
topic: "Landing Page Redesign, App-Tutorial + Chat-Hilfe, User-Freigabe-System"
tags: [research, codebase, landing, tutorial, chat, approval, auth, rls, notifications]
status: complete
---

# Research: Landing Page Redesign, App-Tutorial + Chat-Hilfe, User-Freigabe-System

## Research Question

Drei geplante Features:

1. **Landing Page Redesign** — "Beginne dein Abenteuer"-Seite komplett visuell überarbeiten mit Feature-Highlights
2. **App Tutorial + Chat-Hilfe** — Rulebook Chat erweitern um App-Nutzungsfragen + Tutorial-Overlay für neue User
3. **User-Freigabe-System** — Neue User bekommen Read-Only-Zugriff, Admin (christoph.menke@gmail.com) gibt frei

## Summary

### 1. Landing Page (`src/app/page.tsx`)

Die aktuelle Landing Page ist minimal: ein zentrierter Glass-Card mit Tagline "Schmiede deine Legende", Subtitle und CTA-Button. Kein Feature-Showcase, keine Bilder, kein immersives Design. Die Login-Seite (`src/app/login/page.tsx`) dagegen hat bereits ein immersives Full-Screen-Design mit Party-Artwork (4 WebP-Bilder in Portrait/Landscape) und Parchment-Card. Das Design-System (Glassmorphism, OKLCH-Farben, Tilt-Cards, Stagger-Reveal) bietet reichhaltige Tools für ein Redesign.

### 2. Rulebook Chat (`src/app/api/rulebook-chat/route.ts`)

Der Chat nutzt Claude Sonnet mit RAG (Voyage AI Embeddings + Supabase Vector Search) und Monster-Daten. Aktuell beantwortet er **nur AD&D-Regelfragen** basierend auf Regelbuch-Ausschnitten. Der System-Prompt ist strikt auf Regelbuch-Kontext limitiert. Es gibt **kein Tutorial-System** — kein Onboarding, keine Tour-Bibliothek, keine walkthrough. User-Preferences werden nur via localStorage gespeichert (Theme, Print-Prefs), keine DB-Tabelle.

### 3. Auth & User-Freigabe

Die Profiles-Tabelle hat 6 Spalten (id, display_name, avatar_url, email, last_login_at, created_at, updated_at) — **kein Role/Status/Approved-Feld**. Alle authentifizierten User haben identische Rechte. RLS-Policies nutzen `auth.role() = 'authenticated'` für read-all auf den meisten Tabellen. Write-Operationen (INSERT/UPDATE/DELETE) sind owner-scoped (`auth.uid() = user_id`). Das Notification-System (7 Typen, Realtime via Supabase) ist vorhanden und erweiterbar.

---

## Detailed Findings

### Landing Page — Aktueller Zustand

**Datei:** `src/app/page.tsx` (33 Zeilen)

- Server Component, prüft auf User und redirected zu `/dashboard`
- Minimale Glass-Card mit `glow-neutral`
- i18n-Keys: `landing.tagline` ("Schmiede deine Legende"), `landing.subtitle`, `landing.cta` ("Abenteuer beginnen")
- Keine Feature-Erklärung, keine Bilder, kein Scroll-Content

**Datei:** `src/app/login/page.tsx` (289 Zeilen)

- Client Component, immersives Full-Screen-Design
- Background: 4 Party-Artwork-Bilder (Portrait/Landscape, Normal/Grimace)
  - `public/images/login/login-party-portrait.webp`
  - `public/images/login/login-party-landscape.webp`
  - `public/images/login/login-party-grimace-portrait.webp`
  - `public/images/login/login-party-grimace-landscape.webp`
- Parchment-Card-Design: `bg-[#f4e9d1]/95`, amber Palette, Cinzel Headings
- OTP-Flow: Email eingeben → 6-Digit-Code → Verify
- Artwork wechselt zwischen Step "email" und "code" (Crossfade)

**Design-System-Assets verfügbar:**

- `.glass`, `.glass-hover`, `.tilt-card`, `.stagger-reveal`
- `.glow-warrior/priest/rogue/wizard/neutral`
- `.hex-badge`, `.hp-bar-*`, `.stat-card-frame`
- OKLCH-Farben mit Dark/Light Mode
- 4 Fonts: Cinzel (Heading), Geist Sans (Body), Crimson Text (Serif), Geist Mono
- Responsive `<picture>` Pattern für Artwork

### Rulebook Chat — Architektur

**API Route:** `src/app/api/rulebook-chat/route.ts` (255 Zeilen)

- **Modell:** claude-sonnet-4-20250514, max 2048 Tokens
- **System-Prompt:** Strikt auf Regelbuch-Ausschnitte limitiert, metrische Einheiten
- **RAG Pipeline:** Voyage AI Embedding → Supabase `match_rulebook_chunks` RPC (threshold 0.3, 8 chunks)
- **Monster-Context:** Auto-Erkennung von Monster-Namen im User-Message, 3 Monster-Matches max
- **Rate Limiting:** 20 Requests/60s pro User (In-Memory Map)
- **History:** Letzte 4 Austausche (8 Messages)
- **Streaming:** ReadableStream mit Content-Block-Deltas

**UI-Komponenten:** `src/components/rulebook-chat/`

- `rulebook-chat.tsx` (224 Zeilen) — Main Container, State Management, Streaming
- `chat-input.tsx` (74 Zeilen) — Textarea, Enter/Shift+Enter
- `chat-message.tsx` (44 Zeilen) — Markdown-Rendering, Unit-Conversion
- `book-filter.tsx` (120 Zeilen) — 27 Bücher in 4 Gruppen

**Zugriff:** Nur im Master-Dashboard als Tab "Chat" (`src/components/master/master-dashboard.tsx:466`)

### Tutorial/Onboarding — Nicht vorhanden

- **Kein Tutorial-System** im Codebase
- **Keine Tour-Library** (kein Shepherd.js, Driver.js, etc.)
- **Kein Onboarding-Flow**
- **User-Preferences:** Nur localStorage (`chaos-forge-theme`, `chaos-forge-print-{id}`)
- **Keine `user_settings` DB-Tabelle**

### Auth-System

**Datei:** `src/lib/supabase/auth.ts` (57 Zeilen)

- `requireAuth()` — Redirect zu `/login` wenn nicht authentifiziert, Dev-Bypass
- `getOptionalUser()` — Gibt null zurück für Landing Page
- OTP-basiert (kein Passwort)

**Profiles-Schema (7 Spalten):**

```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_url text,
  email text,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Auto-Create Trigger:**

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

→ Erstellt Profile mit `display_name = 'Abenteurer'` und `email`

### RLS-Policies — Zusammenfassung

| Tabelle             | SELECT              | INSERT    | UPDATE    | DELETE    |
| ------------------- | ------------------- | --------- | --------- | --------- |
| profiles            | Alle Auth           | —         | Owner     | —         |
| characters          | Owner/Shared/Public | Owner     | Owner     | Owner     |
| character_equipment | Alle Auth           | Owner     | Owner     | Owner     |
| character_spells    | Alle Auth           | Owner     | Owner     | Owner     |
| notifications       | Owner               | Alle Auth | Owner     | Owner     |
| monsters            | Alle Auth           | Alle Auth | Alle Auth | Alle Auth |
| party_loot\*        | Alle Auth           | Alle Auth | Alle Auth | Alle Auth |
| chronicle_npcs      | Alle Auth           | Creator   | Creator   | Creator   |
| sessions            | Alle Auth           | Creator   | Creator   | —         |

**Kritisch für User-Freigabe:** Die meisten INSERT/UPDATE/DELETE-Policies nutzen `auth.uid() = user_id` (owner-scoped). Für Read-Only müssten nur die write-Policies um eine `is_approved`-Prüfung erweitert werden.

### Notification-System

**Schema:** `supabase/migrations/00177_notifications.sql`

```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  character_id uuid REFERENCES characters(id),
  type text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**7 existierende Typen:** gm_item_received, gm_gold_received, party_item_received, party_gold_received, trade_item_received, trade_gold_received, session_xp_awarded

**Realtime:** Via Supabase Realtime (postgres_changes INSERT)
**UI:** NotificationBell mit Dropdown, Mark-as-Read, Delete

---

## Code References

- `src/app/page.tsx` — Landing Page (33 Zeilen, minimal)
- `src/app/login/page.tsx` — Login Page (289 Zeilen, immersiv)
- `src/app/api/rulebook-chat/route.ts` — Chat API (255 Zeilen)
- `src/components/rulebook-chat/` — Chat UI (4 Dateien)
- `src/components/master/master-dashboard.tsx:466` — Chat Tab Integration
- `src/lib/supabase/auth.ts` — Auth Helpers (57 Zeilen)
- `src/components/notifications/notification-bell.tsx` — Notification UI (260 Zeilen)
- `src/components/notifications/notification-item.tsx` — Notification Rendering
- `src/app/globals.css` — Glassmorphism Design System
- `src/app/layout.tsx` — Root Layout (101 Zeilen)
- `supabase/migrations/00001_initial_schema.sql` — Profiles + Characters Schema
- `supabase/migrations/00177_notifications.sql` — Notifications Schema
- `supabase/migrations/00042_profiles_email_sharing.sql` — Email in Profiles
- `supabase/migrations/00113_rls_shared_character_data.sql` — Read-All Policies
- `messages/de.json` / `messages/en.json` — i18n (1749 Zeilen each)

## Architecture Documentation

**Auth Flow:** OTP-basiert → `handle_new_user()` Trigger → Profile auto-created → Redirect zu `/characters`

**RLS Pattern:** Fast alle Tabellen: `SELECT = authenticated`, `INSERT/UPDATE/DELETE = owner`. Einige Party-Tabellen (loot, monsters, magic_items) erlauben allen Auth-Users auch Schreibzugriff.

**Design Pattern:** Immersive Screens nutzen isolierte Farbpaletten (amber/parchment) statt des globalen Design-Systems. Glassmorphism-Klassen für reguläre App-Screens.

**Chat-Architektur:** RAG-basiert mit Vector Search + Monster-DB. Nur im Master-Dashboard verfügbar. Kein App-Hilfe-Kontext.

## Open Questions

1. Soll die Landing Page und Login-Seite zusammengelegt werden (ein Flow) oder getrennt bleiben?
2. Soll der Chat für App-Hilfe ein separater Endpunkt sein oder der existierende erweitert werden?
3. Wo soll der Chat für reguläre User (nicht GM) zugänglich sein? (Aktuell nur im Master-Dashboard)
4. Soll das Tutorial-System eine Tour-Library (Driver.js, Shepherd.js) nutzen oder Custom?
5. Wie soll die Admin-Benachrichtigung bei neuen Usern technisch ablaufen? (Supabase Trigger + Edge Function? Oder App-seitig?)
6. Sollen die bestehenden Party-weiten Write-Policies (monsters, party_loot, magic_items) auch für nicht-freigegebene User blockiert werden?
