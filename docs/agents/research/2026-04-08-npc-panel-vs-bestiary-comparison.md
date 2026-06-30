---
date: 2026-04-08T14:44:07+00:00
git_commit: 84dd469
branch: feature/polish-and-fixes
topic: "NPC Panel vs Monster Bestiary — Vergleich und Redesign-Grundlage"
tags: [research, codebase, master-dashboard, npcs, bestiary, ui]
status: complete
---

# Research: NPC Panel vs Monster Bestiary — Vergleich und Redesign-Grundlage

## Research Question

Wie sind NPC-Panel und Monster-Bestiary im GM-Dashboard implementiert, und welche visuellen Elemente des Bestiary lassen sich auf das NPC-Panel anwenden?

## Summary

Das Monster-Bestiary (`master-bestiary-panel.tsx`, ~650 Zeilen) bietet eine deutlich reichhaltigere UI als das NPC-Panel (`master-npcs-panel.tsx`, ~700 Zeilen). Das Bestiary hat Grid/List-Toggle, mehrstufige Filter (Suche, Größe, HD-Range), Sortierung, Paginierung, generierte SVG-Avatare, ein Detail-Modal und Kampf-Integration. Das NPC-Panel hat nur Suche, ein 3-Spalten-Grid mit einfachen GlassCards, und ein Inline-Expand/Collapse. Die NPC-Datenstruktur (`ChronicleNpcRow`) hat genug Felder (Location, Stats, Tier) um eine ähnlich visuell ansprechende Darstellung zu ermöglichen.

## Detailed Findings

### Monster Bestiary — Architektur & Features

**Datei:** `src/components/master/master-bestiary-panel.tsx`

**State-Management:**

- `search`, `sizeFilter`, `hdRange` — drei Filter-Dimensionen
- `viewMode` — Grid/List-Toggle (`"grid" | "list"`)
- `sortKey`/`sortDir` — 5 Sortierkriterien (Name, AC, HD, THAC0, XP) mit Richtung
- `page` — Client-seitige Paginierung (PAGE_SIZE = 24)
- `selectedMonster` — für Detail-Modal

**Datenmodell:** `MonsterRow` mit: id, name, name_en, description, description_en, size (T/S/M/L/H/G), ac, hit_dice, hit_dice_value, thac0, movement, attacks, damage, xp_value, magic_resistance, special_attacks, special_defenses, image_url, und weiteren Feldern.

**UI-Komponenten:**

1. **Filter-Bar** (Zeile 192-290): Suchfeld + Size-Dropdown + HD-Range-Dropdown + Sort-Dropdown + Grid/List-Toggle
2. **Result Count** (Zeile 292-297): "1-24 / 176" Paginierungsinfo
3. **MonsterCard** (Grid View, Zeile 378-503):
   - Square aspect-ratio Image-Bereich mit Gradient-Overlay
   - Generiertes SVG-Avatar wenn kein Bild vorhanden (`monsterAvatar()` mit deterministischem Farbhash)
   - Name über Gradient am unteren Bildrand
   - Stat-Row: AC (amber), HD (red), THAC0 (sky) mit farbigen Icons
   - Secondary stats: XP, Größe, Magic Resistance
   - Description preview (1 Zeile)
   - "Add to Combat"-Button in Ecke
4. **MonsterListView** (Zeile 505-647): Tabelle mit sortierbaren Spaltenheadern, Mini-Avatar, farbige Stat-Icons
5. **Pagination** (Zeile 333-361): Prev/Next mit Seiteninfo
6. **MonsterDetailModal** (nach Zeile 647): 2-Spalten-Layout, Bildupload, alle Stats, Beschreibung

**Visuelle Besonderheiten:**

- Deterministische SVG-Avatare basierend auf Name-Hash (Hue) + Größen-Silhouette
- Farbkodierte Stats (amber=AC, red=HD, sky=THAC0, purple=Magic Resistance)
- Grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6`
- GlassCard mit `hover:scale-[1.01]` Transition

### NPC Panel — Architektur & Features

**Datei:** `src/components/master/master-npcs-panel.tsx`

**State-Management:**

- `search` — einziger Filter
- `editingNpc`, `isCreating` — Inline-Edit/Create
- `showCopyPicker` — Character-Copy-Dialog
- `expandedId` — Expand/Collapse einer einzelnen Karte

**Datenmodell:** `ChronicleNpcRow` mit: id, name, location, description, avatar_url, tier ("normal"|"advanced"), is_visible_to_players, race_id, class_ids[], level, str/dex/con/int/wis/cha, hp_current, hp_max, ac, thac0, equipment_notes, spell_notes, notes.

**Zusätzlich:** `npcCharacters: CharacterRow[]` — vollwertige Charakter-NPCs (is_npc=true), getrennt von `chronicle_npcs`.

**UI-Komponenten:**

1. **Header** (Zeile 138-188): Suchfeld + 3 Buttons (Simple NPC, Full NPC, Copy Character) — KEIN Sortierung, Filter, View-Toggle
2. **Copy Picker** (Zeile 191-252): Grid mit Charakter-Buttons zum Kopieren
3. **NPC Form** (Zeile 483-700+): Inline-Formular mit Tier-Toggle, Common + Advanced Feldern
4. **Advanced NPCs Section** (Zeile 274-312): Eigener Abschnitt, einfache GlassCards mit Name/Level/HP + Manage/Play Links
5. **Normal NPCs Section** (Zeile 315-334): 3-Spalten-Grid mit NpcCard
6. **NpcCard** (Zeile 339-481): Name + Location + Visibility/Edit/Delete Buttons + expandable Details

**Visuelle Defizite gegenüber Bestiary:**

- Keine Avatare/Bilder
- Keine farbkodierten Stats
- Keine Grid/List-Toggle
- Keine Sortierung
- Keine Paginierung (alle auf einmal)
- Kein Detail-Modal (stattdessen Inline-Expand)
- Kein visuelles Unterscheidungsmerkmal zwischen NPCs (alle sehen gleich aus)

### NPC-Daten die für visuelle Aufwertung nutzbar sind

| Feld                    | Bestiary-Äquivalent       | Visualisierungspotenzial                            |
| ----------------------- | ------------------------- | --------------------------------------------------- |
| `name`                  | `name`                    | SVG-Avatar mit deterministischem Farbhash           |
| `location`              | —                         | Subtitle unter Name (wie Beschreibung bei Monstern) |
| `tier`                  | `size`                    | Visueller Indikator (Badge, Border-Farbe)           |
| `ac`, `thac0`, `hp_*`   | `ac`, `thac0`, `hit_dice` | Farbkodierte Stat-Row                               |
| `level`                 | `hit_dice_value`          | Level-Badge oder Stat                               |
| `is_visible_to_players` | —                         | Eye-Icon Overlay                                    |
| `race_id`, `class_ids`  | —                         | Klassen-basierte Akzentfarbe                        |
| `description`           | `description`             | Preview-Text                                        |

### Chronicle-Seite — Spalten-Layout

**Datei:** `src/app/sessions/page.tsx:103`

Aktuelles Layout: `grid-cols-[1fr_300px_300px]` — die Sessions-Spalte nimmt allen verfügbaren Platz, Quotes und NPCs sind auf jeweils 300px fixiert. Für gleich große Spalten: `grid-cols-3` oder `grid-cols-[1fr_1fr_1fr]`.

## Code References

- `src/components/master/master-bestiary-panel.tsx` — Bestiary-Komponente (Referenz-UI)
- `src/components/master/master-npcs-panel.tsx` — NPC-Panel (zu redesignen)
- `src/lib/supabase/types.ts:432-461` — ChronicleNpcRow Interface
- `src/app/master/actions.ts:388-453` — NPC CRUD Server Actions
- `src/app/sessions/page.tsx:103` — Chronicle 3-Spalten-Layout

## Architecture Documentation

- Beide Panels sind Client-Komponenten im `src/components/master/` Verzeichnis
- Beide erhalten ihre Daten als Props vom `master-dashboard.tsx`
- Das Bestiary-Panel bekommt `MonsterRow[]` vom Server, das NPC-Panel bekommt `ChronicleNpcRow[]` + `CharacterRow[]`
- NPC-CRUD wird über Server Actions (`createNpc`, `updateNpc`, `deleteNpc`) abgewickelt
- Monster haben keine CRUD-Operationen im Bestiary (nur Image-Upload), sie sind geseeded
- NPCs unterscheiden zwischen "Normal" (chronicle_npcs Tabelle) und "Advanced" (characters Tabelle mit is_npc=true)
