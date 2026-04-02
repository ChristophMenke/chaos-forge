-- ═══════════════════════════════════════════════════════════════════════════════
-- WSC1 Wizard Level 1: Deutsche Namen ergänzen (60 Spells)
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.spells SET name = 'Haftung'
WHERE LOWER(name_en) = LOWER('Adhesion') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Instrument Verwandeln — Barde'
WHERE LOWER(name_en) = LOWER('Alter Instrument — Bard') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Normale Winde Verändern'
WHERE LOWER(name_en) = LOWER('Alter Normal Winds') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Verstärken'
WHERE LOWER(name_en) = LOWER('Amplify') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Tier-Friedfertigkeit — Barde'
WHERE LOWER(name_en) = LOWER('Animal Nonaggression — Bard') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Tierschutz'
WHERE LOWER(name_en) = LOWER('Animal Sanctuary') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Tote Tiere Beleben'
WHERE LOWER(name_en) = LOWER('Animate Dead Animals') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Holz Beleben'
WHERE LOWER(name_en) = LOWER('Animate Wood') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Pfeilflug — Pluma'
WHERE LOWER(name_en) = LOWER('Arrowflight — Pluma') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Tantchens Bad'
WHERE LOWER(name_en) = LOWER('Aunty''s Bath') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Aurafeuer — Roter Zauberer'
WHERE LOWER(name_en) = LOWER('Aura Fire — Red Wizard') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Gleichgewicht'
WHERE LOWER(name_en) = LOWER('Balance') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Barriere — Altes Reich'
WHERE LOWER(name_en) = LOWER('Barrier — Old Empire') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Bigbys Bücherwurm-Fluch'
WHERE LOWER(name_en) = LOWER('Bigby''s Bookworm Bane') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Bigbys Tastende Finger'
WHERE LOWER(name_en) = LOWER('Bigby''s Feeling Fingers') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Vogelzauber I — Pluma'
WHERE LOWER(name_en) = LOWER('Bird Charm I — Pluma') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Schwarzstahl'
WHERE LOWER(name_en) = LOWER('Blacksteel') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Schwarzdornen'
WHERE LOWER(name_en) = LOWER('Blackthorns') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Blüte'
WHERE LOWER(name_en) = LOWER('Bloom') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Atmen — Altes Reich'
WHERE LOWER(name_en) = LOWER('Breathe — Old Empire') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Bugmans Krug'
WHERE LOWER(name_en) = LOWER('Bugman''s Mug') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Brennender Sand'
WHERE LOWER(name_en) = LOWER('Burning Sands') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Katzenzauber — Hishna'
WHERE LOWER(name_en) = LOWER('Cat Charm — Hishna') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Katapult'
WHERE LOWER(name_en) = LOWER('Catapult') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Leichte Wunden Verursachen'
WHERE LOWER(name_en) = LOWER('Cause Light Wounds') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Chamäleon'
WHERE LOWER(name_en) = LOWER('Chameleon') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Männer Bezaubern I'
WHERE LOWER(name_en) = LOWER('Charm Man I') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Chromatische Kugel'
WHERE LOWER(name_en) = LOWER('Chromatic Orb') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Kreis — Roter Zauberer'
WHERE LOWER(name_en) = LOWER('Circle — Red Wizard') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Wolkenleiter'
WHERE LOWER(name_en) = LOWER('Cloud Ladder') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Farbe'
WHERE LOWER(name_en) = LOWER('Color') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Farbenblindheit'
WHERE LOWER(name_en) = LOWER('Color Blindness') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Untote Befehligen'
WHERE LOWER(name_en) = LOWER('Command Undead') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Kompass'
WHERE LOWER(name_en) = LOWER('Compass') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Dampf Kontrollieren'
WHERE LOWER(name_en) = LOWER('Control Vapor') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Kühlende Stärke'
WHERE LOWER(name_en) = LOWER('Cool Strength') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Kühlung — Pluma'
WHERE LOWER(name_en) = LOWER('Cool — Pluma') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Kopie'
WHERE LOWER(name_en) = LOWER('Copy') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Leichenverbindung'
WHERE LOWER(name_en) = LOWER('Corpse Link') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Leichenantlitz'
WHERE LOWER(name_en) = LOWER('Corpse Visage') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Leichenleuchten'
WHERE LOWER(name_en) = LOWER('Corpselight') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Totentanz'
WHERE LOWER(name_en) = LOWER('Dance Macabre') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Tanzende Flamme — Phaerimm'
WHERE LOWER(name_en) = LOWER('Dancing Fire — Phaerimm') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Ablenkung — Alhoon'
WHERE LOWER(name_en) = LOWER('Deflection — Alhoon') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Krankheit Entdecken'
WHERE LOWER(name_en) = LOWER('Detect Disease') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Illusion Entdecken'
WHERE LOWER(name_en) = LOWER('Detect Illusion') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Leben Entdecken — Alhoon'
WHERE LOWER(name_en) = LOWER('Detect Life — Alhoon') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Metalle und Minerale Entdecken'
WHERE LOWER(name_en) = LOWER('Detect Metals and Minerals') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Geheime Durchgänge und Portale Entdecken'
WHERE LOWER(name_en) = LOWER('Detect Secret Passages and Portals') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Temporale Anomalie Entdecken'
WHERE LOWER(name_en) = LOWER('Detect Temporal Anomaly') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Dethos Delirium'
WHERE LOWER(name_en) = LOWER('Detho''s Delirium') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Entwaffnen'
WHERE LOWER(name_en) = LOWER('Disarm') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Verkleidung — Hishna'
WHERE LOWER(name_en) = LOWER('Disguise — Hishna') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Verzerren'
WHERE LOWER(name_en) = LOWER('Distort') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Wünschelrute'
WHERE LOWER(name_en) = LOWER('Divining Rod') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Dolents Helm'
WHERE LOWER(name_en) = LOWER('Dolent''s Helm') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Drachenzungen — Drachenritter'
WHERE LOWER(name_en) = LOWER('Dragon Tongues — Dragon Knight') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Drawmijs Lasttier'
WHERE LOWER(name_en) = LOWER('Drawmij''s Beast of Burden') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Drawmijs Leichter Schritt'
WHERE LOWER(name_en) = LOWER('Drawmij''s Light Step') AND spell_type = 'wizard';

UPDATE public.spells SET name = 'Schläfrige Insekten'
WHERE LOWER(name_en) = LOWER('Drowsy Insects') AND spell_type = 'wizard';
