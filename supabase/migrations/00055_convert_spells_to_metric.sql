-- Convert all imperial measurements in spells to metric
-- Affects: range, area_of_effect, description, description_en

-- Helper function for conversion
CREATE OR REPLACE FUNCTION convert_imperial_to_metric(input text) RETURNS text AS $$
DECLARE
  result text := input;
BEGIN
  IF result IS NULL THEN RETURN NULL; END IF;

  -- Yards to meters (1 yard = 0.9144m, rounded)
  result := regexp_replace(result, '(\d+),(\d+) yds', '\1\2 yds', 'g'); -- remove commas in numbers first
  result := regexp_replace(result, '300 yds', '274 m', 'g');
  result := regexp_replace(result, '240 yds', '219 m', 'g');
  result := regexp_replace(result, '200 yds', '183 m', 'g');
  result := regexp_replace(result, '180 yds', '165 m', 'g');
  result := regexp_replace(result, '150 yds', '137 m', 'g');
  result := regexp_replace(result, '120 yds', '110 m', 'g');
  result := regexp_replace(result, '100 yds', '91 m', 'g');
  result := regexp_replace(result, '90 yds', '82 m', 'g');
  result := regexp_replace(result, '80 yds', '73 m', 'g');
  result := regexp_replace(result, '70 yds', '64 m', 'g');
  result := regexp_replace(result, '60 yds', '55 m', 'g');
  result := regexp_replace(result, '50 yds', '46 m', 'g');
  result := regexp_replace(result, '40 yds', '37 m', 'g');
  result := regexp_replace(result, '30 yds', '27 m', 'g');
  result := regexp_replace(result, '20 yds', '18 m', 'g');
  result := regexp_replace(result, '15 yds', '14 m', 'g');
  result := regexp_replace(result, '10 yds', '9 m', 'g');
  result := regexp_replace(result, '5 yds', '4,5 m', 'g');
  result := regexp_replace(result, '3 yds', '2,7 m', 'g');
  result := regexp_replace(result, '2 yds', '1,8 m', 'g');
  result := regexp_replace(result, '1 yds', '0,9 m', 'g');
  -- Remaining yds patterns with /level etc.
  result := regexp_replace(result, ' yds', ' m', 'g');

  -- Yards written out
  result := regexp_replace(result, '(\d+) yards', '\1 m', 'g');
  result := regexp_replace(result, '(\d+)-yard', '\1-m', 'g');

  -- Feet to meters (1 foot = 0.3048m)
  result := regexp_replace(result, '1,000 feet', '305 m', 'g');
  result := regexp_replace(result, '500 feet', '152 m', 'g');
  result := regexp_replace(result, '300 feet', '91 m', 'g');
  result := regexp_replace(result, '240 feet', '73 m', 'g');
  result := regexp_replace(result, '200 feet', '61 m', 'g');
  result := regexp_replace(result, '180 feet', '55 m', 'g');
  result := regexp_replace(result, '150 feet', '46 m', 'g');
  result := regexp_replace(result, '120 feet', '37 m', 'g');
  result := regexp_replace(result, '100 feet', '30 m', 'g');
  result := regexp_replace(result, '90 feet', '27 m', 'g');
  result := regexp_replace(result, '80 feet', '24 m', 'g');
  result := regexp_replace(result, '70 feet', '21 m', 'g');
  result := regexp_replace(result, '60 feet', '18 m', 'g');
  result := regexp_replace(result, '50 feet', '15 m', 'g');
  result := regexp_replace(result, '40 feet', '12 m', 'g');
  result := regexp_replace(result, '30 feet', '9 m', 'g');
  result := regexp_replace(result, '25 feet', '7,6 m', 'g');
  result := regexp_replace(result, '20 feet', '6 m', 'g');
  result := regexp_replace(result, '15 feet', '4,5 m', 'g');
  result := regexp_replace(result, '10 feet', '3 m', 'g');
  result := regexp_replace(result, '5 feet', '1,5 m', 'g');
  result := regexp_replace(result, '3 feet', '0,9 m', 'g');
  result := regexp_replace(result, '2 feet', '0,6 m', 'g');
  result := regexp_replace(result, '1 foot', '0,3 m', 'g');
  -- Remaining feet/ft patterns
  result := regexp_replace(result, ' feet', ' m', 'g');
  result := regexp_replace(result, '(\d+) ft\.', '\1 m', 'g');
  result := regexp_replace(result, '(\d+) ft\b', '\1 m', 'g');
  result := regexp_replace(result, '(\d+)-ft\.', '\1-m', 'g');
  result := regexp_replace(result, '(\d+)-foot', '\1-m', 'g');

  -- Miles to kilometers (1 mile = 1.609 km)
  result := regexp_replace(result, '(\d+) miles', '\1 Meilen (×1,6 km)', 'g');
  result := regexp_replace(result, '(\d+) mile\b', '\1 Meile (×1,6 km)', 'g');

  -- Inches to centimeters
  result := regexp_replace(result, '(\d+) inches', '\1 Zoll (×2,5 cm)', 'g');
  result := regexp_replace(result, '(\d+) inch', '\1 Zoll (×2,5 cm)', 'g');

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Apply conversion to all spell columns
UPDATE public.spells SET
  range = convert_imperial_to_metric(range),
  area_of_effect = convert_imperial_to_metric(area_of_effect),
  description = convert_imperial_to_metric(description),
  description_en = convert_imperial_to_metric(description_en);

-- Clean up helper function
DROP FUNCTION convert_imperial_to_metric(text);
