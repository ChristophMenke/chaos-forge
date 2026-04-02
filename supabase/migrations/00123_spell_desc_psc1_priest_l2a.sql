-- ═══════════════════════════════════════════════════════════════════════════════
-- PSC1 Priest Spells Level 2 (Batch 1: 19 Spells — Acorn Barrage to Body Blades)
-- Metrisch, eng an Originaltexten orientiert
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.spells SET
  name = 'Eichelgeschosse — Elf',
  description = 'Lässt einen Hagel aus Eicheln aus der Hand des Priesters, vom Boden oder von einer Eiche innerhalb von 9,1 m abfeuern. Der Priester kann eine Eichel pro Stufe verschießen, die bis zu 36,6 m weit fliegen. Jede Eichel erfordert einen erfolgreichen Angriffswurf (wie mit einer Schleuder geschossen) und verursacht bei einem Treffer 1W2 Schadenspunkte. Entfernungsmodifikatoren gelten (10/20/40). Unterwasser unwirksam.',
  description_en = 'Causes a barrage of acorns to launch from the priest''s hand, the ground, or an oak tree within 9.1 m. The priest can fire one acorn per level, flying up to 36.6 m. Each acorn requires a successful attack roll (as if hurled with a sling) and inflicts 1d2 points of damage on a hit. Range modifiers apply (10/20/40). Ineffective underwater.'
WHERE LOWER(name_en) = LOWER('Acorn Barrage — Elf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Verbündete Alarmieren — Zwerg, Gnom',
  description = 'Sendet einen sofortigen mentalen Alarm an Gefährten des Priesters. Es kann nur die Nachricht „Alarm" übermittelt werden, keine Zwei-Wege-Kommunikation. Der Priester muss jeden Empfänger durch Stirnberührung für eine Runde verbinden — ein Verbündeter pro Stufe, maximal zehn. Die mentale Verbindung hält bis zur Alarmauslösung oder maximal 8 Stunden. Reichweite: 27,4 m um den Priester.',
  description_en = 'Sends an instantaneous mental alert to the priest''s comrades warning of danger. Only the message "Alert" can be transmitted, no two-way communication. The priest must physically touch foreheads with each recipient for one round — one ally per level, maximum ten. The mental link lasts until the alert is broadcast or 8 hours. Range: 27.4 m around the priest.'
WHERE LOWER(name_en) = LOWER('Alert Allies — Dwarf, Gnome') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Alicorn-Lanze',
  description = 'Erschafft eine silbrig schimmernde, teilweise ätherische Lanze in Form eines Einhorn-Horns, die über der Stirn des Zauberwirkers schwebt. Hält maximal 1 Runde pro Stufe. Per Willensakt kann der Priester die Lanze auf ein Ziel innerhalb von 36,6 m abfeuern — sie trifft automatisch und verursacht 3W6 Stichschaden (halb bei erfolgreichem Rettungswurf gegen Zauber). Die Lanze gilt als +1 Waffe (unter 7. Stufe) oder +2 (ab 7. Stufe). Das Ziel wird anschließend 1W4 Runden von Feenfeuern umhüllt.',
  description_en = 'Creates a silver-hued, partially ethereal lance shaped like a unicorn horn that hovers above the caster''s brow. Lasts up to 1 round per level. By silent will, the priest can fire it at a target within 36.6 m — it never misses and deals 3d6 piercing damage (half on a successful saving throw vs. spell). The lance counts as a +1 weapon (below 7th level) or +2 (7th level or higher). The target is outlined in faerie fire for 1d4 rounds afterward.'
WHERE LOWER(name_en) = LOWER('Alicorn Lance') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Selbstlosigkeit',
  description = 'Der Priester kann beliebig viele eigene Trefferpunkte auf ein williges, lebendes Wesen übertragen, dessen Gesinnung nicht direkt der seinen entgegengesetzt ist. Jeder übertragene Trefferpunkt heilt einen verlorenen Trefferpunkt beim Empfänger. Die Übertragung ist unwiderruflich. Der Empfänger kann nicht über sein normales Maximum geheilt werden. Die verlorenen Trefferpunkte des Priesters können durch normale oder magische Heilung wiederhergestellt werden.',
  description_en = 'The priest can transfer as many of his own hit points as desired to heal a willing, living creature whose alignment is not directly opposed to his own. Each hit point transferred restores one lost hit point of the recipient. The transfer is irreversible. The recipient cannot exceed its normal maximum. The priest''s lost hit points can be restored by normal or magical healing.'
WHERE LOWER(name_en) = LOWER('Altruism r') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Amulett',
  description = 'Erlaubt einem Barbarenpriester, ein Schutzzeichen gegen ein bestimmtes gefürchtetes Wesen zu erschaffen. Der Träger erhält +1 auf alle Rettungswürfe und Rüstungsklasse gegen dieses Wesen. Nähert sich das Wesen auf 3 m, muss es einen Rettungswurf gegen Zauber bestehen oder wird von Furcht ergriffen. Benötigt einen Gegenstand im Wert von mindestens 5 GM und ein Relikt des Feindes. Bei besonders wertvollen Komponenten (über 160,9 km entfernt) verdoppelt sich der Effekt auf +2.',
  description_en = 'Allows a barbarian cleric to create a protective token against one specific feared being. The wearer gains +1 to all saving throws and Armor Class against that creature. If the creature approaches within 3 m, it must save vs. spell or be affected by fear. Requires an object worth at least 5 gp and a relic of the foe. If components are exceptionally valuable (obtained from beyond 160.9 km), effects double to +2.'
WHERE LOWER(name_en) = LOWER('Amulet') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Ahnensegen — Oriental',
  description = 'Ruft den Geist eines Vorfahren herbei, sofern der Zauberwirker mindestens 3. Stufe und Oberhaupt seines Haushalts ist und täglich einen Ahnenaltar pflegt. Der Geist kann entweder eine Frage beantworten (75 % Genauigkeit), einem Wesen +1 auf Rettungswürfe für 1 Tag pro Stufe gewähren, oder das Heim als unfehlbare Alarmanlage gegen nichtmagisches Eindringen für einen Monat bewachen.',
  description_en = 'Calls upon an ancestral spirit, provided the caster is at least 3rd level, head of household, and maintains a daily ancestor altar. The spirit can either answer one question (75% accuracy), grant one individual +1 to saving throws for 1 day per level, or guard the home as an infallible alarm against nonmagical intrusion for one month.'
WHERE LOWER(name_en) = LOWER('Ancestral Blessing — Oriental') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Tieraugen',
  description = 'Der Priester zeigt auf ein einzelnes Tier innerhalb von 91,4 m und schließt die Augen. Er sieht dann in seinem Geist alles, was das Tier sieht. Das Tier wird nicht beeinflusst und ist sich des Zaubers nicht bewusst. Der Zauber endet, wenn der Priester sich bewegt, seine Augen öffnet, das Tier stirbt oder sich weiter als 91,4 m entfernt. Wirkt nur auf natürliche Tiere, nicht auf übernatürliche, humanoide oder außerplanare Wesen.',
  description_en = 'The priest points at a single animal within 91.4 m and closes his eyes. He then sees in his mind''s eye whatever the animal sees. The animal is unaffected and unaware of the spell. The spell ends if the priest moves, opens his eyes, the animal dies, or moves beyond 91.4 m. Only works on natural animals, not supernatural, humanoid, or extraplanar creatures.'
WHERE LOWER(name_en) = LOWER('Animal Eyes') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Tierspion',
  description = 'Nur normale Tiere (einschließlich Riesenversionen) können als Tierspion dienen. Der Priester teilt die Sinne des Tieres — sieht durch seine Augen, hört mit seinen Ohren usw. Das Tier ist sich des Zaubers nicht bewusst und wird nicht kontrolliert. Der Priester fällt in eine Trance und kann sich nicht bewegen oder seine eigenen Sinne nutzen. Er kann den Zauber zu Beginn jeder Runde beenden. Der Zauber endet auch, wenn das Tier sich weiter als 91,4 m pro Zauberstufe entfernt.',
  description_en = 'Only normal animals (including giant versions) can serve as an animal spy. The caster shares the animal''s senses — sees through its eyes, hears with its ears, etc. The animal is unaware and not controlled. The caster enters a trance, unable to move or use human senses. The caster can end the spell at the start of any round. The spell also ends if the animal moves beyond 91.4 m per caster level.'
WHERE LOWER(name_en) = LOWER('Animal Spy') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Tierspion — Schamane',
  description = 'Der Schamane hält eine nichtmagische Kreatur (maximal Katzengröße), blickt ihr eine Runde lang in die Augen und erteilt ihr dann Befehle für die Zauberdauer. Das Tier erhält vorübergehend 1W3 Intelligenzpunkte und versteht die Worte des Zauberers, der wiederum die Kommunikation des Tieres versteht. Das Tier behält seine Persönlichkeit und kann nicht gegen seine Natur handeln. Es kann keine einzelnen Menschen erkennen, außer anhand auffälliger Merkmale.',
  description_en = 'The shaman holds a nonmagical creature (no larger than a cat), stares into its eyes for one round, then commands it for the spell''s duration. The creature temporarily gains 1d3 Intelligence points and understands the caster''s words, while the caster understands the creature''s communication. The animal retains its personality and cannot act against its nature. It cannot recognize individual humans except by blatant features.'
WHERE LOWER(name_en) = LOWER('Animal Spy — Shaman') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Armhämmer — Altes Imperium',
  description = 'Verwandelt die Unterarme und Hände des Priesters in nichtmagische Adamantit-Hämmer. Der Priester kann festes Gestein mit einer Rate von 3 m pro Runde durchschlagen und Strukturschaden verursachen. Im Kampf kann er zweimal pro Runde angreifen (je ein Hammer) mit -3 auf den Angriffswurf für 1W8 Schaden (2W10 bei natürlicher 20). Pro Runde muss der Priester einen Konstitutionswurf bestehen, sonst endet der Zauber. Dauer: 1 Runde pro Stufe. Zauber mit somatischen Komponenten sind während der Wirkungsdauer unmöglich.',
  description_en = 'Transforms the priest''s forearms and hands into nonmagical adamantine hammers. The priest can tunnel through solid rock at 3 m per turn and inflict structural damage. In combat, two attacks per round (one per hammer) at -3 to hit for 1d8 damage (2d10 on natural 20). Each turn requires a Constitution check or the spell ends. Duration: 1 turn per level. Spells with somatic components are impossible while active.'
WHERE LOWER(name_en) = LOWER('Arm Hammers — Old Empire') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Psionik Verstärken — Duergar',
  description = 'Der Empfänger erhält 3W8 zusätzliche PSPs für die Dauer des Zaubers. Die Bonus-PSPs ermöglichen es dem Empfänger, tatsächlich mehr PSPs als sein normales Maximum zu besitzen. Die Bonus-PSPs werden zuerst verbraucht, wenn der Empfänger psionische Aktivitäten ausübt. Der Zauber wirkt nur auf Wesen mit psionischen Fähigkeiten.',
  description_en = 'The recipient receives 3d8 additional PSPs for the duration of the spell. The bonus PSPs allow the recipient to actually exceed their normal maximum PSP total. Bonus PSPs are used first when the recipient engages in psionic activity. The spell has no effect on individuals without psionic ability.'
WHERE LOWER(name_en) = LOWER('Augment Psionics — Duergar') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Beshabas Fluch',
  description = 'Belegt eine einzelne lebende Kreatur mit einem Fluch, der nicht durch Magie Bannen aufgehoben werden kann. Der Priester muss das Ziel mit bloßer Hand berühren (Angriffswurf im Kampf nötig). Der Fluch verursacht kumulative Abzüge auf Rettungswürfe: -4 auf den ersten, -3 auf den zweiten, -2 auf den dritten, -1 auf den vierten. Danach ist die Magie erschöpft. Hält bis zum Tod des Ziels oder bis erschöpft. Hebt sich mit Tymoras Gunst gegenseitig auf.',
  description_en = 'Curses a single living creature with a bane that cannot be ended by dispel magic. The priest must touch the target with a bare hand (attack roll required in combat). The curse imposes cumulative saving throw penalties: -4 on the first, -3 on the second, -2 on the third, -1 on the fourth. After four penalized saves, the magic is exhausted. Lasts until the target''s death or exhaustion. Cancels out Favor of Tymora.'
WHERE LOWER(name_en) = LOWER('Bane of Beshaba') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Fäulnis Bannen',
  description = 'Durch Berühren und Anhauchen einer Pflanze beseitigt dieser Zauber dauerhaft bestehende Pflanzenkrankheiten und stellt Blätter für 1 Tag pro Stufe in einen unversehrten Zustand wieder her. Kann tote Pflanzen nicht wiederbeleben, aber bringt Überlebensreste in Bestform — welke Blüten blühen auf, hängende Blätter werden grün. Bei beweglichen/intelligenten Pflanzen (wie Treants) heilt der Zauber 1W10+4 Schadenspunkte.',
  description_en = 'By touching and breathing on a plant, this spell permanently removes existing plant diseases and restores leaves to pristine condition for 1 day per level. Cannot revive dead plants but brings surviving remains to peak condition — wilted flowers bloom anew, drooping leaves turn green. For mobile/intelligent plant life (such as treants), the spell restores 1d10+4 hit points.'
WHERE LOWER(name_en) = LOWER('Banish Blight') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Fledermaussinn',
  description = 'Verleiht dem berührten Wesen die Echoortung einer Fledermaus. Das Wesen kann in alle Richtungen bis zu 18,3 m „sehen" und die physische Form und Position aller festen und flüssigen Objekte wahrnehmen. Die Augen müssen geschlossen sein, was aber keine Abzüge auf Bewegung oder Kampf verursacht. Das Wesen kann nicht überrascht werden und erkennt unsichtbare, versetzte oder getarnte Objekte. Stille (4,6 m Radius) hebt den Effekt auf. Unwirksam gegen Illusionen, Gase und körperlose Geister.',
  description_en = 'Grants the touched creature the echolocation abilities of a bat. The creature can "see" in all directions up to 18.3 m, sensing the shape and position of all solid and liquid objects. Eyes must be closed, but this causes no penalties to movement or combat. The creature cannot be surprised and detects invisible, displaced, or camouflaged items. Silence 15'' radius nullifies the effect. Ineffective against illusions, gases, and insubstantial spirits.'
WHERE LOWER(name_en) = LOWER('Bat Sense') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Bestienklaue',
  description = 'Verwandelt die Arme des Priesters vorübergehend in äußerst widerstandsfähige, pelzige Gliedmaßen mit reißenden Klauen. Ermöglicht zwei Klauenangriffe pro Runde mit +2 Bonus für je 1W4+2 Schadenspunkte. Mit einer Waffe wird Stärke 18/76 angewendet. Der Priester kann den Zauber jederzeit beenden — dabei werden alle Schäden an den Gliedmaßen geheilt, einschließlich Verstümmelungen und magischer Verwelkung. Die Klauen sind immun gegen formverändernde Magie.',
  description_en = 'Temporarily transforms the caster''s arms into extremely durable furry limbs with raking talons. Allows two claw attacks per round at +2 bonus for 1d4+2 damage each. With a weapon, Strength 18/76 applies. The caster can end the spell at any time — doing so heals all damage to the limbs, including mutilations and magical withering. The claws are immune to shape-changing magic.'
WHERE LOWER(name_en) = LOWER('Beast Claw') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Segen Vhaeruns — Drow',
  description = 'Verleiht dem Empfänger einmalig +15 % auf eine einzelne Diebesfähigkeit oder +3 auf einen einzelnen Waffenangriff. Jeder durch diese Aktion verursachte Schaden ist bei einem 1W8-Wurf von 1-6 automatisch das Maximum. Der Angriffsbonus macht die Attacke nicht magisch. Der Zauber hält bis zu 1 Runde oder bis die Fähigkeit/der Angriff eingesetzt wird. Der Empfänger muss die Nutzung vor dem Wurf ansagen.',
  description_en = 'Grants the recipient a one-time +15% bonus to a single thief skill or +3 to a single weapon attack. Any damage caused by this action is automatically maximum on a 1d8 roll of 1-6. The attack bonus does not make the attack magical. The spell lasts up to 1 turn or until the skill/attack is used. The recipient must declare use before making the roll.'
WHERE LOWER(name_en) = LOWER('Blessing of Vhaeraun — Drow') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Glückseligkeit',
  description = 'Versetzt ein einzelnes Wesen, das seinen Rettungswurf gegen Zauber nicht besteht, in eine Trance intensiver Freude und Glückseligkeit für 4 Runden. Das Wesen bemerkt die Umgebung nicht mehr, wandert ziellos umher und lässt alle Gegenstände fallen. Betroffene können keine bewussten Handlungen ausführen, nicht angreifen und sich nicht verteidigen. Der Rettungswurf wird durch den Stufenunterschied zwischen Zauberer und Ziel modifiziert. Immunisiert für 1 Tag plus 1 Stunde pro Konstitutionspunkt gegen weitere Glückseligkeit.',
  description_en = 'Puts a single creature that fails its saving throw vs. spell into a trance of intense pleasure and happiness for 4 rounds. The creature fails to notice its surroundings, wanders aimlessly, and drops all held items. Affected creatures cannot perform deliberate tasks, attack, or defend. The saving throw is modified by the level difference between caster and target. Grants immunity to further bliss spells for 1 day plus 1 hour per Constitution point.'
WHERE LOWER(name_en) = LOWER('Bliss') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Blutrausch',
  description = 'Verleiht dem Empfänger Moral 20, Immunität gegen alle Formen von Furcht, Freiheit von negativen Auswirkungen von Schmerz und Übelkeit sowie einen geschärften Geruchssinn. Der Empfänger kann wie ein Waldläufer Fährten lesen (ohne stufenabhängige Modifikatoren). Der Zauber wirkt sofort und beseitigt alle bereits bestehenden Zustände, die von der Magie betroffen werden. Erlaubt die Identifikation selbst schwacher Gerüche auf erhöhte Entfernung.',
  description_en = 'Grants the recipient morale 20, immunity to all forms of fear, freedom from adverse effects of pain and nausea, and a heightened sense of smell. The recipient can track like a ranger (without level-related modifiers). The spell is instant, banishing any preexisting conditions that the magic normally affects. Allows identification of even faint smells at increased range.'
WHERE LOWER(name_en) = LOWER('Blood Lust') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Körperklingen',
  description = 'Lässt zahlreiche dolchartige Klingen aus allen Oberflächen des Körpers des Priesters sprießen. Sie wachsen durch Rüstung und Kleidung, ohne Sinne oder Geschicklichkeit zu beeinträchtigen. Verbessert die Rüstungsklasse um 2 Punkte. Bei einem Sturmangriff verursachen sie 1W4+2 Schaden, bei Umklammerung verdoppelt. Konstriktionsangriffe (z. B. sich schließende Wände) werden von den Klingen aufgehalten. Die Klingen sind nichtmetallisch und immun gegen Hitze-Metall und magnetische Effekte.',
  description_en = 'Causes many dagger-like blades to sprout from all surfaces of the caster''s body. They grow through armor and clothing without affecting senses or Dexterity. Improves Armor Class by 2 points. On a charge, they deal 1d4+2 damage; doubled on a grapple or overbear. Constricting attacks (e.g., closing walls) are halted by the blades. The blades are nonmetallic and immune to heat metal and magnetic effects.'
WHERE LOWER(name_en) = LOWER('Body Blades') AND spell_type = 'priest';
