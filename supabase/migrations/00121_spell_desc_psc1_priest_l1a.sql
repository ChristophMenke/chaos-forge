-- ═══════════════════════════════════════════════════════════════════════════════
-- PSC1 Priest Spells Level 1 (Batch 1: 21 Spells — Animal Animosity to Deafening Clang)
-- Metrisch, eng an Originaltexten orientiert
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.spells SET
  name = 'Tierfeindseligkeit',
  description = 'Eine Variante des Göttlichen Fluchs der 7. Stufe, die auch die Nachkommen des Subjekts betrifft. Das betroffene Wesen verströmt eine Aura, die alle Tiere in der Umgebung aggressiv und feindlich macht. Tiere greifen das verfluchte Wesen an oder fliehen in Panik. Der Fluch ist erblich und betrifft alle Nachkommen. Nur Fluch Brechen oder Wunsch kann den Effekt aufheben.',
  description_en = 'A 7th-level variation of Divine Curse that also affects the subject''s descendants. The affected creature exudes an aura that makes all nearby animals aggressive and hostile. Animals attack the cursed creature or flee in panic. The curse is hereditary, affecting all descendants. Only Remove Curse or Wish can end the effect.'
WHERE LOWER(name_en) = LOWER('Animal Animosity') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Tierbegleiter',
  description = 'Nur im Freien wirksam. Beschwört ein normales Waldtier aus bis zu 1,6 km Entfernung. Die Kreatur dient als Begleiter, folgt dem Zauberkundigen und gehorcht einfachen Befehlen. Das Tier bleibt freiwillig und kann nicht zum Kämpfen gezwungen werden, verteidigt sich aber bei Angriffen. Die Bindung hält 1 Runde pro Stufe. Danach kehrt das Tier in seinen Lebensraum zurück.',
  description_en = 'Only effective outdoors. Summons one normal woodland creature from within 1.6 km. The creature serves as a companion, following the caster and obeying simple commands. The animal stays willingly and cannot be forced to fight, but defends itself if attacked. The bond lasts 1 turn per level. Afterward, the animal returns to its habitat.'
WHERE LOWER(name_en) = LOWER('Animal Companion') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Tierschutz',
  description = 'Ein durch diesen Zauber geschütztes Tier wird übersehen und kann nicht direkt angegriffen werden von Kreaturen, die einen Rettungswurf gegen Zauber nicht bestehen. Greift das geschützte Tier selbst an, endet der Zauber sofort. Der Schutz wirkt wie eine verbesserte Unsichtbarkeit, speziell für Tiere — das Tier ist sichtbar, wird aber von Feinden ignoriert.',
  description_en = 'An animal protected by this spell is overlooked and cannot be directly attacked by any creature that fails a saving throw vs. spell. If the protected animal itself attacks, the spell ends immediately. The protection functions like an improved invisibility specifically for animals — the animal is visible but ignored by enemies.'
WHERE LOWER(name_en) = LOWER('Animal Sanctuary') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Waffe Beleben',
  description = 'Belebt eine Waffe, die wie ein Tanzende-Klinge-Schwert für den Priester kämpft. Bei Priestern der 2. Stufe oder niedriger können nur einfache Waffen (Knüppel, Streitkolben, Kampfstab) belebt werden. Höherstufige Priester können jede Waffe beleben, die sie normalerweise führen dürfen. Die Waffe kämpft selbstständig mit dem ETW0 des Priesters und schwebt in der Luft. Benötigt keine Konzentration. Dauer abhängig von der Priesterstufe.',
  description_en = 'Animates one weapon to fight for the priest, much like a Sword of Dancing. If the priest is 2nd level or less, only simple weapons (club, mace, quarterstaff) can be animated. Higher-level priests can animate any weapon they are normally allowed to wield. The weapon fights independently with the priest''s THAC0, floating in the air. Requires no concentration. Duration depends on priest level.'
WHERE LOWER(name_en) = LOWER('Animate Weapon') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Ungeziefer-Barriere',
  description = 'Erschafft ein unsichtbares Kraftfeld, das nicht-magische Insekten, Nagetiere, Spinnen, Schlangen, Würmer und ähnliches Ungeziefer von weniger als 1 TW abwehrt. Die Barriere ist stationär und hat einen Radius von 3 m. Kreaturen mit mehr als 1 TW können die Barriere durchdringen, aber kleinere Kreaturen werden zuverlässig ferngehalten. Nützlich zum Schutz von Lagern und Schlafplätzen.',
  description_en = 'Creates an invisible force field that repels non-magical insects, rodents, spiders, snakes, worms, and similar vermin of less than 1 HD. The barrier is stationary with a 3 m radius. Creatures with more than 1 HD can penetrate the barrier, but smaller creatures are reliably kept at bay. Useful for protecting camps and sleeping areas.'
WHERE LOWER(name_en) = LOWER('Anti-Vermin Barrier') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Baumklettern — Gnom',
  description = 'Ermöglicht dem Empfänger, so leicht wie ein Eichhörnchen auf Bäumen zu klettern und sich an ihnen zu hängen. Das betroffene Wesen darf nicht größer als menschengroß sein. Die Klettergeschwindigkeit entspricht der normalen Bewegungsrate. Der Empfänger kann sich an Ästen schwingen, kopfüber hängen und sogar auf den dünnsten Zweigen sicher stehen. Dauer: 1 Runde pro Stufe.',
  description_en = 'Enables the recipient to climb about or hang from trees as easily as a squirrel. The affected creature can be no larger than man-sized. Climbing speed equals normal movement rate. The recipient can swing from branches, hang upside down, and even stand safely on the thinnest twigs. Duration: 1 turn per level.'
WHERE LOWER(name_en) = LOWER('Arboreal Scamper — Gnome') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Wert Schätzen — Altes Imperium',
  description = 'Ermöglicht dem Priester, den fairen Marktwert eines Gegenstands anhand der verwendeten Materialien durch bloßes Anfassen zu bestimmen. Der Zauber offenbart auch, ob der Gegenstand aus seltenen oder magischen Materialien besteht, gibt aber keine Informationen über magische Eigenschaften. Wirkzeit: 1 Runde.',
  description_en = 'Enables the caster to determine the fair market value of an object based on the materials used in its construction simply by handling it. The spell also reveals whether the item is made of rare or magical materials, but provides no information about magical properties. Casting time: 1 round.'
WHERE LOWER(name_en) = LOWER('Assess Value — Old Empire') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Astrale Schnelligkeit',
  description = 'Verbessert die Bewegungsfähigkeiten des Priesters in außerplanaren Umgebungen, indem er sich an seine neue Umgebung anpasst. Der Priester bewegt sich doppelt so schnell wie normal auf anderen Ebenen. Dieser Zauber wird selten von Priestern der 1. Stufe gewirkt, da diese normalerweise nicht auf anderen Ebenen reisen.',
  description_en = 'Enhances the caster''s movement capabilities in extraplanar settings by attuning him to new surroundings. The priest moves at double normal speed on other planes. This spell is seldom cast by 1st-level priests, as they rarely travel to other planes.'
WHERE LOWER(name_en) = LOWER('Astral Celerity') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Kunstfertigkeit Verbessern — Elf',
  description = 'Verbindet Magie mit dem Schaffensprozess und verbessert die Kunstfertigkeit jedes Werks, das der Empfänger erschafft. Pro drei Stufen des Priesters erhält das erschaffene Werk einen kumulativen Bonus auf Qualität und Wert. Das Werk strahlt schwach Magie aus. Besonders unter Elfen beliebt für die Herstellung von Schmuck, Waffen und Kunstgegenständen.',
  description_en = 'Combines magic with the act of creation to enhance the artistry of any work created by the recipient. For every three levels of the priest, the created work receives a cumulative bonus to quality and value. The work radiates faint magic. Especially popular among elves for crafting jewelry, weapons, and art objects.'
WHERE LOWER(name_en) = LOWER('Augment Artistry — Elf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Flammen Verbannen',
  description = 'Löscht augenblicklich alle nicht-magischen Flammen im Wirkungsbereich. Brennende Gegenstände werden nicht zerstört, sondern hören einfach auf zu brennen. Magische Flammen sind nicht betroffen. Kein Rettungswurf. Nützlich zur Brandbekämpfung und zum Schutz vor Feuerfallen.',
  description_en = 'Instantly snuffs all flames of a non-magical nature within the area of effect. Burning items are not destroyed but simply cease burning. Magical flames are not affected. No saving throw. Useful for firefighting and protection against fire traps.'
WHERE LOWER(name_en) = LOWER('Banish Flame') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Kampfschicksal',
  description = 'Verändert die Wahrscheinlichkeit zugunsten eines kämpfenden Wesens. Der Gegner kann zur falschen Zeit stolpern, eine ungeschickte Parade kann den feindlichen Schlag abfangen, oder eine Pfeilspitze könnte den Schild genau richtig treffen. Der Empfänger erhält +1 auf Angriffs- und Schadenswürfe oder der Gegner erleidet −1 — vom Priester bei der Wirkung gewählt. Dauer: 1 Runde pro Stufe.',
  description_en = 'Alters probability to favor one creature locked in battle. The opponent may stumble at an awkward time, a clumsy parry might catch the enemy''s blow, or an arrowhead might strike a shield just right. The recipient gains +1 to attack and damage rolls, or the opponent suffers −1 — chosen by the priest when casting. Duration: 1 round per level.'
WHERE LOWER(name_en) = LOWER('Battlefate') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Tiertätowierung — Elf',
  description = 'Verzaubert eine Tätowierung, die ein Tier oder Monster darstellt, und verleiht dem Priester einen Attributsbonus in einem Attribut, das mit der dargestellten Kreatur verwandt ist. Z.B. erhöht eine Bärentätowierung die Stärke, eine Falkentätowierung die Geschicklichkeit. Der Bonus beträgt +1 pro 3 Stufen des Priesters. Dauer: 1 Runde pro Stufe.',
  description_en = 'Enchants a tattoo depicting an animal or monster to imbue the caster with an ability score increase in an attribute related to that creature. E.g. a bear tattoo increases Strength, a hawk tattoo increases Dexterity. The bonus is +1 per 3 priest levels. Duration: 1 turn per level.'
WHERE LOWER(name_en) = LOWER('Beast Tattoo — Elf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Herbeilocken — Altes Imperium',
  description = 'Betrifft eine Kreatur mit halb-intelligenter oder geringerer Intelligenz (INT 4 oder weniger). Die Kreatur muss entweder für Tierfreundschaft anfällig sein oder der Priester muss ihr Lieblingsnahrung oder einen anderen Anreiz anbieten. Bei Misserfolg des Rettungswurfs nähert sich die Kreatur dem Priester und verhält sich freundlich für die Dauer des Zaubers.',
  description_en = 'Affects one creature of semi-intelligence or lower (Intelligence 4 or less). The creature must either be vulnerable to Animal Friendship or the priest must offer its favorite food or other incentive. On a failed saving throw, the creature approaches the priest and behaves friendly for the spell''s duration.'
WHERE LOWER(name_en) = LOWER('Beckon — Old Empire') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Wohltätigkeit',
  description = 'Umgibt den Shukenja mit einer Aura mystischer Harmonie und Weisheit. Alle, die ihn sehen, erkennen ihn als tugendhaften heiligen Mann. Die Aura verhindert feindliche Handlungen gegen den Shukenja, solange er selbst nicht angreift. Kreaturen müssen einen Rettungswurf gegen Zauber bestehen, um den Priester anzugreifen. Dauer: 1 Runde pro Stufe.',
  description_en = 'Surrounds the shukenja in an aura of mystical harmony and wisdom. All who see him recognize him as a virtuous holy man. The aura prevents hostile actions against the shukenja as long as he does not attack. Creatures must save vs. spell to attack the priest. Duration: 1 turn per level.'
WHERE LOWER(name_en) = LOWER('Beneficence') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Berechnen',
  description = 'Ermöglicht dem Priester, die Erfolgswahrscheinlichkeit einer bestimmten Aktion genau abzuschätzen — z.B. eine gefährliche Klippe klettern, einen Fluss durchschwimmen oder einen Kampf gegen ein bestimmtes Monster gewinnen. Der Priester erhält eine prozentuale Schätzung. Die Genauigkeit hängt davon ab, wie vollständig die dem Priester bekannten Informationen sind.',
  description_en = 'Enables the priest to accurately estimate the chance of success of one specific action — such as climbing a dangerous cliff, swimming across a river, or winning a fight against a specific monster. The priest receives a percentage estimate. Accuracy depends on how complete the priest''s available information is.'
WHERE LOWER(name_en) = LOWER('Calculate') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Tier oder Vogel Rufen',
  description = 'Schwächere Form der Tierbeschwörung. Der Druide muss vor dem Wirken entscheiden, ob er Tiere oder Vögel ruft (verschiedene verbale und materielle Komponenten). Es erscheinen 1W4 Tiere/Vögel der Region, die dem Druiden für 1 Runde pro Stufe dienen. Die Kreaturen sind normal und nicht magisch verstärkt. Sie gehorchen einfachen Befehlen.',
  description_en = 'A weaker form of Animal Summoning. The druid must decide before casting whether to call animals or birds (different verbal and material components). 1d4 animals/birds of the region appear and serve the druid for 1 turn per level. The creatures are normal and not magically enhanced. They obey simple commands.'
WHERE LOWER(name_en) = LOWER('Call Animal or Bird') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Klauen von Thard Harr — Zwerg',
  description = 'Verwandelt die Hände eines willigen Zwergs in reißende Klauen, bekannt als die Klauen von Thard Harr. Jede Klaue verursacht 1W4+2 Schadenspunkte pro Treffer. Der Zwerg kann pro Runde zwei Klauenangriffe ausführen. Die Klauen gelten als magische Waffen. Der Zwerg kann keine Gegenstände halten oder manipulieren, während die Klauen aktiv sind.',
  description_en = 'Transforms the hands of a willing dwarf into rending talons known as the Claws of Thard Harr. Each talon inflicts 1d4+2 damage per hit. The dwarf can make two claw attacks per round. The claws count as magical weapons. The dwarf cannot hold or manipulate objects while the claws are active.'
WHERE LOWER(name_en) = LOWER('Claws of Thard Harr — Dwarf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Klauen von Velsharoon',
  description = 'Ermöglicht dem Priester, eine Kriechende Klaue pro Erfahrungsstufe zu beleben. Die Klauen können durch telepathische Befehle des Priesters gesteuert werden. Sie kriechen eigenständig umher, können Gegenstände tragen, Türen öffnen und im Kampf angreifen. Die Klauen gelten als untote Kreaturen und können vertrieben werden.',
  description_en = 'Enables the caster to animate one crawling claw per level of experience. The claws can be directed by the priest''s telepathic commands. They crawl about independently, can carry objects, open doors, and attack in combat. The claws count as undead creatures and can be turned.'
WHERE LOWER(name_en) = LOWER('Claws of Velsharoon') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Fluch der Zungen',
  description = 'Dieser geringfügige Zauber macht die Sprache des Ziels völlig unverständlich, indem die Luftwellen, die die Stimme projizieren, verzerrt und zerstreut werden. Das Opfer kann keine verbalen Zauberkomponenten sprechen und sich nicht verständlich machen. Rettungswurf gegen Zauber negiert. Dauer: 1 Runde pro Stufe.',
  description_en = 'This minor spell makes the target''s speech completely unintelligible by distorting and dispersing the airwaves that project the voice. The victim cannot speak verbal spell components and cannot communicate verbally. Saving throw vs. spell negates. Duration: 1 round per level.'
WHERE LOWER(name_en) = LOWER('Curse of Tongues') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Dunkler Pfad',
  description = 'Ermöglicht willigen Empfängern, sich in vollständiger Dunkelheit ohne Behinderung oder Risiko zu bewegen. Der Nachthimmel gilt normalerweise nicht als vollständige Dunkelheit, wohl aber ein fensterloses Verlies. Die Empfänger bewegen sich mit voller Geschwindigkeit und können Hindernisse „spüren", bevor sie dagegen laufen. Dauer: 1 Runde pro Stufe.',
  description_en = 'Enables willing recipients to move in complete darkness without hindrance or risk. The night sky is not usually considered complete darkness, but a windowless dungeon is. Recipients move at full speed and can "sense" obstacles before colliding with them. Duration: 1 turn per level.'
WHERE LOWER(name_en) = LOWER('Dark Path') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Ohrenbetäubendes Klirren — Gnom',
  description = 'Nur wirksam auf einen Metallgegenstand. Der verzauberte Gegenstand ertönt mit einem ohrenbetäubenden Klirren, wenn er geschlagen oder fallen gelassen wird. Alle Kreaturen innerhalb von 9,1 m müssen einen Rettungswurf gegen Zauber bestehen oder sind für 1W4 Runden betäubt (−2 auf Angriff, +2 auf RK, keine Zauber möglich). Materialkomponente: Ein Metallgegenstand.',
  description_en = 'Only effective when cast upon a metal item. The enchanted object rings with a deafening clang if struck or dropped. All creatures within 9.1 m must save vs. spell or be stunned for 1d4 rounds (−2 to attack, +2 to AC, no spellcasting possible). Material component: A metal item.'
WHERE LOWER(name_en) = LOWER('Deafening Clang — Gnome') AND spell_type = 'priest';
