-- ═══════════════════════════════════════════════════════════════════════════════
-- PSC1 Priest Spells Level 5 (Batch 2: 20 Spells — Chain Creation to Deny Death)
-- Metrisch, eng an Originaltexten orientiert
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.spells SET
  name = 'Kettenschöpfung',
  description = 'Wirkt nur auf Ergebnisse priesterlicher Zauber der Schöpfungssphäre oder eines Magier-Zaubers Geringere Schöpfung. Innerhalb einer Runde nach deren Wirkung erzeugt dieser Zauber drei identische Kopien des geschaffenen Gegenstands. Die Kopien bestehen genauso lange wie das Original. Permanente Gegenstände sind unabhängig permanent und werden nicht durch Zerstörung des Originals vernichtet. Materialkomponente: Drei Rubine im Gesamtwert von mindestens 100 GM, die beim Wirken zermalmt werden.',
  description_en = 'Works only on output of priestly spells in the sphere of creation or a wizard''s minor creation spell. Cast within 1 turn, it creates three identical copies of whatever the other magic created. Copies last as long as the original. Permanent items are independently permanent and not destroyed by destruction of the original. Material component: three rubies worth at least 100 gp total, crushed during casting.'
WHERE LOWER(name_en) = LOWER('Chain Creation') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Kraft des Champions',
  description = 'Verleiht einer Person die Angriffs- und Schadensboni des Rests der Gruppe. Der Priester bestimmt den Champion und die Beitragenden (eine Person pro zwei Priesterstufen, alle innerhalb 9,1 m). Alle nicht-magischen ETW0- und Schadensboni der Beitragenden werden dem Champion hinzugefügt — einschließlich Abzüge von Beitragenden ohne Boni. Beitragende müssen sich konzentrieren und den Champion im Blickfeld behalten. Verlässt ein Beitragender den 9,1-m-Radius oder kämpft, geht sein Beitrag verloren.',
  description_en = 'Bestows upon one person the attack and damage bonuses from the rest of the group. The priest designates the champion and contributors (one person per two caster levels, all within 9.1 m). All nonmagical THAC0 and damage bonuses from contributors are added to the champion — including penalties from those without bonuses. Contributors must concentrate and maintain line of sight. If a contributor moves beyond 9.1 m or fights, their contribution is lost.'
WHERE LOWER(name_en) = LOWER('Champion''s Strength') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Chaotische Befehle',
  description = 'Macht eine Kreatur immun gegen magische Befehle. Verspotten, Vergessen, Suggestion, Beherrschung, Geas, Forderung, Beistand, Befehl, Fesseln, Quest, Eintreiben und andere Zauber, die einen direkten verbalen Befehl an ein Individuum erteilen, scheitern automatisch. Zusätzlich muss jeder, der einen solchen Zauber auf die geschützte Kreatur wirkt, einen Rettungswurf gegen Zauber bestehen — bei Misserfolg muss der Zauberwirker seinem eigenen Zauber gehorchen.',
  description_en = 'Renders a creature immune to magical commands. Taunt, forget, suggestion, domination, geas, demand, succor, command, enthrall, quest, exaction, and other spells that issue a direct verbal command to a single individual automatically fail. Additionally, anyone casting such a spell on the protected creature must make a saving throw vs. spell — failure means the caster must obey his own magic.'
WHERE LOWER(name_en) = LOWER('Chaotic Commands') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Geist Bezaubern',
  description = 'Erlaubt dem Priester, einen bestimmten Geist innerhalb der Reichweite zu bezaubern. Der Priester muss den Geist sehen oder seinen Aufenthaltsort kennen können. Der Geist kann in einem Objekt gebunden, ein Wesen oder Objekt besitzen oder frei sein. Natürlich gebundene Geister (z.B. Naturgeister) können nicht betroffen werden. Bei misslingendem Rettungswurf gegen Zauber gehorcht der Geist als treuer Diener, greift sogar Verbündete an — kann aber nicht gegen seine eigene Gesinnung handeln. Materialkomponente: Kristallkugel (mind. 50 GM).',
  description_en = 'Allows the caster to charm any specified spirit within range. The caster must see or otherwise know the spirit''s location. The spirit may be bound in an object, possessing a being or object, or free. Naturally bound spirits (e.g. nature spirits) cannot be affected. On a failed saving throw vs. spell, the spirit obeys as a faithful servant, even attacking its own allies — but cannot be forced to act against its alignment. Material component: crystal ball (at least 50 gp).'
WHERE LOWER(name_en) = LOWER('Charm Spirit') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Steinkreis* — Zwerg',
  description = 'Kann an jedem Ort gewirkt werden, an dem Steinbrocken größer als der Priester ihn auf mindestens drei Seiten umgeben. Erzeugt ein unsichtbares magisches Feld mit 3 m Radius pro beteiligtem Zauberwirker. Gewährt +4 auf Rettungswürfe aller Wesen im Kreis und eine 5-von-6-Chance, dass Zauber oder magische Effekte von außerhalb reflektiert werden. Zwerge im Steinkreis erhalten zusätzlich +3 auf Trefferwürfe und können alle Gegner treffen, auch solche, die normalerweise magische Waffen erfordern.',
  description_en = 'Can be cast in any location where stone pieces larger than the caster surround him on at least three sides. Creates an invisible magical field with 3 m radius per caster involved. Grants +4 to saving throws of all beings in the circle and a 5-in-6 chance that spells or magical effects from outside are reflected. Dwarves within gain +3 to attack rolls and can hit all opponents, even those normally struck only by magical weapons.'
WHERE LOWER(name_en) = LOWER('Circle of Stone* —Dwarf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Gemeinschaft Reinigen',
  description = 'Funktioniert wie der Stufe-3-Zauber Herdstelle Reinigen, vertreibt aber besitzende Geister aus einer ganzen Gemeinschaft für ein Jahr. Der Schamane und Gehilfen toben durch das Dorf und schlagen rituell auf Gebäude, Möbel, Tiere und Personen ein. Betrifft jede Siedlung, die von den Bewohnern als einzelne Gemeinschaft betrachtet wird. Kein Geist ist immun (außer gebundene), aber ungeschlagene Geister bleiben unberührt. Geister mit erfolgreichem Rettungswurf können nach 1W10 Monaten zurückkehren.',
  description_en = 'Works like the 3rd-level spell cleanse hearth but drives possessing spirits from an entire community for one year. The shaman and assistants rampage through the village, ritually striking buildings, furniture, animals, and people. Affects any group of dwellings considered a single community by inhabitants. No spirit is immune (unless bound), but unstrucked spirits remain unaffected. Spirits making a successful save can return after 1d10 months.'
WHERE LOWER(name_en) = LOWER('Cleanse Community') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Wolkenlandschaft',
  description = 'Verfestigt eine einzelne Wolke oder einen Teil einer Wolkenbank: 28,3 m³ pro Stufe werden fest genug, um jedes Gewicht zu tragen. Die verfestigte Wolke fühlt sich wie dicker Teppich an und bleibt in der Luft. Kreaturen, die auf die Wolke fallen, erleiden Fallschaden. Fliegende Kreaturen, die hineingeraten, werden für 1 Runde betäubt (Geschicklichkeitsprüfung zur Erholung). Kreaturen, die sich beim Verfestigen in der Wolke befinden, erhalten einen Rettungswurf gegen Versteinerung — bei Misserfolg werden sie eingeschlossen (können aber atmen).',
  description_en = 'Solidifies a single cloud or part of a cloud bank: 28.3 m³ per level become solid enough to support any weight. The solidified cloud feels like thick carpet and remains airborne. Creatures falling onto it sustain falling damage. Flying creatures hitting it are stunned for 1 round (Dexterity check to recover). Creatures inside when it solidifies get a saving throw vs. petrification — failure means they are trapped (but can breathe).'
WHERE LOWER(name_en) = LOWER('Cloudscape') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Schweigegebot',
  description = 'Verhindert bei einem Individuum jegliche Kommunikation über ein vom Priester verbotenes Thema — Sprache, Schrift, Handzeichen, Malerei und Symbole werden blockiert. Versuche, das Geheimnis zu verraten, ergeben völlig zusammenhanglose Aussagen. Die Dauer hängt von der Spezifität des Geheimnisses ab: allgemein (1 Tag/Stufe), ungewöhnlich (1 Woche/Stufe), spezifisch (1 Monat/Stufe), exakt (1 Jahr/Stufe). Rettungswurf gegen Zauber (WIS-Modifikator). Materialkomponente: Ein Stück Tierzunge.',
  description_en = 'Prevents an individual from any communication about a topic forbidden by the caster — speech, writing, hand signals, painting, and symbology are blocked. Attempts to reveal the secret produce completely unrelated statements. Duration depends on specificity: general (1 day/level), uncommon (1 week/level), specific (1 month/level), exacting (1 year/level). Saving throw vs. spell (WIS modifier applies). Material component: a piece of animal tongue.'
WHERE LOWER(name_en) = LOWER('Code of Secrecy') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Kalte Hand',
  description = 'Wirkt durch den gesamten Körper des Priesters, nicht nur die Hand. Der Priester bleibt vom Zauber unberührt und kann andere Aktivitäten ausführen, bis das erste Wesen berührt wird (Trefferwurf erforderlich). Die Berührung verursacht 1 Schadenspunkt plus 1 pro Priesterstufe (Maximum 21). Kein Rettungswurf erlaubt, aber natürliche oder magische Kälteresistenz kann den Schaden um bis zu die Hälfte reduzieren.',
  description_en = 'Works through the caster''s entire body, not just a hand. The priest is unaffected and can undertake other activities until the first being is touched (attack roll required). The touch causes 1 point of damage plus 1 per caster level (maximum 21). No saving throw allowed, but natural or magical cold resistance can reduce damage by up to half.'
WHERE LOWER(name_en) = LOWER('Cold Hand') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Wald Befehligen — Treant',
  description = 'Auf einen Treant-Edlen gewirkt, erlaubt dieser Zauber dem Edlen, Befehle durch den Wald zu senden — über denselben Prozess, durch den er normalerweise Informationen empfängt. Aufgrund des begrenzten Bewusstseins der Bäume und der Kommunikationsverzögerung ist die Steuerung umständlich. Einfache Bewegungsbefehle erfordern mindestens eine Stunde pro 1,6 km Entfernung zum Waldrand. Befehligte Bäume haben die Fähigkeiten von Treant-belebten Bäumen, können praktisch aber nur zu Bewegung befehligt werden.',
  description_en = 'Cast on a treant noble, this spell allows the noble to send commands through the forest via the same process it normally receives information. Due to limited tree awareness and communication delays, commanding is unwieldy. Simple movement commands require at least one hour per 1.6 km to the farthest forest edge. Commanded trees theoretically have all abilities of treant-animated trees but practically can only be commanded to move.'
WHERE LOWER(name_en) = LOWER('Command Forest — Treant') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Erdverbindung — Zwerg',
  description = 'Ermöglicht einem Zwergenpriester, eins mit der umgebenden Erde zu werden. Der Priester erfährt eine Tatsache pro Erfahrungsstufe über die Umgebung — über Boden, Mineralien, Gewässer, Bewohner, Tiere, grabende Kreaturen, Pilze usw. Mächtige unnatürliche Kreaturen und der allgemeine Zustand der Erde können erkannt werden. Nur in felsigen Hügeln, Bergen oder unterirdischen Höhlen wirksam. Radius: 0,8 km pro Stufe, Tiefe: 0,4 km pro Stufe.',
  description_en = 'Enables a dwarven priest to become one with the surrounding earth. The priest learns one fact per experience level about the surroundings — about ground, minerals, bodies of water, people, animals, burrowing creatures, fungi, etc. Powerful unnatural creatures and the general state of the earth can be detected. Only effective in rocky hills, mountains, or underground caverns. Radius: 0.8 km per level, depth: 0.4 km per level.'
WHERE LOWER(name_en) = LOWER('Commune With Earth — Dwarf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Kontakt mit Höherem Geist',
  description = 'Ähnlich dem Zauber Kontakt mit Geringerem Geist, aber jede Art von Geist kann kontaktiert werden, einschließlich der Gottheit des Shukenja. Die Fragen sind auf Ja/Nein-Antworten beschränkt (obwohl „vielleicht" und „ich weiß nicht" ebenfalls mögliche Antworten sind). Materialkomponente: Ein angemessenes Opfer passender Art und Wert für den kontaktierten Geist.',
  description_en = 'Similar to commune with lesser spirit but any type of spirit can be contacted, including the shukenja''s deity. Questions are limited to yes/no answers (though "maybe" and "I don''t know" are also acceptable replies). Material component: an offering of appropriate type and value to the spirit contacted.'
WHERE LOWER(name_en) = LOWER('Commune With Greater Spirit') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Lebenskraft Verbergen — Vedisch',
  description = 'Verbirgt die Lebenskraft (Shakti) eines Wesens vor Entdeckung und verhindert, dass Zauber wie Karma-Sicht und Reinkarnations-Sicht auf die Kreatur wirken. Innerhalb einer Stunde nach dem Tod eines Wesens gewirkt, verbirgt der Zauber das Selbst (Atman) vor den göttlichen Agenten der Reinkarnation. Dies ermöglicht eine Auferstehung durch Tote Erwecken oder Auferstehung. Die Nutzung zur Verhinderung der Reinkarnation ist ein Verstoß gegen die kosmische Ordnung und kann göttlichen Zorn auslösen.',
  description_en = 'Hides a being''s lifeforce (shakti) from detection, preventing spells like karma sight and reincarnation sight from working on the creature. Cast within an hour of death, the spell hides the subject''s self (atman) from divine agents of reincarnation. This allows raising via raise dead or resurrection. Using this spell to prevent reincarnation violates the cosmic order and may trigger divine wrath.'
WHERE LOWER(name_en) = LOWER('Conceal Lifeforce — Vedic') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Konsequenz',
  description = 'Erlaubt dem Priester zu bestimmen, wie ein kürzliches Ereignis in das große Ganze passt. Der Priester erfährt, ob die zugrunde liegende Situation abgeschlossen oder andauernd ist, ob das Ereignis bedeutsam oder unbedeutend war, und ob es weiterhin Auswirkungen auf die Beteiligten haben wird. Die Botschaft ist normalerweise klar, kann aber bei hochkomplexen Umständen kryptisch sein. Eine zweite Anwendung innerhalb von 24 Stunden liefert dieselbe Botschaft wie die erste. Materialkomponente: Drei Platinmünzen (mind. 1.000 GM).',
  description_en = 'Allows the priest to determine how one recent event fits into the grand scheme. The priest learns whether the underlying situation is complete or ongoing, whether the event was significant or insignificant, and whether it will continue to have repercussions. The message is normally straightforward but may be cryptic in highly complex circumstances. A second casting within 24 hours gives the same message as the first. Material component: three platinum coins (at least 1,000 gp).'
WHERE LOWER(name_en) = LOWER('Consequence') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Dampf Kontrollieren',
  description = 'Verändert Bewegungsrate und Richtung natürlicher oder magischer Rauch- und Dampfwolken, einschließlich Brandwolken, Nebelwolken, Todeswolken und gasförmiger Atemwaffen. Windeffekte werden im Wirkungsbereich aufgehoben. Der Priester kann einen Dampf festhalten oder mit 3 m pro Stufe und Runde in jede Richtung bewegen. Gasförmige Kreaturen (z.B. Vampire) erhalten keinen Rettungswurf. Die Formänderung gasförmiger Kreaturen dauert doppelt so lange. Materialkomponente: Heiliges Symbol und eine Bohne oder Erbse.',
  description_en = 'Alters movement rate and direction of natural or magical smokes and vapors, including incendiary clouds, fog clouds, cloudkill, and gaseous breath weapons. Wind effects are negated within the area. The priest can hold a vapor stationary or move it 3 m per level each round in any direction. Gaseous creatures (e.g. vampires) receive no saving throw. Form changes of gaseous creatures take twice as long. Material component: holy symbol and a bean or pea.'
WHERE LOWER(name_en) = LOWER('Control Vapor') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Zwiegespräch — Schamane',
  description = 'Erlaubt dem Schamanen ein kurzes Gespräch mit der natürlichen Welt. Statt einer einzelnen Frage an alles in Reichweite wählt der Schamane ein einzelnes Ziel (Baum, Vogel, Bach usw.) und stellt dem darin wohnenden Geist eine Frage. Insgesamt 2W6 Fragen können gestellt werden (geheim vom SL gewürfelt). Nur natürliche, lebende Dinge mit Geistern können befragt werden — tote oder künstliche Objekte nicht. Die Antworten sind für andere Anwesende nicht wahrnehmbar.',
  description_en = 'Allows the shaman to hold a brief conversation with the natural world. Instead of asking a single question of all within range, the shaman picks a single target (tree, bird, stream, etc.) and asks the spirit dwelling within it a question. A total of 2d6 questions can be asked (rolled secretly by the DM). Only natural, living things with spirits can be questioned — dead or artificial objects cannot. The answers are imperceptible to others present.'
WHERE LOWER(name_en) = LOWER('Converse — Shaman') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Geringen Helm Erschaffen',
  description = 'Verwandelt einen normalen Stuhl oder Sitz in einen geringeren Spelljammer-Helm zum Antrieb eines Schiffs durch den Weltraum. Altert den Zauberwirker um ein Jahr. Der Helm kann ein Schiff von maximal der doppelten Stufe des Priesters in Tonnage antreiben. Er funktioniert identisch mit einem permanenten Spelljammer-Helm, kann aber durch Magie Bannen zum Verschwinden gebracht werden. Dient hauptsächlich als Notfallsystem.',
  description_en = 'Transforms a normal chair or seat into a minor spelljammer helm suitable for powering a ship through space. Ages the caster one year. The helm can power a ship of no more than twice the caster''s level in tonnage. It functions identically to a permanent spelljammer helm but can be destroyed by a successful dispel magic. Serves primarily as a backup or emergency system.'
WHERE LOWER(name_en) = LOWER('Create Minor Helm') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Kristallomantie — Elf',
  description = 'Lässt einen klaren oder durchscheinenden kristallinen Edelstein als Wahrsagegerät dienen (ähnlich einer Kristallkugel). Pro 1.000 GM Wert des Edelsteins kann der Priester 1 Runde lang wahrsagen, bis maximal 1 Stunde. Pro drei Stufen über der 7. kann ein Erkennungszauber der 4. Stufe oder niedriger durch den Edelstein gewirkt werden. Funktioniert nur, wenn der Priester bei Corellon Larethian in gutem Ansehen steht. Der Edelstein wird nicht verbraucht.',
  description_en = 'Causes a clear or translucent crystalline gemstone to serve as a scrying device (similar to a crystal ball). For every 1,000 gp value, the priest can scry for one round, up to 1 hour maximum. For every three levels above 7th, one detection spell of 4th level or less can be cast through the gemstone. Only functions if the priest is in good standing with Corellon Larethian. The gemstone is not consumed.'
WHERE LOWER(name_en) = LOWER('Crystallomancy — Elf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Fäulnis Heilen',
  description = 'Eine mächtigere Version des Zaubers Fäulnis Verhindern. Wirkt auf ein von Holzfäule betroffenes Holzobjekt und heilt die Fäule vollständig mit einer Rate von 0,028 m³ pro Runde. Mindestens ein Teil des Originalholzes muss noch intakt sein — völlig zu Staub zerfallene Objekte können nicht geheilt werden. Heilt auch Fäulnis und Schäden an lebenden Bäumen und Pflanzen durch natürliche Krankheiten oder Parasiten (bis zu 0,4 Hektar). Materialkomponente: Mistel und ein toter Holzbohrerkäfer.',
  description_en = 'A more powerful version of prevent rot. Cures wood rot on a wooden object at a rate of 0.028 m³ per round. At least part of the original wood must be intact — objects totally rotted to dust cannot be cured. Also cures rotting and damage to living trees or plants caused by natural disease or parasites (up to 0.4 hectares). Material component: mistletoe and a dead woodborer beetle.'
WHERE LOWER(name_en) = LOWER('Cure Rot') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Tanz der Einhörner',
  description = 'Eine priesterliche Variante von Teleportation Ohne Irrtum und Blinzeln. Der Empfänger kann sich einmal pro Runde per Willensakt innerhalb von 329,2 m ohne Fehler teleportieren. Maximales Gewicht: 113,4 kg plus 68 kg pro Stufe des Priesters über der 10. Die Teleportation kann am Ende der Runde oder zu einem zufälligen Zeitpunkt während der Runde erfolgen (im letzteren Fall funktioniert sie wie ein Blinzeln-Zauber mit wählbarer Richtung). Materialkomponente: Klares Flusswasser, das ein Einhorn mit seinem Horn gerührt hat.',
  description_en = 'A priestly variant of teleport without error and blink. The recipient can teleport without error once per round by act of will within 329.2 m. Maximum weight: 113.4 kg plus 68 kg per caster level above 10th. The teleportation can occur at end of round or at a random time during the round (in the latter case it works like a blink spell with chosen direction). Material component: clear river water stirred by a unicorn''s horn.'
WHERE LOWER(name_en) = LOWER('Dance of the Unicorns') AND spell_type = 'priest';
