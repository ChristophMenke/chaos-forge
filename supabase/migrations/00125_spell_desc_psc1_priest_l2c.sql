-- ═══════════════════════════════════════════════════════════════════════════════
-- PSC1 Priest Spells Level 2 (Batch 3: 18 Spells — Darkfire (Drow) to Enchant Runestones)
-- Metrisch, eng an Originaltexten orientiert
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.spells SET
  name = 'Dunkelfeuer — Drow',
  description = 'Dunkelfeuer-Flammen geben kein Licht ab, obwohl Kreaturen mit Infrarotsicht eine hellere Signatur als bei normalen Flammen sehen. Kontakt verursacht 2W4 Schadenspunkte; brennbare Gegenstände erfordern Gegenstandsrettungswürfe gegen magisches Feuer. Im Kampf emaniert das Dunkelfeuer von einer Hand des Priesters und verursacht 1W8 Feuerschaden bei Berührung. Kann als Feuerball geworfen werden (Reichweite 3 m): 1W3 Schaden plus 1 pro Stufe (max. 1W3+10). Fehlschüsse brennen 1W2 Runden.',
  description_en = 'Darkfire flames give no light, though creatures with infravision see a brighter signature than normal flame. Contact inflicts 2d4 damage; flammable items require saving throws vs. magical fire. In combat, darkfire emanates from one hand, dealing 1d8 fire damage on a hit. Can be thrown as fireballs (range 3 m): 1d3 damage plus 1 per level (max 1d3+10). Misses burn for 1d2 rounds.'
WHERE LOWER(name_en) = LOWER('Darkfire — Drow') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Todeskerze — Schamane',
  description = 'Erschafft eine Möglichkeit, Gesundheit und Leben eines anderen Wesens zu überwachen. Der Zauber wird auf ein Wesen gewirkt, das eine zuvor unbenutzte Kerze hält. Die Kerze wird angezündet und kann danach nur noch durch magische Mittel gelöscht werden. Die Flamme brennt ohne die Kerze zu verbrauchen, solange das Subjekt lebt. Ist das Subjekt todkrank oder nahe dem Tod, flackert die Flamme schwach. Nur wenn das Subjekt stirbt, erlischt die Kerze.',
  description_en = 'Creates a way to monitor the health and life of another being. The spell is cast on a creature holding a previously unused candle. The candle is lit and thereafter cannot be extinguished except by magical means. The flame burns without consuming the candle as long as the subject lives. If the subject is gravely ill or near death, the flame gutters low. Only if the subject dies does the candle go out.'
WHERE LOWER(name_en) = LOWER('Death Candle — Shaman') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Todesfluch',
  description = 'Dient der Vergeltung für den bevorstehenden Tod des Zauberers. Der Barbarenpriester benennt einen Feind und erfindet einen Fluch, der wirksam wird, wenn dieser Feind die direkte Todesursache war. Wird der Priester von den Toten erweckt, bricht der Fluch. Andernfalls ist er ewig. Der Fluch darf die Macht eines Fluch-Belegen-Zaubers nicht übersteigen (-4 Abzug, Attribut auf 3 reduziert usw.). Nur ein Feind kann gleichzeitig bedroht werden.',
  description_en = 'Used to avenge the caster''s imminent death. The barbarian cleric names an enemy and invents a curse that takes effect if that enemy was the direct cause of death. If the caster is raised from the dead, the curse breaks. Otherwise it is everlasting. The curse cannot exceed the power of a bestow curse spell (-4 penalty, ability score reduced to 3, etc.). Only one enemy can be under threat at a time.'
WHERE LOWER(name_en) = LOWER('Death Curse') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Totengebet',
  description = 'Verringert die Chance, dass ein Leichnam als Untoter aufersteht. Verhindert sowohl magische Belebung als auch die Übernahme durch eindringende Geister. Die Schutzwirkung verblasst und ist nur durch Große Weissagung (5. Stufe+) erkennbar. Der Leichnam erhält einen Rettungswurf basierend auf seiner Stufe zu Lebzeiten (maximal 75 % Erfolgswahrscheinlichkeit). Kontakt mit dem Geist durch Kontakt mit Toten erfordert höhere Stufe als der Zauberer des Totengebets. Auferstehungswurf wird um 25 % erschwert.',
  description_en = 'Reduces the chance that a corpse will rise as undead. Prevents both magical animation and spirit seizure. The protection fades and is detectable only by greater divination (5th level+). The corpse gets a saving throw based on its level in life (max 75% success chance). Speak with dead requires higher level than the death prayer caster. Resurrection survival roll is penalized by 25%.'
WHERE LOWER(name_en) = LOWER('Death Prayer') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Leben Entdecken',
  description = 'Erkennt, ob eine Kreatur lebt. Wirkt bei Wesen unter dem Einfluss von Todesvortäuschen, in Koma, todesähnlicher Trance oder Scheintod. Funktioniert auch bei Astralreisenden und bei Pflanzen. Reichweite wird durch Barrieren vermindert — jeder 2,5 cm Holz oder Stein zählt als 3 m offener Raum. Metallbarrieren jeder Dicke lassen den Zauber fehlschlagen. Mentaler Schutz (psionisch oder magisch) ruiniert den Zauber ebenfalls.',
  description_en = 'Detects whether a creature is alive. Works on beings under feign death, in a coma, death-like trance, or suspended animation. Also works on astral travelers and on plants. Range is diminished by barriers — each 2.5 cm of wood or stone counts as 3 m of open space. Metal barriers of any thickness cause the spell to fail. Mental protection (psionic or magical) also ruins the spell.'
WHERE LOWER(name_en) = LOWER('Detect Life') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Mächte Entdecken',
  description = 'Wird außerhalb einer Kristallsphäre gewirkt und ermöglicht dem Priester festzustellen, ob es freundlich gesinnte Götter oder andere Mächte gibt, um höherstufige Zauber wiederzuerlangen. Offenbart auch, ob die Gottheit des Zauberers in dieser Sphäre verehrt wird. Das Ergebnis reicht von „Macht bekannt" (normale Zaubererneuerung) bis „Macht unbekannt" (keine Zauber über 2. Stufe). Verwandte Mächte mit ähnlichem Portfolio können Zugang gewähren.',
  description_en = 'Cast outside a crystal sphere, allows the priest to determine if friendly gods or powers exist so higher-level spells can be regained. Also reveals if the caster''s patron is worshipped in that sphere. Results range from "power known" (normal spell recharge) to "power unknown" (no spells above 2nd level). Related powers with similar portfolios may grant access.'
WHERE LOWER(name_en) = LOWER('Detect Powers') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Psionik Entdecken',
  description = 'Der Priester sieht jede psionische Nutzung im Wirkungsbereich als rosiges Leuchten, das die psionische Kreatur umgibt. Je mehr PSPs die Kreatur einsetzt, desto heller leuchtet es (schwach 1-5, mittel 6-10, stark 11+). Der Priester kann pro Runde einen 60-Grad-Bogen scannen. Chance von 10 % pro Stufe, die verwendete psionische Disziplin zu bestimmen. Jede Materialbarriere ab 2,5 cm Dicke blockiert den Zauber.',
  description_en = 'The priest sees any psionic use in the area of effect as a rosy glow outlining the creature. The more PSPs used, the brighter the glow (faint 1-5, moderate 6-10, strong 11+). The caster can scan a 60-degree arc per round. 10% chance per level to determine the psionic discipline being used. Any material barrier at least 2.5 cm thick blocks the spell.'
WHERE LOWER(name_en) = LOWER('Detect Psionic Use') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Diktieren — Harmonium',
  description = 'Eine Variation des Befehl-Zaubers, die bis zu sechs Kreaturen gleichzeitig betrifft und länger als eine Runde wirkt. Erlaubt dem Priester, einen kurzen, präzisen Befehl von maximal einem Dutzend Wörtern zu sprechen, dem alle Ziele mit fehlgeschlagenem Rettungswurf gegen Zauber gehorchen müssen. Der Befehl muss in einer für die Ziele verständlichen Sprache gesprochen werden und eine sofortige physische Handlung auslösen. Offensichtlich selbstzerstörerische Befehle funktionieren nie.',
  description_en = 'A variation of the command spell affecting up to six creatures at once and lasting more than one round. Allows the priest to speak a short, precise command of no more than a dozen words that must be obeyed by all targets failing their saving throw vs. spell. The command must be in a language understood by the targets and create an immediate physical action. Obviously self-destructive commands never work.'
WHERE LOWER(name_en) = LOWER('Dictate — Harmonium') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Entwirren — Zwerg',
  description = 'Ermöglicht dem Empfänger, sich aus jedem Seil, Netz, Pflanzengriff, Kiefer, Leim oder Ringergriff zu befreien, solange die Fesselung physischer Natur ist. Erlaubt kein Formverändern, daher kein Entkommen aus festen Fesseln wie Holzblock, Metallschellen oder Gitterstäben. Ermöglicht auch sofortige Flucht aus magischen Effekten wie Fesseln, Verstricken oder Evards Schwarze Tentakel, wirkt aber nicht gegen Haltezauber oder Ghul-Lähmung.',
  description_en = 'Enables the recipient to escape any rope, web, plant grip, jaws, glue, or wrestling hold, as long as the binding is physical. Does not allow shape-alteration, so no escape from fixed restraints like stocks, metal shackles, or cage bars. Also allows immediate escape from magical effects like bind, entangle, or Evard''s black tentacles, but not from hold person or ghoul paralyzation.'
WHERE LOWER(name_en) = LOWER('Disentangle — Dwarf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Festmahl der Zwietracht',
  description = 'Wird während der Zubereitung einer Mahlzeit auf bis zu 4,5 kg Essen pro Stufe gewirkt. Fünf Runden nach dem Essen müssen betroffene Kreaturen einen Rettungswurf gegen Zauber bestehen. Wer scheitert, wird zunehmend gereizt — nach fünf Minuten eskaliert die Situation zu Beleidigungen, Drohungen und schließlich Gewalt. Betroffene halten keine Bündnisse aufrecht. Am Ende des Zaubers fühlen sich alle, als würden sie aufwachen, und haben keine Ahnung, warum sie wütend wurden.',
  description_en = 'Cast during meal preparation on up to 4.5 kg of food per level. Five rounds after eating, affected creatures must save vs. spell. Those who fail become increasingly agitated — after five minutes, the situation escalates to insults, threats, and eventually violence. No alliances are maintained. At the spell''s end, all feel as if waking up, with no idea why they became angry.'
WHERE LOWER(name_en) = LOWER('Dissension''s Feast') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Traumsicht',
  description = 'Der Shukenja fällt in tiefen Schlaf und träumt von nahen Orten und Ereignissen. Sein Geist wird zum gewünschten Ort projiziert und kann sehen und hören, sich mit Tempo 36 bewegen oder eine Runde lang beobachten. Der Traumgeist kann durch feste Objekte gleiten, aber nicht in von Schutzzaubern bewachte Bereiche eindringen. Wird der Körper des Shukenja gestört, ist ein Rettungswurf gegen Tod nötig — bei Misserfolg fällt der Körper in Katatonie. Der Traumgeist gilt als niederer Geist.',
  description_en = 'The shukenja falls into deep sleep and dreams of nearby places and events. The spirit is projected to the desired location, able to see and hear, move at rate 36, or observe for one round. The dream spirit can pass through solid objects but not enter areas guarded by protection spells. If the body is disturbed, a saving throw vs. death is required — failure causes catatonic state. The dream spirit counts as a lesser spirit.'
WHERE LOWER(name_en) = LOWER('Dream Sight') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Druidensicht',
  description = 'Ermöglicht dem Druiden, durch die Augen eines anderen Tieres zu sehen und die Welt so wahrzunehmen wie dieses Tier. Vertraute, polymorphte oder gestaltwandelnde Kreaturen sind nicht betroffen. Befreundete Tiere (Begleiter, Haustiere, beschworene Tiere) erfordern keinen Rettungswurf. Normale Tiere erhalten einen normalen Rettungswurf gegen Zauber. Das Tier kann telepathisch angewiesen werden, bis zu 91,4 m plus 9,1 m pro Stufe zu erkunden.',
  description_en = 'Allows the druid to see through another animal''s eyes and perceive things as that animal would. Familiars and polymorphed or shapechanged creatures are not subject. Friendly animals (companions, pets, summoned) require no saving throw. Normal animals get a normal saving throw vs. spell. The animal can be telepathically commanded to scout up to 91.4 m plus 9.1 m per caster level.'
WHERE LOWER(name_en) = LOWER('Druidsight') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Dumathoins Ruhe',
  description = 'Lässt belebte Skelette und Zombies zusammenbrechen. Ihre Überreste können für mindestens 24 Stunden nicht reaktiviert oder wiederbelebt werden, in welcher Zeit sie vermutlich ordnungsgemäß bestattet werden. Der Zauber betrifft 2W6 Trefferwürfel an Skeletten und/oder Zombies, 3W6 wenn die Überreste von Zwergen stammen.',
  description_en = 'Causes animated skeletons and zombies to collapse. Their remains cannot be reactivated or reanimated for a minimum of 24 hours, during which time they can be properly interred. The spell affects 2d6 Hit Dice of animated skeletons and/or zombies, 3d6 if the remains are of dwarves.'
WHERE LOWER(name_en) = LOWER('Dumathoin''s Rest') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Erdanker — Halbling',
  description = 'Bindet lebende, körperliche Kreaturen magisch an den Boden. Betroffene können sich mit einem Drittel ihrer Bewegungsrate hin- und herschieben, aber keinen Körperteil vom Boden abheben. Ein Rettungswurf gegen Zauber ist erlaubt. Kreaturen, die den Bereich verlassen, sind nicht länger gebunden. Beim erneuten Betreten ist ein neuer Rettungswurf erforderlich. Wirkt durch Stiefel, Rüstung und andere getragene Ausrüstung.',
  description_en = 'Magically binds living, corporeal creatures to the ground. Affected creatures can slide at one-third movement rate but cannot lift any body part from the earth. A saving throw vs. spell is allowed. Creatures leaving the area are no longer bound. Re-entering requires a new saving throw. Works through boots, armor, and other worn gear.'
WHERE LOWER(name_en) = LOWER('Earth Anchor — Halfling') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Ecdysis — Drache',
  description = 'Beschleunigt die Häutung, der Drachen unterliegen. Wirkt nur gegen Drachen, Dracohydren, Drachenschildkröten, Drachenjunge und drakonische Hybriden — nicht gegen Dracoliche. Bei fehlgeschlagenem Rettungswurf gegen Zauber verliert das Ziel sofort 10 % seiner Schuppen (dann weitere 10 % nach je einer Runde). Für je 10 % verlorener Schuppen verschlechtert sich die RK um 1. Verlorene Schuppen zerfallen zu Staub. Nur Heilung, Begrenzter Wunsch oder Wunsch beschleunigen die Regeneration.',
  description_en = 'Accelerates the molting that dragons undergo. Only affects dragons, dracohydrae, dragon turtles, dragonets, and draconic hybrids — not dracoliches. On a failed saving throw vs. spell, the target sheds 10% of its scales immediately (then 10% more each turn). For each 10% shed, AC worsens by 1. Lost scales decay to dust. Only heal, limited wish, or wish can speed recovery.'
WHERE LOWER(name_en) = LOWER('Ecdysis — Dragon') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Schneide Arumdinas — Gnom',
  description = 'Verzaubert eine Klingenwaffe (typischerweise eine Axt, einen Dolch oder ein Schwert) mit der magischen Schärfe von Garls Gefährtin. Die verzauberte Waffe kann Erde, Stein oder Metall durchschneiden, als wären sie Luft. Metallrüstung und Steinwände bieten keinen physischen Schutz gegen diese Waffe, obwohl magische Boni unverändert gelten. Verleiht der Waffe nicht die Fähigkeit, Kreaturen zu treffen, die nur durch verzauberte Waffen verwundbar sind.',
  description_en = 'Enchants an edged weapon (typically an axe, dagger, or sword) with the magical sharpness of Garl''s companion. The enchanted weapon can cut through earth, stone, or metal as though they were air. Metal armor and stone walls provide no physical protection, though magical bonuses still apply. Does not grant the weapon the ability to harm creatures vulnerable only to enchanted weapons.'
WHERE LOWER(name_en) = LOWER('Edge of Arumdina — Gnome') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Elas Konten',
  description = 'Ein Bezauberungszauber für die Finanzprüfung durch Elas Kirche. Während ein Priester das Ziel in ein Gespräch verwickelt, wirkt der andere den Zauber. Das bezauberte Ziel ist gezwungen, alle Besitztümer, Einkünfte und Vermögenswerte wahrheitsgemäß offenzulegen. Das Ziel kann nicht lügen oder Informationen zurückhalten. Nach dem Gespräch hat das Ziel keine Erinnerung an die Offenlegung. Nur andere Priester von Elas Flinke Finger erhalten einen Rettungswurf.',
  description_en = 'A charm spell for financial auditing by Ela''s church. While one priest engages the subject in conversation, the other casts the spell. The charmed subject is compelled to truthfully recount all properties, income, and holdings. The subject cannot lie or withhold information. After the conversation, the subject has no memory of having divulged details. Only other priests of Ela''s Quick Fingers get a saving throw.'
WHERE LOWER(name_en) = LOWER('Ela''s Accounts') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Runensteine Verzaubern — Zwerg',
  description = 'Ein zwergischer Priester bereitet einen Satz von 6-20 Runensteinen für Weissagungszauber wie Augury oder Weissagung vor. Der Priester graviert spezielle Zwergenrunen auf jeden Stein, wirkt dann Segen und anschließend diesen Zauber. Die verzauberten Runensteine verbessern eine Woche lang die Genauigkeit von Weissagungszaubern (allgemein um etwa +10 %). Die Steine werden bei der Weissagung auf den Boden geworfen und gelesen.',
  description_en = 'A dwarven priest prepares a set of 6 to 20 runestones for divination spells like augury or divination. The priest engraves special dwarven runes on each stone, then casts bless followed by this spell. The enchanted runestones improve divination accuracy for one week (generally by about +10%). The stones are tossed on the ground and read as part of the divination process.'
WHERE LOWER(name_en) = LOWER('Enchant Runestones — Dwarf') AND spell_type = 'priest';
