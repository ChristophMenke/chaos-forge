-- ═══════════════════════════════════════════════════════════════════════════════
-- WSC1 Wizard Level 5: Deutsche Namen ergänzen (44 Spells)
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.spells SET name = 'Auf das Ziel zielen'
WHERE LOWER(name_en) = LOWER('Aiming at the Target') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Andruis Unheilvoller Rückschlag'
WHERE LOWER(name_en) = LOWER('Andrui''s Baneful Backfire') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Betäubung'
WHERE LOWER(name_en) = LOWER('Anesthesia') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Articus'' Rückentwicklungs-Krieger'
WHERE LOWER(name_en) = LOWER('Articus''s Devolutionary Warrior') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Azurblaue Flamme — Paramander'
WHERE LOWER(name_en) = LOWER('Azure Flame — Paramander') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Ballants Steinstärke'
WHERE LOWER(name_en) = LOWER('Ballant''s Stonestrength') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Verzauberung Verleihen'
WHERE LOWER(name_en) = LOWER('Bestow Enchantment') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Bigbys Fantastische Fechter'
WHERE LOWER(name_en) = LOWER('Bigby''s Fantastic Fencers') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Bigbys Würgegriff'
WHERE LOWER(name_en) = LOWER('Bigby''s Strangling Grip') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Bigbys Überlegene Kraftskulptur'
WHERE LOWER(name_en) = LOWER('Bigby''s Superior Force Sculpture') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Untote Binden'
WHERE LOWER(name_en) = LOWER('Bind Undead') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Explosionsmantel — Phaerimm'
WHERE LOWER(name_en) = LOWER('Blastcloak — Phaerimm') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Bowgentles Flüchtige Reise'
WHERE LOWER(name_en) = LOWER('Bowgentle''s Fleeting Journey') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Atemblockade — Drache'
WHERE LOWER(name_en) = LOWER('Breathblock — Dragon') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Bubkas Überlegene Identifikation'
WHERE LOWER(name_en) = LOWER('Bubka''s Superior Identification') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Caddelyns Katastrophe'
WHERE LOWER(name_en) = LOWER('Caddelyn''s Catastrophe') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Wind Beruhigen'
WHERE LOWER(name_en) = LOWER('Calm Wind') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Schwere Wunden Verursachen'
WHERE LOWER(name_en) = LOWER('Cause Critical Wounds') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Tiere Bezaubern'
WHERE LOWER(name_en) = LOWER('Charm Animals') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Chromatische Klinge'
WHERE LOWER(name_en) = LOWER('Chromatic Blade') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Drache Befehligen'
WHERE LOWER(name_en) = LOWER('Command Dragon') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Leitung — Elf'
WHERE LOWER(name_en) = LOWER('Conduit — Elf') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Nachtmahr Beschwören'
WHERE LOWER(name_en) = LOWER('Conjure Nightmare') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Untote Kontrollieren — Hexe'
WHERE LOWER(name_en) = LOWER('Control Undead — Witch') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Auserwählten Erschaffen — Roter Magier'
WHERE LOWER(name_en) = LOWER('Create Chosen One — Red Wizard') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Gleitpforte Erschaffen'
WHERE LOWER(name_en) = LOWER('Create Slipgate') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Talisman der Pluma Erschaffen'
WHERE LOWER(name_en) = LOWER('Create Talisman of Pluma') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Kriechende Dunkelheit'
WHERE LOWER(name_en) = LOWER('Creeping Darkness') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Purpurne Geißel'
WHERE LOWER(name_en) = LOWER('Crimson Scourge') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Daltims Feuriger Beschützer'
WHERE LOWER(name_en) = LOWER('Daltim''s Fiery Protector') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Dunkelblitz — Alhoon'
WHERE LOWER(name_en) = LOWER('Darkbolt — Alhoon') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Darssons Spieluhr'
WHERE LOWER(name_en) = LOWER('Darsson''s Music Box') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Todesstoß — Ghul'
WHERE LOWER(name_en) = LOWER('Death Bump — Ghul') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Todesrauch'
WHERE LOWER(name_en) = LOWER('Death Smoke') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Todeswächter — Altes Reich'
WHERE LOWER(name_en) = LOWER('Deathguard — Old Empire') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Todesfläschchen des Meisters'
WHERE LOWER(name_en) = LOWER('Deathmaster''s Vial') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Zwietracht — Elf'
WHERE LOWER(name_en) = LOWER('Discord — Elf') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Blutlinie Verschleiern'
WHERE LOWER(name_en) = LOWER('Disguise Bloodline') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Untote Verkleiden'
WHERE LOWER(name_en) = LOWER('Disguise Undead') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Erschöpfung Vertreiben'
WHERE LOWER(name_en) = LOWER('Dispel Exhaustion') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Leben Verzerren II'
WHERE LOWER(name_en) = LOWER('Distort Life II') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Schmerz'
WHERE LOWER(name_en) = LOWER('Dolor') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Drawmijs Fliegende Meisterleistung'
WHERE LOWER(name_en) = LOWER('Drawmij''s Flying Feat') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Traumglobus'
WHERE LOWER(name_en) = LOWER('Dream Globe') AND spell_type = 'wizard';
