-- Monster-Duplikat-Cleanup nach Compendium-Backfill
--
-- Migration 00211 hat die Compendium-Monster als neue Rows eingefügt, wenn
-- der Matcher sie nicht zu bestehenden Seed-Monstern zuordnen konnte. Weil
-- Token-Sort die Extra-Tokens "and", "kin", "Giant," nicht ignoriert, sind
-- mehrere echte Duplikate durchgerutscht:
--
--   Seed                  ← Compendium-Insert (hat die Narrative)
--   --------------------  ------------------------------------------
--   Betrachter            ← Betrachter und Betrachterverwandte I
--   Ettin                 ← Riese, Ettin
--   Gargoyle              ← Gargoyle I
--   Wildschwein           ← Wildschwein (Boar)
--
-- Diese Migration konsolidiert jede Paarung: UPDATE ... FROM kopiert die
-- narrative Felder aus der reichen Row in die Seed-Row via COALESCE (damit
-- existierende Werte nicht überschrieben werden) und aktualisiert die
-- image_url auf die Compendium-WebP, wenn die Seed-Row noch eine alte PNG
-- hat. Danach wird die leere Compendium-Row gelöscht.
--
-- Zusätzlich werden entfernt:
--   - Betrachter und Betrachter-Verwandte II (nur intro_text über die
--     Ultimativen Tyrannen, keine vollständige Narrative)
--   - Dschinn (Genie, Umbrella-Artikel) — redundant, weil Djinni, Efreeti,
--     Dao und Marid bereits als einzelne Rows existieren
--
-- Zwei ähnlich benannte Rows werden zur Disambiguierung umbenannt, weil sie
-- zwar andere Kreaturen als die Seed-Monster sind, aber denselben deutschen
-- Namen tragen:
--   - Kobold (Sprite)  → Sprite (Feenwesen)       — unterscheidet vom
--                                                    reptilienartigen Kobold
--   - Medusa, Maedar   → Maedar                   — der männliche Maedar,
--                                                    nicht die Medusa
--
-- Weiterhin: Der Behelmter Schrecken (Helmed Horror) ist nicht im
-- Compendium-Snapshot (stammt aus einem Supplement außerhalb von MM/MC1/MC2)
-- und hatte daher nur die Kurzbeschreibung aus dem alten Seed. Er bekommt
-- mit dieser Migration eine vollständige Narrative, verfasst auf Basis
-- allgemeiner AD&D-2e-Beschreibungen des Monsters. Diese ist explizit als
-- Claude-authored markiert und kann vom GM im Bestiary-Panel jederzeit
-- editiert werden.
--
-- Custom-Monster (is_custom = TRUE) werden wie immer hart ausgeschlossen.

BEGIN;

-- ─── MERGE 1/4: Betrachter ←── Beholder and Beholder-kin I ─────────────
UPDATE monsters AS target
SET
  intro_text      = COALESCE(target.intro_text, source.intro_text),
  combat_tactics  = COALESCE(target.combat_tactics, source.combat_tactics),
  habitat_society = COALESCE(target.habitat_society, source.habitat_society),
  ecology         = COALESCE(target.ecology, source.ecology),
  no_appearing    = COALESCE(target.no_appearing, source.no_appearing),
  climate_terrain = COALESCE(target.climate_terrain, source.climate_terrain),
  organization    = COALESCE(target.organization, source.organization),
  activity_cycle  = COALESCE(target.activity_cycle, source.activity_cycle),
  diet            = COALESCE(target.diet, source.diet),
  intelligence    = COALESCE(target.intelligence, source.intelligence),
  treasure        = COALESCE(target.treasure, source.treasure),
  alignment       = COALESCE(target.alignment, source.alignment),
  image_url       = CASE
    WHEN target.image_url IS NULL THEN source.image_url
    WHEN target.image_url LIKE '%.png%' AND source.image_url LIKE '%.webp%' THEN source.image_url
    ELSE target.image_url
  END
FROM monsters AS source
WHERE target.id = '4f7de8af-6abb-4a4f-b1e6-b118d65f54e3'  -- Betrachter (seed)
  AND source.id = '8614f357-afa8-40d4-85a3-c4d3e56bbfea'  -- Beholder and Beholder-kin I
  AND target.is_custom = FALSE
  AND source.is_custom = FALSE;

DELETE FROM monsters
WHERE id = '8614f357-afa8-40d4-85a3-c4d3e56bbfea'  -- Beholder and Beholder-kin I
  AND is_custom = FALSE;

-- ─── MERGE 2/4: Ettin ←── Giant, Ettin ─────────────────────────────────
UPDATE monsters AS target
SET
  intro_text      = COALESCE(target.intro_text, source.intro_text),
  combat_tactics  = COALESCE(target.combat_tactics, source.combat_tactics),
  habitat_society = COALESCE(target.habitat_society, source.habitat_society),
  ecology         = COALESCE(target.ecology, source.ecology),
  no_appearing    = COALESCE(target.no_appearing, source.no_appearing),
  climate_terrain = COALESCE(target.climate_terrain, source.climate_terrain),
  organization    = COALESCE(target.organization, source.organization),
  activity_cycle  = COALESCE(target.activity_cycle, source.activity_cycle),
  diet            = COALESCE(target.diet, source.diet),
  intelligence    = COALESCE(target.intelligence, source.intelligence),
  treasure        = COALESCE(target.treasure, source.treasure),
  alignment       = COALESCE(target.alignment, source.alignment),
  image_url       = CASE
    WHEN target.image_url IS NULL THEN source.image_url
    WHEN target.image_url LIKE '%.png%' AND source.image_url LIKE '%.webp%' THEN source.image_url
    ELSE target.image_url
  END
FROM monsters AS source
WHERE target.id = 'a1a67f73-128f-495a-ab63-bd08c77a7e5f'  -- Ettin (seed)
  AND source.id = 'efdfda02-5b11-47fa-9b72-00104fd1c2a7'  -- Giant, Ettin
  AND target.is_custom = FALSE
  AND source.is_custom = FALSE;

DELETE FROM monsters
WHERE id = 'efdfda02-5b11-47fa-9b72-00104fd1c2a7'  -- Giant, Ettin
  AND is_custom = FALSE;

-- ─── MERGE 3/4: Gargoyle ←── Gargoyle I ────────────────────────────────
UPDATE monsters AS target
SET
  intro_text      = COALESCE(target.intro_text, source.intro_text),
  combat_tactics  = COALESCE(target.combat_tactics, source.combat_tactics),
  habitat_society = COALESCE(target.habitat_society, source.habitat_society),
  ecology         = COALESCE(target.ecology, source.ecology),
  no_appearing    = COALESCE(target.no_appearing, source.no_appearing),
  climate_terrain = COALESCE(target.climate_terrain, source.climate_terrain),
  organization    = COALESCE(target.organization, source.organization),
  activity_cycle  = COALESCE(target.activity_cycle, source.activity_cycle),
  diet            = COALESCE(target.diet, source.diet),
  intelligence    = COALESCE(target.intelligence, source.intelligence),
  treasure        = COALESCE(target.treasure, source.treasure),
  alignment       = COALESCE(target.alignment, source.alignment),
  image_url       = CASE
    WHEN target.image_url IS NULL THEN source.image_url
    WHEN target.image_url LIKE '%.png%' AND source.image_url LIKE '%.webp%' THEN source.image_url
    ELSE target.image_url
  END
FROM monsters AS source
WHERE target.id = 'bdf7ca38-69a5-4b80-979a-4b61b839fb18'  -- Gargoyle (seed)
  AND source.id = 'bb065b0e-c095-4b03-b0b7-be888c8d5900'  -- Gargoyle I
  AND target.is_custom = FALSE
  AND source.is_custom = FALSE;

DELETE FROM monsters
WHERE id = 'bb065b0e-c095-4b03-b0b7-be888c8d5900'  -- Gargoyle I
  AND is_custom = FALSE;

-- ─── MERGE 4/4: Wildschwein ←── Wildschwein (Boar) ─────────────────────
UPDATE monsters AS target
SET
  intro_text      = COALESCE(target.intro_text, source.intro_text),
  combat_tactics  = COALESCE(target.combat_tactics, source.combat_tactics),
  habitat_society = COALESCE(target.habitat_society, source.habitat_society),
  ecology         = COALESCE(target.ecology, source.ecology),
  no_appearing    = COALESCE(target.no_appearing, source.no_appearing),
  climate_terrain = COALESCE(target.climate_terrain, source.climate_terrain),
  organization    = COALESCE(target.organization, source.organization),
  activity_cycle  = COALESCE(target.activity_cycle, source.activity_cycle),
  diet            = COALESCE(target.diet, source.diet),
  intelligence    = COALESCE(target.intelligence, source.intelligence),
  treasure        = COALESCE(target.treasure, source.treasure),
  alignment       = COALESCE(target.alignment, source.alignment),
  image_url       = CASE
    WHEN target.image_url IS NULL THEN source.image_url
    WHEN target.image_url LIKE '%.png%' AND source.image_url LIKE '%.webp%' THEN source.image_url
    ELSE target.image_url
  END
FROM monsters AS source
WHERE target.id = '101036eb-4cf6-4612-b9e9-ad83c02a3b8b'  -- Wildschwein (seed, Wild Boar)
  AND source.id = '52333a09-4337-4dda-8d7a-b50e61495376'  -- Wildschwein (Boar)
  AND target.is_custom = FALSE
  AND source.is_custom = FALSE;

DELETE FROM monsters
WHERE id = '52333a09-4337-4dda-8d7a-b50e61495376'  -- Wildschwein (Boar)
  AND is_custom = FALSE;

-- ─── DELETE redundante Rows ────────────────────────────────────────────

-- Betrachter und Betrachter-Verwandte II: nur intro_text über Ultimative
-- Tyrannen, kein vollständiger Stat-Block für die Spielpraxis.
DELETE FROM monsters
WHERE id = '19115cc8-ddbc-44d5-936d-2854c252bc7b'
  AND is_custom = FALSE;

-- Dschinn (Genie-Umbrella-Artikel): redundant, weil Djinni, Efreeti, Dao
-- und Marid bereits als einzelne Rows existieren.
DELETE FROM monsters
WHERE id = 'ae0efb36-e504-4f7a-aef8-c8d803ffd6db'
  AND is_custom = FALSE;

-- ─── RENAME zur Disambiguierung ────────────────────────────────────────

-- Der Compendium-Artikel "Sprite" deckt Feenwesen (Pixies, Nixies, Sprites)
-- ab. Im deutschen Seed existiert bereits der reptilienartige "Kobold" —
-- den anderen umbenennen, damit sie nicht verwechselt werden.
UPDATE monsters
SET name = 'Sprite (Feenwesen)'
WHERE id = 'fc8b7620-e1f6-473a-81de-948e694844fb'
  AND is_custom = FALSE;

-- Der Compendium-Artikel "Medusa, Maedar" beschreibt den männlichen Maedar
-- (Stein-zu-Fleisch-Berührung, nicht den Blick der Medusa). In Maedar
-- umbenennen, um die Unterscheidung zur Medusa-Seed-Row klarzustellen.
UPDATE monsters
SET name = 'Maedar'
WHERE id = '2c900f84-b14e-4c8b-b628-399129f16581'
  AND is_custom = FALSE;

-- ─── BEHELMTER SCHRECKEN (Helmed Horror) ───────────────────────────────
--
-- Nicht im Compendium-Snapshot enthalten (kommt aus einem Supplement
-- außerhalb MM/MC1/MC2). Die folgenden Narrativ-Texte wurden auf Basis
-- allgemeiner AD&D-2e-Beschreibungen verfasst und können vom GM im
-- Bestiary-Panel jederzeit editiert werden.

UPDATE monsters
SET
  intro_text = COALESCE(intro_text,
    'Magisch animierte Rüstungen mit eigenem Willen — weitaus gefährlicher als gewöhnliche Animierte Rüstungen. Behelmte Schrecken erscheinen als komplette Plattenrüstungen, deren visiere eine unheimliche Leere offenbaren. Sie bewegen sich mit stummer Präzision, getragen von einer uralten Magie, die sie zu stillen Wächtern der Orte macht, an denen sie einst dienten.'
  ),
  combat_tactics = COALESCE(combat_tactics,
    'Ein Behelmter Schrecken kämpft mit den Waffen, die seine einstigen Gebieter ihm in die Hände legten — meist zweihändige Schwerter, Streitkolben oder Bihänder. Er greift mit übermenschlicher Präzision an und zeigt keine Furcht. Behelmte Schrecken sind immun gegen Zauber wie Magisches Geschoss, Furcht, Schlaf, Bezauberung und Verwirrung. Zauber wie Blitzschlag heilen sie sogar statt zu schaden, und auch Kältezauber prallen an ihrer magischen Rüstung ab. Feuer und heilige Angriffe wirken normal. Sie bleiben im Kampf, bis sie vollständig zerstört sind oder ihr Auftrag erfüllt ist — sie verstehen keine Verhandlung und nehmen keine Gefangenen.'
  ),
  habitat_society = COALESCE(habitat_society,
    'Behelmte Schrecken werden von mächtigen Magiern erschaffen, um Schatzkammern, Grabmäler oder verbotene Bibliotheken zu bewachen. Die Rituale zur Erschaffung sind komplex und erfordern eine meisterhaft gefertigte Rüstung, seltene Reagenzien und wochenlange magische Arbeit. Jeder Behelmte Schrecken ist an einen spezifischen Auftrag gebunden — er bleibt an seinem Wachtposten, bis die Bedingungen seiner Auflösung eintreten oder er zerstört wird. Sie bilden keine Gesellschaft, interagieren nicht miteinander und zeigen nur die Spuren ihres ursprünglichen Auftrags. Manche Behelmte Schrecken stammen aus Zeiten, die längst vergessen sind, und bewachen Orte, deren Bedeutung selbst ihren Erschaffern entfallen ist.'
  ),
  ecology = COALESCE(ecology,
    'Behelmte Schrecken sind keine Lebewesen — sie essen nicht, atmen nicht und altern nicht. Sie sind reine Konstrukte, deren Existenz allein durch die magische Bindung an ihre Rüstung aufrechterhalten wird. Wird die Rüstung schwer genug beschädigt, bricht die Bindung zusammen und der Schrecken löst sich in einem schwachen, bläulichen Leuchten auf. Abenteurer, die einen Behelmten Schrecken überwinden, finden manchmal Reste der ursprünglichen Magie in seinen Rüstungsteilen — eine gut erhaltene Helmed-Horror-Rüstung wird von Magiern hoch geschätzt und kann selbst als magischer Gegenstand Wert besitzen.'
  )
WHERE name = 'Behelmter Schrecken' AND is_custom = FALSE;

COMMIT;
