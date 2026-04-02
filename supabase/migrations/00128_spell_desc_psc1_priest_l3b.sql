-- ═══════════════════════════════════════════════════════════════════════════════
-- PSC1 Priest Spells Level 3 (Batch 2: 18 Spells — Charm of Isis to Detect Spirits)
-- Metrisch, eng an Originaltexten orientiert
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.spells SET
  name = 'Isis'' Amulett — Altes Reich',
  description = 'Verzaubert einen kleinen Gegenstand — ein Amulett, einen Talisman oder Fetisch — als Schutzzauber. Das Amulett wirkt nur für die von der Priesterin bestimmte Person und nur solange deren Handlungen von Isis wohlwollend betrachtet werden. Es muss die Haut des Besitzers berühren. Gewährt entweder einen RK-Bonus oder einen Rettungswurfbonus (nicht beides): +1 pro drei Stufen der Priesterin, maximal +5 ab Stufe 15. Eine Priesterin kann maximal drei solcher Amulette gleichzeitig existieren lassen.',
  description_en = 'Enchants a small item — an amulet, talisman, or fetish — as a protective charm. It functions only for the person designated by the priestess and only while that being''s actions are viewed favorably by Isis. It must touch the owner''s skin. Grants either an AC bonus or a saving throw bonus (not both): +1 per three caster levels, maximum +5 at level 15. A priestess cannot have more than three such charms in existence at once.'
WHERE LOWER(name_en) = LOWER('Charm of Isis — Old Empire') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Leibeigener Geist',
  description = 'Jeder Nemesis-Geist, den der Zauberer besiegt hat, kann mit diesem Zauber herbeigerufen werden. Er erscheint mit den Kräften und Trefferpunkten, die er beim Kampf gegen den Barbarenkleriker hatte. Der Geist muss dem Zauberer dienen oder Fragen nach bestem Wissen beantworten. Bei Ablauf des Zaubers verschwindet der Geist, auch bei unvollendeter Aufgabe. Nur drei Dienste können von einem einzelnen Nemesis-Geist verlangt werden. Einmal im Dienst getötet, kann ein Geist nicht erneut gerufen werden.',
  description_en = 'Any nemesis spirit the caster has defeated can be summoned with this spell. It appears with the powers and hit points it had when fought. The spirit must serve the caster or answer questions to the best of its ability. When the spell ends, the spirit vanishes even if its task is incomplete. Only three services can be asked of any individual nemesis spirit. Once slain in an assignment, a spirit cannot be called again.'
WHERE LOWER(name_en) = LOWER('Chattel Spirit') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Schwatzrinde — Waldläufer',
  description = 'Eine Variante von Mit Pflanzen Sprechen. Der Waldläufer kann einem Baum eine einfache Frage stellen und eine gesprochene Antwort erhalten. Der Stamm muss mindestens 0,3 m Durchmesser haben. Vor dem Wirken muss der Waldläufer mindestens eine Stunde lang ein menschenähnliches Gesicht in den Stamm schnitzen. Der Baum antwortet ehrlich mit einem Wort oder kurzen Satz. Das Wissen eines Baumes beschränkt sich auf Beobachtungen (Passanten, Wetter) und allgemeine Informationen über die unmittelbare Umgebung.',
  description_en = 'A variation of speak with plants. The ranger can ask a tree a simple question and receive a spoken response. The trunk must be at least 0.3 m in diameter. Before casting, the ranger must spend at least an hour carving a humanoid face in the trunk. The tree answers honestly with a single word or short phrase. A tree''s knowledge is limited to observations (passersby, weather) and general information about the immediate area.'
WHERE LOWER(name_en) = LOWER('Chatterbark — Ranger') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Kälte — Altes Reich',
  description = 'Erschafft eine Kältesphäre mit 9,1 m Radius. Der Zauberer kann die Kälte jede Runde auf eine Kreatur im Bereich fokussieren und 1 Schadenspunkt pro Zauberstufe verursachen (maximal 10 Punkte). Ein erfolgreicher Rettungswurf gegen Zauber halbiert den Schaden. Andere Kreaturen im Bereich spüren nur unangenehme Kälte. Wird der Zauberer vor seiner Initiative getroffen, verursacht der Zauber in dieser Runde keinen Schaden, endet aber nicht. Jedes weitere Zaubern beendet den Kältezauber.',
  description_en = 'Creates a 9.1 m radius sphere of cold air. The caster can focus the cold each round on one creature in the area, inflicting 1 damage per caster level (maximum 10 points). A successful saving throw vs. spell halves the damage. Other creatures in the area feel only an unpleasant chill. If the caster is struck before initiative, no damage is dealt that round, but the spell does not end. Casting any subsequent spell terminates chill.'
WHERE LOWER(name_en) = LOWER('Chill — Old Empire') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Zukunft Wählen',
  description = 'In der Runde unmittelbar nach dem Wirken erhält die betroffene Kreatur zwei Würfe für einen einzelnen normalen Angriffswurf, Initiativwurf oder Rettungswurf. Die Kreatur kann dann den besseren Wurf wählen. Materialkomponenten sind zwei Sandkörner und ein Rosenblatt.',
  description_en = 'In the round immediately following the casting, the affected creature is allowed two rolls for any single normal attack roll, initiative roll, or saving throw. The creature can then choose the best roll. Material components are two grains of sand and a rose petal.'
WHERE LOWER(name_en) = LOWER('Choose Future') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Kreis der Geheimnisse*',
  description = 'Kooperativer Zauber für 2 bis 12 Priester, die sich und Verbündete durch Verwandlung in natürliche Geländemerkmale unentdeckbar machen. Die Priester stehen oder sitzen im Kreis, schließen die Augen und konzentrieren sich. Die Erscheinung wird durch die verehrte Gottheit und Situation bestimmt. Alle Vorübergehenden sind betroffen — Verdächtige erhalten einen Rettungswurf gegen Zauber mit −1 pro teilnehmendem Priester. Pro zwei teilnehmende Priester kann ein zusätzliches Individuum verborgen werden.',
  description_en = 'Cooperative spell for 2 to 12 priests that makes them and allies undetectable by transforming their appearance into natural terrain features. The priests stand or sit in a circle, close their eyes and concentrate. The appearance is dictated by the worshiped deity and situation. All passersby are affected — suspicious individuals receive a saving throw vs. spell at −1 per participating priest. One additional individual per two casting priests can be hidden.'
WHERE LOWER(name_en) = LOWER('Circle of Secrets*') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Herd Reinigen',
  description = 'Vertreibt Geister aus einem Heim — von einer kleinen Hütte bis zu einem ganzen Palast, solange es der Wohnsitz einer einzelnen Familie ist. Der Schamane und Helfer nehmen biegsame Zweige und Büschel belaubter Pflanzen und stürmen durch das Gebäude, schreien Drohungen und schlagen auf Wände, Böden, Möbel und Bewohner ein. Geister mit mehr TW als die Stufe des Zauberers sind nicht betroffen. Andere Geister erhalten einen Rettungswurf — bei Erfolg müssen sie für 2W6 Wochen gehen, bei Misserfolg werden sie dauerhaft vertrieben.',
  description_en = 'Casts out spirits from a home — from a small shack to an entire palace, as long as it is the residence of a single family. The shaman and assistants take supple boughs and clumps of leafy plants and rampage through the dwelling, shouting threats and beating walls, floors, furniture, and inhabitants. Spirits with more HD than the caster''s level are unaffected. Other spirits receive a saving throw — on success they must leave for 2d6 weeks, on failure they are permanently driven out.'
WHERE LOWER(name_en) = LOWER('Cleanse Hearth') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Wolkenbruch',
  description = 'Lässt einen Schwall Wasser aus der Luft niedergehen, der alles im Wirkungsbereich durchnässt. Normale Feuer werden gelöscht. Permanente magische Feuer erlöschen, entzünden sich aber in 1W2 Runden wieder. Feuerbasierte Zauber der Stufe 1-2 werden sofort negiert. Feuerbasierte Zauber ab Stufe 3 werden ebenfalls negiert, erzeugen aber eine Dampfwolke von 36,6 m Durchmesser, die 1W3 Verbrühungsschaden pro Runde verursacht (doppelt für kältebasierte Kreaturen) für 1W4+1 Runden.',
  description_en = 'Precipitates a rush of water from the air, instantly drenching everything in the area. Normal fires are extinguished. Permanent magical fires go out but re-light in 1d2 rounds. Fire-based spells of level 1-2 are negated immediately. Fire-based spells of level 3+ are also negated but create a steam cloud of 36.6 m diameter dealing 1d3 scalding damage per round (doubled for cold-based creatures) for 1d4+1 rounds.'
WHERE LOWER(name_en) = LOWER('Cloudburst') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Zwingen',
  description = 'Ermöglicht dem Zauberer, ein oder zwei Kreaturen mit einem Einzelwortbefehl zu kommandieren, ähnlich dem Zauber Befehl der Stufe 1. Der Befehl muss in einer verstandenen Sprache ausgesprochen werden. "Stirb!" verursacht einen zweirundigen kataleptischen Zustand, nicht den Tod. Wesen mit Intelligenz 15+ oder 8+ TW/Stufen erhalten einen Rettungswurf gegen Zauber (ohne Weisheitsmodifikator). Der Zwang regiert zwei aufeinanderfolgende Runden — in der zweiten Runde kann ein anderer Befehl gegeben werden.',
  description_en = 'Enables the caster to command one or two creatures with a single word, similar to the 1st-level command spell. The command must be uttered in a language understood by the targets. "Die!" causes a two-round cataleptic state, not death. Beings with Intelligence 15+ or 8+ HD/levels receive a saving throw vs. spell (not adjusted for Wisdom). The compulsion governs two consecutive rounds — a different command can be issued in the second round.'
WHERE LOWER(name_en) = LOWER('Compel') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Gegenstand Verbergen — Drow',
  description = 'Macht einen einzelnen nichtlebenden Gegenstand, der kleiner als die Körpermasse des Zauberers ist, völlig unentdeckbar. Der Zauber verbirgt sogar magische und Gesinnungsauren. Wahres Sehen zeigt nur einen verschwommenen, weißen Nebelbereich. Wird typischerweise verwendet, um magische Gegenstände oder Waffen zu verbergen. Priester Vaerhauns nutzen ihn zum Verbergen heiliger Symbole — bei heiligen Symbolen wird die Zauberdauer verdreifacht.',
  description_en = 'Renders a single nonliving item smaller than the caster''s body mass utterly undetectable. The spell conceals even magical and alignment auras. True seeing shows only a blank, wavering area of white fog. Typically used to conceal carried magical items or weapons. Priests of Vhaeraun use it to hide holy symbols — when cast on any holy symbol, spell duration is tripled.'
WHERE LOWER(name_en) = LOWER('Conceal Item — Drow') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Immerwährendes Feenfeuer',
  description = 'Bedeckt einen Bereich mit blassem, leuchtendem Licht beliebiger Farbe. Alle Wesen und Objekte im Kontakt werden mit etwas intensiverem Licht umrissen. Unsichtbare Kreaturen werden enthüllt, sofern sie körperlich sind. Untote zeigen eine Aura der Schwärze. Zaubernde oder magische Gegenstände strahlen zusätzlich ein flackerndes weißes Leuchten aus. Die Fläche kann bis zur Stufenbegrenzung beliebig geformt werden, muss aber zusammenhängend sein.',
  description_en = 'Covers an area with pale, glowing light of any desired color. All beings and objects in contact are outlined with slightly more intense light. Invisible creatures are revealed if corporeal. Undead display an aura of blackness. Spellcasting or magical items radiate an additional flickering white aura. The area can be any shape up to the level limit but must be continuous.'
WHERE LOWER(name_en) = LOWER('Continual Faerie Fire') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Immerwährender Schatten',
  description = 'Ähnlich wie Immerwährendes Licht oder Immerwährende Dunkelheit, erschafft aber einen Bereich dauerhaften Schattens und Dämmerlichts. Hält an, bis durch magisches Licht, magische Dunkelheit oder Magie Bannen negiert. Kann in die Luft, auf ein Objekt oder auf eine Kreatur gewirkt werden. Bei Kreaturen: Erfolgreicher Rettungswurf bedeutet, der Schatten erscheint 0,3 m hinter der Kreatur; bei Misserfolg ist er auf die Kreatur zentriert und bewegt sich mit ihr.',
  description_en = 'Similar to continual light or continual darkness, but creates an area of perpetual shadow and gloom. Lasts until negated by magical light, magical darkness, or dispel magic. Can be cast into the air, onto an object, or at a creature. For creatures: a successful saving throw means the shadow appears 0.3 m behind the creature; failure means it is centered on and moves with the creature.'
WHERE LOWER(name_en) = LOWER('Continual Shadow') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Tier Kontrollieren',
  description = 'Zwingt ein Tier, dem Willen des Priesters zu gehorchen. Die Kreatur erhält einen Rettungswurf gegen Zauber; bei Misserfolg kann der Zauberer einfache Befehle wie „Angriff", „Lauf" oder „Hol" geben. Selbstmörderische Befehle erlauben einen erneuten Rettungswurf mit +1 bis +4 Bonus. Es wird eine mentale Verbindung hergestellt, über die das Tier stumm befehligt werden kann. Wirkt nur auf normale oder riesige Tiere mit Intelligenz 1-4. Magische Tiere und Monster sind immun. Druiden verwenden diesen Zauber nie.',
  description_en = 'Forces an animal to do the priest''s bidding. The creature is allowed a saving throw vs. spell; on failure, the caster can direct it with simple commands like "Attack," "Run," or "Fetch." Suicidal commands allow another saving throw with +1 to +4 bonus. A mental link is established for silent commands. Only works on normal or giant-sized animals with Intelligence 1-4. Magical animals and monsters are immune. Druids never use this spell.'
WHERE LOWER(name_en) = LOWER('Control Animal') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Mit Meereskreaturen Sprechen',
  description = 'Ermöglicht dem Zauberer, mit jeder Meereskreatur tierischer Intelligenz oder höher zu kommunizieren. Der Zauberer kann diese Kreaturen verstehen und in der richtigen Sprache antworten. Gespräche mit allen Meereskreaturen im Wirkungsbereich sind möglich, auch wenn sie verschiedene Sprachen sprechen. Garantiert keine Freundlichkeit — die Kreaturen können angreifen. Erlaubt kein Unterwasseratmen. Materialkomponente ist eine kleine Muscheltrompete.',
  description_en = 'Allows the caster to communicate with any sea creature of Animal intelligence or greater. The caster can understand such creatures and respond in the correct tongue. Conversation with all sea creatures within the area is possible even if they speak different languages. Does not guarantee friendliness — creatures may attack. Does not allow underwater breathing. Material component is a small shell trumpet.'
WHERE LOWER(name_en) = LOWER('Converse with Sea Creatures') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Leichenflüstern',
  description = 'Ermöglicht dem Zauberer, eine Nachricht an eine untote Kreatur zu übermitteln. Die Nachricht formt sich lautlos im Geist des Untoten in der Stimme des Zauberers. Sichtlinie ist nicht nötig bei kontrollierten Untoten. Selbstbewusste Untote können frei handeln. Die Verbindung erlaubt halb so viele einrundige Nachrichten wie der Zauberer Stufen hat. Die Kreatur muss beim Wirken innerhalb von 12,2 m sein, kann sich danach aber bis zu 1,6 km entfernen und weiterhin Befehle empfangen.',
  description_en = 'Enables the caster to transmit a message to an undead creature. The message forms silently in the corpse''s mind in the caster''s natural voice. Line of sight is not needed for currently controlled undead. Self-willed undead can act freely. The link allows half as many one-round messages as the caster has levels. The creature must be within 12.2 m when cast but can travel up to 1.6 km away and still receive commands.'
WHERE LOWER(name_en) = LOWER('Corpse Whisper') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Maske Erschaffen — Schamane',
  description = 'Der Schamane erschafft eine Maske für den Umgang mit einem bestimmten Geist oder Geistertyp. Der Zauberer muss die Maske selbst herstellen (passende NWP erforderlich) und den Zauber während der Arbeit wirken. Die Maske muss den Geist zumindest symbolisch darstellen. Wenn getragen, gewährt sie −1 auf die meisten Würfe bei Interaktionen mit den entsprechenden Geistern (also +1 für Rituale, Charisma-Prüfungen etc.). Die Maske kann nur einen Geist gleicher Gesinnung wie den gewährenden Geist darstellen.',
  description_en = 'The shaman creates a mask for dealing with a specific spirit or spirit type. The caster must create the mask without aid (appropriate NWP required) and cast the spell as work progresses. The mask must resemble the spirit at least symbolically. When worn, it provides a −1 bonus to most rolls when interacting with the corresponding spirits (i.e., +1 for rituals, Charisma checks, etc.). The mask can only depict a spirit of the same alignment as the granting spirit.'
WHERE LOWER(name_en) = LOWER('Create Mask — Shaman') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Fluch des Schwarzen Sandes',
  description = 'Bei missglücktem Rettungswurf gegen Zauber hinterlässt das Opfer schwarze, ölige Fußabdrücke, die leicht zu verfolgen und nicht auszulöschen sind. Sie können bedeckt, aber nicht durch Erde verborgen werden. Fliegende oder auf Bäume kletternde Kreaturen hinterlassen keine Spuren, bis sie den Boden berühren. In Schlickgebieten folgt ein schwarzer Streifen der verfluchten Kreatur. Ein Priester, der mehrere Kreaturen verflucht, kann die Spuren voneinander unterscheiden. Die Spur verschwindet bei Ablauf des Zaubers.',
  description_en = 'On a failed save vs. spell, the victim leaves black, oily footprints that are easily tracked and cannot be erased or destroyed. They can be covered but not by earth. Flying or tree-climbing creatures leave no prints until returning to the ground. In silty areas, a black streak follows the cursed creature. A priest who curses multiple creatures can tell the trails apart. The trail disappears when the spell expires.'
WHERE LOWER(name_en) = LOWER('Curse of Black Sand/Silt') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'An der Schwelle des Todes',
  description = 'Durch Berührung bringt der Priester ein verletztes, bewusstloses Wesen an der Schwelle des Todes (−1 bis −9 Trefferpunkte) sofort auf 0 Trefferpunkte. Das Wesen bleibt bewusstlos, aber Blutung und Verfall werden für die Zauberdauer gestoppt. Der Betroffene (jetzt bei 0 TP) kann sofort durch Heilzauber oder -gegenstände ins Bewusstsein gebracht werden. Materialkomponenten sind das Heilige Symbol, ein Stück weißes Leinen und eine Salbe.',
  description_en = 'By touching a being who is injured, unconscious, and at death''s door (−1 to −9 hit points), the priest immediately brings the wounded individual to 0 hit points. The individual remains unconscious, but bleeding and deterioration are stopped for the spell''s duration. The subject (now at 0 HP) can be brought to consciousness immediately by healing spells or items. Material components are the holy symbol, a bit of white linen, and an unguent.'
WHERE LOWER(name_en) = LOWER('Death''s Door') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Verfall',
  description = 'Beschleunigt die Alterung eines Gegenstandes — für jede verstrichene Stunde altert das Objekt einen Tag, und jede Belastung wird zwanzigfach verstärkt. Hat keine Wirkung auf lebende Materie. Magie Bannen stoppt den beschleunigten Verfall, aber bereits eingetretene Alterung ist dauerhaft. Normale Gegenstände erhalten keinen Rettungswurf. Magische Gegenstände müssen einen Gegenstandsrettungswurf gegen Blitz mit −2 Abzug bestehen. Artefakte und Relikte sind nicht betroffen.',
  description_en = 'Accelerates the aging of any item — for every hour that passes, the object decays a day, and any strain is increased twentyfold. Has no effect on living matter. Dispel magic halts the accelerated decay, but aging already taken effect is permanent. Normal items receive no saving throw. Magical items must make a successful item saving throw vs. lightning at −2. Artifacts and relics are unaffected.'
WHERE LOWER(name_en) = LOWER('Decay') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Magieresistenz Senken — Elf, Gnom',
  description = 'Reduziert vorübergehend die Magieresistenz einer Zielkreatur. Die Magieresistenz des Ziels wirkt mit halber Stärke gegen diesen Zauber, und kein Rettungswurf ist erlaubt. Hat keine Wirkung auf Kreaturen ohne Magieresistenz. Bei Erfolg wird die Magieresistenz für einen Zug um 10 % reduziert. Drow-Magieresistenz wird jedoch um 50 % plus 2 % pro Stufe des Zauberers reduziert.',
  description_en = 'Temporarily reduces the magic resistance of a target creature. The creature''s magic resistance works at half its normal value against this spell, and no saving throw is allowed. Has no effect on creatures without magic resistance. If not resisted, magic resistance is reduced by 10% for one turn. However, drow magic resistance is reduced by 50% plus 2% per caster level.'
WHERE LOWER(name_en) = LOWER('Depress Resistance — Elf, Gnome') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Fluch Entdecken — Altes Reich',
  description = 'Ermöglicht dem Zauberer, einen Gegenstand oder eine Kreatur magisch zu untersuchen, ob ein Fluchzauber darauf liegt. Verfluchte Gegenstände oder Wesen strahlen eine schwarze Aura aus. Ab Stufe 12 kann der Zauberer bestimmen, ob der erkannte Fluch Fluch Aussprechen, Großer Fluch, Sterbender Fluch, Verderben oder ein ähnlicher Zauber ist. Erkennt keine magischen Gegenstände mit schädlichen Effekten wie eine Würgekette.',
  description_en = 'Enables the caster to magically examine an item or creature to see if it has been subject to a curse spell. Cursed items or beings appear to radiate a black aura. At level 12, the caster can determine if the detected curse is bestow curse, major curse, dying curse, bane, or a similar spell. Does not detect magical items with malign effects such as a necklace of strangulation.'
WHERE LOWER(name_en) = LOWER('Detect Curse — Old Empire') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Fluch Entdecken — Shukenja',
  description = 'Der Shukenja hat eine 5 %-Chance pro Stufe, einen verfluchten Gegenstand, eine Person oder einen Ort zu entdecken. Pro Runde kann ein menschengroßes Objekt oder ein Quadratmeter überprüft werden. Nach Entdeckung besteht dieselbe prozentuale Chance, die allgemeine Natur des Fluchs zu bestimmen, obwohl genaue Auslöser und Effekte ein Rätsel bleiben. Jeder Gegenstand oder Bereich kann vom Shukenja nur einmal überprüft werden.',
  description_en = 'The shukenja has a 5% chance per level of detecting any cursed item, person, or place. One man-sized object or one square meter can be checked each round. Once found, the same percentage chance exists to determine the general nature of the curse, though precise triggers and effects remain a mystery. Each item or area can only be checked once by the shukenja.'
WHERE LOWER(name_en) = LOWER('Detect Curse — Shukenja') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Verfluchten Gegenstand Entdecken',
  description = 'Der Priester kann durch Berühren feststellen, ob ein Gegenstand verflucht ist (was in manchen Fällen den Fluch auslösen kann). Verfluchte Schriftrollen müssen geöffnet, aber nicht gelesen werden. Artefakte geben keine Lesung. Der Grundrettungswurf eines Gegenstandes ist 13, sehr mächtige Gegenstände können bis 5 haben. Misslingt die Entdeckung, kann der Priester es vor der nächsten Stufenerhöhung nicht erneut versuchen. Nach dem Wirken kann der Priester vier Stunden lang keine weiteren Zauber wirken.',
  description_en = 'The priest can determine if an item is cursed by touching it (which might release the curse). Cursed scrolls must be opened but not read. Artifacts give no reading. The basic saving throw of an item is 13, though very powerful items might be as low as 5. Failure to detect means the caster cannot try again before gaining another level. After casting, the priest cannot cast other spells for four hours.'
WHERE LOWER(name_en) = LOWER('Detect Cursed Item') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Illusion Erkennen',
  description = 'Ermöglicht dem Zauberer, jede Illusion als das zu sehen, was sie wirklich ist, und verbannt Phantasmen aus dem Geist des Zauberers. Während der Zauberdauer kann der Priester pro Runde einer Kreatur durch Berührung einen neuen Rettungswurf gegen Zauber gegen jede Illusion oder jedes Phantasma der Stufe 6 oder niedriger gewähren. Dazu muss der Zauberer die Kreatur berühren (eventuell mit Angriffswurf) und darf in dieser Runde keine andere bedeutende Aktion ausführen.',
  description_en = 'Enables the caster to see any illusion for what it is and banishes phantasms from the caster''s mind. While the spell lasts, the priest can grant one creature per round a new saving throw vs. spell against any illusion or phantasm of 6th level or less by touching it. This may require an attack roll and no other significant action can be taken that round.'
WHERE LOWER(name_en) = LOWER('Detect Illusion') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Geister Entdecken',
  description = 'Enthüllt die Anwesenheit körperloser oder nichtkörperlicher Geister aller Art, einschließlich Todesalben, Geister, Spektren, astral projizierender Kreaturen, sowie jener, die Magiergefäß oder Besessenheit nutzen. Der Zauberer erkennt Geister in einem 3 m breiten und 18,3 m langen Pfad; alle Geister im Bereich werden in ihrer bevorzugten Form für alle sichtbar enthüllt. Das Entdecken allein verleiht keine besondere Fähigkeit zur Kommunikation mit oder zum Angriff auf den Geist.',
  description_en = 'Reveals the presence of disembodied or noncorporeal spirits of all types, including wraiths, ghosts, spectres, astrally-projecting creatures, and those using magic jar or possession. The caster detects spirits in a 3 m wide and 18.3 m long path; all spirits in the area are revealed in their preferred form for all to see. Detection alone grants no special ability to communicate with or attack the spirit.'
WHERE LOWER(name_en) = LOWER('Detect Spirits') AND spell_type = 'priest';
