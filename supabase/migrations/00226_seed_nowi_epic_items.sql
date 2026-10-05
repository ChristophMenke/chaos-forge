-- Epic Items für Nowi Tarja: Tricksters Choice & Netherese Blooded
-- Beide Items nutzen level_thresholds [3,5,7,9] (4 Tiers, Lvl3-4/5-6/7-8/9-10),
-- identisch zum bestehenden Muster (siehe 00165/00169_..._klinge_des_wassers).

-- ═══════════════════════════════════════════════════════════════════════════════
-- 0. Spellpoints-System für Nowi aktivieren (Netherese Blooded braucht Points-Mode)
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.characters
SET spell_system = 'points'
WHERE name = 'Nowi Tarja' AND spell_system = 'slots';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. Epic Item: Tricksters Choice
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.epic_items (
  character_id, slug, name, name_en, description, description_en, icon,
  equipped, damage_level, max_damage_level, damage_levels, simple_effects, notes
)
SELECT
  c.id,
  'tricksters-choice',
  'Tricksters Choice',
  'Tricksters Choice',
  'Ein kleines, aber feines Artefakt, das einst von einem der mächtigsten Ebenenläufer aller Zeiten für eine gute Freundin erschaffen wurde. Es ähnelt vom Aussehen her einem silbernen W6. Durch Körperkontakt und ständige Nutzung wird jede der sechs Seiten des Würfels freigeschaltet. Egal, welche Seite genutzt wird, kann der Würfel dreimal am Tag ein Portal erschaffen.',
  'A small but exquisite artifact, once created by one of the mightiest planeswalkers of all time for a good friend. It resembles a silver d6 in appearance. Through physical contact and continued use, each of the die''s six sides is unlocked. Regardless of which side is ultimately used, the die can create a portal three times per day.',
  'sparkles',
  true,
  0, -- auto-calculated from character level
  4, -- max_damage_level = 5 tiers (0-4)
  '{
    "0": {
      "description": "Das Artefakt ist noch nicht vollständig erwacht. Kein Portal möglich.",
      "description_en": "The artifact has not fully awakened yet. No portal possible.",
      "effects": []
    },
    "1": {
      "description": "Stufe 3-4: Das Portal führt zu einer extradimensionalen Truhe mit einem Fassungsvermögen von 50 kg.",
      "description_en": "Level 3-4: The portal leads to an extradimensional chest with a capacity of 50 kg.",
      "effects": []
    },
    "2": {
      "description": "Stufe 5-6: Das Portal führt zu einer extradimensionalen Truhe mit einem Fassungsvermögen von 150 kg.",
      "description_en": "Level 5-6: The portal leads to an extradimensional chest with a capacity of 150 kg.",
      "effects": []
    },
    "3": {
      "description": "Stufe 7-8: Das Portal führt zu einer extradimensionalen Hütte mit Platz für 6 Personen inklusive eines unsichtbaren Dieners.",
      "description_en": "Level 7-8: The portal leads to an extradimensional cottage with room for 6 people, including an invisible servant.",
      "effects": []
    },
    "4": {
      "description": "Stufe 9-10: Das Portal führt zu einem extradimensionalen Haus mit Platz für 20 Personen inklusive eines unsichtbaren Dieners und genug Nahrung für alle Gäste. Die Nahrung verschwindet, wenn sie aus dem Haus entfernt wird.",
      "description_en": "Level 9-10: The portal leads to an extradimensional house with room for 20 people, including an invisible servant and enough food for all guests. The food vanishes if removed from the house.",
      "effects": []
    }
  }'::jsonb,
  '{
    "level_thresholds": [3, 5, 7, 9],
    "spell_abilities": [
      {
        "key": "portal",
        "name": "Portal",
        "name_en": "Portal",
        "unlock_level": 0,
        "usesPerDay": 3,
        "usesPerWeek": 0,
        "effect": "Erschafft ein Portal zum aktuell freigeschalteten Extradimensionalraum (siehe Stufenbeschreibung oben).",
        "effect_en": "Opens a portal to the currently unlocked extradimensional space (see tier description above)."
      }
    ]
  }'::jsonb,
  ''
FROM public.characters c
WHERE c.name = 'Nowi Tarja'
  AND NOT EXISTS (
    SELECT 1 FROM public.epic_items ei WHERE ei.character_id = c.id AND ei.slug = 'tricksters-choice'
  )
LIMIT 1;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. Epic Item: Netherese Blooded (nur Magier)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.epic_items (
  character_id, slug, name, name_en, description, description_en, icon,
  equipped, damage_level, max_damage_level, damage_levels, simple_effects, notes
)
SELECT
  c.id,
  'netherese-blooded',
  'Netherese Blooded',
  'Netherese Blooded',
  'Das Erbe der versunkenen Magierreiche Netherils fließt in den Adern der Trägerin. Nur nutzbar für Magier. Die Trägerin erhält permanent ihre aktuelle Stufe ×2 an zusätzlichen Spellpoints.',
  'The legacy of the sunken Netherese mage-empires flows in the bearer''s veins. Usable by wizards only. The bearer permanently gains bonus spell points equal to her current level × 2.',
  'sparkles',
  true,
  0, -- auto-calculated from character level
  4, -- max_damage_level = 5 tiers (0-4)
  '{
    "0": {
      "description": "Die Blutlinie ist noch nicht erwacht. Nur der permanente Spellpoints-Bonus (Stufe ×2) ist aktiv.",
      "description_en": "The bloodline has not yet awakened. Only the permanent spell points bonus (level ×2) is active.",
      "effects": []
    },
    "1": {
      "description": "Stufe 3-4: Dreimal am Tag kann die Trägerin frei einen Zauber für die Kosten eines gespeicherten Zaubers wirken.",
      "description_en": "Level 3-4: Three times per day, the bearer can freely cast a spell for the cost of a stored spell.",
      "effects": []
    },
    "2": {
      "description": "Stufe 5-6: Zweimal am Tag kann die Trägerin einen Zauber maximieren (Reichweite, Schaden, Dauer).",
      "description_en": "Level 5-6: Twice per day, the bearer can maximize a spell (range, damage, duration).",
      "effects": []
    },
    "3": {
      "description": "Stufe 7-8: Dreimal am Tag kann die Trägerin einen Zauber auf einer höheren Stufe wirken (der gesteigerte Zauber wirkt, als wäre er von einer 1-2 Stufen höheren Zauberin gewirkt worden). Magick-Kosten je Zauberstufe (Fixed / Free-Powered-Fixed / Powered-Free): Stufe 1: 4/8/12, Stufe 2: 6/12/18, Stufe 3: 10/20/30, Stufe 4: 15/30/45, Stufe 5: 22/44/66, Stufe 6: 30/60/90, Stufe 7: 40/80/120, Stufe 8: 50/100/150, Stufe 9: 60/120/180.",
      "description_en": "Level 7-8: Three times per day, the bearer can cast a spell at a higher level (the empowered spell behaves as if cast by a caster 1-2 levels higher). Magick cost per spell level (Fixed / Free-Powered-Fixed / Powered-Free): Level 1: 4/8/12, Level 2: 6/12/18, Level 3: 10/20/30, Level 4: 15/30/45, Level 5: 22/44/66, Level 6: 30/60/90, Level 7: 40/80/120, Level 8: 50/100/150, Level 9: 60/120/180.",
      "effects": []
    },
    "4": {
      "description": "Stufe 9-10: Die Trägerin kann Trefferpunkte in Spellpoints umwandeln (1 TP = 2 SP). Freie Zauber der Stufe 1 kosten nun nur noch 4 Spellpoints.",
      "description_en": "Level 9-10: The bearer can convert hit points into spell points (1 HP = 2 SP). Freely cast level-1 spells now cost only 4 spell points.",
      "effects": []
    }
  }'::jsonb,
  '{
    "level_thresholds": [3, 5, 7, 9],
    "spell_points_bonus_multiplier": 2,
    "hp_to_sp_conversion": { "unlock_level": 4, "ratio": 2 }
  }'::jsonb,
  'Transkriptions-Hinweis: In der handschriftlichen Magick-Kostentabelle war Stufe 1/Spalte "Free-Powered-Fixed" durch eine Korrektur schwer leserlich. Der hier hinterlegte Wert (8) folgt der arithmetischen Konsistenz der übrigen Zeilen (Spalte 2 = 2× Spalte 1, Spalte 3 = 3× Spalte 1). Bei Bedarf am Originalzettel gegenprüfen.'
FROM public.characters c
WHERE c.name = 'Nowi Tarja'
  AND NOT EXISTS (
    SELECT 1 FROM public.epic_items ei WHERE ei.character_id = c.id AND ei.slug = 'netherese-blooded'
  )
LIMIT 1;
