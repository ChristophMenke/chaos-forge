-- ═══════════════════════════════════════════════════════════════════════════════
-- PSC1 Priest Spells Level 4 (Batch 4: 17 Spells — Dweomerflow to Footsore)
-- Metrisch, eng an Originaltexten orientiert
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.spells SET
  name = 'Dweomerstrom',
  description = 'Kann auf zwei Arten gewirkt werden. Version 1: Wird auf einen Zauberwirker gewirkt und lenkt dessen nächsten Zauber in ein vorbereitetes Gefäß (Fokalstein, Kristallkugel oder nachladbarer magischer Gegenstand), statt seine normale Wirkung zu entfalten. Version 2: Ein Heiligwasserbecken oder geweihter Altar kann bis zu ein Dutzend umgelenkte Zauber aufnehmen, die einzeln (einer pro Runde) von Gläubigen desselben Glaubens freigesetzt werden können — auch ohne die nötige Klasse oder Stufe. Zauber ab Stufe 5 benötigen einen zusätzlichen Abeyanz-Zauber.',
  description_en = 'Can be cast in two ways. Version 1: Cast on a spellcaster, it causes the next spell to flow into a prepared receptacle (focal stone, crystal ball, or rechargeable magical item) instead of taking its usual effect. Version 2: A holy water font or consecrated altar can accept up to a dozen flowed spells, released one per round by any being of the same faith — even without the necessary class or level. Spells of 5th level or greater require an accompanying abeyance spell.'
WHERE LOWER(name_en) = LOWER('Dweomerflow') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Elementarkontrolle',
  description = 'Ermöglicht dem Priester, die Kontrolle über ein von jemand anderem beschworenes Elementar zu übernehmen. Basiserfolgschance: 50 %, angepasst um die Stufen-/TW-Differenz zwischen Priester und Elementar sowie die Weisheitsdifferenz zwischen ursprünglichem Beschwörer und Wirker. Nur ein Versuch pro Kreatur; bei Misserfolg sind keine weiteren Versuche möglich. Bei Erfolg gehorcht das Elementar dem Priester für den Rest seines Aufenthalts auf der materiellen Ebene.',
  description_en = 'Allows the priest to seize control of an elemental summoned by someone else. Base chance of success: 50%, adjusted by level/HD difference between priest and elemental and by the Wisdom difference between original summoner and caster. Only one attempt per creature; failure means no further efforts will succeed. On success, the elemental obeys the priest for the remainder of its stay on the physical plane.'
WHERE LOWER(name_en) = LOWER('Elemental Control') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Ausdauer Ilmaters',
  description = 'Verdoppelt die Trefferpunkte des Empfängers für die Zauberdauer. Schaden wird zuerst von den Bonus-TP abgezogen. Alle Stärke- und Konstitutionswürfe gelingen automatisch. Alle Systemschock-Würfe und Krankheitsresistenzwürfe gelingen ebenfalls automatisch. Alle anderen Rettungswürfe erhalten +2 Bonus. Zudem kann der Empfänger nicht umgestoßen, niedergetrampelt oder überrannt werden — er steht fest gegen alle Anstürme.',
  description_en = 'Doubles the recipient''s hit points for the spell duration. Damage is taken from bonus hit points first. All Strength and Constitution checks automatically succeed. All system shock rolls and disease resistance checks also succeed automatically. All other saving throws receive a +2 bonus. Additionally, the recipient cannot be knocked over, trampled, or ridden down — standing firm against all charges.'
WHERE LOWER(name_en) = LOWER('Endurance of Iimater') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Exorzismus',
  description = 'Negiert die Besessenheit einer Kreatur oder eines Objekts durch übernatürliche Kräfte — einschließlich Magisches Gefäß, dämonische Besessenheit, Flüche und Bezauberungen. Die Grundchance liegt zwischen 1–100 %, modifiziert um −1 % pro Stufe, die der Priester unter dem Besitzer liegt (oder +1 % pro Stufe darüber). Der Exorzismus kann nach Beginn nicht unterbrochen werden, ohne ihn zu ruinieren. Jede Runde wird erneut gewürfelt. Ein religiöses Artefakt oder Relikt kann die Erfolgschance um 1–50 % erhöhen.',
  description_en = 'Negates possession of a creature or object by supernatural forces — including magic jar, demonic possession, curses, and charms. Base chance ranges from 1–100%, modified by −1% per level the priest is below the possessor (or +1% per level above). The exorcism cannot be interrupted once begun without ruining it. Each turn the dice are rerolled. A religious artifact or relic can increase the chance of success by 1–50%.'
WHERE LOWER(name_en) = LOWER('Exorcise') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Geist Extrahieren — Schamane',
  description = 'Ermöglicht dem Wirker, einen in ein Objekt gebundenen Geist zu entfernen und in einen anderen Behälter zu versetzen. Wirkt nur auf objektgebundene Geister (natürlich gebundene wie Baumgeister oder durch Schamanenmagie gebundene). Unwillige Geister erhalten einen Rettungswurf gegen Zauber. Häufige Verwendungen: Als tragbarer Sensor spürt der Geist Wesen im Umkreis von 9,1 m pro TW des Annähernden. Als stationärer Wächter löst er Alarm aus, wenn Kreaturen den Bereich durchqueren.',
  description_en = 'Allows the caster to remove a spirit bound into an object and place it in another container. Works only on object-bound spirits (naturally bound like tree spirits or shaman-magic bound). Unwilling spirits get a saving throw vs. spell. Common uses: As a portable sensor, the spirit detects beings within 9.1 m per HD of the approaching creature. As a stationary guardian, it triggers an alarm when creatures pass through the area.'
WHERE LOWER(name_en) = LOWER('Extract Spirit — Shaman') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Zone der Glaubensmagie',
  description = 'Verlangsamt das Wirken aller Magierzauber im Wirkungsbereich um +3 auf die Wirkzeit (nur bei Zaubern mit Wirkzeit von 1 Runde oder weniger). Auch magische Gegenstände auf Basis von Magierzaubern werden mit +3 Abzug aktiviert. Die Zone erzeugt ein schwaches silbernes Leuchten und bewegt sich mit dem Wirker. Kreaturen im Bereich erhalten +3 auf alle Rettungswürfe gegen Magierzauber und -effekte. Kann normal gebannt werden.',
  description_en = 'Slows the casting of all wizard spells in the area of effect by +3 to casting time (only for spells taking one round or less). Magical items based on wizard spells are likewise activated with a +3 penalty. The zone creates a dim silver radiance and moves with the caster. Creatures in the area gain +3 to all saving throws vs. wizard spells and effects. Can be dispelled normally.'
WHERE LOWER(name_en) = LOWER('Faith Magic Zone') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Schicksal',
  description = 'Erlaubt dem Shukenja, den allgemeinen Verlauf des Lebens eines Subjekts vorherzusehen. Beide Personen müssen bei der Wirkung anwesend sein und wesentliche Lebensdetails müssen bekannt sein (Geburtsdatum, vergangene Taten, Familie). Der SL kann ein bekanntes Ereignis verwenden oder auf einer Schicksalstabelle würfeln. Die Vorhersage ist vage — keine spezifischen Fragen, Daten oder Orte. Mögliche Ergebnisse reichen von Triumph über einen Feind bis zu Ruin durch plötzlichen Reichtum.',
  description_en = 'Allows the shukenja to foresee the general course of a subject''s life. Both must be present at casting and significant life details must be known (birth date, past deeds, family). The DM can use a known event or roll on a Fate Table. The prediction is vague — no specific questions, dates, or locations. Possible outcomes range from triumph over a great foe to ruin brought by sudden fortune.'
WHERE LOWER(name_en) = LOWER('Fate') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Heldentat',
  description = 'Ermöglicht dem Empfänger, eine einzelne extrem schwierige Handlung zu vollbringen — alle nötigen Attributs- und Fertigkeitswürfe gelingen automatisch (außer langwierige Tätigkeiten wie Rüstungsherstellung). Die Magie führt die Handlung nicht aus und schützt nicht vor Risiken, garantiert aber den Erfolg. Selbst wenn die Kreatur beim Versuch stirbt, vollendet ihr Körper die Aktion. Muss in der Runde nach dem Wirken ausgeführt werden, sonst verfällt die Magie.',
  description_en = 'Allows the recipient to complete one extremely difficult single-step task — all necessary ability and proficiency checks automatically succeed (except protracted activities like constructing armor). The magic does not perform the task or protect from risks, but guarantees success. Even if the creature dies in the attempt, the body completes the action. Must be performed the round after casting or the magic is wasted.'
WHERE LOWER(name_en) = LOWER('Feat') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Untoten Vortäuschen',
  description = 'Lässt den Wirker oder eine freiwillige Person wie einen Zombie erscheinen. Die Person sieht untot aus, atmet nicht mehr und fühlt keinen Schmerz oder Emotionen. Immun gegen Lähmung, Gift und Stärke-/Energieentzug (Giftwürfe erst beim Zauberende). Haut verändert sich, Fleisch schrumpft, Gelenke werden steif. Greift als normaler Zombie an (immer zuletzt in der Runde). Tatsächliche Untote greifen nicht an, es sei denn, sie werden dazu befohlen. Zauber gegen Untote wirken nicht.',
  description_en = 'Makes the caster or a willing person appear as a zombie. The person looks undead, ceases breathing, and feels no pain or emotion. Immune to paralysis, poison, and Strength/energy drain (poison saves only at spell''s end). Skin changes, flesh shrinks, joints stiffen. Attacks as a normal zombie (always last in the round). Actual undead will not attack unless ordered. Spells that affect undead have no effect.'
WHERE LOWER(name_en) = LOWER('Feign Undead') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Fruchtbarkeit',
  description = 'Zwei Anwendungen möglich. Erstens: Verstärktes Pflanzenwachstum über 16,1 km² — bei erfolgreichem Rettungswurf des SL steigen Erträge um 30–80 % bei normaler Wachstumssaison. Zweitens: Als Hochzeitssegen gewirkt, verleiht 95 % Chance auf Empfängnis bei Paarung innerhalb 24 Stunden. Der Nachwuchs wird garantiert gesund geboren, solange die Mutter gesund bleibt. Alter, Flüche und andere Faktoren können die Chance beeinflussen.',
  description_en = 'Two uses possible. First: Enhanced plant growth over a 16.1 km² area — on a successful DM saving throw, yields increase by 30–80% given a normal growing season. Second: Cast as a marital blessing, grants a 95% chance of conception if mating within 24 hours. The offspring is guaranteed to be born healthy as long as the mother remains uninjured. Age, curses, and other factors may influence the chance.'
WHERE LOWER(name_en) = LOWER('Fertility') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Gefährten Finden',
  description = 'Ähnlich wie Vertrauten Finden des Magiers, aber teils mächtiger. Der Priester ruft ein Tier als Hilfe und Begleiter. Nur ein Gefährte gleichzeitig möglich; die Art ist nicht kontrollierbar. Der Gefährte hat Intelligenz 4–5, verleiht +1 auf Überraschungswürfe und wird telepathisch gesteuert. Wenn mehr als 1,6 km entfernt für über einen Tag, verliert er 1 TP/Tag bis zum Tod. Anders als bei Magiern: Priester erleiden keinen Schaden beim Tod des Gefährten. Gefährte hat 3W4+1 TP pro Stufe und RK 7.',
  description_en = 'Similar to wizard''s find familiar but partly more powerful. The priest summons an animal for aid and companionship. Only one companion at a time; the type cannot be controlled. The companion has Intelligence 4–5, grants +1 to surprise rolls, and is directed telepathically. If separated by more than 1.6 km for over a day, it loses 1 HP/day until death. Unlike wizards: priests suffer no damage when the companion dies. Companion has 3d4+1 HP per level and AC 7.'
WHERE LOWER(name_en) = LOWER('Find Companion') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Feueraugen Gorms — Zwerg',
  description = 'Erlaubt dem Priester, einen feurigen Strahl aus einem oder beiden Augen abzufeuern. Kann bis zu zwei Gegner pro Runde treffen, trifft mit dem normalen ETW0 des Priesters und erlaubt gleichzeitig andere physische Aktivitäten (einschließlich Kampf). Verursacht 2W8 Feuerschaden (Rettungswurf gegen Zauber für halben Schaden). Wirkt auf Metall als sofortiges sengend heißes Metall — ein zweiter Treffer auf dieselbe Metallstelle schmilzt das Metall, sofern kein Gegenstandsrettungswurf gegen Blitz gelingt. Rüstungsträger erleiden sowohl Strahl- als auch Metallschaden.',
  description_en = 'Allows the priest to emit a fiery beam from one or both eyes. Can strike up to two opponents per round, attacks with the priest''s normal THAC0, and permits other physical activities (including combat). Deals 2d8 fire damage (save vs. spell for half). Acts on metal as instant searing heat metal — a second strike on the same metal piece melts it unless it succeeds an item saving throw vs. lightning. Armored targets suffer both beam and metal damage.'
WHERE LOWER(name_en) = LOWER('Fire Eyes of Gorm — Dwarf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Feuerreinigung',
  description = 'Schützt einen Bereich vor normalem und magischem Feuer. Normale Feuer (Lagerfeuer, Fackeln, Ölbrände) können im Wirkungsbereich nicht brennen. Magische Feuer (Drachenodem, brennende Hände, Feuerball) verursachen nur 50 % des normalen Schadens. Kreaturen im Bereich erhalten +4 auf Rettungswürfe gegen Feuerangriffe. Löscht bestehende Feuer nicht. Kann als kooperative Magie gewirkt werden — die Dauer beträgt dann 1 Runde pro Stufe des mächtigsten Priesters plus 1 Runde pro weiterem Priester, mit vergrößertem Wirkungsbereich.',
  description_en = 'Protects an area against normal and magical fire. Normal fires (campfires, torches, oil fires) cannot burn in the area. Magical fires (dragon breath, burning hands, fireball) cause only 50% damage. Creatures in the area gain +4 to saving throws vs. fire attacks. Does not extinguish existing fires. Can be cast as cooperative magic — duration becomes 1 turn per level of the most powerful priest plus 1 turn per additional priest, with enlarged area of effect.'
WHERE LOWER(name_en) = LOWER('Fire Purge*') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Vogelschwarm — Altes Reich',
  description = 'Ruft einen dichten Schwarm gewöhnlicher Vögel herbei (versagt ohne Vögel in der Umgebung). Die Vögel verdunkeln die Sicht auf 6,1 m und machen Zaubern unmöglich. Ab Stufe 11 kann der Wirker den Schwarm zum Angriff befehlen: 1W2 Schaden plus 1 Punkt pro vier Stufen pro Runde gegen ein einzelnes Wesen. Immunität gegen nichtmagische Waffen schützt vollständig. Alle Kreaturen im Bereich müssen alle 2 Runden einen Moralwurf bestehen oder fliehen (über 219,5 m). Nur ein Flächenzauber mit mindestens 4 Schadenspunkten über den gesamten Schwarm beendet den Effekt.',
  description_en = 'Summons a dense flock of ordinary birds (fails without birds in the environment). The birds obscure vision to 6.1 m and make spellcasting impossible. At level 11+, the caster can command the flock to attack: 1d2 damage plus 1 point per four levels per round against a single being. Immunity to nonmagical weapons provides full protection. All creatures in the area must make a morale check every 2 rounds or flee beyond 219.5 m. Only an area-effect spell dealing at least 4 damage encompassing the entire flock ends the effect.'
WHERE LOWER(name_en) = LOWER('Flock of Birds — Old Empire') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Fokus',
  description = 'Erschafft einen Fokus, durch den Glaubensmagie verstärkt werden kann. Der Fokus benötigt eine ständige Quelle hingebungsvoller Energie (Gemeinde oder Priestergruppe) innerhalb von 30,5 m — ohne diese verfällt er sofort. Drei Typen: Ortsfokus (an einen Ort gebunden, unsichtbar und immateriell), Gegenstandsfokus (zentriert auf ein Objekt, üblicherweise ein Altar), und Lebender Fokus (auf ein Lebewesen gewirkt, seltenster Typ). Die Art des Fokus hängt von der Religion und dem zu verstärkenden Zauber ab.',
  description_en = 'Creates a focus through which faith magic is amplified. The focus requires a constant source of devotional energy (congregation or priest group) within 30.5 m — without it, the focus immediately fails. Three types: Site focus (bound to a place, invisible and intangible), Item focus (centered on an object, usually an altar), and Living focus (cast on a living being, rarest type). The type depends on the religion and the spell being amplified.'
WHERE LOWER(name_en) = LOWER('Focus') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Fußlahm',
  description = 'Ein spezialisierter Fluch, der jede Reise von mehr als einer Wegstunde (ca. 4,8 km) doppelt so lang wie normal macht. Betroffene schlurfen, laufen im Kreis, bestehen auf langen Pausen und unternehmen andere Handlungen, die die Reise verlangsamen. Normale Reittiere der Betroffenen sind ebenfalls betroffen. Der einzige Gegenmaßnahme ist Fluch Entfernen, gewirkt von einem Priester höherer Stufe als der ursprüngliche Wirker, oder das Abwarten der Zauberdauer.',
  description_en = 'A specialized curse causing any journey of more than one league (about 4.8 km) to take twice as long as normal. Those affected drag their feet, walk in circles, insist on long rests, and take other actions to slow travel. Normal mounts ridden by affected creatures are also affected. The only counter is remove curse cast by a priest of higher level than the original caster, or waiting for the duration to expire.'
WHERE LOWER(name_en) = LOWER('Footsore') AND spell_type = 'priest';
