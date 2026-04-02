-- ═══════════════════════════════════════════════════════════════════════════════
-- PSC1 Priest Spells Level 5 (Batch 1: 20 Spells — A Day in the Life to Candle of Calm)
-- Metrisch, eng an Originaltexten orientiert
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.spells SET
  name = 'Ein Tag im Leben — Halbling',
  description = 'Verwandelt eine berührte lebende, intelligente Kreatur in einen normalen Halbling ohne Klassenfähigkeiten, sofern sie einen Rettungswurf gegen Zauber nicht besteht (Trefferwurf erforderlich). Die Kreatur behält Gesinnung, Erinnerung, geistige Fähigkeiten, Rettungswürfe und Trefferpunkte. Zaubersprüche können nicht gewirkt werden, bleiben aber im Gedächtnis. Am Ende der Zauberdauer nimmt die Kreatur ohne Systemschock-Wurf ihre normale Gestalt wieder an.',
  description_en = 'Transforms a touched living, sentient creature into a normal halfling with no class abilities if it fails a saving throw vs. spell (attack roll required). The creature retains alignment, memory, mental capacity, saving throws, and hit points. Spellcasting is impossible but spells remain memorized. At the spell''s expiration the creature resumes its normal form without requiring a system shock roll.'
WHERE LOWER(name_en) = LOWER('A Day in the Life — Halfling') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Aufschub',
  description = 'Kann in zwei Formen gewirkt werden. In der häufigsten Form friert dieser Zauber einen anderen Zauber ein, der zuvor in einen Fokusstein gewirkt wurde, und verzögert dessen Ausführung auf unbestimmte Zeit. Der eingefrorene Zauber wird durch Zerstörung des Fokussteins oder bestimmte andere Zauber freigesetzt (Magie bannen funktioniert nicht). In der zweiten Form kann der Zauber auf einen magischen Gegenstand gewirkt werden — bei dessen nächster Aktivierung wird der Effekt um 1 Runde verzögert.',
  description_en = 'Can be cast in two forms. In the most common form, this magic freezes another spell cast into a focal stone, delaying its execution indefinitely. The frozen spell is released by shattering the focal stone or by certain other spells (dispel magic does not work). In the second form, the spell can affect a magical item — the next time the item is activated, its effect is delayed by 1 round.'
WHERE LOWER(name_en) = LOWER('Abeyance') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Anpassung',
  description = 'Erlaubt dem Empfänger, Gase zu ignorieren die die Atmung beeinträchtigen, unter Wasser zu atmen oder sogar in luftleerem Raum zu existieren (ähnlich einer Halskette der Anpassung). Der Priester kann die Grunddauer auf mehrere Wesen aufteilen, mindestens eine halbe Stunde pro Wesen. Materialkomponente: Weihwasser.',
  description_en = 'Allows the recipient to ignore gases affecting respiration, breathe underwater, or exist in airless space for the duration (similar to a necklace of adaptation). The priest can divide the base duration among multiple beings, to a minimum of half an hour each. Material component: holy water.'
WHERE LOWER(name_en) = LOWER('Adaptation') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Tierblick — Schamane',
  description = 'Der Zauberwirker wählt ein Tier innerhalb von 9,1 m und kann durch dessen Augen sehen und dessen Ohren hören. Der Schamane kann das Tier in jede Richtung lenken, es aber nicht zum Angriff zwingen. Wirkt nur auf normale Tiere (einschließlich Riesenvarianten). Während der Dauer befindet sich der Körper des Schamanen in tiefer Trance und ist sich seiner Umgebung nicht bewusst — selbst Angriffe auf seinen Körper werden nicht bemerkt.',
  description_en = 'The caster selects one animal within 9.1 m and can see through its eyes and hear through its ears. The shaman can direct the animal in any direction but cannot make it attack. Works only on normal animals including giant varieties. For the duration, the shaman''s body sits in a deep trance, unaware of its surroundings — even attacks on the body go unnoticed.'
WHERE LOWER(name_en) = LOWER('Animal''s View — Shaman') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Tote Monster Beleben',
  description = 'Belebt ein humanoides Skelett oder einen Leichnam pro vier Erfahrungsstufen des Priesters. Betrifft die Überreste von zweibeinigen Monstern mit mehr als 3 Trefferwürfeln und mindestens 2,1 m Größe (z.B. Ettin, Oger, Troll, Riese). Skelette erhalten die Basis-Trefferwürfel des Monsters, Zombies einen zusätzlichen Trefferwürfel. Belebte Monster erhalten ihre normalen physischen Angriffe, aber keine Spezialfähigkeiten. Der Priester kann Befehle von bis zu 12 Wörtern erteilen.',
  description_en = 'Animates one humanoid skeleton or corpse per four experience levels of the caster. Affects remains of bipedal monsters of more than 3 Hit Dice and at least 2.1 m height (e.g. ettin, ogre, troll, giant). Skeletal forms have the base monster Hit Dice; zombie forms gain one additional Hit Die. Animated monsters receive their normal physical attacks but no special attributes. The priest can issue commands of up to 12 words.'
WHERE LOWER(name_en) = LOWER('Animate Dead Monsters') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Flamme Beleben',
  description = 'Der Priester kann eine Flamme von ihrer Brennstoffquelle lösen und nach seinem Willen bewegen. Die Flamme behält ihre Intensität und erlischt nicht, selbst ohne Brennbares. Natürliche Feuer werden automatisch belebt; magische Feuer erfordern einen Wurf von 11+ auf 1W20 (angepasst um die Stufendifferenz). Die belebte Flamme bewegt sich mit Rate 12, kann kein Wasser überqueren und greift mit ETW0 10 an. Schaden hängt von der Größe ab. Die Flamme entzündet brennbare Materialien.',
  description_en = 'The priest can command a flame to leave its fuel source and move at his direction. The flame retains its intensity and does not weaken even without fuel. Natural fires are automatically animated; magical fires require a roll of 11+ on 1d20 (adjusted by level difference). The animated flame moves at rate 12, cannot cross water, and attacks with THAC0 10. Damage depends on size. The flame ignites combustibles.'
WHERE LOWER(name_en) = LOWER('Animate Flame') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Baum Beleben',
  description = 'Erlaubt dem Druiden, einen Baum zu beleben, der dieselben Trefferwürfel und Eigenschaften wie ein Treant gleicher Größe erhält. Ein Baum, dessen resultierende Trefferwürfel die Druidenstufe des Zauberwirkers überschreiten, kann nicht belebt werden. Intelligente oder gesinnungstreue Bäume erhalten einen Rettungswurf gegen Zauber. Der belebte Baum folgt einfachen Befehlen und kehrt am Ende der Dauer an seinen Platz zurück, um sich wieder zu verwurzeln. Materialkomponente: Mistel.',
  description_en = 'Enables the druid to animate a tree, which gains the same Hit Dice and characteristics as a treant of the same size. A tree whose resulting Hit Dice would exceed the caster''s druidical level cannot be animated. Intelligent or aligned trees receive a saving throw vs. spell. The animated tree follows simple commands and returns to its original location to reroot itself when the spell ends. Material component: mistletoe.'
WHERE LOWER(name_en) = LOWER('Animate Tree') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Azuths Erhabene Triade',
  description = 'Betrifft einen bereits memorierten Zauber der Stufen 1-5. Der gewählte Zauber kann dreimal gewirkt werden ohne zusätzliches Memorieren oder Verlust anderer Zauberplätze. Der erste Einsatz ist normal; der zweite und dritte erfordern keine Material- oder Verbalkomponenten und haben Zauberzeit 2. Nur eine Triade kann gleichzeitig auf einen Zauberplatz wirken; maximal zwei Triaden dürfen gleichzeitig aktiv sein. Verstöße verursachen Schwachsinn.',
  description_en = 'Affects one memorized spell of levels 1-5. The chosen spell becomes castable three times without additional memorization or loss of spell slots. The first use is normal; the second and third require no material or verbal components and have casting time 2. Only one triad can affect a spell slot at a time; no more than two triads can be active simultaneously. Violations cause feeblemindedness.'
WHERE LOWER(name_en) = LOWER('Azuth''s Exalted Triad') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Yondallas Fluch — Halbling',
  description = 'Ähnlich einem Schlag durch einen Stab des Verdorrens. Eine Kreatur, die ihren Rettungswurf gegen Zauber nicht besteht, erleidet 1W4+1 Schaden und altert um 10% ihrer natürlichen Lebensspanne mit entsprechenden Anpassungen an Fähigkeiten. Ab Stufe 11 verdorrt und verkümmert eines der Gliedmaßen des Ziels (zufällig bestimmt). Alterslose Kreaturen (Untote, Tanar''ri, Baatezu) können nicht gealtert werden.',
  description_en = 'Similar to a strike by a staff of withering. A creature failing its saving throw vs. spell suffers 1d4+1 damage and ages by 10% of its natural lifespan with corresponding adjustments to abilities. At 11th level or higher, one of the creature''s limbs shrivels and becomes useless (determined randomly). Ageless creatures (undead, tanar''ri, baatezu) cannot be aged.'
WHERE LOWER(name_en) = LOWER('Bane of Yondalla — Halfling') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Barriere der Zurückhaltung',
  description = 'Erzeugt ein unsichtbares, einseitiges Kraftfeld um den Wirkungsbereich. Pro Stufe des Priesters entsteht ein 3 m × 3 m × 3 m großer Würfel, die zu beliebigen Rechteckformen angeordnet werden können. Eindringlinge betreten den Bereich ungehindert, können ihn aber nicht verlassen (Rettungswurf gegen Zauber). Zauber können durch die Barriere nach außen gewirkt werden, und Teleportation ermöglicht Flucht. Magie bannen hebt die Barriere auf.',
  description_en = 'Creates a one-way invisible force field around the area of effect. One 3 m × 3 m × 3 m cube per caster level, arrangeable into any rectangular shape. Intruders enter freely but cannot leave (saving throw vs. spell). Spells can be cast out through the barrier, and teleport allows escape. Dispel magic negates the barrier.'
WHERE LOWER(name_en) = LOWER('Barrier of Retention') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Kampfgezeiten',
  description = 'Verlangsamt alle Wesen außer dem Zauberwirker in einem kugelförmigen Radius von 6,1 m — betroffene Wesen bewegen sich und greifen mit halber Geschwindigkeit an. Die gestohlene Energie wird auf den Priester übertragen, der ohne Alterungseffekte beschleunigt wird (doppelte Bewegung, doppelte Angriffe). Rettungswurf gegen Zauber einmal pro Runde mit anfänglich −6 Abzug, der jede Runde um 1 abnimmt.',
  description_en = 'Slows all beings except the caster within a 6.1 m spherical radius — affected beings move and attack at half speed. The stolen energy is transferred to the caster, who is hasted without aging effects (double movement, double attacks). Saving throw vs. spell once per round starting at −6 penalty, decreasing by 1 each round.'
WHERE LOWER(name_en) = LOWER('Battletide') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Beshabas Dunkelfeuer',
  description = 'Verwandelt eine Gruppe von Kriegern in bärengestaltige Berserker. Sie behalten Hände und Augen und können Waffen führen, verlieren aber jede Todesangst und verfallen in Kampfraserei. Sie müssen jeden sichtbaren Feind angreifen und können keine Befehle befolgen. −4 auf INT/WIS/CHA-Prüfungen, +2 auf Rettungswürfe gegen Zauber. +4 auf Stärke, RK verbessert sich um 2. Immunität gegen Feuer, Bezauberung, Illusion und viele Schutzzauber. Nur auf freiwillige Kämpfer wirkbar.',
  description_en = 'Transforms a group of warriors into bear-shaped berserkers. They retain hands and eyes and can wield weapons but lose all fear of death and enter a killing rage. They must attack any visible enemy and cannot follow orders. −4 to INT/WIS/CHA checks, +2 to saving throws vs. spell. +4 to Strength, AC improves by 2. Immune to fire, enchantment, illusion, and many protection spells. Only castable on willing fighters.'
WHERE LOWER(name_en) = LOWER('Beshaba, Darkfire of') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Klingenbiegung — Drow',
  description = 'Lässt die Klinge einer ungezogenen Kantenwaffe in Reichweite sich verdrehen und ihren Träger angreifen. Empfindungsfähige, nicht-böse Waffen sind nicht betroffen. Die Waffe greift mit dem Basis-ETW0 des Priesters an, zuzüglich aller der Waffe innewohnenden Boni oder Abzüge. Nach Auflösung des Angriffs kehrt die Waffe in ihren Normalzustand zurück. Materialkomponente: Heiliges Symbol des Priesters.',
  description_en = 'Causes the blade of one unsheathed edged weapon within range to twist and strike its bearer. Sentient, non-evil weapons are unaffected. The weapon strikes with the caster''s base THAC0 plus any bonuses or penalties inherent to the weapon. Once the attack is resolved, the weapon reverts to its normal state. Material component: priest''s holy symbol.'
WHERE LOWER(name_en) = LOWER('Bladebend — Drow') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Blaenthers Schalen',
  description = 'Teleportiert kleine nichtlebende Gegenstände von einer Oberfläche zu einer anderen über eine dimensionale Verbindung. Beide Oberflächen müssen kleiner sein als der Körper des Zauberwirkers und dürfen nach dem Wirken nicht weiter als 30,5 m pro Stufe voneinander entfernt sein (beim Wirken max. 18,3 m). Jede Oberfläche kann ein Objekt pro Runde senden. Lebende oder tote Wesen werden nicht transportiert. Zu große Gegenstände werden nicht gesendet.',
  description_en = 'Teleports small nonliving items from one surface to another via a dimensional linkage. Both surfaces must be smaller than the caster''s body and separated by no more than 30.5 m per level after casting (max 18.3 m when first cast). Each surface can send one item per round. Living or dead beings are not transported. Items too large are not sent.'
WHERE LOWER(name_en) = LOWER('Blaenther''s Bowls') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Schmerzstrahl',
  description = 'Erzeugt einen rauchig-grauen Strahl, der ein einzelnes Ziel trifft. Rettungswurf gegen Zauber mit −5: Bei Erfolg wird das Ziel 1 Runde verlangsamt (halbe Bewegung, +3 auf Zauberzeiten, −2 auf Angriffe) und erleidet 1W4+1 Schaden. Bei Misserfolg: 1 Schadenspunkt pro Stufe des Priesters und 2 Runden hilfloser Schmerz. Weitere Rettungswürfe in Runde 3 (−4) und 4 (−3) bei jeweils erneutem Schaden. Kreaturen über 10 TW/Stufen erhalten +1 Bonus auf Rettungswürfe.',
  description_en = 'Creates a smoky gray beam that unerringly strikes a single target. Saving throw vs. spell at −5: on success, the target is slowed for 1 round (half movement, +3 to casting times, −2 to attacks) and suffers 1d4+1 damage. On failure: 1 damage per caster level and 2 rounds of helpless pain. Additional saves in round 3 (−4) and 4 (−3) with renewed damage on failure. Creatures above 10 HD/levels gain +1 bonus to saving throws.'
WHERE LOWER(name_en) = LOWER('Blast of Pain') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Blutrausch',
  description = 'Kann nur in der Runde nach dem Töten eines empfindungsfähigen Gegners im Nahkampf gewirkt werden. Der Priester berührt den Leichnam und stößt einen Siegesschrei aus, der im Wirkungsbereich einen Gebet-Effekt erzeugt. Feinde erleiden zusätzlich −1 auf Angriffs- und Schadenswürfe, Rettungswürfe und Moral (Rettungswurf gegen Zauber). Feinde, die um −6 oder mehr scheitern, erleiden einen Effekt wie Symbol der Hoffnungslosigkeit (Dauer: 3W4 Runden).',
  description_en = 'Can only be cast on the round following the slaying of a sentient opponent in melee combat. The priest touches the body and utters a cry of exultation, establishing a prayer effect in the area. Enemies additionally suffer −1 to attack/damage rolls, saving throws, and morale (saving throw vs. spell). Enemies failing by −6 or worse are subject to a symbol of hopelessness effect (duration: 3d4 turns).'
WHERE LOWER(name_en) = LOWER('Bloodgloat') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Dinosaurier Rufen',
  description = 'Ruft einen einzelnen riesigen oder eine kleine Gruppe kleinerer Dinosaurier herbei, die dem Priester zu Hilfe eilen. Die Kreaturen stehen nicht unter direkter Kontrolle, folgen aber den Anweisungen des Priesters gemäß dem Willen der höheren Macht. Der Priester kann den Typ nicht bestimmen — das entscheidet die Gottheit. Die Dinosaurier greifen den Beschwörer nicht an und ziehen sich nach Erledigung der unmittelbaren Aufgabe zurück. Vage oder abstrakte Aufträge funktionieren nicht.',
  description_en = 'Summons a single gargantuan or small group of smaller dinosaurs that come to the priest''s aid at top speed. The creatures are not under direct control but follow the caster''s instructions as the deity wills. The priest cannot specify the type — the deity decides. The dinosaurs do not attack the summoner and retreat after completing the immediate task. Vague or abstract orders do not work.'
WHERE LOWER(name_en) = LOWER('Call Dinosaurs') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Steinwächter Rufen — Gnom',
  description = 'Formt vorübergehend einen Steinwächter aus einem massiven Steinblock von mindestens 1.360,8 kg. Der Steinwächter besitzt alle Fähigkeiten und Einschränkungen dieses Kreaturentyps, ist nicht intelligent und folgt nur einfachen Befehlen. Der Priester kontrolliert den Wächter mit einem speziell gefertigten Quartzstab (10 Tage Herstellung, 1.000 GM). Vorzeitiges Zerbrechen des Stabs beendet den Zauber. Dauer: 1 Runde pro Stufe.',
  description_en = 'Temporarily forms a stone guardian from a solid stone block of at least 1,360.8 kg. The guardian has all abilities and restrictions of this creature type, is nonintelligent, and follows only simple commands. The priest controls the guardian with a specially crafted rod of pure quartz (10 days to shape, 1,000 gp). Premature shattering of the rod ends the spell. Duration: 1 turn per level.'
WHERE LOWER(name_en) = LOWER('Call Stone Guardian — Gnome') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Wasser Beruhigen',
  description = 'Unterbindet natürliche oder magische Störungen im Wasser innerhalb des Wirkungsbereichs. Wasserkreaturen mit weniger Trefferwürfeln als die Priesterstufe fliehen aus dem Bereich; wasserbasierte Kreaturen (Wassergeister, Elementare usw.) können sich nicht bilden. Kreaturen mit TW gleich oder über der Priesterstufe müssen jede Runde einen Rettungswurf gegen Zauber bestehen, um im Bereich zu agieren. Der Effekt bewegt sich mit dem Priester.',
  description_en = 'Inhibits natural or magical disturbances in water within the area of effect. Aquatic creatures with fewer Hit Dice than the caster''s level flee the area; water-based creatures (water weirds, elementals, etc.) cannot form. Creatures with HD equal to or exceeding the caster''s level must save vs. spell each round to operate in the area. The effect moves with the caster.'
WHERE LOWER(name_en) = LOWER('Calm Water') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Kerze der Ruhe',
  description = 'Erzeugt die Illusion einer schwebenden, brennenden Kerze, die echtes Flickerlicht ausstrahlt (ohne Flamme oder Hitze). Alle Wesen innerhalb von 21,3 m müssen in der Runde des Erscheinens einen Rettungswurf gegen Zauber bestehen, um Zauber zu wirken, anzugreifen oder sich zu verteidigen (Bewegung bleibt frei). Erfolgreiche Angriffe erleiden −7 auf Trefferwürfe. Der Abzug verringert sich in den Folgerunden um jeweils 1 und endet nach 7 Runden. Erzeugt zusätzlich einen Freude-Effekt und vertreibt Angst, Hass und Hoffnungslosigkeit.',
  description_en = 'Creates the illusion of a floating lit candle that gives off real flickering light (without flame or heat). All beings within 21.3 m must make a saving throw vs. spell in the round it appears to cast spells, attack, or defend themselves (movement remains free). Successful attacks suffer −7 to attack rolls. The penalty decreases by 1 each subsequent round and ends after 7 rounds. Also creates a happiness effect and banishes fear, hate, and hopelessness.'
WHERE LOWER(name_en) = LOWER('Candle of Calm') AND spell_type = 'priest';
