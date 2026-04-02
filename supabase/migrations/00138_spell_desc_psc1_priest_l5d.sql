-- ═══════════════════════════════════════════════════════════════════════════════
-- PSC1 Priest Spells Level 5 (Batch 4: 10 Spells — Faerie Flames to Forgotten Melody)
-- Metrisch, eng an Originaltexten orientiert
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.spells SET
  name = 'Feenflammen — Elf',
  description = 'Eine Variante des Stufe-1-Zaubers Feenfeuer mit zusätzlichem Schaden. Umrissene Kreaturen erleiden sofort 2W4 Schaden. Jede weitere Runde ist ein Rettungswurf gegen Zauber erlaubt — bei Misserfolg weitere 2W4 Schaden (maximale Dauer: 4 Runden pro Stufe). Die Flammen erzeugen keine Hitze und beschädigen keine Gegenstände, aber Kreaturen, die umrissene Objekte berühren, erleiden 1W3 Schaden. Kann nicht mit Wasser gelöscht werden — nur magische Mittel (Magie Bannen, Stab der Flammenlöschung) wirken.',
  description_en = 'A variant of the 1st-level faerie fire spell with additional damage. Outlined creatures take 2d4 damage immediately. Each subsequent round a saving throw vs. spell is allowed — failure means another 2d4 damage (maximum duration: 4 rounds per level). The flames produce no heat and do not harm objects, but creatures touching outlined objects take 1d3 damage. Cannot be doused with water — only magical means (dispel magic, wand of flame extinguishing) work.'
WHERE LOWER(name_en) = LOWER('Faerie Flames — Elf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Glaubensrüstung',
  description = 'Erzeugt eine schattenhafte, durchscheinende Rüstung um den Priester, die weder entfernt noch auf andere gewirkt werden kann. Setzt die Rüstungsklasse des Priesters temporär auf RK 0 (unabhängig von Belastung, Geschicklichkeit oder tatsächlich getragener Rüstung). Zusätzlich kann der Priester beim Wirken Immunität gegen alle Magierzauber einer bestimmten Schule oder alle Priesterzauber einer bestimmten Sphäre wählen. Materialkomponente: Eine Handvoll pulverisierter Obsidian, genug um beide Handflächen dünn zu bedecken.',
  description_en = 'Creates a shadowy, translucent armor around the caster that cannot be removed or cast on others. Temporarily sets the priest''s Armor Class to AC 0 (regardless of encumbrance, Dexterity, or actual armor worn). Additionally, the priest can choose immunity to all wizard spells of a particular school or all priest spells of a specific sphere at casting time. Material component: a handful of powdered obsidian, enough to cover both palms thinly.'
WHERE LOWER(name_en) = LOWER('Faith Armor') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Gunst',
  description = 'Der Priester bittet die Gottheit, über den Empfänger zu wachen — üblicherweise vor einer großartigen Heldentat. Die Effektivität hängt davon ab, wie die Gottheit die Tat beurteilt (1W6). Für die Zauberdauer werden die Rettungswürfe des Empfängers um das Ergebnis verbessert. Zusätzlich erhält der Empfänger einmalig das Recht auf göttliche Intervention: einen einzelnen Würfelwurf wiederholen. Eine Gottheit gewährt nie mehr als einen Gunst-Zauber pro Abenteuergruppe, und üblicherweise nur auf den Anführer.',
  description_en = 'The priest asks the deity to watch over the recipient — usually before a magnificent deed. Effectiveness depends on how the deity views the deed''s glory (1d6). For the duration, the recipient''s saving throws are modified positively by the result. Additionally, the recipient receives one pledge of divine intervention: reroll any single die roll affecting them personally. A deity never grants more than one favor spell per adventuring group, and usually only on the group''s leader.'
WHERE LOWER(name_en) = LOWER('Favor') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Valkurs Gunst',
  description = 'Wird auf einen willigen Empfänger (typischerweise Seeleute) gewirkt. Falls der Empfänger jemals über Bord fällt oder Schiffbruch erleidet, treiben günstige Winde und Strömungen ihn sicher an Land — unabhängig von Wetterbedingungen — bevor er ertrinkt oder verdurstet. Die Küste bietet genug Nahrung und Wasser zum Überleben (keine Garantie gegen Dummheit, Krankheit oder Raubtiere). Kann nur einmal im Leben auf ein Wesen gewirkt werden. Endet nach Einmalverwendung oder einem Jahr. Kann auch auf ein spezielles Amulett gewirkt werden (5 Jahre haltbar, Herstellung ab Stufe 16).',
  description_en = 'Cast on a willing recipient (typically a sailor). If the recipient ever falls overboard or is shipwrecked, favorable winds and currents float them safely to shore — regardless of weather — before drowning or dying of thirst. The shoreline provides sufficient food and water for survival (no guarantee against stupidity, disease, or predators). Can only be received once per lifetime. Ends after one use or one year. Can also be cast on a special amulet (5-year shelf life, crafted at 16th level or higher).'
WHERE LOWER(name_en) = LOWER('Favor of Valkur') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Feuer der Gerechtigkeit',
  description = 'Erzeugt korrosive innere Energiestöße im Empfänger und verursacht 1W4+1 Schaden pro Priesterstufe (Maximum 10W4+10). Untote erleiden doppelten Schaden. Dieser Schaden wird von keiner Art von Feuer- oder Hitzeresistenz beeinflusst. Kann nur von einem Priester Tyrs gewirkt werden, der dem Ziel bereits ungeheilten Nahkampf-, Fernkampf- oder Magieschaden zugefügt hat (ein einzelner Trefferpunkt genügt). Materialkomponente: Eine Kohle, die einmal im Feuer war, und ein Tropfen geweihtes Weihwasser eines Tyr-Priesters.',
  description_en = 'Induces corrosive internal energy surges in the recipient, causing 1d4+1 damage per caster level (maximum 10d4+10). Undead suffer double damage. This damage is not affected by fire or heat resistance of any sort. Can only be cast by a priest of Tyr who has already inflicted some unhealed melee, missile, or magical damage on the creature (a single hit point suffices). Material component: a coal that has been in a fire and a drop of holy water consecrated by a priest of Tyr.'
WHERE LOWER(name_en) = LOWER('Fire of Justice') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Feuerschutz',
  description = 'Macht einen kugelförmigen Bereich vorübergehend feuerfest — löscht sofort alle Feuer und verhindert neue Entzündungen für die Zauberdauer. Die Kugel ist nach Erschaffung stationär, aber der Priester kann sich frei bewegen, andere Zauber wirken oder schlafen, ohne den Effekt zu stören. Wirksam gegen roten Drachenatem, Feuerelementare (können die Kugel nicht betreten oder darin beschworen werden), natürliche Feuer aller Größen und Feuermagie. Verhindert Wärme- und Dampfübertragung. Materialkomponente: Eine Prise Sand und ein Tropfen Wasser.',
  description_en = 'Temporarily renders a spherical area fireproof — instantly extinguishes all fires and prevents new conflagrations for the spell''s duration. The sphere is stationary once created, but the caster can move freely, cast other spells, or sleep without affecting it. Effective against red dragon breath, fire elementals (cannot enter or be summoned into the sphere), natural fires of all sizes, and fiery magic. Prevents heat and vapor transfer. Material component: a pinch of sand and a drop of water.'
WHERE LOWER(name_en) = LOWER('Fireward') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Flammenernte',
  description = 'Erzeugt eine Falle über einem großen Feld, Hain oder anderem brennbaren Bereich mit vordefinierten Auslösebedingungen. Der Priester durchschreitet den Bereich eine Stunde lang meditierend. Die Falle bleibt 1 Monat lang scharf. Bedingungen müssen schriftlich festgelegt werden (so wörtlich wie möglich). Bei Auslösung wird das Gebiet in Flammen gehüllt: 6W8 Schaden, danach 1W4 Schaden pro Runde bis zum Ausbrennen. Wirkungsbereich: 27,4 m im Quadrat, Flammen bis 3 m Höhe.',
  description_en = 'Creates a trap over a large field, copse, or other flammable area with predefined trigger conditions. The priest walks the area for one hour while meditating. The trap remains set for 1 month. Conditions must be written down (interpreted as literally as possible). When triggered, the area is engulfed in flames: 6d8 damage, then 1d4 damage per round until the fire burns out. Area of effect: 27.4 m square, flames rise to 3 m height.'
WHERE LOWER(name_en) = LOWER('Flame Harvest') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Schweben',
  description = 'Verleiht einem Gegenstand von bis zu 226,8 kg eine Form magischen Flugs. Der Priester bewegt den Gegenstand durch Konzentration — horizontal oder vertikal mit Flugrate 6 (Manövrierfähigkeit C), halbe Rate beim Auf- oder Absteigen. Der Priester kann den Gegenstand auch bewegungslos in der Luft schweben lassen. Wird die Konzentration des Priesters unterbrochen, endet der Zauber. Materialkomponente: Eine Daune von einer Ente.',
  description_en = 'Bestows a form of magical flight upon an object weighing up to 226.8 kg. The priest moves the object through concentration — horizontally or vertically at fly rate 6 (MC: C), half rate when ascending or descending. The priest can also cause the object to hover motionless in the air. If concentration is disrupted, the spell ends. Material component: a bit of down from a duck.'
WHERE LOWER(name_en) = LOWER('Float') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Fließstein — Zwerg',
  description = 'Lässt Stein wie Sirup fließen und dann erhärten. Der fließende Stein reagiert auf Schwerkraft, kann aber mit Holzpaddeln gelenkt werden. Zwerge nutzen dies oft zum Formen von Steinleitungen oder glatten Türumrandungen. Kreaturen in Kontakt mit fließendem Stein erhalten einen Rettungswurf gegen Gift — bei Erfolg entgehen sie unversehrt. Bei Misserfolg werden sie teilweise von Stein umschlossen (verlangsamte Bewegung, −2 GES). Unbewegliche Kreaturen im Zentrum eines Bereichs über 3 m müssen einen zusätzlichen Rettungswurf gegen Zauber bestehen oder werden eingeschlossen. Bedeckt Stein die Atemorgane, tritt der Tod in 1W4+1 Runden ein.',
  description_en = 'Makes stone flow like syrup and then harden. The flowing stone responds to gravity but can be directed with wooden paddles. Dwarves often use this to shape stone conduits or smooth door surrounds. Creatures in contact with flowing stone get a saving throw vs. poison — on success, they escape unharmed. On failure, they are partially encrusted (slowed movement, −2 DEX). Immobile creatures in the center of an area over 3 m must also save vs. spell or be stuck. If stone covers breathing organs, death occurs in 1d4+1 rounds.'
WHERE LOWER(name_en) = LOWER('Flowstone — Dwarf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Flugfeld',
  description = 'Erlaubt dem Priester (und nur ihm), ein antriebsloses, treibendes Spelljammer-Schiff plötzlich in eine gewünschte Richtung und Entfernung zu schleudern (innerhalb der Reichweite). Der unvollständige Zauber bleibt einen Tag pro Stufe wirksam. Der Priester hat volle Kontrolle über Richtung und Entfernung. Wirkt nicht auf Schiffe unter Antrieb. Wirkt in Wildraum, Phlogiston und Atmosphären gleichermaßen. Kann kein Schiff bewegen, dessen Tonnage die Grenze des Wirkungsbereichs überschreitet (5 Tonnen pro Stufe). Materialkomponente: Zwei magnetisierte Metallstücke und eine Kristallkugel.',
  description_en = 'Allows the caster (only) to cause a powerless, drifting spelljamming ship to suddenly lunge in a desired direction and distance (within range). The incomplete spell remains effective for one day per level. The priest has total control over direction and distance. Does not work on ships under power. Works in wildspace, phlogiston, and atmospheres alike. Cannot move a ship whose tonnage exceeds the area of effect limit (5 tons per level). Material component: two magnetized metal pieces and a crystal sphere.'
WHERE LOWER(name_en) = LOWER('Flyfield') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Fokusstein',
  description = 'Verwandelt die innere Struktur eines klaren oder durchscheinenden kristallinen Edelsteins (maximal faustgroß), sodass er einen Zauber aufnehmen und speichern kann (üblicherweise via Magiestrom). Beim Wirken ist ein Gegenstandsrettungswurf für den Stein nötig — Misserfolg zerstört ihn. Der Fokusstein leuchtet danach mit sanftem inneren Licht und strahlt eine schwache Magie aus. In giftige Flüssigkeit getaucht, wird er leuchtend violett und kann durch Berührung und Wille das Gift neutralisieren (zerstört dabei den Stein). Schützt vor natürlicher und magischer Hitze, Flamme, Lava und extremer Kälte, kann aber durch gezielte Angriffe zerbrochen werden.',
  description_en = 'Transforms the internal structure of a clear or translucent crystalline gemstone (max fist-sized) to receive and hold a spell (usually via dweomerflow). An item saving throw is required when cast — failure destroys the gemstone. The focal stone then glows with soft internal radiance and emits a faint dweomer. Immersed in poisonous liquid, it turns vivid purple and can neutralize poison by touch and will (destroying the stone). Protected from natural and magical heat, flame, lava, and extreme cold, but can be shattered by deliberate attack.'
WHERE LOWER(name_en) = LOWER('Focal Stone') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Vergessene Melodie',
  description = 'Der Priester singt den Anfang eines eingängigen Liedes. Betroffene Kreaturen (Rettungswurf gegen Zauber mit −4) werden vom Lied besessen und können es nicht aus dem Kopf bekommen. Solange sie versuchen, das Lied zu vollenden, können sie keine Zauber wirken oder psionische Fähigkeiten nutzen. Besonders verheerend für hochintelligente Wesen: die Dauer in Runden entspricht dem Intelligenzwert (angepasst durch den magischen Verteidigungsmodifikator der Weisheit). Geistlose Untote, Kreaturen mit tierischer oder niedrigerer Intelligenz, und Wesen, die den Priester nicht hören oder verstehen können, sind immun.',
  description_en = 'The priest sings the beginning of a catchy song. Affected creatures (saving throw vs. spell at −4) become obsessed with the song and cannot get it out of their heads. While trying to finish it, they cannot cast spells or use psionic abilities. Especially devastating to very intelligent beings: duration in rounds equals the Intelligence score (adjusted by Wisdom''s magical defense adjustment). Mindless undead, creatures with animal or lower intelligence, and beings that cannot hear or understand the caster are immune.'
WHERE LOWER(name_en) = LOWER('Forgotten Melody') AND spell_type = 'priest';
