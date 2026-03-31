---
date: 2026-03-31T08:40:02.784152+00:00
git_commit: 04458eafc2a2690e06552d529f7a6743b2d9502a
branch: feat/priest-system
topic: "Priester-Zaubersystem — PHB-Regeln vs. aktuelle Implementierung"
tags: [research, codebase, priest, spells, spheres, deity]
status: complete
---

# Research: Priester-Zaubersystem — PHB-Regeln vs. aktuelle Implementierung

## Research Question

Wie funktioniert das Priester-Zaubersystem in AD&D 2nd Edition? Wie unterscheidet es sich vom Magier-System? Was ist aktuell in Chaos Forge implementiert und was fehlt?

## Summary

Priester und Magier haben in AD&D 2e **grundlegend verschiedene** Zaubersysteme. Der entscheidende Unterschied: **Priester müssen keine Zauber erlernen.** Sie kennen automatisch alle Zauber ihrer Sphären und beten täglich um die gewünschten Zauber. Magier hingegen müssen Zauber in ihr Zauberbuch schreiben und können dabei scheitern.

Chaos Forge behandelt Priester aktuell identisch wie Magier (Learn → Prepare → Cast), was **nicht regelkonform** ist.

## Detailed Findings

### 1. PHB-Regeln: Priester-Zauber vs. Magier-Zauber

**Magier:**

- Müssen Zauber in ein Zauberbuch schreiben (INT-basierte Chance zu scheitern)
- Können nur Zauber memorieren, die in ihrem Zauberbuch stehen
- Begrenzt durch Schulen (Spezialisten) und Oppositionsschulen

**Priester:**

- **Keine Zauberbücher** — Wissen über verfügbare Zauber wird direkt von der Gottheit gewährt
- **Automatischer Zugang** zu allen Zaubern in ihren Sphären, sobald sie die nötige Stufe erreichen
- Müssen täglich **beten** (nicht memorieren), um Zauber zu erhalten
- Können jeden Tag frei aus ihrem gesamten Sphären-Pool wählen

> "Unlike the wizard, the priest needs no spell book and does not roll to see if he learns spells. [...] Through prayer, the priest humbly and politely requests those spells he wishes to memorize."
> — Players Handbook, Zeilen 15108-15118

> "The knowledge of what spells are available to the priest becomes instantly clear as soon as he advances in level. This, too, is bestowed by his deity."
> — Players Handbook, Zeilen 15132-15135

### 2. Sphären-System (Major vs. Minor Access)

- **Major Access:** Zugang zu allen Zaubern (Level 1-7) der Sphäre
- **Minor Access:** Nur Zauber der Stufe 1-3

> "A priest with minor access to a sphere can cast only 1st-, 2nd-, and 3rd-level spells from that sphere."
> — Players Handbook, Zeilen 15130-15131

Es gibt **16 Sphären:** All, Animal, Astral, Charm, Combat, Creation, Divination, Elemental, Guardian, Healing, Necromantic, Plant, Protection, Summoning, Sun, Weather.

### 3. Gottheit bestimmt Sphärenzugang

Die Sphären eines Priesters werden durch seine Gottheit/Priesterschaft definiert:

> "The priest's deity will have major and minor accesses to certain spheres, and this determines the spells available to the priest."
> — Players Handbook, Zeilen 6107-6111

Die "All"-Sphäre enthält Grundzauber, die allen Priestern zur Verfügung stehen, unabhängig von der Gottheit.

### 4. Player's Option: Spell Points

Das Spell Points System (Hausregel in Chaos Forge) ersetzt fixe Slot-Tabellen durch einen Punktepool:

- Punkte steigen pro Level (Tabelle in `spellslots.ts:143-146`)
- WIS-Bonus erhöht den Pool (`spellslots.ts:162-169`)
- Zauberkoten pro Stufe: 1, 2, 4, 6, 8, 10, 12 (`spellslots.ts:150-158`)
- Priester wählen frei, welche Zauber sie für Punkte vorbereiten

### 5. Aktuelle Implementierung in Chaos Forge

#### Was existiert:

**Priesthood-Definitionen** (`src/lib/rules/priesthoods.ts`):

- 20+ Priesthoods mit Sphären-Mapping, Granted Powers, Combat Rating
- Jedes Priesthood definiert `spheres: SphereMap` (major/minor Zugang)
- Interface `PriesthoodDefinition` (Zeile 5-18)

**Sphären-Logik** (`src/lib/rules/magic.ts:89-116`):

- `getPriestSpheres(classId, priesthoodId)` — gibt Sphären-Map zurück
- `hasSphereAccess(classId, sphere, accessLevel, priesthoodId)` — prüft Zugang
- Standard-Sphären für Cleric (Zeile 62-77) und Druid (Zeile 79-87)

**Spell Learn Check** (`src/lib/rules/spellslots.ts:278-328`):

- `canLearnSpell()` prüft Sphärenzugang inkl. priesthoodId
- Minor-Sphären-Check: maximal Level 3
- Gibt Warnungen zurück (nie blockierend, Hausregel)

**Wizard Step** (`src/components/wizard/step-priesthood.tsx`):

- Gottheit-Freitext-Eingabe
- Priesthood-Auswahl für Clerics (mit Sphären-Anzeige, Granted Powers)
- Druiden erhalten Hinweis "keine Priesterschaft"

**DB-Schema** (`src/lib/supabase/types.ts`):

- `deity: string | null` (Zeile 58)
- `priesthood: string | null` (Zeile 59)

#### Was fehlt / falsch implementiert ist:

**1. Tab Spells behandelt Priester wie Magier** (`tab-spells.tsx:286-296`):

- Priester müssen aktuell Zauber **einzeln erlernen** ("Learn" Button)
- Korrekt wäre: Priester sehen **automatisch alle Zauber** ihrer Sphären
- Der "Learn"-Flow ist nur für Magier relevant

**2. Kein Sphären-Filter im Zauber-Tab:**

- Priester sollten Zauber nach Sphären gefiltert sehen (Major/Minor)
- Minor-Sphären-Zauber sollten auf Level 1-3 begrenzt sein
- Aktuell: gleicher Filter wie Magier (School statt Sphere)

**3. Play Mode zeigt keine Priester-spezifischen Infos:**

- Keine Anzeige der Gottheit
- Keine Sphären-Übersicht
- Kein Unterschied im Zauber-Flow (Priester beten, Magier memorieren)

**4. Character Sheet zeigt keine Gottheit/Priesthood:**

- Kein sichtbarer Hinweis auf Gottheit oder Priesterschaft
- Sphären-Zugang nicht einsehbar

## Code References

- `src/lib/rules/magic.ts:57-116` — Priest sphere definitions and access checks
- `src/lib/rules/spellslots.ts:138-187` — Priest spell points system
- `src/lib/rules/spellslots.ts:278-328` — canLearnSpell() with priesthood support
- `src/lib/rules/priesthoods.ts:1-100` — Priesthood definitions with sphere maps
- `src/components/character-sheet/tab-spells.tsx:286-296` — Learn flow (identical for priest/wizard)
- `src/components/character-sheet/tab-spells.tsx:107-126` — TabSpells props (priesthood passed)
- `src/components/wizard/step-priesthood.tsx` — Wizard step for deity/priesthood selection
- `src/lib/supabase/types.ts:58-59` — deity/priesthood DB fields
- `src/components/play-mode/play-spellbook-panel.tsx:69-70` — isPriest detection in play mode

## Architecture Documentation

### Aktueller Datenfluss (Magier = Priester, identisch):

1. **Wizard Step** → Klasse + Priesthood + Deity wählen
2. **Character Sheet (Manage)** → "Learn Spell" Dialog → einzelne Zauber erlernen → in `character_spells` speichern
3. **Character Sheet (Manage)** → "Prepare" Toggle → Zauber vorbereiten
4. **Play Mode** → Vorbereitete Zauber anzeigen → Casten/Expenden

### Korrekter Datenfluss (Priester):

1. **Wizard Step** → Klasse + Priesthood + Deity wählen ✅ (existiert bereits)
2. **Character Sheet (Manage)** → Alle Sphären-Zauber automatisch anzeigen (kein "Learn") → "Prepare/Pray" Toggle
3. **Play Mode** → Gottheit + Sphären anzeigen → Vorbereitete Zauber casten

## Open Questions

1. Sollen Priester-Zauber in der DB als `character_spells` gespeichert werden (nur prepared/expended), oder soll der Sphären-Filter dynamisch die verfügbaren Zauber berechnen?
2. Wie soll der Übergang für bestehende Priester-Charaktere funktionieren, die bereits manuell Zauber "gelernt" haben?
3. Soll die "All"-Sphäre in der UI separat angezeigt werden oder in die Gesamtliste integriert?
