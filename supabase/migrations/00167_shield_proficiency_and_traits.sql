-- Shield Proficiency + Character Traits & Disadvantages
-- Part A: Medium Shield + is_shield Fix + Larry Shield Proficiency
-- Part B: Traits/Disadvantages Spalten + Larry Daten

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. Neuer Schildtyp: Mittlerer Schild (Medium Shield)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.armor (name, name_en, ac, weight, cost_gp, max_movement, source_book, is_shield)
SELECT 'Mittlerer Schild', 'Medium Shield', 8, 7.5, 12.0, 12, 'PHB', true
WHERE NOT EXISTS (SELECT 1 FROM public.armor WHERE name = 'Mittlerer Schild');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. is_shield für alle Schildtypen korrigieren
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.armor SET is_shield = true
WHERE lower(name) IN ('buckler', 'großer schild', 'mittlerer schild')
   OR lower(name_en) IN ('buckler', 'large shield', 'medium shield');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. Traits + Disadvantages Spalten auf characters
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS traits jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS disadvantages jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. Larry (new): Mittlerer Schild als Equipment
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.character_equipment (character_id, armor_id, quantity, equipped, hit_bonus, damage_bonus)
SELECT c.id, a.id, 1, true, 0, 0
FROM public.characters c, public.armor a
WHERE c.name = 'Larry (new)' AND a.name = 'Mittlerer Schild'
  AND NOT EXISTS (
    SELECT 1 FROM public.character_equipment ce
    JOIN public.armor ar ON ar.id = ce.armor_id
    WHERE ce.character_id = c.id AND ar.name = 'Mittlerer Schild'
  )
LIMIT 1;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. Larry (new): Shield Proficiency für Mittlerer Schild
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.character_weapon_proficiencies (character_id, weapon_name, specialization)
SELECT c.id, 'Mittlerer Schild', false
FROM public.characters c WHERE c.name = 'Larry (new)'
  AND NOT EXISTS (
    SELECT 1 FROM public.character_weapon_proficiencies cwp
    WHERE cwp.character_id = c.id AND cwp.weapon_name = 'Mittlerer Schild'
  )
LIMIT 1;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. Larry (new): Traits + Disadvantages seeden
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.characters SET
  traits = '[
    {
      "name": "Innerer Kompass",
      "name_en": "Internal Compass",
      "description": "+1 auf Navigation-Fertigkeitswürfe. Die Chance, sich zu verirren, ist um 5% reduziert.",
      "description_en": "+1 bonus to Navigation proficiency checks, and the chance of being lost is reduced by 5%.",
      "cost": 3
    }
  ]'::jsonb,
  disadvantages = '[
    {
      "name": "Farbenblind",
      "name_en": "Colorblind",
      "description": "Der Charakter sieht nur in Graustufen.",
      "description_en": "Character sees only in shades of grey.",
      "cost": 3
    }
  ]'::jsonb
WHERE name = 'Larry (new)';
