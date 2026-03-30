-- Seed Sprocket's two epic items
-- Character ID: 294c567c-5abb-4b6e-bc24-8d5105981ccf

INSERT INTO public.epic_items (character_id, slug, name, name_en, description, description_en, icon, equipped, damage_level, max_damage_level, damage_levels, simple_effects)
VALUES (
  '294c567c-5abb-4b6e-bc24-8d5105981ccf',
  'sharpvision_goggles',
  'Scharfsicht-Brille',
  'Sharpvision Goggles',
  'Sprocket trägt diese Brille aus poliertem Messing und feinem Silberdraht fast immer. Sie ist nicht nur ein medizinisches Gerät, sondern ein Meisterwerk der optischen Ingenieurskunst, das an allen Ecken und Enden von winzigen Zahnrädern und magisch geschliffenen Prismen geschmückt ist. Bei der Konzentration summt die Brille leise, und in den Linsen fängt sich ein funkelndes Licht ein.',
  'Sprocket almost always wears these goggles made of polished brass and fine silver wire. They are not just a medical device, but a masterpiece of optical engineering, adorned with tiny gears and magically ground prisms at every corner. When concentrating, the goggles hum softly, and a sparkling light catches in the lenses.',
  'glasses',
  true,
  0,
  0,
  '{}',
  '{"perception_bonus": 2, "description": "+2 auf sichtbedingte Wahrnehmungswürfe", "description_en": "+2 to sight-based perception checks", "weakness": "Die filigranen Linsen und Mechanismen sind anfällig für Erschütterungen. Ein Schlag auf den Kopf oder ein Sturz könnte sie beschädigen.", "weakness_en": "The delicate lenses and mechanisms are susceptible to shocks. A blow to the head or a fall could damage them."}'
)
ON CONFLICT (character_id, slug) DO NOTHING;

INSERT INTO public.epic_items (character_id, slug, name, name_en, description, description_en, icon, equipped, damage_level, max_damage_level, damage_levels, simple_effects)
VALUES (
  '294c567c-5abb-4b6e-bc24-8d5105981ccf',
  'constitution_condenser',
  'Konstitutions-Kondensator',
  'Constitution Condenser',
  'Dieses Gerät ist ein kompakter, runder Behälter aus Bronze und Glas, der wie ein kleiner mechanischer Herzschlag im Rhythmus pulsiert und an Sprockets Gürtel befestigt ist. Im Inneren leuchten rote, magische Kristalle, die durch eine Spirale aus Drähten miteinander verbunden sind.',
  'This device is a compact, round container of bronze and glass that pulses like a small mechanical heartbeat and is attached to Sprocket''s belt. Inside, red magical crystals glow, connected by a spiral of wires.',
  'heart-pulse',
  true,
  0,
  8,
  '{
    "0": {
      "stat_overrides": {"con": 18},
      "description": "Voll funktionsfähig. Der Motor erhöht Sprockets Konstitution auf 18.",
      "description_en": "Fully functional. The motor raises Sprocket''s Constitution to 18.",
      "effects": []
    },
    "1": {
      "stat_overrides": {"con": 17},
      "description": "Leichte Beschädigung. Konstitution sinkt auf 17.",
      "description_en": "Minor damage. Constitution drops to 17.",
      "effects": []
    },
    "2": {
      "stat_overrides": {"con": 16},
      "description": "Konstitution sinkt auf 16. Sprocket spürt eine wachsende emotionale Distanz.",
      "description_en": "Constitution drops to 16. Sprocket feels a growing emotional distance.",
      "effects": []
    },
    "3": {
      "stat_overrides": {"con": 15},
      "description": "Konstitution sinkt auf 15. Zauber und Angriffe haben eine 10%-ige Fehlschlagwahrscheinlichkeit.",
      "description_en": "Constitution drops to 15. Spells and attacks have a 10% failure chance.",
      "effects": ["spell_failure_10"]
    },
    "4": {
      "stat_overrides": {"con": 14},
      "description": "Konstitution sinkt auf 14. Sprocket leidet unter Erschöpfung: -10% auf Diebesfähigkeiten.",
      "description_en": "Constitution drops to 14. Sprocket suffers from exhaustion: -10% on thief skills.",
      "effects": ["spell_failure_10", "thief_penalty_10"]
    },
    "5": {
      "stat_overrides": {"con": 12},
      "description": "Konstitution sinkt auf 12. 1 Punkt elektrischer Schaden pro Runde. Diebesfähigkeiten nicht nutzbar.",
      "description_en": "Constitution drops to 12. 1 point of electrical damage per round. Thief skills unusable.",
      "effects": ["spell_failure_10", "thief_disabled", "electric_damage_1"]
    },
    "6": {
      "stat_overrides": {"con": 10},
      "description": "Konstitution sinkt auf 10. Zauber haben eine 50%-ige Wild-Magic-Chance.",
      "description_en": "Constitution drops to 10. Spells have a 50% Wild Magic chance.",
      "effects": ["spell_failure_10", "thief_disabled", "electric_damage_1", "wild_magic_50"]
    },
    "7": {
      "stat_overrides": {"con": 8},
      "description": "Konstitution sinkt auf 8. Mühsame Fortbewegung. Rettungswurf gg. Todesmagie pro Runde nötig.",
      "description_en": "Constitution drops to 8. Labored movement. Save vs. Death Magic required each round.",
      "effects": ["spell_failure_10", "thief_disabled", "electric_damage_1", "wild_magic_50", "save_vs_death"]
    },
    "8": {
      "stat_overrides": {"con": 5},
      "description": "Totalausfall. Die Konstitution sinkt auf Sprockets angeborenen Wert von 5. Das Gerät funktioniert nicht mehr.",
      "description_en": "Total failure. Constitution drops to Sprocket''s innate value of 5. The device no longer functions.",
      "effects": ["thief_disabled", "device_offline"]
    }
  }',
  '{
    "repair_skill": "Ingenieurskunst",
    "repair_skill_en": "Engineering",
    "repair_time": "10 Minuten",
    "repair_time_en": "10 minutes",
    "elixir_cost_gp": 100,
    "elixir_bonus": 4,
    "base_con": 5,
    "damage_trigger": "Jeder physische Rettungswurf: 50% Chance auf Schadensstufe (-2% pro Klassenstufe). Natürliche 1: automatisch 2 Stufen.",
    "damage_trigger_en": "Each physical saving throw: 50% chance of damage level (-2% per class level). Natural 1: automatically 2 levels."
  }'
)
ON CONFLICT (character_id, slug) DO NOTHING;
