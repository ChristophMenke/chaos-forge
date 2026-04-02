-- ═══════════════════════════════════════════════════════════════════════════════
-- Doppelte deutsche Spell-Namen bereinigen
-- ═══════════════════════════════════════════════════════════════════════════════

-- Blood Lust / Blood Rage / Bloodgloat — alle drei "Blutrausch"
UPDATE public.spells SET name = 'Blutgier'
WHERE LOWER(name_en) = LOWER('Blood Lust') AND spell_type = 'priest';

UPDATE public.spells SET name = 'Blutwut'
WHERE LOWER(name_en) = LOWER('Blood Rage') AND spell_type = 'priest';

UPDATE public.spells SET name = 'Blutfreude'
WHERE LOWER(name_en) = LOWER('Bloodgloat') AND spell_type = 'priest';

-- Bloom / Blossom — Pluma — beide "Blüte"
UPDATE public.spells SET name = 'Erblühen'
WHERE LOWER(name_en) = LOWER('Bloom') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Blütenzauber — Pluma'
WHERE LOWER(name_en) = LOWER('Blossom — Pluma') AND spell_type = 'wizard';

-- Cause Serious Wounds / Cause Critical Wounds — beide "Schwere Wunden verursachen"
UPDATE public.spells SET name = 'Schwere Wunden Verursachen'
WHERE LOWER(name_en) = LOWER('Cause Serious Wounds') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Kritische Wunden Verursachen'
WHERE LOWER(name_en) = LOWER('Cause Critical Wounds') AND spell_type = 'wizard';

-- Disguise / Disguise — Wu Jen — beide "Verkleidung"
UPDATE public.spells SET name = 'Verkleidung'
WHERE LOWER(name_en) = LOWER('Disguise') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Verkleidung — Wu Jen'
WHERE LOWER(name_en) = LOWER('Disguise — Wu Jen') AND spell_type = 'wizard';

-- Dictation / Dictate — beide "Diktat"
UPDATE public.spells SET name = 'Diktat'
WHERE LOWER(name_en) = LOWER('Dictation') AND spell_type = 'priest';

UPDATE public.spells SET name = 'Gebieten — Harmonium'
WHERE LOWER(name_en) = LOWER('Dictate — Harmonium') AND spell_type = 'priest';

-- Darkbolt (priest) / Darkning Bolt (wizard) — beide "Dunkelblitz"
UPDATE public.spells SET name = 'Dunkelbolzen'
WHERE LOWER(name_en) = LOWER('Darkbolt') AND spell_type = 'priest';

UPDATE public.spells SET name = 'Verdunkelnder Blitz'
WHERE LOWER(name_en) = LOWER('Darkning Bolt') AND spell_type = 'wizard';

-- Crawling Darkness (priest) / Creeping Darkness (wizard) — beide "Kriechende Dunkelheit"
UPDATE public.spells SET name = 'Kriechende Dunkelheit'
WHERE LOWER(name_en) = LOWER('Crawling Darkness') AND spell_type = 'priest';

UPDATE public.spells SET name = 'Schleichende Dunkelheit'
WHERE LOWER(name_en) = LOWER('Creeping Darkness') AND spell_type = 'wizard';

-- Darkfire of Beshaba / Beshaba, Darkfire of — DB-Duplikat, eines löschen
DELETE FROM public.spells
WHERE LOWER(name_en) = LOWER('Beshaba, Darkfire of') AND spell_type = 'priest';
