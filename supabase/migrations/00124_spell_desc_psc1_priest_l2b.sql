-- ═══════════════════════════════════════════════════════════════════════════════
-- PSC1 Priest Spells Level 2 (Batch 2: 19 Spells — Bone Bite to Darkfire of Beshaba)
-- Metrisch, eng an Originaltexten orientiert
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.spells SET
  name = 'Knochenbiss',
  description = 'Verwandelt einen Knochen oder ein Knochenfragment in ein rasiermesserscharfes Kieferpaar, das jedes lebende Wesen außer dem Zauberer beißt. Die Kiefer können geworfen oder als Kontaktfalle platziert werden. Beim Treffer verursachen sie 1W6+4 Schadenspunkte und verwandeln sich in der nächsten Runde in ein zweites Kieferpaar, das automatisch 1W4+2 Schaden verursacht. Untote sind immun. Der Priester kann maximal vier mal seine Stufe unverbrauchte Knochenbiss-Zauber gleichzeitig aktiv haben.',
  description_en = 'Transforms a bone or bone fragment into razor-sharp jaws that bite any living being except the caster. The jaws can be thrown or placed as a contact trap. On a hit, they deal 1d6+4 damage and transform into a second set of jaws next round that automatically deals 1d4+2 damage. Undead are immune. The priest can have no more than four times his level undischarged bone bite spells active simultaneously.'
WHERE LOWER(name_en) = LOWER('Bone Bite') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Knocheneisen',
  description = 'Eine schwächere Version des Magierspruchs Waffe Verzaubern der 4. Stufe. Verwandelt Knochenwaffen hinsichtlich Angriffs- und Schadensfähigkeiten in ihre Metallgegenstücke. Jeder Abzug für Materialstärke wird entfernt, und die Waffe bricht nicht leichter als eine eiserne. Mehrfaches Wirken auf dieselbe Waffe hat keinen zusätzlichen Effekt. Bei Geschossen endet der Zauber beim Treffer. Kann auch bei der Erschaffung permanenter magischer Knochenwaffen verwendet werden.',
  description_en = 'A lesser version of the 4th-level wizard spell Enchanted Weapon. Transforms bone weapons into their metal counterparts regarding attack and damage capabilities. Any penalty for material strength is removed, and the weapon has no more chance of breaking than iron. Multiple castings on the same weapon have no additional effect. On missiles, the spell ends upon hitting a target. Can also be used in creating permanent magical bone weapons.'
WHERE LOWER(name_en) = LOWER('Boneiron') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Knochenholz',
  description = 'Härtet grobe Holzwaffen auf die Stärke eines Knochengegenstücks. Die Waffen sind zudem feuerfest für die Zauberdauer. Ein großes, ein mittleres oder zwei kleine Waffenstücke können pro Wirken betroffen werden. Geschosse kehren beim Treffer zum Normalzustand zurück. Wiederholtes Wirken auf dieselbe Waffe bringt keinen zusätzlichen Nutzen. Normale Holzwaffen wie Knüppel und Kampfstäbe profitieren nur von der Feuerfestigkeit.',
  description_en = 'Toughens crude wooden weapons to the equivalent of bone counterparts. The weapons are also fireproof for the spell''s duration. One large, one medium, or two small weapons can be affected per casting. Missiles revert to normal upon hitting a target. Repeated castings on the same weapon provide no additional benefit. Normal wooden weapons like clubs and staves only benefit from the fireproofing.'
WHERE LOWER(name_en) = LOWER('Bonewood') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Lichtmantel — Zwerg',
  description = 'Umhüllt den Kopf des Empfängers mit einem Nimbus aus schwachem, flackerndem blauem Licht. Der Empfänger erhält +2 auf Intelligenzwürfe und klares, ungetrübtes Denken. Alkohol, Drogen und Gifte werden nicht entfernt, aber ihre geistigen Nebenwirkungen werden vorübergehend unterdrückt. Schützt gegen Bezauberung/Charme-Zauber wie Chaos, Befehl, Verwirrung, Freunde, Vergessen, Furcht usw. Dauer: 1 Stunde pro Stufe bei Zwergen, sonst 1 Runde pro Stufe.',
  description_en = 'Envelops the recipient''s head in a nimbus of faint, flickering blue light. The recipient gains +2 to Intelligence checks and clear, unimpaired thinking. Alcohol, drugs, and poisons are not removed, but their mind-muddling side effects temporarily abate. Protects against enchantment/charm spells like chaos, command, confusion, friends, forget, fear, etc. Duration: 1 hour per level for dwarves, otherwise 1 turn per level.'
WHERE LOWER(name_en) = LOWER('Brightmantle — Dwarf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Graben — Gnom',
  description = 'Die Fingernägel des Priesters verlängern sich und werden steinhart. Für die Zauberdauer kann der Priester durch Erde, Sand, Lehm und Kies graben (nicht durch festen Fels) mit einer Grabrate von 3, ähnlich einem Dachs. Zusätzlich kann der Priester die Klauen als Waffen nutzen — zwei Klauenangriffe für je 1W4+1 Schadenspunkte plus Stärkemodifikator. Der Zauber endet vorzeitig durch Magie Bannen, Tod des Priesters oder auf stummen Befehl.',
  description_en = 'The priest''s fingernails lengthen and become hard as stone. For the duration, the priest can burrow through earth, sand, clay, and gravel (not solid rock) at a burrowing rate of 3, like a badger. Additionally, the priest can use the claws as weapons — two claw attacks for 1d4+1 damage each plus Strength adjustment. The spell ends early via dispel magic, the priest''s death, or by silent command.'
WHERE LOWER(name_en) = LOWER('Burrow — Gnome') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Chaos Beruhigen',
  description = 'Beruhigt vorübergehend eine chaotische Situation mit einer Gruppe von Menschen. Verändert nicht die Emotionen der Betroffenen — Wut oder Freude bleiben bestehen, werden aber zurückgehalten. Jede betroffene Kreatur erhält einen Rettungswurf gegen Zauber mit -4 Abzug. Nach einem erfolgreichen Charismawurf des Priesters werden die Betroffenen dazu gebracht, zuzuhören. Die Aufmerksamkeit wird gehalten, solange eine Ablenkung (Rede, Vorführung, Zauber) andauert. Endet, wenn die Ablenkung für eine Runde unterbrochen wird oder ein dringenderes Ereignis eintritt.',
  description_en = 'Temporarily calms a chaotic situation involving a group of people. Does not change emotions — anger or joy persist but are restrained. Each affected creature gets a saving throw vs. spell at -4 penalty. After a successful Charisma check by the priest, those affected are compelled to listen. Attention is held as long as a distraction (speech, performance, spell) continues. Ends if the distraction ceases for one round or a more immediate event occurs.'
WHERE LOWER(name_en) = LOWER('Calm Chaos') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Tarnung — Elf',
  description = 'Wirkt nur in der Wildnis. Verbirgt eine Person pro Erfahrungsstufe sofort und vollständig, selbst gegen gründliche Durchsuchungen. Der Zauber ändert Färbung und Schattierung der Betroffenen, um sich der Umgebung anzupassen. Wirksam gegen Infrarot- und Ultrasicht. Verborgene Personen behalten alle Fähigkeiten und können sich langsam (3 m pro Runde) bewegen. Bei einem Angriff erhält der Getarnte einen Überraschungsbonus und +4 auf den Angriffswurf, aber der Zauber endet sofort. Dauer: 1 Runde pro Stufe.',
  description_en = 'Works only in wilderness settings. Instantly and completely hides one person per experience level, concealing them against even thorough searches. The spell changes coloring and shadowing to blend with natural surroundings. Effective against infravision and ultravision. Hidden individuals retain all abilities and can move slowly (3 m per round). On attacking, the concealed individual gains surprise bonus and +4 to hit, but the spell breaks immediately. Duration: 1 turn per level.'
WHERE LOWER(name_en) = LOWER('Camouflage — Elf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Austreibung',
  description = 'Ermöglicht dem Schamanen, einen Geist zu vertreiben, der gewaltsam eine Person oder ein Objekt besetzt. Wirkt nicht gegen Geister in ihrem rechtmäßigen Zuhause (Bäume, Fetische) oder willige Wirte. Drei Methoden stehen zur Verfügung: rituelles Tieropfer, Überredung (erfordert Charismawurf) oder Schlagen des Besessenen (1W3 Schaden). Der Geist erhält einen Rettungswurf gegen Zauber — bei Erfolg wird er vertrieben, kann aber zum Opfer zurückkehren.',
  description_en = 'Allows the shaman to dismiss a spirit that is forcibly possessing a person or object. Does not work against spirits in their proper homes (trees, fetishes) or willing hosts. Three methods are available: ritual animal sacrifice, persuasion (requires Charisma check), or beating the host (1d3 damage). The spirit gets a saving throw vs. spell — on success it is cast out but can return to the victim.'
WHERE LOWER(name_en) = LOWER('Casting Out') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Chaosschild',
  description = 'Erschafft eine schimmernde Aura wirbelnden Lichts um eine Kreatur. Gewährt +1 RK im Nahkampf. Gegen Fernkampfangriffe und gezielte Zauber +2 RK und +2 auf Rettungswürfe. Zusätzlich können Fernkampfangriffe und gezielte Zauber abgelenkt oder reflektiert werden: 86-90 % automatisch besiegt, 91-95 % trifft zufällige Kreatur innerhalb 9,1 m, 96-99 % wird zum Angreifer zurückreflektiert. Die Stufe des Zauberers wird zum Prozentwurf addiert.',
  description_en = 'Creates a shimmering aura of whirling light around a creature. Grants +1 AC in melee. Against missile attacks and directed spells, +2 AC and +2 to saving throws. Additionally, missiles and directed spells may be deflected or reflected: 86-90% automatically defeated, 91-95% hits a random creature within 9.1 m, 96-99% reflected back at originator. The caster''s level is added to the percentile roll.'
WHERE LOWER(name_en) = LOWER('Chaos Ward') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Brandobaris'' Charme — Halbling',
  description = 'Nützlich wenn der Zauberer gefangen genommen wurde. Überzeugt 1-4 Kreaturen davon, dass der Zauberer zu wertvoll ist, um sofort getötet (oder gefressen) zu werden. Erzeugt Zweifel bei den Entführern — sie denken, der Zauberer sollte gegen Lösegeld getauscht oder höhere Autoritäten konsultiert werden. Bei 3 Zielen normaler Rettungswurf, bei 2 Zielen -1 Abzug, bei 1 Ziel -2. Beeinflusst nicht die Kommunikation und macht Wachen nicht weniger wachsam. Dauer: 1 Tag pro Stufe.',
  description_en = 'Useful when the caster has been captured. Convinces 1-4 creatures that the caster is too valuable to execute (or eat) immediately. Creates doubts in captors'' minds — they think the caster should be ransomed or higher authorities consulted. At 3 targets normal saving throw, at 2 targets -1 penalty, at 1 target -2. Does not affect communication or make guards less watchful. Duration: 1 day per level.'
WHERE LOWER(name_en) = LOWER('Charm of Brandobaris — Halfling') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Frostsense',
  description = 'Erschafft eine übergroße, aber gewichtlose Sense, die von jeder lebenden Kreatur als Werkzeug oder Waffe geführt werden kann. Die Sense ist eine verzauberte +2 Waffe (2,1 m lang, beidhändig), die 2W4+2 Stich-/Hiebschaden verursacht (1W8+2 gegen große Kreaturen) plus 1W4 Kälteschaden (kein Rettungswurf). Der Kälteschaden entzieht Lebenskraft, nicht Temperatur. Geschwindigkeitsfaktor 5, keine Nichtgeübtheit-Abzüge. Gegen Untote: 4W6 Schaden und schleudert sie 6,1 m zurück.',
  description_en = 'Creates an oversized but weightless scythe that can be wielded by any living creature as tool or weapon. The scythe is a +2 enchanted weapon (2.1 m long, two-handed), dealing 2d4+2 piercing/slashing damage (1d8+2 vs. large creatures) plus 1d4 chilling damage (no save). The chilling drains life force, not temperature. Speed factor 5, no nonproficiency penalty. Against undead: 4d6 damage and hurls them 6.1 m away.'
WHERE LOWER(name_en) = LOWER('Chilling Scythe') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Schutzkreis gegen Geister',
  description = 'Der Schamane zeichnet einen Kreis auf den Boden. Solange er den Kreis nicht verlässt, sind alle Sterblichen innerhalb immun gegen Besetzungsversuche durch Geister und erhalten -2 auf die Rüstungsklasse gegen Geisterangriffe. Der Kreis hat keinen negativen Einfluss auf die eigenen Zauber des Schamanen, wirkt aber auch gegen verbündete Geister. Sobald der Schamane den Kreis verlässt, endet die Wirkung.',
  description_en = 'The shaman draws a circle on the ground. As long as he does not leave the circle, all mortals within are immune to possession attempts by spirits and receive a -2 AC bonus against spirit attacks. The circle does not affect the shaman''s own spells but does affect allied spirits. As soon as the caster leaves the circle, it ceases to function.'
WHERE LOWER(name_en) = LOWER('Circle of Protection from Spirits') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Kommunion mit Niederem Geist',
  description = 'Ermöglicht dem Shukenja, einen lokalen niederen Geist zu kontaktieren — den Geist eines bestimmten Baumes, Felsens oder Baches. Der Shukenja muss die Identität des Geistes kennen und sich innerhalb von 3 m seines Bereichs befinden. Pro Erfahrungsstufe darf eine spezifische Frage gestellt werden. Gute Geister antworten hilfreich, neutrale in Rätseln, böse versuchen die Antwort zu verdrehen. Der Geist kann nur Fragen zu seinem unmittelbaren Bereich beantworten.',
  description_en = 'Allows the shukenja to contact a local lesser spirit — the spirit of a specific tree, rock, or stream. The shukenja must know the spirit''s identity and be within 3 m of its area. One question per experience level may be asked. Good spirits answer helpfully, neutral ones in riddles, evil ones try to distort the answer. The spirit can only answer questions concerning its immediate area.'
WHERE LOWER(name_en) = LOWER('Commune With Lesser Spirit') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Geist Einfangen — Schamane',
  description = 'Fängt einen einzelnen Geist in einer Flasche, einem Kürbis oder einem anderen Behälter ein. Der Geist muss sich innerhalb von 9,1 m befinden und seine TW dürfen die Stufe des Zauberers nicht übersteigen. Bei misslingendem Rettungswurf gegen Lähmung wird der Geist gefangen. Der Zauber ist theoretisch permanent — solange der Behälter versiegelt bleibt. Geister mit TW gleich der Zaubererstufe dürfen wöchentlich einen Rettungswurf zum Ausbrechen versuchen. Wertvolle Behälter (10 GM = -1, 100 GM = -2 usw.) erschweren das Entkommen.',
  description_en = 'Traps a single spirit in a bottle, gourd, or other container. The spirit must be within 9.1 m and its HD cannot exceed the caster''s level. On a failed saving throw vs. paralyzation, the spirit is trapped. The spell is theoretically permanent — as long as the container remains sealed. Spirits with HD equal to the caster''s level may attempt a weekly saving throw to escape. Valuable containers (10 gp = -1, 100 gp = -2, etc.) make escape harder.'
WHERE LOWER(name_en) = LOWER('Contain Spirit — Shaman') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Krokodilstränen — Altes Imperium',
  description = 'Lässt den Priester schwach, krank, verletzt und emotional verzweifelt erscheinen. Verbirgt bedrohliche Merkmale (Fänge, Klauen) und lässt Waffen und Rüstung harmlos aussehen (z. B. ein Schwert als Wanderstab). Kreaturen mit Intelligenz 5+ müssen einen Rettungswurf gegen Zauber bestehen oder eilen zum Priester, um Hilfe anzubieten, und lassen dabei Waffen fallen. Greift der Priester an, sind die Helfer automatisch überrascht (+4 Angriffsbonus). Dauer: 1 Stunde pro Stufe.',
  description_en = 'Makes the priest appear weak, sick, injured, and emotionally distressed. Disguises menacing features (fangs, claws) and makes weapons and armor appear harmless (e.g., a sword looks like a walking staff). Creatures with Intelligence 5+ must save vs. spell or rush to offer aid, dropping weapons. If the priest attacks, would-be benefactors are automatically surprised (+4 attack bonus). Duration: 1 hour per level.'
WHERE LOWER(name_en) = LOWER('Crocodile Tears — Old Empire') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Kristallisieren',
  description = 'Verwandelt 0,03 Kubikmeter Wasser pro Stufe des Priesters in Eis oder bildet eine 2,5 cm dicke Eisschicht über einem bestehenden Gewässer. Auf einer Eisfläche Gehende müssen einen Rettungswurf gegen Lähmung bestehen oder ausrutschen, hinfallen und den Rest der Runde mit Aufstehen verbringen. Viele Wesen auf Athas haben noch nie Eis gesehen und betrachten es möglicherweise als Schatz.',
  description_en = 'Transforms 1 cubic foot of water per caster level into ice, or forms a 2.5 cm thick layer of ice over an existing pool. Anyone walking on the ice must make a successful saving throw vs. paralyzation or fall and spend the rest of the round trying to stand. Many creatures on Athas have never seen ice and may consider it a treasure.'
WHERE LOWER(name_en) = LOWER('Crystallize') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Wahnsinn Heilen — Elf',
  description = 'Heilt die meisten geistigen Erkrankungen durch Handauflegen auf die Stirn des Betroffenen. Die Genesung dauert je nach Art und Fortschritt der Erkrankung zwischen einer Runde und 10 Tagen. Wirksam auch gegen Nachwirkungen psionischer Fähigkeiten, die den Geist schädigen, sowie gegen Schwachsinn (Feeblemind). Verhindert keinen Rückfall, wenn der Empfänger erneut dem Wahnsinn verfällt, und exorziert keine besitzenden Geister.',
  description_en = 'Cures most diseases affecting the mind by placing a hand on the afflicted creature''s brow. Recovery takes from one turn to 10 days depending on the type and advancement of the affliction. Also effective against aftereffects of psionic abilities that damage the mind and against feeblemind. Does not prevent reoccurrence if the recipient again succumbs to madness, nor does it exorcise possessing spirits.'
WHERE LOWER(name_en) = LOWER('Cure Madness — Elf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Dunkelfeuer',
  description = 'Erschafft ein kleines, lichtloses Lagerfeuer auf einem Bronzebecken. Das Feuer erzeugt Hitze und verbrennt, strahlt aber kein Licht im sichtbaren Spektrum aus und erzeugt keinen Rauch. Objekte, die vom Dunkelfeuer entzündet werden, brennen jedoch normal mit Rauch und Licht. Der Wirkungsbereich entspricht der Größe des Beckens, maximal 30 cm Durchmesser pro Stufe des Zauberers.',
  description_en = 'Creates a small, lightless campfire when cast on a bronze brazier. The fire produces heat and burns but emits no light in the visible spectrum and creates no smoke. Objects set ablaze by the dark fire burn normally, emitting both smoke and light. The area of effect equals the brazier''s size, maximum 30 cm diameter per caster level.'
WHERE LOWER(name_en) = LOWER('Dark Fire') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Beshabas Dunkelfeuer',
  description = 'Der Priester kann einen Strahl schwarzer Flammen aus Hand oder Augen aussenden. Die Flamme ist ölig, kühl und schadet nur Lebewesen. Bei Berührung (Hand): 1W4 Schadenspunkte plus 1 pro Stufe (max. 1W4+10). Bei Augenstrahl (Reichweite 4,6 m): halber Schaden. Untote werden durch das Dunkelfeuer geheilt statt verletzt und erhalten Trefferpunkte in Höhe des normalen Schadens zurück. Kann auch abgetrennte Untoten-Körperteile wieder zusammenfügen — ein Bruch pro Stufe.',
  description_en = 'The priest can emit a jet of black flame from hand or eyes. The flame is oily, cool, and harms only living things. On touch (hand): 1d4 damage plus 1 per level (max 1d4+10). On eye beam (range 4.6 m): half damage. Undead are restored by darkfire, regaining hit points equal to the damage it would inflict on living things. Can also rejoin severed undead body parts — one break per caster level.'
WHERE LOWER(name_en) = LOWER('Darkfire of Beshaba') AND spell_type = 'priest';
