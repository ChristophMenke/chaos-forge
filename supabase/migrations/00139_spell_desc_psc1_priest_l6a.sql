-- ═══════════════════════════════════════════════════════════════════════════════
-- PSC1 Priest Spells Level 6 (Batch 1: 20 Spells — Air Tread to Death Touch)
-- Metrisch, eng an Originaltexten orientiert
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.spells SET
  name = 'Luftwandeln — Drow',
  description = 'Eine mächtigere Version des Luftwandel-Zaubers. Verändert vorübergehend die Beziehung des Empfängers zur Schwerkraft und ermöglicht das Gehen auf Luft wie auf festem Boden. Schneller und wendiger als normales Luftwandeln — der Empfänger kann laufen, springen und sogar aufwärts gehen. Dauer: 1 Runde pro Stufe.',
  description_en = 'A more powerful version of the Air Walk spell. Temporarily alters the recipient''s relationship with gravity, enabling walking on air as on solid ground. Faster and more agile than normal Air Walk — the recipient can run, jump, and even ascend. Duration: 1 turn per level.'
WHERE LOWER(name_en) = LOWER('Air Tread — Drow') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Allsehende Kristallkugel',
  description = 'Erschafft eine temporäre Kristallkugel (ca. 15,2 cm Durchmesser), mit der der Priester Orte und Personen ausspähen kann, als würde er eine permanente Kristallkugel benutzen. Die Kugel hält 1 Runde pro Stufe. Der Priester kann entfernte Orte sehen und hören, die er kennt oder die ihm beschrieben wurden.',
  description_en = 'Creates a temporary crystal sphere (about 15.2 cm diameter) that allows the priest to scry on locations and persons as if using a permanent crystal ball. The sphere lasts 1 turn per level. The priest can see and hear distant locations he knows or that have been described to him.'
WHERE LOWER(name_en) = LOWER('All-Seeing Crystal Ball') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Glück Verändern',
  description = 'Verändert das Glück des Empfängers und gibt ihm drei Chancen, einen Fehlschlag zu vermeiden — bei jedem Rettungswurf, Angriffswurf oder Eigenschaftsprüfung kann der Empfänger dreimal würfeln und das beste Ergebnis nehmen. Sobald drei Würfe auf diese Weise wiederholt wurden, endet der Zauber.',
  description_en = 'Alters the recipient''s luck, allowing three chances to avoid failure — on any saving throw, attack roll, or ability check, the recipient can roll three times and take the best result. Once three rolls have been rerolled this way, the spell ends.'
WHERE LOWER(name_en) = LOWER('Alter Luck') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Tierübertragung',
  description = 'Überträgt den Geist des Priesters in den Körper eines bestimmten Tieres. Der Priester kontrolliert das Tier vollständig und nutzt dessen Sinne und physische Fähigkeiten. Sein eigener Körper verbleibt komatös und verletzlich. Wird das Tier getötet, muss der Priester einen Systemschock-Wurf bestehen oder stirbt ebenfalls.',
  description_en = 'Transfers the priest''s mind into the body of a designated animal. The priest has full control over the animal and uses its senses and physical abilities. His own body remains comatose and vulnerable. If the animal is killed, the priest must make a system shock roll or also dies.'
WHERE LOWER(name_en) = LOWER('Animal Transfer') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Ersticken',
  description = 'Erstickt Individuen (vom Priester gewählt), die einen Rettungswurf gegen Zauber nicht bestehen. Die Opfer können nicht atmen und erleiden jede Runde Erstickungsschaden. Das Opfer kann sich nicht konzentrieren, nicht zaubern und kämpft mit −4 auf alle Würfe. Der Effekt hält an, bis der Rettungswurf gelingt oder der Zauber endet.',
  description_en = 'Asphyxiates individuals (chosen by the priest) who fail a saving throw vs. spell. Victims cannot breathe and suffer suffocation damage each round. The victim cannot concentrate, cannot cast spells, and fights at −4 to all rolls. The effect persists until the saving throw succeeds or the spell ends.'
WHERE LOWER(name_en) = LOWER('Asphyxiate') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Geist Herbeirufen',
  description = 'Durch diesen Zauber kann ein Schamane jeden Geist bitten, zu erscheinen. Wird typischerweise verwendet, um mit den Geistern der Ahnen, der Natur oder der Elemente zu kommunizieren. Der Geist ist nicht gezwungen zu erscheinen, erscheint aber normalerweise aus Höflichkeit. Erscheint er, kann der Priester Fragen stellen.',
  description_en = 'Through this spell, a shaman can ask any spirit to appear. Typically used to communicate with spirits of ancestors, nature, or elements. The spirit is not compelled to appear but normally does so out of courtesy. If it appears, the priest can ask questions.'
WHERE LOWER(name_en) = LOWER('Beckon Spirit') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Bolzen der Herrlichkeit',
  description = 'Der Priester projiziert einen Energiebolzen von der Positiven Materiellen Ebene. Der Bolzen verursacht unterschiedlichen Schaden je nach Zieltyp: Untote und Wesen der Negativen Ebene erleiden maximalen Schaden (bei Versagen des Rettungswurfs). Lebende Wesen der Materiellen Ebene sind kaum betroffen. Außerplanare böse Kreaturen erleiden erheblichen Schaden.',
  description_en = 'The priest projects a bolt of energy from the Positive Material Plane. The bolt deals varying damage depending on target type: undead and Negative Plane beings suffer maximum damage (on failed save). Living Prime Material creatures are barely affected. Extraplanar evil creatures suffer significant damage.'
WHERE LOWER(name_en) = LOWER('Bolt of Glory') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Phönix Rufen',
  description = 'Ermöglicht dem Priester, einen Phönix zu Hilfe zu rufen. Der Priester muss guter Gesinnung oder ein Druide sein — böse oder neutrale Nicht-Druiden können keinen Phönix beschwören. Der Phönix antwortet immer, braucht aber je nach Entfernung 1W8-1 Runden zum Erscheinen (0 = sofort in Rauch und Flammen). Der Phönix greift keine guten Wesen an. Nach Ablauf des Zaubers ist der Phönix frei zu tun, was er will. Materialkomponente: Drei Diamanten (je mind. 500 GM Wert) und eine rotglühende Kohle.',
  description_en = 'Enables the priest to summon a phoenix to his aid. The caster must be good-aligned or a druid — evil or non-druid neutral priests cannot summon a phoenix. The phoenix always answers but may take 1d8-1 rounds to appear (0 = immediately in smoke and flame). The phoenix won''t attack good-aligned beings. When the spell expires, the phoenix is free to act as it wills. Material component: Three diamonds (at least 500 gp each) and a red-hot coal.'
WHERE LOWER(name_en) = LOWER('Call Phoenix') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Kettenwahnsinn',
  description = 'Ermöglicht dem Priester, Wahnsinn im Geist einer Zielkreatur zu erzeugen, der sich auf nahestehende Kreaturen ausbreiten kann. Das erste Opfer muss einen Rettungswurf gegen Zauber bestehen oder wird wahnsinnig. In jeder folgenden Runde kann sich der Wahnsinn auf eine weitere Kreatur innerhalb von 3 m ausbreiten. Nur Wahnsinn Heilen oder Wunsch kann den Effekt aufheben.',
  description_en = 'Allows the priest to create insanity in a target creature''s mind that can spread to nearby creatures. The first victim must save vs. spell or become insane. Each subsequent round, the madness can spread to one additional creature within 3 m. Only Heal Insanity or Wish can end the effect.'
WHERE LOWER(name_en) = LOWER('Chain Madness') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Erde Befehligen',
  description = 'Gewährt dem Priester begrenzte Macht über Kreaturen der elementaren Erde. Erdelementare und verwandte Wesen können befohlen werden, einfache Aufgaben auszuführen oder den Kampf einzustellen. Die Kreaturen erhalten einen Rettungswurf gegen Zauber. Bei Misserfolg gehorchen sie für die Dauer des Zaubers.',
  description_en = 'Grants the priest limited power over creatures from the elemental plane of earth. Earth elementals and related beings can be commanded to perform simple tasks or cease combat. The creatures receive a saving throw vs. spell. On failure, they obey for the spell''s duration.'
WHERE LOWER(name_en) = LOWER('Command Earth') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Kommunizieren',
  description = 'Ermöglicht dem Priester, mit einem anderen Individuum überall auf derselben Ebene zu kommunizieren. Beide Parteien können sprechen und hören, als wären sie nebeneinander. Der Priester muss den Empfänger kennen oder seinen Namen und Aufenthaltsort wissen. Die Verbindung hält 1 Runde pro Stufe.',
  description_en = 'Enables the priest to communicate with another individual anywhere on the same plane. Both parties can speak and hear as if standing next to each other. The priest must know the recipient or know their name and location. The connection lasts 1 round per level.'
WHERE LOWER(name_en) = LOWER('Communicate') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Lykanthropen Kontrollieren',
  description = 'Ermöglicht die Kontrolle über Lykanthropen: 1 Werbär oder Wertiger, 1-2 Wereber, 1-3 Werwölfe oder Wolfswerwesen, 1-4 Werratten. Die Kreaturen erhalten einen Rettungswurf gegen Zauber. Bei Misserfolg gehorchen sie einfachen Befehlen des Priesters. Die Kontrolle hält 1 Runde pro Stufe und kann Lykanthropen daran hindern, sich zu verwandeln.',
  description_en = 'Enables control over lycanthropes: 1 werebear or weretiger, 1-2 wereboars, 1-3 werewolves or wolfweres, 1-4 wererats. Creatures receive a saving throw vs. spell. On failure, they obey simple commands from the priest. Control lasts 1 turn per level and can prevent lycanthropes from shapeshifting.'
WHERE LOWER(name_en) = LOWER('Control Lycanthropes') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Kriechende Dunkelheit',
  description = 'Erzeugt einen Schleier aus dunklen, windenden Tentakeln um den Priester. Die Tentakel greifen automatisch jede Kreatur an, die innerhalb von 3 m kommt, und verursachen 2W4 Schaden pro Runde. Der Priester ist immun gegen seine eigene Kriechende Dunkelheit. Die Tentakel blockieren auch Sicht und Licht im Wirkungsbereich.',
  description_en = 'Brings into being a shroud of dark, writhing tentacles around the caster. The tentacles automatically attack any creature coming within 3 m, dealing 2d4 damage per round. The priest is immune to his own Crawling Darkness. The tentacles also block vision and light in the area of effect.'
WHERE LOWER(name_en) = LOWER('Crawling Darkness') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Uralte Untote Erschaffen — Altes Imperium',
  description = 'Entweiht den sorgfältig konservierten und geheiligten Körper eines Verstorbenen und verwandelt ihn in einen mächtigen untoten Diener. Die resultierende Kreatur ist mächtiger als gewöhnliche Untote und behält einige Fähigkeiten aus ihrem früheren Leben. Der Prozess ist ein zutiefst böser Akt und erfordert aufwendige Rituale.',
  description_en = 'Defiles the carefully preserved and sanctified corporeal body of a deceased individual, transforming it into a powerful undead servant. The resulting creature is more powerful than ordinary undead and retains some abilities from its former life. The process is a deeply evil act requiring elaborate rituals.'
WHERE LOWER(name_en) = LOWER('Create Ancient Dead — Old Empire') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Bannwächter Erschaffen',
  description = 'Verwandelt ein unbelebtes Skelett der Größe M oder kleiner in einen Bannwächter — einen untoten Wächter, der einen bestimmten Bereich bewacht. Der Bannwächter gehorcht den bei der Erschaffung festgelegten Befehlen und kämpft gegen jeden Eindringling. Er ist mächtiger als ein normales Skelett und kann magische Waffen führen.',
  description_en = 'Transforms one inanimate skeleton of size M or smaller into a baneguard — an undead guardian that protects a specific area. The baneguard obeys commands set during creation and fights any intruder. It is more powerful than a normal skeleton and can wield magical weapons.'
WHERE LOWER(name_en) = LOWER('Create Baneguard') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Ibrandlin Erschaffen',
  description = 'Erschafft Ibrandlin durch magische Veränderung von Feuereidechsen. Die resultierenden Kreaturen sind mächtige, feueratmende Reptilien, die als Wächter und Kampfgefährten dienen. Der Prozess ist langwierig und erfordert spezielle Materialkomponenten. Die Ibrandlin sind dem Priester loyal.',
  description_en = 'Creates ibrandlin by magically altering fire lizards. The resulting creatures are powerful, fire-breathing reptiles that serve as guardians and combat companions. The process is lengthy and requires special material components. The ibrandlin are loyal to the priest.'
WHERE LOWER(name_en) = LOWER('Create Ibrandlin') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Maschine Erschaffen — Zwerg',
  description = 'Wird verwendet, um den Prozess der Herstellung magischer Maschinen und Konstrukte abzuschließen. Der Zauber verleiht einem sorgfältig gefertigten mechanischen Gerät magisches Leben und Funktionalität. Nur Zwergenpriester mit Schmiedeexpertise können diesen Zauber wirken.',
  description_en = 'Used to finish the process of fabricating magical machines and constructs. The spell imbues a carefully crafted mechanical device with magical life and functionality. Only dwarven priests with smithing expertise can cast this spell.'
WHERE LOWER(name_en) = LOWER('Create Machine* — Dwarf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Krone der Brillanz — Archon',
  description = 'Verwandelt ein Kopfschmuckstück in eine lodernde Quelle goldenen Lichts, vergleichbar mit Sonnenlicht. Untote und lichtempfindliche Kreaturen erleiden Schaden und werden geblendet. Alle Verbündeten im Lichtradius erhalten +1 auf Moral- und Angriffswürfe. Dauer: 1 Runde pro Stufe.',
  description_en = 'Turns a piece of headgear into a blazing source of golden light comparable to sunlight. Undead and light-sensitive creatures suffer damage and are blinded. All allies within the light radius gain +1 to morale and attack rolls. Duration: 1 turn per level.'
WHERE LOWER(name_en) = LOWER('Crown of Brilliance — Archon') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Zerquetschende Wände',
  description = 'Verzaubert einen Boden, eine Decke oder eine einzelne Wand eines Raumes. Die verzauberte Fläche beginnt sich langsam zu bewegen und den Raum zusammenzudrücken. Kreaturen im Raum erleiden zunehmenden Quetschschaden pro Runde. Nur physische Stärke (Biegstangen/Tore heben) oder mächtige Magie kann die Wände aufhalten.',
  description_en = 'Enchants a floor, ceiling, or single wall of a room. The enchanted surface begins slowly moving and compressing the room. Creatures inside suffer increasing crushing damage per round. Only physical strength (bend bars/lift gates) or powerful magic can stop the walls.'
WHERE LOWER(name_en) = LOWER('Crushing Walls') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Fluch des Revenancer — Drow',
  description = 'Verflucht eine einzelne Kreatur, von den rachsüchtigen Geistern derer heimgesucht zu werden, die sie im Leben getötet hat. Die Geister erscheinen jede Nacht und greifen das Opfer an, entziehen Lebensstufen und verursachen Wahnsinn. Nur Fluch Brechen der höchsten Stufe oder Wunsch kann den Fluch aufheben.',
  description_en = 'Curses a single creature to be haunted by the vengeful spirits of those it killed in life. The spirits appear every night and attack the victim, draining life levels and causing madness. Only the highest-level Remove Curse or Wish can lift the curse.'
WHERE LOWER(name_en) = LOWER('Curse of the Revenancer — Drow') AND spell_type = 'priest';
