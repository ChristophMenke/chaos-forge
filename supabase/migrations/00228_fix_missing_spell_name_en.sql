-- Setzt die fehlenden englischen Zaubernamen (spells.name_en).
--
-- Problem: 16 PHB-Zauber wurden nur mit deutschem `name` angelegt, `name_en`
-- blieb leer. Überall dort, wo über den englischen Namen gematcht wird, fällt
-- der Code dann auf den deutschen Namen zurück:
--   - localized(name, name_en, locale) zeigt EN-Nutzern den deutschen Namen
--   - die bilinguale Suche in Spellbook/Learn-Dialog findet sie nur auf Deutsch
--   - scripts/spell-cards/lib.mjs musste sie über eine NAME_FIX-Tabelle
--     nachschlagen, damit die Kartennamen stimmen
--
-- Die englischen Namen sind die kanonischen AD&D-2e-Schreibweisen aus dem PHB.
-- "Change self " trägt zusätzlich ein Leerzeichen am Ende, das hier mitgeht.
--
-- Idempotent: Die WHERE-Klausel greift nur bei leerem name_en.

UPDATE public.spells AS s
SET name_en = v.name_en
FROM (
  VALUES
    -- Magier
    ('Cantrip', 1, 'wizard', 'Cantrip'),
    ('Change self ', 1, 'wizard', 'Change Self'),
    ('Magisches Geschoss', 1, 'wizard', 'Magic Missile'),
    ('Schlaf', 1, 'wizard', 'Sleep'),
    ('Schild', 1, 'wizard', 'Shield'),
    ('Klopfen', 2, 'wizard', 'Knock'),
    ('Fluch Brechen', 3, 'wizard', 'Remove Curse'),
    ('Feuerball', 3, 'wizard', 'Fireball'),
    -- Priester
    ('Licht', 1, 'priest', 'Light'),
    ('Segen', 1, 'priest', 'Bless'),
    ('Schutz vor Bösem', 1, 'priest', 'Protection From Evil'),
    ('Leichte Wunden Heilen', 1, 'priest', 'Cure Light Wounds'),
    ('Stille 15 Fuß Radius', 2, 'priest', 'Silence, 15'' Radius'),
    ('Fluch Aufheben', 3, 'priest', 'Remove Curse'),
    ('Gebet', 3, 'priest', 'Prayer'),
    ('Schwere Wunden Heilen', 4, 'priest', 'Cure Serious Wounds')
) AS v(name, level, spell_type, name_en)
WHERE s.name = v.name
  AND s.level = v.level
  AND s.spell_type = v.spell_type
  AND (s.name_en IS NULL OR btrim(s.name_en) = '');
