-- Korrigiert Flächenangaben in spells.area_of_effect.
--
-- Problem: Bei der Übersetzung wurde "square feet" mehrfach zu "qm" UMBENANNT
-- statt umgerechnet. Die Werte waren dadurch rund 10,8× zu groß
-- (1 sq ft = 0,0929 m²), z. B. Phantasmal Force "400 qm" statt 37,2 m².
--
-- Konvention (wie im gesamten Projekt): Die DB speichert IMPERIAL, die UI rechnet
-- über convertImperialText() metrisch um. Der Fix ist deshalb ein reiner
-- Einheitentausch — alle Zahlen bleiben unverändert, nur "qm" → "Quadratfuß".
--
-- Betroffen (Zahlen gegen ressources/books/Players Handbook.txt verifiziert):
--   Hold Portal   20 → "20 square feet/level"
--   Knock         10 → "10 square feet/level"
--   Wizard Lock   30 → "30 square feet/level"
--   Phantasmal Force  400 + 100 → "400 sq. ft. + 100 sq. ft./level"
--   Wall of Stone 20 → Fließtext "up to 20 square feet per level"
--   Wall of Iron  15 → kein Statblock im OCR; Zahl unverändert, nur Einheit
--
-- Idempotent: Nach dem Lauf enthält keine Zeile mehr "qm"/"Quadratmeter",
-- die WHERE-Klausel greift also kein zweites Mal.

UPDATE public.spells
SET area_of_effect = regexp_replace(area_of_effect, '\yqm\y|Quadratmeter', 'Quadratfuß', 'gi')
WHERE area_of_effect ~* '\yqm\y|Quadratmeter'
  AND COALESCE(name_en, name) <> 'Web';

-- Web ist ein Sonderfall: Der PHB nennt dort ein VOLUMEN ("a maximum area of
-- eight 10' x 10' x 10' cubes"), keine Fläche. "80 qm" ist daraus fehlhergeleitet
-- (vermutlich "eight" × "10'"). Wir setzen den PHB-Wortlaut.
UPDATE public.spells
SET area_of_effect = 'Acht Würfel à 10 Fuß Kantenlänge'
WHERE COALESCE(name_en, name) = 'Web'
  AND area_of_effect = '80 qm';
