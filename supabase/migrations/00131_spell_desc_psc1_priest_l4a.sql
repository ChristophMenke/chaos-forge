-- ═══════════════════════════════════════════════════════════════════════════════
-- PSC1 Priest Spells Level 4 (Batch 1: 18 Spells — Addition to Breath Of The Elements)
-- Metrisch, eng an Originaltexten orientiert
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.spells SET
  name = 'Addition',
  description = 'Erlaubt dem Priester, ein neues Objekt oder Lebewesen vorübergehend in die Realität einzufügen, indem er die „Gleichung des Augenblicks" verändert. Zauberer der 10. Stufe oder niedriger können einen einzelnen, unbelebten Gegenstand bis 4,5 kg erschaffen, der nicht komplexer als eine Armbrust sein darf. Höhere Stufen erlauben komplexere oder größere Objekte bis hin zu lebenden Wesen. Das Objekt existiert 1 Runde pro Stufe und darf nicht in einem bereits besetzten Raum erscheinen.',
  description_en = 'Allows the priest to temporarily bring a new object or living creature into existence by modifying the "equation of the moment." Casters of 10th level or less can create a single inanimate object weighing up to 4.5 kg, no more complex than a crossbow. Higher levels allow more complex or larger objects up to living creatures. The object exists for 1 turn per level and cannot appear in an already occupied space.'
WHERE LOWER(name_en) = LOWER('Addition') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Verbesserter Sonnenschein',
  description = 'Ein vielseitiger Zauber, der in drei Formen gewirkt werden kann und dafür Sonnenlicht des aktuellen Tages „ausleiht". Licht: Erzeugt ein Licht-Zauber, der 1 Runde pro Stufe anhält und den Tag um 1 Minute pro Stufe verkürzt. Feuerball: Wandelt Sonnenenergie in einen Feuerball um, als wäre er von einem Magier gleicher Stufe gewirkt (nur bei klarem Himmel tagsüber). Beleuchtung: Erzeugt Dauerlicht mit doppelter Reichweite und Wirkung, verkürzt den Tag um 1 Stunde.',
  description_en = 'A versatile spell cast in one of three forms, borrowing sunshine from the current day. Light: Creates a light spell lasting 1 turn per level, shortening the day''s sunshine by 1 minute per level. Fireball: Converts sun energy into a fireball as if cast by a mage of the priest''s level (only on clear days during daytime). Illumination: Creates continual light at double range and effect, shortening the day''s sunshine by 1 hour.'
WHERE LOWER(name_en) = LOWER('Advanced Sunshine') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Pflanzenalter',
  description = 'Ermöglicht dem Priester, das Alter einer Pflanze, eines Samens oder Baumes vor- oder zurückzusetzen. Blumen können zum Blühen gebracht, Samen zum Keimen, Bäume zum Früchtetragen — oder umgekehrt — veranlasst werden. Die Veränderung geschieht augenblicklich und kann bis zu 10 Jahre pro Stufe betragen. Der Priester kann das Altern an jedem gewünschten Punkt stoppen. Wirkt nicht auf magisch erzeugte Pflanzen oder pflanzenbasierte Monster.',
  description_en = 'Enables the priest to age or rejuvenate any plant, seed, or tree forward or backward in time. Flowers can be made to blossom, seeds to sprout, trees to bear fruit — or the reverse. The change occurs instantaneously and can affect up to 10 years per caster level. The priest can stop the aging at any desired point. Has no effect on magically generated plants or plant-based monsters.'
WHERE LOWER(name_en) = LOWER('Age Plant') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Bernsteingefängnis — Elf',
  description = 'Umhüllt ein Zielwesen mit einer harten, durchscheinenden Schicht aus fossilem Harz in Gelb-, Orange- oder Braungelbtönen. Ein erfolgreicher Rettungswurf gegen Zauber negiert den Effekt (−4 Abzug wenn bereits mit Baumsaft bedeckt). Riesige oder größere Kreaturen befreien sich in 1 Runde; andere können pro Runde einen Gitterstäbe-biegen-Wurf versuchen, dessen Erfolgschance um 1 % pro Runde sinkt. 30 Punkte physischer Schaden zerschmettern das Gefängnis. Eingeschlossene Kreaturen ersticken langsam und müssen jede Runde einen Konstitutionswurf bestehen.',
  description_en = 'Encases a target creature in a hard, translucent coating of fossil resin in yellow, orange, or brownish-yellow hues. A successful saving throw vs. spell negates the effect (−4 penalty if already covered in tree sap). Huge or larger creatures break free in 1 round; others may attempt a bend bars/lift gates roll each round, with success chance decreasing by 1% per round. 30 points of physical damage shatters the prison. Encased creatures slowly suffocate and must make a Constitution check each round.'
WHERE LOWER(name_en) = LOWER('Amber Prison — Elf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Tiersicht',
  description = 'Der Priester sieht buchstäblich durch die Augen eines Tieres, auf das der Zauber gewirkt wird. Wohin das Tier auch reist, sieht der Priester, was es sieht. Während der Dauer muss der Priester reglos bleiben und sich auf das Tier konzentrieren. Schaden am Priester unterbricht den Zauber. Besonders nützlich zum Ausspähen oder Erkunden eines Gebiets, bevor man es persönlich betritt.',
  description_en = 'The priest literally sees through the eyes of an animal upon which the spell is cast. Wherever the animal travels for the duration, the priest sees what it sees. The priest must remain stationary and concentrate on the animal during this time. Damage to the priest interrupts the spell. Especially useful for spying or scouting a territory before entering it personally.'
WHERE LOWER(name_en) = LOWER('Animal Sight') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Tiervision — Altes Reich',
  description = 'Verbindet die Sicht des Priesters mit der eines einzelnen Tieres in Sichtweite oder bei Berührung — Säugetier, Reptil, Vogel, Fisch oder Insekt. Solange das Tier in Reichweite bleibt, kann der Priester durch seine Augen sehen und dessen normale oder besondere Sicht nutzen. Es besteht keine weitere Verbindung: Der Priester hat keine Kontrolle über das Tier und erleidet keinen Schaden, wenn es getötet wird.',
  description_en = 'Links the vision of the priest to a single animal in sight or touched — mammal, reptile, bird, fish, or insect. As long as the animal remains within range, the caster can see through its eyes using whatever normal or special vision it possesses. There is no other link: the priest has no control over the animal and suffers no damage if it is killed.'
WHERE LOWER(name_en) = LOWER('Animal Vision — Old Empire') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Beliebiger Zauber',
  description = 'Erlaubt dem Priester, einen Magierzauber der Stufe 1–5 zu lesen und später zu wirken. Durch das Wirken von Beliebiger Zauber erhält der Priester die Fähigkeit Magie Lesen; nur ein Zauber kann pro Wirkung gelesen und eingesetzt werden. Der Magierzauber bleibt im Gedächtnis, bis er gewirkt wird, und benötigt keine Materialkomponenten. Solange der Magierzauber gespeichert ist, kann der Priester den 4.-Stufe-Zauberplatz nicht neu besetzen.',
  description_en = 'Allows the priest to read and later cast any wizard spell of 1st through 5th level. Casting anyspell confers a read magic ability; only one spell can be read and cast per casting. The wizard spell is retained in mind until cast and requires no material components. While the wizard spell is stored, the priest cannot pray for a spell to replace the 4th-level slot.'
WHERE LOWER(name_en) = LOWER('Anyspell') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Einstimmung — Drow',
  description = 'Ermöglicht dem betroffenen Wesen die sichere Nutzung magischer Kräfte von Haus-Insignien und allen anderen Gegenständen mit derselben Haus-Kennung. Erlaubt zudem das gefahrlose Passieren von Fallen und Schutzzaubern der Haus-Verteidigung. Der Zauber platziert Wissen über den Umgang mit Insignien-Kräften im Unterbewusstsein — identifiziert aber weder die Kräfte noch deren Art und Anzahl. Hält an, bis der Insignien-Fluch ausgelöst wird oder das Wesen stirbt.',
  description_en = 'Enables the affected being to safely use magical powers of house insignia and all other items bearing the same House identifier. Also allows passing traps and wards of House defenses without harm. The spell places knowledge of how to wield insignia powers in the recipient''s subconscious but does not identify any powers, their nature, or number. Lasts until the insignia''s curse is triggered or the attuned being is slain.'
WHERE LOWER(name_en) = LOWER('Attunement — Drow') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Axtsturm von Clangeddin — Zwerg',
  description = 'Verleiht jedem betroffenen Zwerg einen zusätzlichen Angriff pro Runde mit jeder Axt im Nahkampf oder beim Werfen. Bewegung, Zauberwirken und Angriffe mit anderen Waffen werden nicht beschleunigt. Als Äxte gelten Streitäxte, Handbeile, Wurfäxte und Zweihand-Streitäxte. Nicht kumulativ mit sich selbst oder ähnlicher Magie. Hast negiert den Effekt und wirkt normal; Langsam negiert den Effekt, hat aber sonst keinen Einfluss.',
  description_en = 'Grants each affected dwarf an additional attack per round with every axe in melee combat or hurled. Movement, spellcasting, and attacks with other weapons are not sped up. Axes include battle axes, hand axes, hatchets, throwing axes, and two-handed battle axes. Not cumulative with itself or similar magic. Haste negates the effect and functions normally; slow negates the effect but has no other impact.'
WHERE LOWER(name_en) = LOWER('Axe Storm of Clangeddin — Dwarf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Azuths Fedensor',
  description = 'Erlaubt dem nächsten Zauber der Stufe 1–5, der vom Wirkenden oder einem berührten Zauberwirker gewirkt wird, ohne Materialkomponenten ausgelöst zu werden (außer bei zauber­kritischen Komponenten wie dem Edelstein bei Magisches Gefäß). Zudem wird der betroffene Zauber nicht aus dem Gedächtnis gelöscht und kann später erneut gewirkt werden. Der betroffene Zauber muss innerhalb von 1 Runde gewirkt werden, sonst verfällt der Fedensor. Wirkt nicht auf sich selbst.',
  description_en = 'Allows the next 1st- through 5th-level spell cast by the caster or a touched spellcaster to be unleashed without material components (unless crucial to the spell, such as the gem in magic jar) and without being forgotten from memory. The affected spell must be cast within 1 turn or the fedensor is lost. Does not work on another Azuth''s fedensor.'
WHERE LOWER(name_en) = LOWER('Azuth''s Fedensor') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Kampfdreizack',
  description = 'Erschafft ein dreispritziges Geschoss aus vorübergehend gehärtetem Wasser, das einem gewählten Ziel nachfliegt und Ausweichmanövern folgt. Trifft mit dem ETW0 des Wirkers mit +2 Angriffsbonus (gilt als +2 magische Waffe). Verursacht 4W6 Schadenspunkte plus 1 Punkt pro Stufe des Wirkers. Ein erfolgreicher Rettungswurf gegen Zauber halbiert den Schaden. Nach Treffer oder Fehlschuss löst sich der Dreizack in Nebel auf.',
  description_en = 'Creates a three-tined missile of temporarily hardened water that streaks at a chosen target, following evasive movements. Strikes with the caster''s THAC0 at a +2 attack bonus (counts as a +2 magical weapon). Deals 4d6 damage plus 1 point per caster level. A successful saving throw vs. spell halves the damage. After striking or missing, the trident dissipates into mist.'
WHERE LOWER(name_en) = LOWER('Battle Trident') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Bärenumarmung',
  description = 'Erlaubt dem Druiden einen Quetschangriff gegen Gegner seiner eigenen Größe oder kleiner. Bei einem erfolgreichen Angriffswurf erleidet die Kreatur 2W8 Schaden in dieser und jeder folgenden Runde, bis der Zauber endet, der Druide stirbt oder die Umklammerung gebrochen wird. Um sich zu befreien, ist ein Gitterstäbe-biegen-Wurf nötig (5 % pro Trefferwürfel, wenn kein Stärke-Wert). Umklammerte Kreaturen greifen mit −2 Abzug an.',
  description_en = 'Allows the druid to make a crushing attack against foes of the druid''s own size or smaller. On a successful attack roll, the creature takes 2d8 damage that round and every subsequent round until the spell ends, the druid dies, or the hold is broken. Breaking free requires a bend bars/lift gates roll (5% per Hit Die if no Strength rating). Held creatures attack at a −2 penalty.'
WHERE LOWER(name_en) = LOWER('Bear Hug') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Blutmantel',
  description = 'Umhüllt den Priester mit wirbelnden blutroten Tröpfchen, die sich zwischen jeden Angriff und den Priester stellen. Verleiht +3 auf Rüstungsklasse und +3 auf Rettungswürfe gegen Feuer und Kälte. Jedoch −3 Abzug auf Rettungswürfe gegen Blitz und Elektrizität. Der Mantel kann als 3-m-großer Vorhang geworfen werden, der als unbewegliche Eisenwand fungiert (immun gegen Rosten), bis der Zauber endet.',
  description_en = 'Enshrouds the priest in swirling blood-red droplets that interpose between any attack and the priest. Grants +3 to Armor Class and +3 to saving throws vs. fire and cold. However, imposes a −3 penalty to saving throws vs. lightning and electricity. The mantle can be hurled up to 3 m away to form a 3 m square curtain acting as an immovable wall of iron (immune to corrosion) until the spell expires.'
WHERE LOWER(name_en) = LOWER('Blood Mantle') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Blutrausch',
  description = 'Erfüllt ein lebendes, intelligentes Wesen mit Kampfraserei und Blutdurst eines Berserkers. Der Betroffene greift rasend jedes Wesen in der Nähe an, ohne Freund von Feind zu unterscheiden, und wendet sich dem nächsten sichtbaren Ziel zu. Verleiht +1 auf Angriffswürfe, +3 auf Schaden und 5 Bonus-Trefferpunkte. Gewährt Immunität gegen Bezauberungen, Schlaf, Furcht und ähnliche Zauber. Der Rausch endet erst, wenn 3 volle Runden lang keine warmblütige Kreatur in 45,7 m Reichweite ist.',
  description_en = 'Imbues a living sentient being with berserker battle rage and blood lust. The subject frenetically attacks any creature nearby, unable to tell friend from foe, moving to the nearest visible target. Grants +1 to attack rolls, +3 to damage, and 5 bonus hit points. Provides immunity to charm, sleep, fear, and similar spells. The rage ends only after 3 continuous rounds without a warm-blooded creature within 45.7 m.'
WHERE LOWER(name_en) = LOWER('Blood Rage') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Knochenkette',
  description = 'Lässt aus verstreuten Knochen eine Kette von Skeletten unter Kontrolle des Wirkers entstehen. Pro Kettenglied wird ein Knochen eines verschiedenen verstorbenen Humanoiden benötigt (maximal so viele wie die Stufe des Priesters). Jeder Knochen kann bis zu 6,1 m von einem anderen entfernt platziert werden. Die Skelette aktivieren sich mit 5 pro Runde vom nächsten zum Wirker aus und haben mindestens 5 Trefferpunkte. Ideal für Hinterhalte mit verborgenen Knochen. Skelette bestehen bis zur Morgendämmerung nach dem Wirken.',
  description_en = 'Causes a chain of skeletons under the caster''s control to spring from scattered bones. Each link requires one bone from a separate deceased humanoid (maximum equal to the priest''s level). Each bone can be placed up to 6.1 m from another. Skeletons activate at 5 per round from nearest to the caster outward, each with at least 5 hit points. Ideal for ambushes with concealed bones. Skeletons persist until dawn following the casting.'
WHERE LOWER(name_en) = LOWER('Bonechain') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Segen Lathanders',
  description = 'In den sechs Runden nach dem Wirken erhält der Empfänger einen zusätzlichen Angriff pro Runde. Außerdem erhalten alle Angriffswürfe und Rettungswürfe einen +1 Bonus. Der Empfänger leuchtet während der verstärkten Fähigkeit in rosenrotem Licht.',
  description_en = 'On the six rounds following the round of casting, the recipient receives an additional attack per round. Further, all attack rolls and saving throws gain a +1 bonus. The recipient glows with a rose-red radiance during the time of augmented ability.'
WHERE LOWER(name_en) = LOWER('Boon of Lathander') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Segen des Gottes',
  description = 'Tauscht vorübergehend die Sicht des Priesters gegen erneuerte Vitalität. Bei Abschluss wird der Wirker sofort vollständig geheilt (Trefferpunkte, Attribute, fehlende Gliedmaßen), erblindet aber für 1 Monat pro Stufe. Der Segen hält 6 Runden, in denen der Wirker ohne Rücksicht auf weiteren oder sogar tödlichen Schaden funktioniert. Während der Blindheit: +2 Initiative-Abzug, +4 RK-Abzug, −4 Angriffswurf, −2 Rettungswürfe. Nach Ablauf wird aller vorheriger und neuer Schaden angewandt.',
  description_en = 'Temporarily trades the priest''s sight for renewed vitality. Upon completion, the caster is instantly restored to full health (hit points, ability scores, missing limbs), but goes blind for 1 month per level. The boon lasts 6 rounds during which the caster functions without regard for additional or even fatal damage. While blind: +2 initiative penalty, +4 AC penalty, −4 attack rolls, −2 saving throws. After expiry, all previous and new damage is applied.'
WHERE LOWER(name_en) = LOWER('Boon of the God') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Atem der Elemente',
  description = 'Ermöglicht dem Empfänger, für die Zauberdauer frei in einem einzelnen Element zu atmen. Beim Wirken benennt der Priester das passende Element: Feuer, Salz, Asche, Erde usw. Die Fähigkeit, in einem Element zu atmen, gewährt nicht das Atmen in einem ähnlichen — ein Wechsel von der Feuer- zur Magma-Ebene erfordert erneutes Wirken. Der Priester kann die Grunddauer auf mehrere Empfänger aufteilen, mindestens eine halbe Stunde pro Person. Unwirksam auf den Ebenen der Leere, positiven und negativen Energie.',
  description_en = 'Enables the recipient to breathe freely in a single element for the spell duration. At casting, the priest names the appropriate element: fire, salt, ash, earth, etc. The ability to breathe in one element does not grant breathing in a similar one — moving from the Plane of Fire to the Plane of Magma requires recasting. The priest can divide the base duration among multiple recipients, minimum one half-hour each. Ineffective on the planes of Vacuum, Positive Energy, and Negative Energy.'
WHERE LOWER(name_en) = LOWER('Breath Of The Elements') AND spell_type = 'priest';
