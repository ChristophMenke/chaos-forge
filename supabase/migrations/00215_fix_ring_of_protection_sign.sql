-- Fix für falsch vorzeichneten AC-Bonus am Custom-Ring des Schutzes
--
-- Nowi Tarja trug einen "Ring des Schutzes (Ring)" mit `ac_bonus: 1` —
-- positive Zahl. In AD&D 2e ist die Rüstungsklasse aber ABSTEIGEND
-- (niedriger = besser), d.h. ein +1 Ring of Protection muss als
-- `ac_bonus: -1` gespeichert werden, damit `calculateAC()` den Wert
-- korrekt von der RK abzieht.
--
-- Mit dem falschen positiven Wert hat der Ring ihre RK tatsächlich um
-- 1 VERSCHLECHTERT statt verbessert — die Differenz zur intendierten RK
-- beträgt also 2 Punkte (verpasste Verbesserung + aufgedrückte
-- Verschlechterung).
--
-- Referenz-Items in der DB sind schon korrekt vorzeichnet, z.B.
-- "Ring des Schutzes +1" und "Umhang des Schutzes +1" haben beide
-- `ac_bonus: -1`. Dieser Custom-Eintrag war inkonsistent.
--
-- Fix:
-- 1. `magic_items` Tabelle: den Katalog-Eintrag auf -1 flippen
-- 2. `character_equipment` Tabelle: die Kopie in Nowis Inventar auch
--    flippen, weil magic_effects dort als JSONB dupliziert ist
--
-- Custom-Flag bleibt unverändert (is_custom = TRUE), damit der GM den
-- Eintrag jederzeit über das Verwalten-Panel weiterhin bearbeiten kann.

BEGIN;

-- 1. Katalog
UPDATE magic_items
SET magic_effects = jsonb_set(magic_effects, '{ac_bonus}', '-1'::jsonb)
WHERE id = 'cf76cd56-fb18-4a01-944f-996431a1cd88'
  AND (magic_effects->>'ac_bonus')::int = 1;

-- 2. Inventar-Kopie (Nowis equipped Ring)
UPDATE character_equipment
SET magic_effects = jsonb_set(magic_effects, '{ac_bonus}', '-1'::jsonb)
WHERE magic_item_id = 'cf76cd56-fb18-4a01-944f-996431a1cd88'
  AND (magic_effects->>'ac_bonus')::int = 1;

COMMIT;
