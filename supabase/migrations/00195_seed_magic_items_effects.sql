-- Populate magic_effects for the 25 DMG seed items in magic_items catalog.
-- These were seeded with empty '{}' effects in 00194.

-- Rings
UPDATE magic_items SET magic_effects = '{"ac_bonus": -1, "save_all": 1}'
WHERE name_en = 'Ring of Protection +1' AND is_custom = false;

UPDATE magic_items SET magic_effects = '{"passive_abilities": ["Invisibility at will"]}'
WHERE name_en = 'Ring of Invisibility' AND is_custom = false;

UPDATE magic_items SET magic_effects = '{"resistances": ["Fire Resistance"], "save_vs_breath": 4}'
WHERE name_en = 'Ring of Fire Resistance' AND is_custom = false;

-- Potions
UPDATE magic_items SET magic_effects = '{"description": "Heals 1d8+1 HP", "description_en": "Heals 1d8+1 HP"}'
WHERE name_en = 'Potion of Healing' AND is_custom = false;

UPDATE magic_items SET magic_effects = '{"description": "Heals 3d8+3 HP", "description_en": "Heals 3d8+3 HP"}'
WHERE name_en = 'Potion of Extra-Healing' AND is_custom = false;

UPDATE magic_items SET magic_effects = '{"str": 19, "description": "Grants giant strength for 1 turn per dose", "description_en": "Grants giant strength for 1 turn per dose"}'
WHERE name_en = 'Potion of Giant Strength' AND is_custom = false;

UPDATE magic_items SET magic_effects = '{"movement_bonus": 6, "description": "Doubles movement and attacks for 5d4 rounds", "description_en": "Doubles movement and attacks for 5d4 rounds"}'
WHERE name_en = 'Potion of Speed' AND is_custom = false;

UPDATE magic_items SET magic_effects = '{"passive_abilities": ["Invisibility for 2d8+4 turns"]}'
WHERE name_en = 'Potion of Invisibility' AND is_custom = false;

-- Cloaks
UPDATE magic_items SET magic_effects = '{"ac_bonus": -1, "save_all": 1}'
WHERE name_en = 'Cloak of Protection +1' AND is_custom = false;

UPDATE magic_items SET magic_effects = '{"ac_bonus": -2, "passive_abilities": ["First attack against wearer always misses"]}'
WHERE name_en = 'Cloak of Displacement' AND is_custom = false;

UPDATE magic_items SET magic_effects = '{"hide_in_shadows": 50, "passive_abilities": ["Near-invisibility in natural settings"]}'
WHERE name_en = 'Cloak of Elvenkind' AND is_custom = false;

-- Boots
UPDATE magic_items SET magic_effects = '{"move_silently": 50, "passive_abilities": ["Near-silent movement"]}'
WHERE name_en = 'Boots of Elvenkind' AND is_custom = false;

UPDATE magic_items SET magic_effects = '{"movement_bonus": 12, "description": "Doubles base movement rate", "description_en": "Doubles base movement rate"}'
WHERE name_en = 'Boots of Speed' AND is_custom = false;

UPDATE magic_items SET magic_effects = '{"passive_abilities": ["Fly at movement rate 15 (MC B)"]}'
WHERE name_en = 'Boots of Flying' AND is_custom = false;

-- Amulets & Necklaces
UPDATE magic_items SET magic_effects = '{"passive_abilities": ["Immune to all divination magic"]}'
WHERE name_en = 'Amulet of Proof Against Detection and Location' AND is_custom = false;

UPDATE magic_items SET magic_effects = '{"passive_abilities": ["Immune to all diseases"]}'
WHERE name_en = 'Periapt of Health' AND is_custom = false;

UPDATE magic_items SET magic_effects = '{"max_charges": 7, "current_charges": 7, "spell_abilities": [{"name": "Fireball", "name_en": "Fireball", "uses_per_day": 0, "description": "Variable damage fireballs depending on bead type", "description_en": "Variable damage fireballs depending on bead type"}]}'
WHERE name_en = 'Necklace of Fireballs' AND is_custom = false;

-- Bracers & Gauntlets
UPDATE magic_items SET magic_effects = '{"ac_bonus": -4, "description": "Sets base AC to 6", "description_en": "Sets base AC to 6"}'
WHERE name_en = 'Bracers of Defense AC 6' AND is_custom = false;

UPDATE magic_items SET magic_effects = '{"dex": 18}'
WHERE name_en = 'Gauntlets of Dexterity' AND is_custom = false;

UPDATE magic_items SET magic_effects = '{"str": 18, "description": "Grants Ogre-level strength (STR 18/00)", "description_en": "Grants Ogre-level strength (STR 18/00)"}'
WHERE name_en = 'Gauntlets of Ogre Power' AND is_custom = false;

-- Belts & Girdles
UPDATE magic_items SET magic_effects = '{"passive_abilities": ["Dwarven abilities: infravision 18m, detect grade/slope, stone door detection"], "save_vs_poison": 1, "save_vs_spell": 1}'
WHERE name_en = 'Girdle of Dwarvenkind' AND is_custom = false;

UPDATE magic_items SET magic_effects = '{"str": 19, "description": "Grants Hill Giant strength (STR 19)", "description_en": "Grants Hill Giant strength (STR 19)"}'
WHERE name_en = 'Belt of Giant Strength' AND is_custom = false;

-- Wands & Rods
UPDATE magic_items SET magic_effects = '{"max_charges": 25, "current_charges": 25, "spell_abilities": [{"name": "Heal", "name_en": "Heal", "uses_per_day": 0, "description": "Cures disease, blindness, or restores 1d6+6 HP per charge", "description_en": "Cures disease, blindness, or restores 1d6+6 HP per charge"}]}'
WHERE name_en = 'Rod of Healing' AND is_custom = false;

UPDATE magic_items SET magic_effects = '{"max_charges": 50, "current_charges": 50, "spell_abilities": [{"name": "Magic Missile", "name_en": "Magic Missile", "uses_per_day": 0, "description": "Fires 1 missile per charge (1d4+1 damage each)", "description_en": "Fires 1 missile per charge (1d4+1 damage each)"}]}'
WHERE name_en = 'Wand of Magic Missiles' AND is_custom = false;

-- Miscellaneous
UPDATE magic_items SET magic_effects = '{"passive_abilities": ["Holds 250 kg, weighing only 7 kg regardless of contents"]}'
WHERE name_en = 'Bag of Holding' AND is_custom = false;
