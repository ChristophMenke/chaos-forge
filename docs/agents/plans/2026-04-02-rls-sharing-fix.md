---
date: "2026-04-02T12:11:46.487259+00:00"
git_commit: 8bd9e2c9fc105e3fc6ce357d39cbe3acee036647
branch: content/spell-descriptions-phb
topic: "RLS SELECT-Policies für geteilte/öffentliche Charaktere fixen"
tags: [plan, rls, sharing, equipment, visibility]
status: draft
---

# RLS SELECT-Policies für geteilte/öffentliche Charaktere fixen

## Overview

5 untergeordnete Character-Tabellen haben restriktive RLS SELECT-Policies, die nur dem Owner Lesezugriff gewähren. Bei öffentlichen oder geteilten Charakteren werden dadurch Equipment, Spells, Proficiencies und Sprachen nicht geladen. Die Policies müssen auf das permissive Pattern (`TO authenticated USING (true)`) aktualisiert werden, konsistent mit den 4 bereits korrekt implementierten Tabellen.

## Current State Analysis

### Betroffene Tabellen (SELECT blockiert für Nicht-Owner)

| Tabelle                             | Aktuelle Policy        | Migration   |
| ----------------------------------- | ---------------------- | ----------- |
| `character_equipment`               | `user_id = auth.uid()` | 00004:52-54 |
| `character_spells`                  | `user_id = auth.uid()` | 00004:69-71 |
| `character_weapon_proficiencies`    | `user_id = auth.uid()` | 00010:45-47 |
| `character_nonweapon_proficiencies` | `user_id = auth.uid()` | 00010:57-59 |
| `character_languages`               | `user_id = auth.uid()` | 00011:81-83 |

### Bereits korrekte Tabellen (Ziel-Pattern)

| Tabelle                     | Policy                                  | Migration |
| --------------------------- | --------------------------------------- | --------- |
| `character_classes`         | `TO authenticated USING (true)`         | 00015     |
| `character_inventory`       | `TO authenticated USING (true)`         | 00017     |
| `epic_items`                | `USING (auth.role() = 'authenticated')` | 00049     |
| `character_fighting_styles` | `USING (auth.role() = 'authenticated')` | 00032     |

### UI-Schicht

Bereits korrekt: `readOnly={!isOwner}` in `character-sheet.tsx:150` und `play-mode.tsx:196`. Keine UI-Änderungen nötig.

## Desired End State

Alle authentifizierten User können SELECT auf alle Character-Subtabellen ausführen. INSERT/UPDATE/DELETE bleibt Owner-only. Geteilte und öffentliche Charaktere zeigen alle Daten (Equipment, Spells, Proficiencies, Sprachen) im Read-Only-Modus an.

### Key Discoveries:

- `character_classes`, `character_inventory`, `epic_items`, `character_fighting_styles` nutzen bereits das permissive Pattern
- Die UI-Schicht ist komplett vorbereitet (readOnly-Props überall implementiert)
- Es gibt nur 10 aktive User, daher ist das permissive Pattern sicher

## What We're NOT Doing

- UI-Änderungen (readOnly-Logik ist bereits korrekt)
- Änderung der INSERT/UPDATE/DELETE Policies (bleiben Owner-only)
- Granulare SELECT-Policies (public/shared check) — nicht nötig bei 10 Usern, inkonsistent mit bestehenden Tabellen

## Implementation Approach

Eine einzige Migration, die die 5 SELECT-Policies dropped und durch permissive Policies ersetzt. Dazu ein Vitest-Test, der die Policy-Namen validiert.

## Architecture and Code Reuse

Bestehendes Pattern aus Migration 00017 (character_inventory):

```sql
create policy "Users can view inventory for readable characters"
  on public.character_inventory for select
  to authenticated
  using (true);
```

Betroffene Dateien:

```
supabase/migrations/00113_rls_shared_character_data.sql  # NEU: Migration
src/test/rls-sharing.test.ts                              # NEU: Test
```

## Phase 1: Migration + Test

### Overview

Eine Migration aktualisiert die 5 SELECT-Policies. Ein Test prüft die Korrektheit.

### Changes Required:

#### [x] 1. Neue Migration erstellen (als 00078 statt 00113 — main ist bei 00077)

**File**: `supabase/migrations/00113_rls_shared_character_data.sql`
**Changes**: DROP + CREATE für 5 SELECT-Policies

```sql
-- Fix: SELECT-Policies für geteilte/öffentliche Charaktere
-- Bisher: Nur Owner konnte lesen
-- Neu: Alle authentifizierten User können lesen (konsistent mit character_classes, inventory, epic_items)

-- character_equipment
DROP POLICY "Users can view their own character equipment" ON character_equipment;
CREATE POLICY "Authenticated can view character equipment"
  ON character_equipment FOR SELECT TO authenticated USING (true);

-- character_spells
DROP POLICY "Users can view their own character spells" ON character_spells;
CREATE POLICY "Authenticated can view character spells"
  ON character_spells FOR SELECT TO authenticated USING (true);

-- character_weapon_proficiencies
DROP POLICY "Users can view their character weapon proficiencies" ON character_weapon_proficiencies;
CREATE POLICY "Authenticated can view character weapon proficiencies"
  ON character_weapon_proficiencies FOR SELECT TO authenticated USING (true);

-- character_nonweapon_proficiencies
DROP POLICY "Users can view their character NW proficiencies" ON character_nonweapon_proficiencies;
CREATE POLICY "Authenticated can view character NW proficiencies"
  ON character_nonweapon_proficiencies FOR SELECT TO authenticated USING (true);

-- character_languages
DROP POLICY "Users can view their character languages" ON character_languages;
CREATE POLICY "Authenticated can view character languages"
  ON character_languages FOR SELECT TO authenticated USING (true);
```

#### [x] 2. Migration ausführen (00113 auf Remote applied)

`supabase db push`

#### [x] 3. Vitest: RLS-Policy-Konsistenz prüfen

**File**: `src/test/rls-sharing.test.ts`
**Changes**: Test der prüft, dass die Migration-Dateien die korrekten Policy-Definitionen enthalten

### Success Criteria:

#### Automated Verification:

- [x] Migration erfolgreich ausgeführt: `supabase db push`
- [x] Tests pass: `npm test` (1041 passed)
- [x] Linting passes: `npm run lint` (5 pre-existing errors, keine neuen)
- [x] Format check: `npm run format:check`

#### Manual Verification:

- [ ] Charakter auf "öffentlich" setzen
- [ ] Als anderer User einloggen
- [ ] Manage-Ansicht: Equipment-Tab zeigt Ausrüstung (read-only)
- [ ] Manage-Ansicht: Spells-Tab zeigt Zauber (read-only)
- [ ] Manage-Ansicht: Proficiencies-Tab zeigt Fertigkeiten (read-only)
- [ ] Play-Ansicht: Combat zeigt Waffen (read-only)
- [ ] Play-Ansicht: Inventar zeigt Items (read-only)
- [ ] Play-Ansicht: Spells zeigt vorbereitete Zauber (read-only)
- [ ] Keine Bearbeitungs-Buttons sichtbar für Nicht-Owner

## Testing Strategy

### Unit Tests:

- Migration-Datei enthält korrekte DROP/CREATE Statements für alle 5 Tabellen
- Kein unbeabsichtigtes Droppen von INSERT/UPDATE/DELETE Policies

### Manual Testing Steps:

1. Eigenen Charakter mit Equipment, Spells, Proficiencies und Sprachen ausstatten
2. Charakter auf "öffentlich" setzen (Share-Dialog)
3. Als anderer User einloggen
4. Charakter in Manage-Ansicht öffnen — alle Tabs prüfen
5. Charakter in Play-Ansicht öffnen — alle Panels prüfen
6. Verifizieren, dass keine Bearbeitungsmöglichkeiten sichtbar sind

## Migration Notes

- Migration Nummer: 00113
- Nur SELECT-Policies werden geändert
- INSERT/UPDATE/DELETE bleiben unverändert (Owner-only)
- Rollback: Alte Policies aus 00004, 00010, 00011 wiederherstellen

## References

- Research: `docs/agents/research/2026-04-02-character-sharing-equipment-visibility.md`
- Korrekte Referenz-Implementation: `supabase/migrations/00017_inventory.sql:41-44`
- Korrekte Referenz-Implementation: `supabase/migrations/00049_epic_items.sql:25-27`
