-- Dschinn-Narrative-Fix
--
-- Migration 00212 hat die "Dschinn (Genie-Umbrella)"-Row gelöscht, weil
-- alle vier Genie-Typen (Djinni, Efreeti, Dao, Marid) bereits als eigene
-- Seed-Rows existieren. Übersehen wurde dabei, dass die Genie-Umbrella-
-- Row die volle Compendium-Narrative enthielt, während die Dschinn-
-- (Djinni)-Seed-Row nur einen kurzen Intro-Text hatte.
--
-- Diese Migration kopiert die Narrative aus der gelöschten Genie-Row auf
-- die bestehende Dschinn-(Djinni)-Row nach. Die Texte stammen aus
-- `ressources/compendium-snapshot/translated.json` (Key: `genie`) und
-- beschreiben generische Djinn-Eigenschaften, die auf den Luft-Dschinn
-- passen. COALESCE verhindert das Überschreiben bereits vorhandener Werte.

BEGIN;

UPDATE monsters
SET
  intro_text = COALESCE(intro_text,
    'Dschinns stammen aus den Elementarebenen. Dort, unter ihresgleichen, haben sie ihre eigenen Gesellschaften. Dschinns werden manchmal auf der Primär-Materiellen Ebene angetroffen und oft gezielt beschworen, um irgendeinen Dienst für einen mächtigen Magier oder Priester zu erfüllen. Alle Dschinns können zu jeder der Elementarebenen reisen, ebenso zur Primär-Materiellen und zur Astralebene. Dschinns sprechen ihre eigene Sprache und die aller intelligenten Wesen, denen sie begegnen, durch eine begrenzte Form der Telepathie.'
  ),
  combat_tactics = COALESCE(combat_tactics,
    'Die magische Natur der Djinn ermöglicht es ihnen, einmal pro Tag folgende Fähigkeiten zu nutzen: nahrhafte Speisen für 2W6 Personen erschaffen und Wasser oder Wein für 2W6 Personen erschaffen; weiche Waren (bis zu 16 Kubikmeter) oder hölzerne Gegenstände (bis zu 9 Kubikmeter) von dauerhafter Natur erschaffen; Metall erschaffen, bis zu 45,4 kg Gewicht mit kurzer Lebensdauer (je härter das Metall, desto weniger Zeit hält es; Gold hat etwa eine 24-stündige Existenz, während Djinni-Stahl nur eine Stunde anhält); Illusion erschaffen wie ein Magier der 20. Stufe mit sowohl sichtbaren als auch hörbaren Komponenten, die ohne Konzentration anhalten, bis sie berührt oder magisch aufgelöst werden; Unsichtbarkeit, Gasgestalt oder Windwandeln nutzen.'
  ),
  habitat_society = COALESCE(habitat_society,
    'Das heimatliche Land der Djinn ist die Elementarebene der Luft, wo sie auf schwimmenden Inseln aus Erde und Stein leben, die zwischen 0,9 m und mehreren Kilometern Durchmesser haben. Sie sind vollgestopft mit Gebäuden, Höfen, Gärten, Springbrunnen und Skulpturen aus elementaren Flammen. In einem typischen Djinn-Landbesitz leben 3W10 Djinn verschiedener Altersstufen und Mächte, sowie 1W10 Jann und 1W10 Elementarkreaturen niedriger Intelligenz. Alle werden vom örtlichen Scheich regiert, einem Djinn mit maximalen Trefferpunkten.'
  )
WHERE name = 'Dschinn' AND name_en = 'Djinni' AND is_custom = FALSE;

COMMIT;
