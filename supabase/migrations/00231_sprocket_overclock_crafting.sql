-- Sprocket: Übertakten mit Ingenieurskunst-Wurf und Kühlungswurf statt
-- Echtzeit-Timer, Kupferelixier als Bestand mit Rezept, Rezepte für die vier
-- Mixturen der Mix-and-Match-Klingen. Wiederholbar: Bestände, Häkchen und ein
-- bereits umgestellter Übertakten-Zustand bleiben erhalten.

-- 1) Übertakten: Fähigkeit ohne feste Dauer, neue Beschreibung
UPDATE public.epic_items
SET simple_effects = jsonb_set(
  simple_effects,
  '{overclock}',
  (simple_effects->'overclock') - 'duration_hours' || '{
    "description": "Übertaktet den Kondensator: KON wird auf 20 gesetzt, Rettungswurf gg. Gift +1 (schlechter), heilt 1 TP pro Stunde. Aktivieren erfordert einen Ingenieurskunst-Wurf – misslingt er, nimmt der Kondensator eine Schadensstufe. Jede Stunde folgt ein Kühlungswurf auf Ingenieurskunst, jede zweite Stunde um 1 erschwert. Misslingt er, schaltet Sprocket ab und das Gerät muss einen Tag abkühlen.",
    "description_en": "Overclocks the Condenser: CON becomes 20, Save vs. Poison +1 (worse), heals 1 HP per hour. Activating requires an Engineering check – on a failure the Condenser takes one damage level. Every hour a cooling check on Engineering follows, 1 harder every second hour. On a failure Sprocket shuts it down and the device must cool down for a day."
  }'::jsonb
)
WHERE character_id = '294c567c-5abb-4b6e-bc24-8d5105981ccf'
  AND slug = 'constitution_condenser'
  AND simple_effects ? 'overclock';

-- 2) Laufzustand vom Timer auf Stundenzählung umstellen (nur einmal)
UPDATE public.epic_items
SET simple_effects = (simple_effects - 'overclock_end_time')
  || '{"overclock_active": false, "overclock_hours": 0, "overclock_cooldown": false}'::jsonb
WHERE character_id = '294c567c-5abb-4b6e-bc24-8d5105981ccf'
  AND slug = 'constitution_condenser'
  AND NOT simple_effects ? 'overclock_hours';

-- 3) Kupferelixier als Bestand mit Rezept (nur einmal, Startbestand 4)
UPDATE public.epic_items
SET simple_effects = (simple_effects - 'elixir_bonus' - 'elixir_cost_gp') || '{
  "elixir": {
    "count": 4,
    "bonus": 4,
    "name": "Kupferelixier",
    "name_en": "Copper Elixir",
    "collected": [],
    "recipe": {
      "yield": 1,
      "duration": "ca. 4 Stunden",
      "duration_en": "about 4 hours",
      "cost_gp": 100,
      "components": [
        {"key": "vinegar", "name": "Starker Essig", "name_en": "Strong vinegar", "source": "Wirtshaus, Markt", "source_en": "Tavern, market"},
        {"key": "salt", "name": "Grobes Salz", "name_en": "Coarse salt", "source": "Krämer, Metzger", "source_en": "Grocer, butcher"},
        {"key": "neatsfoot", "name": "Klauenöl", "name_en": "Neatsfoot oil", "source": "Sattler, Schuster", "source_en": "Saddler, cobbler"}
      ]
    }
  }
}'::jsonb
WHERE character_id = '294c567c-5abb-4b6e-bc24-8d5105981ccf'
  AND slug = 'constitution_condenser'
  AND NOT simple_effects ? 'elixir';

-- 4) Rezepte der Mixturen (Rezept überschreibbar, Häkchen und Zähler bleiben)
CREATE TEMP TABLE _mixture_recipes (key text PRIMARY KEY, recipe jsonb) ON COMMIT DROP;

INSERT INTO _mixture_recipes (key, recipe) VALUES
('red', '{
  "yield": 2, "duration": "ca. 1 Stunde", "duration_en": "about 1 hour",
  "components": [
    {"key": "saltpeter", "name": "Salpeter", "name_en": "Saltpeter", "source": "Stall- oder Kellerwände, Gerber", "source_en": "Stable or cellar walls, tanner"},
    {"key": "honey", "name": "Honig oder Rohzucker", "name_en": "Honey or raw sugar", "source": "Imker, Markt", "source_en": "Beekeeper, market"},
    {"key": "madder", "name": "Krappwurzel", "name_en": "Madder root", "source": "Färber, Wegesrand", "source_en": "Dyer, roadside"},
    {"key": "beeswax", "name": "Bienenwachs", "name_en": "Beeswax", "source": "Kerzenzieher, Imker", "source_en": "Chandler, beekeeper"}
  ]
}'),
('blue', '{
  "yield": 2, "duration": "ca. 1 Stunde", "duration_en": "about 1 hour",
  "components": [
    {"key": "hartshorn", "name": "Hirschhornsalz", "name_en": "Hartshorn salt", "source": "Bäcker", "source_en": "Baker"},
    {"key": "spirits", "name": "Hochprozentiger Branntwein", "name_en": "Strong spirits", "source": "Wirtshaus", "source_en": "Tavern"},
    {"key": "mint", "name": "Pfefferminze", "name_en": "Peppermint", "source": "Kräuterfrau, Bauerngarten", "source_en": "Herbalist, cottage garden"},
    {"key": "woad", "name": "Waid", "name_en": "Woad", "source": "Färber", "source_en": "Dyer"},
    {"key": "bladder", "name": "Schweinsblase", "name_en": "Pig bladder", "source": "Metzger", "source_en": "Butcher"}
  ]
}'),
('green', '{
  "yield": 2, "duration": "ca. 1 Stunde", "duration_en": "about 1 hour",
  "components": [
    {"key": "resin", "name": "Kiefernharz oder Pech", "name_en": "Pine resin or pitch", "source": "Wald, Böttcher, Köhler", "source_en": "Forest, cooper, charcoal burner"},
    {"key": "verdigris", "name": "Grünspan", "name_en": "Verdigris", "source": "Kupferschmied, Kesselflicker", "source_en": "Coppersmith, tinker"},
    {"key": "foxfire", "name": "Fuchsfeuer", "name_en": "Foxfire", "source": "Wald, nachts", "source_en": "Forest, at night"},
    {"key": "pepper", "name": "Gemahlener Pfeffer", "name_en": "Ground pepper", "source": "Markt, Gewürzkrämer", "source_en": "Market, spice seller"},
    {"key": "linseed", "name": "Leinöl", "name_en": "Linseed oil", "source": "Ölmüller, Maler", "source_en": "Oil miller, painter"}
  ]
}'),
('purple', '{
  "yield": 2, "duration": "ca. 1 Stunde", "duration_en": "about 1 hour",
  "components": [
    {"key": "poppy", "name": "Mohnkapseln", "name_en": "Poppy pods", "source": "Kräuterfrau, Bauerngarten", "source_en": "Herbalist, cottage garden"},
    {"key": "valerian", "name": "Baldrianwurzel", "name_en": "Valerian root", "source": "Kräuterfrau, feuchte Wiesen", "source_en": "Herbalist, damp meadows"},
    {"key": "hops", "name": "Hopfen", "name_en": "Hops", "source": "Brauer, Wirtshaus", "source_en": "Brewer, tavern"},
    {"key": "elder", "name": "Holundersaft", "name_en": "Elderberry juice", "source": "Hecken, Bauernhof", "source_en": "Hedgerows, farm"},
    {"key": "schnapps", "name": "Schnaps", "name_en": "Schnapps", "source": "Wirtshaus", "source_en": "Tavern"}
  ]
}');

-- Eine Zeile pro Mixtur: UPDATE … FROM würde je Item nur ein Rezept anwenden.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT key, recipe FROM _mixture_recipes LOOP
    UPDATE public.epic_items
    SET simple_effects = jsonb_set(
      jsonb_set(simple_effects, ARRAY['mixtures', r.key, 'recipe'], r.recipe),
      ARRAY['mixtures', r.key, 'collected'],
      COALESCE(simple_effects #> ARRAY['mixtures', r.key, 'collected'], '[]'::jsonb)
    )
    WHERE character_id = '294c567c-5abb-4b6e-bc24-8d5105981ccf'
      AND slug = 'mix-and-match-blades'
      AND simple_effects #> ARRAY['mixtures', r.key] IS NOT NULL;
  END LOOP;
END $$;

-- 5) Realtime für den GM-Bereich (KON 20 beim Übertakten sofort sichtbar)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'epic_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.epic_items;
  END IF;
END $$;
