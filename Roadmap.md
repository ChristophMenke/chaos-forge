# 🗺️ Chaos Forge - Entwicklungs-Roadmap

## 1. Projektübersicht

Entwicklung von "Chaos Forge", einer modernen Web-Applikation zur Erstellung, Verwaltung und Aktualisierung von Pen-&-Paper-Charakteren für **Advanced Dungeons & Dragons (AD&D) 2nd Edition**.
Die App richtet sich an eine private Spielgruppe ("Chaos RPG") mit maximal 10 Nutzern und sehr geringer paralleler Nutzung.
**Wichtigstes Architekturziel:** Die Applikation muss extrem kostengünstig (idealerweise komplett im Free-Tier) zu betreiben und zu hosten sein.

## 2. Kernfunktionen (Features)

- **Level-Agnostische Erstellung:** Charaktere können auf beliebigen Stufen angelegt werden.
- **Avatar-Upload:** Möglichkeit, Charakterporträts hochzuladen.
- **Smart Print-Layout:** Generierung eines perfekt optimierten, druckfertigen PDFs für das Spielen am Tisch ohne Bildschirme.
- **Foto-Import (OCR/Vision):** Auslesen und Importieren von physischen Charakterbögen via Kamera/Foto.
- **Session-Management ("Die Chronik des Chaos"):** Timeline-Ansicht, Tagging und Smart Summaries (Zusammenfassungen für längere Spielpausen).
- **Geführter Wizard & Automatisierung:** Anfängerfreundliche Erstellung unter strikter Einhaltung der AD&D 2e Restriktionen (inkl. automatischer Modifikatoren-Berechnung).

## 3. AD&D 2nd Edition Spezifika (Datenmodell)

- **Attribute:** STR (inkl. 18/xx Ausnahmsstärke), DEX, CON, INT, WIS, CHA.
- **Rassen & Klassen:** Mensch, Elf, Zwerg etc. vs. Krieger, Magier, Priester, Schurken (inkl. Level-Caps).
- **Kampfwerte:** Absteigende Rüstungsklasse (RK/AC), ETW0 (THAC0), klassenspezifische Trefferwürfel, Rettungswürfe.
- **Fertigkeiten:** Waffenfertigkeiten (inkl. Spezialisierung) und Allgemeine Fertigkeiten.
- **Magie:** Magier (Schulen & Spezialisten) und Priester (Sphären mit Haupt-/Nebenzugang).
- **Ausrüstung:** Berücksichtigung von Gewicht (Belastung) und Waffengeschwindigkeit.

## Epic 1: Projekt-Setup & Infrastruktur

- [x] Initialisierung des Repositories & Tech-Stacks (Next.js 16, TypeScript, Tailwind v4, shadcn/ui).
- [x] Setup der CI/CD Pipeline (GitHub Actions) und Playwright für E2E-Testing.
- [x] Anbindung der Datenbank (Supabase) & Einrichtung des Datenmodells (profiles, characters + RLS).
- [x] Basis-Layout und Theming (AD&D Nostalgie-Look: Cinzel + Crimson Text, dunkles Pergament-Theme).

## Epic 2: AD&D Core-Regelwerk (Engine)

- [x] Datenstruktur für Attribute (inkl. 18/xx Stärke), 7 Rassen und 16 Klassen.
- [x] Logik für absteigende Rüstungsklasse (RK) und ETW0 (THAC0) + Rettungswürfe.
- [x] Implementierung des Magiesystems (8 Schulen für Magier, 16 Sphären für Priester).
- [x] Datenbank-Seeding mit 12 Rüstungen, 16 Waffen und 18 Beispielzaubern.
- [x] Logos (WebP) und Favicons aus Ressources ins Design eingebaut.

## Epic 3: Charakter-Management

- [x] Interaktiver Charakterbogen (Anzeige & manuelle Bearbeitung) mit Tabs (Werte/Kampf/Notizen).
- [x] Step-by-Step Wizard für die Charaktererstellung (6 Schritte, level-agnostisch).
- [x] Avatar-Upload (Client-seitiges Resize 400x400 WebP, Supabase Storage, Initialen-Fallback).
- [x] Smart Print-Layout (Druck-CSS, dedizierter Print-View /characters/[id]/print, A4-optimiert).

## Epic 4: Die Chronik des Chaos (Session Log)

- [x] Timeline-Ansicht für Sessions (chronologisch, mit Tags und Summary-Vorschau).
- [x] Tagging-System (NPC, Ort, Gegenstand, Quest — mit Autocomplete und farbigen Badges).
- [x] Smart Summaries (KI-Zusammenfassung via Claude Haiku 4.5 + manuelles Markdown-Feld).

## Epic 5: Advanced Features

- [x] OCR/Vision-Import (Claude Vision API, Foto + PDF).
- [x] Gruppen-Dashboard (alle Charaktere, HP-Ampel, Statistiken).
- [x] CRUD komplett (Delete für Charaktere/Sessions/Beiträge, Edit für Beiträge).
- [x] Kompletter Charakterbogen (Ausrüstung, Zauber, Fertigkeiten, Sprachen, XP, Gold, Alignment).
- [x] ~231 Zauber, ~46 Waffen, ~20 Rüstungen, ~63 Fertigkeiten geseeded.
- [x] Eigene Items/Zauber/Fertigkeiten erstellbar.
- [x] Lockere Regeln (Warnings statt Blocking).
- [x] Dark/Light Mode.
- [x] Test-Login Bypass (QA-Domain: @qa.chaosforge.test).
- [x] i18n (Deutsch/Englisch) mit next-intl.

## Epic 6: Play Mode & Epische Ausrüstung

- [x] Session-optimierte Ansicht (Kampf, Zauber, Fähigkeiten, Checks, Inventar, Geldbörse).
- [x] Epic Items mit Effekten (Stat-Overrides, Thief-Penalties, Spell Failure, Gestaltwandlung, Spell Abilities).
- [x] Mode-Navigation (Verwalten/Spielen/Episch).
- [x] Wahrnehmungswurf-Hausregel: `floor((INT + WIS) / 2)`.
- [x] Untote vertreiben Panel + Gestaltwandlung.

## Epic 7: Dashboard Ausbau

- [x] 8 Widgets: Zitat des Tages, NPCs, XP-Ranking, Tag-Wolke, Party-Übersicht, Session-Stats, Throwback.

## Epic 8: Print/Export Customization

- [x] Abschnitte ein-/ausblendbar und in der Reihenfolge änderbar.
- [x] Word-Export (.docx) mit 1:1 Print-Layout.
- [x] Alle PHB-Modifier im Export.

## Epic 9: Priester-System

- [x] Sphären-basiertes Zaubersystem (Priester sehen automatisch alle Zauber ihrer Sphären).
- [x] Gottheit + Priesthood-Auswahl (20+ Priesterschaften).
- [x] Turn Undead Panel.
- [x] Quellenbuch-Filter (DM entscheidet welche Bücher).
- [x] Player's Option Spell Points System.

## Epic 10: Tiefling & Erweiterungen

- [x] 9. Rasse (Tiefling), Rassenwechsel, Fähigkeiten-Panel.
- [x] Magische Items/Waffen mit Stat-Effekten.
- [x] Import-Verbesserungen.

## Epic 11: Regelwerk-Vollständigkeit

- [x] Crusader, Monk, Shaman, Bard Slots, Dual-Class Engine.
- [x] Beschreibungstext-Audit.

## Epic 12: Party-Inventar & Loot

- [x] Gemeinsame Gruppenkasse (5 Münztypen: PP, GP, EP, SP, CP).
- [x] Item-Pool mit CRUD + In-Use-Check.
- [x] Loot-Verteilung an Charaktere.
- [x] Audit-Log + Gold-Abzug.

## Epic 13: Epische Waffen & P.O: S&P

- [x] Klinge des Wassers (Spell Abilities, Kälteschaden).
- [x] Shield Proficiency AC-Bonus (P.O: S&P Table 51).
- [x] Traits & Disadvantages (CP-Kosten, bilingual).

## Epic 14: Master of Chaos (GM-Dashboard)

- [x] PIN-Gate (6-Digit, Rate-Limiting, Immersives Artwork).
- [x] Party-Übersicht (Council of Heroes, Realtime HP via Postgres-Changes).
- [x] Gold-Distribution (Treasury Vault, Multi-Select, Split-Party).
- [x] Custom Items mit Proficiency-Autocomplete.
- [x] Monster CRUD + AI Import (Claude Vision, Precise Mode).
- [x] Combat Simulator (VS-Divider, Siegchance, DPR-Breakdown).
- [x] Rulebook Chat + NPC-Management.
- [x] PWA-Manifest, eigene Sidebar + Bottom-Nav.

## Epic 15: UX/UI Polish & GM CRUD Extensions

- [x] Treasury Vault + Council of Heroes Redesign.
- [x] GM Item CRUD (Edit/Delete mit In-Use-Check).
- [x] Notifications Delete (einzeln + alle).
- [x] Avatar Fallback (Rassen-/Klassen-Silhouetten).
- [x] Client-Side Image Compression (Canvas API, iPhone-Fotos < 3 MB).
- [x] React 19/Compiler-Migration, Memory-Leak Fixes.
- [x] `npm run verify` als CI-Spiegel, Dialog ARIA Compliance.

## Epic 16: Monster-Datenmodell-Vollständigkeit

- [x] Compendium-Backfill (353 MM-Monster aus decheine/complete-compendium).
- [x] Schema-Migration (Narrative-Felder: intro_text, combat_tactics, habitat_society, ecology).
- [x] Sub-Varianten-System (variant_of_id FK Self-Reference, variant_name).
- [x] HTML-Parser + Merge-Script (parse-compendium.ts, backfill-monsters-from-compendium.ts).
- [x] Claude Sonnet 4 Übersetzung (translate-monster-narrative.ts mit AD&D-Glossar).
- [x] Monster-Bilder (GIF-Import aus Compendium + Gemini Imagen für Fehlende).
- [x] Treasure-Code-Legende (DMG-Buchstaben → DE-Beschreibung, Tooltip im Bestiary).
- [x] MonsterForm Component (Create/Edit, shared zwischen Dialog und Variant-Picker).
- [x] AI-Import Multi-Variant-Picker (Orc + Orog in einem Scan → Auswahl-Panel).

## Epic 17: Immersive Screens & QA-Migration

- [x] Immersive PIN-Gate + Login-Screens (Chaos-Artwork, Parchment-Cards, Party-Background).
- [x] NPC-Card-Layout-Polish (Icon-Buttons, Confirm-Dialog, gestackte Location-Badges).
- [x] Bestiary-Header-Redesign (konsistente gold/primary Buttons + Settings-Cog für Precise-Mode).
- [x] Magic Items AC-Berechnung überall (calculateAC + getMagicItemEffects in 5 Aufrufstellen).
- [x] Test-Domain Migration auf @qa.chaosforge.test (RFC .test TLD, zentrale Constants).
- [x] 5 pre-existing E2E-Failures gefixt (PIN Touch-Target, Size-Filter, Party Gold, A11y Timeout).

## Epic 18: Landing Page, Tutorial & User-Freigabe

- [x] Landing Page Redesign (Hero mit Party-Artwork, 4 Feature-Cards mit Klassen-Glows, How-It-Works-Timeline, Footer-CTA).
- [x] Custom Tutorial-Overlay (kein Library-Bloat) für Dashboard, Charakterbogen, Party Loot, Chronik — localStorage-Persistenz pro Seite, letzter Schritt verweist auf Chat.
- [x] Rulebook Chat beantwortet auch App-Nutzungsfragen (Dual-Mode: Regel-RAG + App-Doku).
- [x] User-Freigabe-System: `profiles.is_approved`, BEFORE-Trigger auf 20+ Tabellen, Approval-Banner mit Realtime-Subscription, In-App + Discord-Notification bei Registrierung.
- [x] Admin-Approve-Seite `/admin/approve/[id]` mit Approve- und Reject-Flow (Reject löscht Auth-User via CASCADE).
- [x] Legacy-User-Heal-Migration (auth.users ohne profiles → Profile nachziehen).
- [x] Larry-Artwork: Gemini image-edit ersetzt nur Larry im bestehenden Party-Bild (Stil + Komposition bleiben).

## Epic 19: Settings, Legal & Kondensator

- [x] `/settings` mit Profil-Edit, Theme/Sprache, Tutorial-Reset, DSGVO-konformer Account-Selbstlöschung.
- [x] `/impressum` + `/datenschutz` + Footer mit externen Diensten (Vercel, Supabase, Anthropic, Google Gemini, Voyage, Discord), DSGVO-Rechten, 30-Tage-Löschfrist.
- [x] Kondensator CON-Fallback: neue `forceStatOverrides`-Semantik für Items mit `simple_effects.base_<stat>` (unbedingter Override, kein max()). `computeEffectiveMaxHp` Delta-Helper. Asymmetrische Current-HP-Clamping-Regel.
- [x] Chronik-Aktionen (Bild-Gen, KI-Zusammenfassung) hinter ApprovalGate + server-seitigem 403-Block.
- [x] `skip_tutorials`-Flag für bestehende User (Backfill, damit keiner mit "alte Hasen"-Status das Tutorial bekommt).
- [x] Dashboard Party-Stats: Dedup in `partyChars` gegen Self-Share-Duplikate.
