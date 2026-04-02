---
date: "2026-04-02T12:09:08.569726+00:00"
git_commit: 8bd9e2c9fc105e3fc6ce357d39cbe3acee036647
branch: content/spell-descriptions-phb
topic: "Character Sharing & Equipment Visibility für öffentliche/geteilte Charaktere"
tags: [research, codebase, sharing, equipment, rls, visibility]
status: complete
---

# Research: Character Sharing & Equipment Visibility

## Research Question

Wie funktioniert das Character-Sharing und die Sichtbarkeit in Chaos Forge? Wo werden Equipment-Daten für geteilte/öffentliche Charaktere blockiert und was muss angepasst werden, damit alles sichtbar (aber read-only für Nicht-Owner) ist?

## Summary

Das Sharing-System basiert auf zwei Mechanismen: einem `is_public`-Flag auf der `characters`-Tabelle und einer `character_shares`-Tabelle für explizites Teilen. Die `characters`-Tabelle selbst hat eine korrekte RLS-Policy, die öffentliche und geteilte Charaktere für alle sichtbar macht. **Allerdings haben 5 von 9 untergeordneten Tabellen restriktive SELECT-Policies, die nur dem Owner Lesezugriff gewähren.** Dies führt dazu, dass bei geteilten/öffentlichen Charakteren Equipment, Spells, Proficiencies und Sprachen nicht angezeigt werden können.

Die UI-Schicht ist bereits korrekt implementiert: Sowohl die Manage- als auch die Play-Seite erkennen Nicht-Owner und setzen `readOnly={true}` auf alle Eingabekomponenten.

## Detailed Findings

### 1. Sharing-Mechanismus (Datenbank)

**characters.is_public** (Migration 00025_character_visibility.sql:5):

- Boolean-Feld, Default `false`
- Steuert öffentliche Sichtbarkeit

**character_shares** (Migration 00025_character_visibility.sql:8-14):

- Junction-Table: `character_id` + `shared_with_user_id`
- Unique-Constraint verhindert Doppelt-Sharing
- Owner kann Shares verwalten (via `is_character_owner()` SECURITY DEFINER Funktion, 00026)
- Geteilte User können ihre eigenen Shares sehen

**Characters SELECT-Policy** (Migration 00025_character_visibility.sql:34-39):

```sql
CREATE POLICY "Users can view own, shared, or public characters" ON characters
  FOR SELECT USING (
    auth.uid() = user_id
    OR is_public = true
    OR EXISTS (SELECT 1 FROM character_shares WHERE character_id = characters.id AND shared_with_user_id = auth.uid())
  );
```

Dies ist **korrekt** implementiert.

### 2. RLS-Policies der untergeordneten Tabellen

#### BROKEN: SELECT nur für Owner

| Tabelle                             | Migration   | Problem                                                                  |
| ----------------------------------- | ----------- | ------------------------------------------------------------------------ |
| `character_equipment`               | 00004:52-54 | `character_id IN (SELECT id FROM characters WHERE user_id = auth.uid())` |
| `character_spells`                  | 00004:69-71 | Identisches Pattern                                                      |
| `character_weapon_proficiencies`    | 00010:45-47 | Identisches Pattern                                                      |
| `character_nonweapon_proficiencies` | 00010:57-59 | Identisches Pattern                                                      |
| `character_languages`               | 00011:81-83 | Identisches Pattern                                                      |

#### KORREKT: Permissive SELECT für alle Authentifizierten

| Tabelle                     | Migration   | Policy                                  |
| --------------------------- | ----------- | --------------------------------------- |
| `character_classes`         | 00015:19-22 | `USING (true)` to authenticated         |
| `character_inventory`       | 00017:41-44 | `USING (true)` to authenticated         |
| `epic_items`                | 00049:25-27 | `USING (auth.role() = 'authenticated')` |
| `character_fighting_styles` | 00032:18-19 | `USING (auth.role() = 'authenticated')` |

### 3. Data Fetching (Manage & Play Pages)

**Manage-Seite** (`src/app/characters/[id]/manage/page.tsx`):

- Lädt alle Daten inkl. Equipment, Spells, Proficiencies, Inventory, Epic Items
- Kein Server-seitiger Ownership-Check — verlässt sich auf RLS
- Equipment-Query (Line 44-47): `supabase.from("character_equipment").select("*, weapon:weapons(*), armor:armor(*)").eq("character_id", id)`

**Play-Seite** (`src/app/characters/[id]/play/page.tsx`):

- Identische Daten-Queries
- Ebenfalls kein Server-seitiger Ownership-Check

**Landing-Page** (`src/app/characters/[id]/page.tsx`):

- Prüft Ownership (Line 30-33)
- Nicht-Owner werden direkt zu `/manage` weitergeleitet

### 4. UI-Schicht (Read-Only-Logik)

**Character Sheet** (`src/components/character-sheet/character-sheet.tsx`):

- Line 150: `const isOwner = character.user_id === userId;`
- Alle Tabs erhalten `readOnly={!isOwner}`:
  - Line 1798: TabEquipment
  - Line 1826: TabSpells
  - Line 1859: TabThiefSkills
  - Line 1883: TabProficiencies

**Play Mode** (`src/components/play-mode/play-mode.tsx`):

- Line 196: `const isOwner = character.user_id === userId;`
- Alle Panels erhalten `readOnly={!isOwner}`:
  - Line 686: PlaySpellbookPanel
  - Line 731: PlayCoinPursePanel
  - Line 740: PlayInventoryPanel

**Equipment-Tab** (`src/components/character-sheet/tab-equipment.tsx`):

- `readOnly` Prop (Line 50, Default false)
- Alle Aktionsbuttons mit `{!readOnly && (` gegattet:
  - Add-Button (Line 645), Remove-Button (Line 719), Equip-Toggle (Line 702), Custom-Weapon-Form (Line 1644)

**Play Inventory Panel** (`src/components/play-mode/play-inventory-panel.tsx`):

- `readOnly` Required Prop (Line 21)
- Quick-Add und Quantity-Buttons gegattet

### 5. Share-Dialog

**File:** `src/components/character-sheet/share-dialog.tsx`

- Nur für Owner sichtbar (Line 886-898 in character-sheet.tsx)
- Toggles `is_public` Flag
- Verwaltet `character_shares` Einträge (User suchen + hinzufügen/entfernen)

## Code References

- `supabase/migrations/00025_character_visibility.sql` — Sharing-Schema + Characters SELECT Policy
- `supabase/migrations/00026_fix_rls_recursion.sql` — `is_character_owner()` Helper
- `supabase/migrations/00004_character_full_schema.sql:51-83` — Restriktive Policies für equipment + spells
- `supabase/migrations/00010_proficiencies.sql:44-67` — Restriktive Policies für proficiencies
- `supabase/migrations/00011_custom_items_and_languages.sql:79-91` — Restriktive Policies für languages
- `src/components/character-sheet/character-sheet.tsx:150` — isOwner Bestimmung
- `src/components/play-mode/play-mode.tsx:196` — isOwner im Play Mode
- `src/components/character-sheet/tab-equipment.tsx:50` — readOnly Prop
- `src/app/characters/[id]/manage/page.tsx:44-47` — Equipment Data Fetching

## Architecture Documentation

**Access Control Flow:**

1. Middleware → `requireAuth()` stellt sicher, dass User authentifiziert ist
2. Landing-Page → Owner sieht Auswahl (Manage/Play/Epic), Nicht-Owner → Redirect zu Manage
3. Manage/Play-Seiten → Laden Daten via Supabase (RLS filtert automatisch)
4. UI-Schicht → `isOwner` steuert `readOnly` Props auf allen Komponenten
5. RLS → Verhindert INSERT/UPDATE/DELETE für Nicht-Owner auf allen Tabellen

**Kern-Problem:** Schritt 3 schlägt fehl, weil die RLS SELECT-Policies auf 5 Tabellen den Nicht-Owner blockieren — die Daten kommen gar nicht erst in der UI an.

## Lösung (Scope)

**Was angepasst werden muss:**

1. **Neue Migration:** SELECT-Policies für 5 Tabellen aktualisieren:
   - `character_equipment` — Permissive SELECT für Charaktere, die der User sehen darf
   - `character_spells` — Analog
   - `character_weapon_proficiencies` — Analog
   - `character_nonweapon_proficiencies` — Analog
   - `character_languages` — Analog

2. **Empfohlenes Policy-Pattern** (konsistent mit character_classes/inventory/epic_items):

   ```sql
   DROP POLICY "Users can view their own character equipment" ON character_equipment;
   CREATE POLICY "Authenticated can view character equipment" ON character_equipment
     FOR SELECT TO authenticated USING (true);
   ```

   Alternativ granularer (nur public/shared/own):

   ```sql
   CREATE POLICY "Users can view equipment for accessible characters" ON character_equipment
     FOR SELECT USING (
       character_id IN (
         SELECT id FROM characters
         WHERE user_id = auth.uid()
           OR is_public = true
           OR EXISTS (SELECT 1 FROM character_shares WHERE character_id = characters.id AND shared_with_user_id = auth.uid())
       )
     );
   ```

3. **UI:** Bereits korrekt — keine Änderungen nötig. `readOnly={!isOwner}` ist überall implementiert.

## Open Questions

- Soll das permissive Pattern (alle Authentifizierten können lesen) oder das granulare Pattern (nur accessible characters) verwendet werden? Ersteres ist konsistenter mit bestehenden Tabellen (character_classes, inventory, epic_items).
