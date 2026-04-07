---
date: "2026-04-07T12:12:17.753944+00:00"
git_commit: c5ddee70249698f27ae73e71e376a2e3ec31c157
branch: feature/performance-optimization
topic: "Bildverwendung & Aufwertungspotenzial durch Gemini-generierte Bilder"
tags: [research, ui, ux, images, gemini, design-system]
status: complete
---

# Research: Wo könnten Bilder die Chaos Forge UI/UX aufwerten?

## Forschungsfrage

Analyse der aktuellen Bildnutzung in der Chaos Forge Applikation und Identifikation von Bereichen, in denen gezielt eingesetzte, via Gemini generierte Bilder das Fantasy-Erlebnis und die Nutzererfahrung steigern könnten.

## Zusammenfassung

Die Applikation nutzt aktuell Bilder **minimal und funktional**: Character-Avatare, ein Header-/Footer-Logo und Lucide-Icons. Das Glassmorphism Dark Fantasy Design-System erzeugt die Atmosphäre rein über CSS (Glows, Blur, Gradients, Noise-Texturen). Es gibt **kein einziges illustratives oder dekoratives Bild** in der gesamten App — die Fantasy-Immersion entsteht ausschließlich durch Typografie, Farben und Effekte.

Dies eröffnet erhebliches Aufwertungspotenzial, insbesondere in den Bereichen:

1. **Rassen- und Klassen-Illustrationen** (Wizard, Character Cards)
2. **Zauber-Illustrationen** (Spellbook)
3. **Monster-Porträts** (Bestiarium)
4. **Session-Stimmungsbilder** (Chronik)
5. **Epische Ausrüstungs-Illustrationen** (Epic Equipment)
6. **Hintergrund-Atmosphäre** (Login, Dashboard)

---

## Detaillierte Ergebnisse

### 1. Aktuelle Bildnutzung (Ist-Zustand)

#### Character-Avatare

- **Komponenten:** `src/components/avatar-display.tsx`, `src/components/avatar-upload.tsx`
- **Speicher:** Supabase Bucket "avatars", Format: 400×400px WebP @ 85% Qualität
- **Fallback:** Initialen-Anzeige (farbiger Kreis mit Buchstaben)
- **Verwendung:** Character Card (110×130px), Character Sheet Header, Play Mode, Print Sheet (72×72px), Dashboard, GM Dashboard
- Nutzer laden eigene Bilder hoch — kein Generierungsfeature vorhanden

#### NPC-Avatare

- **Komponenten:** `src/components/session/npc-avatar-upload.tsx`
- **Speicher:** Supabase Bucket "npc-avatars", 400×400px WebP
- **Verwendung:** Session-Einträge, Dashboard NPC-Widget

#### Monster-Bilder

- **Komponenten:** `src/components/master/master-bestiary-panel.tsx:36-66`
- **Speicher:** Supabase Bucket "monster-images"
- **Fallback:** Programmatisch generierte SVG-Silhouetten (`monsterAvatar()`) — 6 Größen-basierte Pfade (T/S/M/L/H/G) mit deterministic Hue aus dem Namen
- **Verwendung:** GM Dashboard Bestiarium

#### Logos & Favicons

- `public/header-logo.webp` (280×120px) — App-Header
- `public/footer-logo.webp` — Footer
- 5 Favicon-Varianten (16px, 32px, 192px, 512px, Apple Touch)

#### Icons

- **Lucide React:** 40+ verschiedene Icons in 40+ Dateien (Swords, Shield, Sparkles, BookOpen, Coins, etc.)
- **Custom SVGs:** 5 Inline-SVG-Icons im Play Mode (`play-mode.tsx:68-156` — Sword, Sparkles, Target, Backpack, Coins)
- **Kein Icon-Set für Rassen, Klassen, Schulen oder Sphären**

#### Was NICHT existiert

- Keine illustrativen Bilder (Fantasy-Artwork)
- Keine Hintergrundbilder oder -texturen (rein CSS)
- Keine Rassen-/Klassen-Bilder
- Keine Zauber-Illustrationen
- Keine Ausrüstungs-Bilder
- Keine Session-/Stimmungsbilder
- Kein Kartenvisualisierung

---

### 2. Bereiche mit hohem Aufwertungspotenzial

#### A. Character Wizard — Rassen- und Klassen-Auswahl (HOCH)

**Dateien:** `src/components/wizard/step-race.tsx`, `src/components/wizard/step-class.tsx`

**Ist-Zustand:** Rassen und Klassen werden als reine Text-Cards dargestellt — Name, Attribut-Badges, kurze Ability-Liste. Keinerlei visuelle Identität.

**Potenzial:** Jede der 9 Rassen und 16 Klassen mit einem charakteristischen Porträt/Illustration. Dies ist der **erste Kontakt** eines Spielers mit seinem Charakter — ein visuell ansprechendes Bild hätte hier den größten emotionalen Impact.

**Bildtyp:** Porträt-Illustration im Dark Fantasy Stil, ca. 200×260px, konsistenter Kunststil

- Rassen: Mensch, Elf, Halbelf, Zwerg, Gnom, Halbling, Halbork, Kobold, Tiefling
- Klassen: Fighter, Ranger, Paladin, Mage, Specialist Wizard, Cleric, Druid, Thief, Bard, Monk, Shaman, Crusader, etc.

**Umsetzung:** Statische Bilder in `public/images/races/` und `public/images/classes/`, via `next/image` eingebunden.

---

#### B. Spellbook — Zauber-Illustrationen (HOCH)

**Dateien:** `src/components/spellbook/spell-card.tsx`, `src/components/play-mode/play-spellbook-panel.tsx`

**Ist-Zustand:** Zauber sind rein textbasiert — Name, Level-Badge, School-Badge, Beschreibungstext. Bei 3.200+ Zaubern in der DB eine enorme Textwand.

**Potenzial:** Illustrationen pro **Magieschule** (8 Schulen) und **Priestersphäre** (~16 Sphären). Nicht pro Zauber (zu viele), sondern als visuelles Kategorisierungselement.

**Bildtyp:**

- 8 Magieschule-Icons (Abjuration, Conjuration, Divination, Enchantment, Evocation, Illusion, Necromancy, Alteration) — jeweils ein stilisiertes Symbol, ca. 48×48px
- 16 Sphären-Icons (All, Animal, Astral, Chaos, Charm, Combat, Creation, Divination, Elemental, Guardian, Healing, Law, Necromantic, Plant, Protection, Sun, Summoning, Time, War, Weather, Wards) — ca. 32×32px
- Alternativ: Ein großes illustratives Header-Bild pro Schule für die Spellbook-Filteransicht

**Umsetzung:** Icons als SVG oder kleine WebP in `public/images/schools/` und `public/images/spheres/`.

---

#### C. Monster-Porträts im Bestiarium (HOCH)

**Dateien:** `src/components/master/master-bestiary-panel.tsx`

**Ist-Zustand:** Monster haben entweder ein hochgeladenes Bild oder einen programmatisch generierten SVG-Fallback (farbige Silhouette + Initiale). Der Fallback ist funktional, aber nicht immersiv.

**Potenzial:** Gemini könnte **on-demand** Monster-Porträts generieren, basierend auf Name, Größe und Beschreibung des Monsters. Bei ~350+ Monstern in der DB wäre ein Batch-Generierungsskript sinnvoll.

**Bildtyp:** Porträt-Illustration, Dark Fantasy Stil, 400×400px WebP, konsistenter Kunststil

- Batch-Generierung für die häufigsten Monster (Goblin, Orc, Dragon, Skeleton, Zombie, etc.)
- On-Demand-Generierung über einen "Bild generieren"-Button im GM Dashboard

**Umsetzung:** Generierte Bilder in Supabase Bucket "monster-images" speichern (Infrastruktur existiert bereits in `src/app/master/actions.ts:580-612`).

---

#### D. Session-Stimmungsbilder (MITTEL)

**Dateien:** `src/components/session/session-detail.tsx`, `src/app/sessions/[id]/page.tsx`

**Ist-Zustand:** Sessions sind rein textbasiert — Titel, Datum, Zusammenfassung, Einträge. Keine visuellen Stimmungselemente.

**Potenzial:** Ein **Header-Bild pro Session**, generiert aus dem Session-Titel/Zusammenfassung. Beispiel: "Die Belagerung von Karak Azgal" → düsteres Schlachtfeld-Bild.

**Bildtyp:** Landscape-Banner, ca. 800×300px, atmosphärisch, Dark Fantasy

- Generierung über Session-Zusammenfassung oder manuellen Prompt
- Optional: Ein "Stimmungsbild generieren"-Button für den Session-Ersteller

**Umsetzung:** Neues Feld `image_url` auf `sessions`-Tabelle, Upload in Supabase Storage.

---

#### E. Epische Ausrüstungs-Illustrationen (MITTEL)

**Dateien:** `src/components/epic-equipment/epic-equipment-view.tsx`, `src/components/epic-equipment/simple-epic-card.tsx`, `src/components/epic-equipment/blade-system-card.tsx`

**Ist-Zustand:** Epic Items werden als Text-Cards mit Lucide-Icons dargestellt. Kein visuelles Element zeigt das Item selbst.

**Potenzial:** Jedes epische Item (aktuell eine überschaubare Anzahl) mit einer individuellen Illustration. Besonders die "Klinge des Wassers" (Blade System) hätte enormes visuelles Potenzial mit ihren Schadensstufen.

**Bildtyp:** Item-Illustration, ca. 120×120px, Dark Fantasy, mit visueller Progression bei Schadensstufen

- 5 Schadensstufen = 5 Varianten desselben Items (zunehmend beschädigt/verändert)

**Umsetzung:** Bilder in Supabase Storage, referenziert via `image_url` auf `epic_items`-Tabelle.

---

#### F. Login-Seite & App-Hintergrund (MITTEL)

**Dateien:** `src/app/login/page.tsx`, `src/app/layout.tsx`

**Ist-Zustand:** Login zeigt eine zentrierte Glass-Card auf dem Standard-Dunkel-Hintergrund. Kein visuelles Element außer dem Logo.

**Potenzial:**

- **Login-Hintergrund:** Ein großes, atmosphärisches Dark Fantasy Bild (Taverne, Dungeon-Eingang, Schmiedefeuer) als dezenter Hintergrund hinter der Glass-Card
- **App-Hintergrund-Textur:** Subtile, wiederholbare Textur (Pergament, Stein, Leder) als `background-image` auf dem Body — ergänzt die CSS-Glassmorphism-Effekte

**Bildtyp:**

- Login: 1920×1080px atmosphärisches Bild, stark verdunkelt (10-20% Opacity)
- Textur: Nahtlos kachelbar, 512×512px, sehr subtil

**Umsetzung:** Statische Bilder in `public/images/`, eingebunden als CSS `background-image`.

---

#### G. Character Card — Avatar-Fallback (NIEDRIG-MITTEL)

**Dateien:** `src/components/character-card.tsx:122-130`

**Ist-Zustand:** Ohne Avatar zeigt die Card einen Initialen-Kreis (z.B. "T" für "Thorin"). Funktional, aber visuell flach.

**Potenzial:** Statt Initialen könnte ein **automatisch generiertes Charakter-Porträt** basierend auf Rasse, Klasse und Geschlecht angezeigt werden. "Erstelle ein Porträt für einen männlichen Zwerg-Krieger."

**Bildtyp:** Porträt, 400×400px WebP, basierend auf Character-Daten

- Generierung bei Charaktererstellung oder als "Avatar generieren"-Button

**Umsetzung:** Neuer API-Endpunkt, der Gemini mit Character-Daten aufruft und das Ergebnis in den bestehenden "avatars"-Bucket speichert.

---

#### H. Dashboard Widgets (NIEDRIG)

**Dateien:** `src/app/dashboard/page.tsx`

**Ist-Zustand:** StatCards nutzen Lucide-Icons und CSS-Glows. Visuell bereits ansprechend durch das Stat-Card-Frame-System mit Noise-Textur und Corner-Ornaments.

**Potenzial:** Gering — das Dashboard ist bereits visuell dicht. Zusätzliche Bilder könnten überladen wirken. Eventuell ein kleines atmosphärisches Bild im "Zitat des Tages"-Widget.

---

### 3. Bereiche, wo Bilder eher STÖREND wären

#### Play Mode

- **Begründung:** Wird während der Session aktiv genutzt, Geschwindigkeit und Übersichtlichkeit sind kritisch. Bilder würden von den Kampfwerten ablenken und die Ladezeit erhöhen.
- **Ausnahme:** Die HP-Bar und Combat-Stats profitieren vom bestehenden Icon/Glow-System.

#### Party-Inventar

- **Begründung:** Funktionale Transaktionsoberfläche. Item-Bilder wären bei generischen Items (Seil, Fackeln, Rationen) mehr Noise als Nutzen.

#### GM Dashboard — Kampf-Tracker

- **Begründung:** Schnelligkeit ist kritisch. Der GM braucht Zahlen, nicht Bilder. Monster-Bilder im Bestiarium sind sinnvoll, im Combat Tracker würden sie die kompakte Darstellung sprengen.

#### Print Sheet / Word-Export

- **Begründung:** Bereits optimiert für Druckformat. Character-Avatar wird bereits eingebunden. Weitere Bilder würden den PHB-Charakterbogen-Stil brechen.

#### Spell-Beschreibungstexte

- **Begründung:** 3.200+ Zauber mit individuellen Bildern wäre excessive. Schulen-/Sphären-Icons sind der richtige Granularitätsgrad.

---

### 4. Empfohlene Priorisierung

| Prio | Bereich                | Bildtyp              | Anzahl    | Aufwand | Impact    |
| ---- | ---------------------- | -------------------- | --------- | ------- | --------- |
| 1    | Rassen (Wizard)        | Porträt-Illustration | 9         | Gering  | Sehr hoch |
| 2    | Klassen (Wizard)       | Porträt-Illustration | 16        | Gering  | Sehr hoch |
| 3    | Monster-Porträts       | Porträt-Illustration | ~50-100   | Mittel  | Hoch      |
| 4    | Magieschulen-Icons     | Stilisiertes Symbol  | 8         | Gering  | Hoch      |
| 5    | Login-Hintergrund      | Atmosphärisches Bild | 1         | Gering  | Mittel    |
| 6    | Session-Header         | Stimmungsbild        | On-Demand | Mittel  | Mittel    |
| 7    | Priestersphären-Icons  | Stilisiertes Symbol  | ~16       | Gering  | Mittel    |
| 8    | Epic Items             | Item-Illustration    | ~5-10     | Gering  | Mittel    |
| 9    | Avatar-Generierung     | Charakter-Porträt    | On-Demand | Hoch    | Mittel    |
| 10   | App-Hintergrund-Textur | Nahtlose Textur      | 1-3       | Gering  | Niedrig   |

---

### 5. Technische Überlegungen

#### Konsistenter Kunststil

Alle generierten Bilder sollten einem **einheitlichen Stil-Prompt** folgen, z.B.:

- "Dark fantasy illustration, muted earth tones with jewel accents, painterly style, medieval fantasy, no modern elements, dark moody lighting"
- Dies sichert visuellen Zusammenhalt mit dem Glassmorphism Dark Fantasy Design

#### Performance

- Statische Bilder: `next/image` mit automatischer Optimierung (WebP, Lazy Loading, Responsive)
- On-Demand-generierte Bilder: Caching in Supabase Storage, einmalige Generierung
- Bildgrößen klein halten: 200-400px für Porträts, 48px für Icons
- `loading="lazy"` für Bilder unterhalb des Folds

#### Bestehende Infrastruktur

- **Supabase Storage:** 3 Buckets existieren bereits (avatars, npc-avatars, monster-images)
- **Image Lightbox:** `src/components/image-lightbox.tsx` existiert für Vollbild-Anzeige
- **Avatar-Upload-Pipeline:** Cropping, Resize zu 400×400 WebP @ 85% existiert
- **`next/image`:** Bereits eingesetzt, Optimierung konfiguriert

#### Gemini-Integration

- Batch-Generierung: Skript für Rassen/Klassen/Monster-Bilder (einmalig)
- On-Demand: API-Route für Session-Bilder und Avatar-Generierung
- Style-Prompt als Konstante in `src/lib/utils/image-prompts.ts`

---

## Code-Referenzen

| Bereich             | Datei                                                   | Relevante Zeilen                     |
| ------------------- | ------------------------------------------------------- | ------------------------------------ |
| Avatar-System       | `src/components/avatar-display.tsx`                     | 1-54                                 |
| Avatar-Upload       | `src/components/avatar-upload.tsx`                      | 1-310                                |
| Avatar-Resize       | `src/lib/avatar/resize.ts`                              | 1-53                                 |
| Character Card      | `src/components/character-card.tsx`                     | 107-131 (Avatar-Bereich)             |
| Wizard Rassen       | `src/components/wizard/step-race.tsx`                   | 31-81 (Race Grid)                    |
| Wizard Klassen      | `src/components/wizard/step-class.tsx`                  | 84-130 (Class Grid)                  |
| Spellbook           | `src/components/spellbook/spell-card.tsx`               | 39-97 (Card Layout)                  |
| Monster-Silhouetten | `src/components/master/master-bestiary-panel.tsx`       | 36-66                                |
| Monster-Upload      | `src/app/master/actions.ts`                             | 580-612                              |
| Epic Equipment      | `src/components/epic-equipment/epic-equipment-view.tsx` | 1-80                                 |
| Session Detail      | `src/components/session/session-detail.tsx`             | 1-80                                 |
| Login-Seite         | `src/app/login/page.tsx`                                | 1-60                                 |
| Dashboard StatCards | `src/app/dashboard/page.tsx`                            | 53-76                                |
| Play Mode Icons     | `src/components/play-mode/play-mode.tsx`                | 68-156                               |
| Design System       | `src/app/globals.css`                                   | 184-503 (Glassmorphism + Animations) |
| Lightbox            | `src/components/image-lightbox.tsx`                     | 1-50                                 |

## Offene Fragen

1. **Gemini-Quota:** Wie viele Bilder können im Free-Tier generiert werden? Reicht es für ~100 Monster?
2. **Speicherplatz:** Supabase Free-Tier Storage-Limit für generierte Bilder?
3. **Stil-Abstimmung:** Welcher Dark Fantasy Stil passt am besten zum bestehenden Glassmorphism-Design?
4. **Batch vs. On-Demand:** Sollen alle Bilder vorab generiert oder bei Bedarf erstellt werden?
5. **Lizenzen:** Sind Gemini-generierte Bilder für die private Spielgruppe uneingeschränkt nutzbar?
