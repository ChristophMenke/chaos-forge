-- Add Tiefling race to the races table (Planescape Campaign Setting)
INSERT INTO public.races (id, name, name_en, ability_adjustments, infravision, ability_minimums, ability_maximums)
VALUES ('tiefling', 'Tiefling', 'Tiefling', '{"int": 1, "cha": -1}', 60, '{}', '{}');
