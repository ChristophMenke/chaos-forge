-- ═══════════════════════════════════════════════════════════════════════════════
-- PSC1 Priest Spells Level 4 (Batch 2: 18 Spells — Briartangle to Corrupt)
-- Metrisch, eng an Originaltexten orientiert
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.spells SET
  name = 'Dornengestrüpp',
  description = 'Verwandelt lebende Sträucher oder Unterholz sofort in dichtes, dorniges Gestrüpp von 1,8 m Höhe mit einem Radius von 3 m plus 3 m pro zwei Stufen des Wirkers. Kreaturen im Gestrüpp erleiden 1W4+2 Stich- und Kratzschaden pro Runde (1W3 bei Platten-/Schuppenpanzer). Geschosse, geworfene Objekte und fliegende Kreaturen werden aufgehalten. Zauber mit somatischer Komponente sind im Gestrüpp unmöglich. Feuer zerstört das Gestrüpp in 1 Runde, verursacht aber 2W6 Feuerschaden an Kreaturen darin (kein Rettungswurf).',
  description_en = 'Instantly transforms living shrubbery or undergrowth into densely tangled thorny briars 1.8 m high with a radius of 3 m plus 3 m per two caster levels. Creatures within take 1d4+2 piercing/scratching damage per round (1d3 in plate/scale armor). Missiles, thrown objects, and flying creatures are halted. Spellcasting with somatic components is impossible inside. Fire destroys the briartangle in 1 round but deals 2d6 fire damage to creatures within (no saving throw).'
WHERE LOWER(name_en) = LOWER('Briartangle') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Luftwesen Herbeirufen',
  description = 'Ruft bestimmte fliegende Kreaturen an den Standort des Priesters. Wirkt nur im Freien. Der Priester beginnt die Beschwörung und setzt sie bis zu 2 Runden lang fort. Nur eine Kreaturenart kann pro Zauber gerufen werden, mit bis zu drei Versuchen für verschiedene Arten. Gerufene Wesen erhalten einen Rettungswurf gegen Zauber mit −4 Abzug. Sie sind dem Wirker wohlgesonnen, aber böse Gruppenmitglieder erlauben ihnen einen erneuten Rettungswurf mit +4. Kampfunterstützung erfordert einen Loyalitätswurf basierend auf dem Charisma des Wirkers.',
  description_en = 'Summons certain aerial creatures to the priest''s location. Works only outdoors. The caster begins the incantation and continues for up to 2 turns. Only one creature type can be called per spell, with up to three attempts for different types. Called beings get a saving throw vs. spell at −4 penalty. They are favorably disposed but evil party members allow them another save at +4. Combat assistance requires a loyalty check based on the caster''s Charisma.'
WHERE LOWER(name_en) = LOWER('Call Aerial Beings') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Winde Beruhigen',
  description = 'Erzeugt einen Bereich vollkommener Windstille, der sich mit dem Wirker bewegt. Negiert Wirbelwinde und Zauber wie Staubteufel und Windstoß im geschützten Bereich, ohne diese zu beenden. Kreaturen von der Elementarebene der Luft und windbasierte Wesen meiden den Bereich. Hält an, solange der Wirker sich konzentriert (halbe Bewegungsrate erlaubt) oder bis die Dauer abläuft.',
  description_en = 'Creates an area of perfect calm that moves with the caster. Negates whirlwinds and spells like dust devil and gust of wind within the protected area without ending them. Creatures from the Elemental Plane of Air and wind-based creatures shun the area. Lasts as long as the caster concentrates (half movement rate allowed) or until the duration expires.'
WHERE LOWER(name_en) = LOWER('Calm Winds') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Tadel',
  description = 'Der Priester berührt ein Wesen mit seinem Heiligen Symbol und verstößt es per Wort und Geste. Bei missglücktem Rettungswurf gegen Zauber wird das Wesen mit einem Mal gezeichnet, das für den Priester und alle Anhänger desselben Glaubens sichtbar ist. Gezeichnete werden von Glaubensbrüdern gemieden, ignoriert und notfalls mit Gewalt vertrieben. Das Mal durchdringt Verkleidungen, Gestaltwandlung und sogar Unsichtbarkeit. Kann durch Magie Bannen entfernt und durch Magie Entdecken aufgespürt werden.',
  description_en = 'The priest touches a creature with his holy symbol and casts it out by word and gesture. On a failed saving throw vs. spell, the creature is marked visibly to the casting priest and all followers of the same faith. The marked creature is shunned, ignored, and if necessary driven away by force by members of the caster''s faith. The mark shows through disguises, shapeshifting, and even invisibility. Can be removed by dispel magic and detected by detect magic.'
WHERE LOWER(name_en) = LOWER('Censure') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Chaotischer Kampf',
  description = 'Wirkt nur auf Krieger. Der Betroffene erhält plötzliche Einsichten für Variationen seiner Angriffs- und Verteidigungstechniken. Zu Beginn jeder Runde wird 1W6 gewürfelt: Bei 1–4 erhält der Krieger +2 auf Angriffswürfe und +2 auf Rüstungsklasse. Bei 5–6 erleidet er −2 auf Angriffswürfe und −2 auf Rüstungsklasse. Die Einsichten gehen beim Ablauf des Zaubers verloren — der Krieger erinnert sich an den Kampf, kann aber die Manöver nicht reproduzieren.',
  description_en = 'Affects only warriors. The subject gains sudden insights for variations on standard attack and defense moves. At the beginning of each round, roll 1d6: on 1–4, the warrior gains +2 to attack rolls and +2 to AC. On 5–6, the warrior suffers −2 to attack rolls and −2 to AC. The insights are lost when the spell expires — the warrior remembers the battle but cannot duplicate the maneuvers.'
WHERE LOWER(name_en) = LOWER('Chaotic Combat') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Chaotischer Schlaf',
  description = 'Bei missglücktem Rettungswurf gegen Zauber (Berührung nötig) wird das Schlafmuster des Ziels bei der nächsten Morgen- oder Abenddämmerung zufällig gestört. Alle 12 Stunden (1W6: 1–3 wach, 4–6 Schlaf) wird entschieden, ob das Wesen schläft oder wach ist. Schlafende können nur durch physische Reize geweckt werden und schlafen sofort wieder ein, wenn ungestört. Pro 12 Stunden erzwungene Wachheit: −1 ETW0-Abzug, keine HP-Regeneration, kein Zaubermemorieren möglich.',
  description_en = 'On a failed saving throw vs. spell (touch required), the target''s sleeping pattern is randomly disrupted starting at the next sunrise or sunset. Every 12 hours (1d6: 1–3 awake, 4–6 asleep), the creature either cannot sleep or cannot stay awake. Sleeping victims can only be roused by physical stimuli and doze off again when undisturbed. Per 12 hours of forced wakefulness: −1 THAC0 penalty, no HP regeneration, no spell memorization possible.'
WHERE LOWER(name_en) = LOWER('Chaotic Sleep') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Glockenspiel des Findens',
  description = 'Ermöglicht das Auffinden vermisster oder gesuchter Personen (wirkt nicht auf Gegenstände). Benötigt ein Windspiel, eine detaillierte Karte des Suchgebiets, einen persönlichen Gegenstand des Gesuchten und einen windstillen Tag. Der Priester hält das Windspiel über die Karte und fährt mit dem Finger darüber — wenn die Glocken erklingen, wird der Aufenthaltsort enthüllt. Wirkt auch bei toten Personen, wobei die Glocken dann langsamer und trauriger klingen.',
  description_en = 'Locates missing or wanted individuals (does not work on inanimate objects). Requires a set of wind chimes, a detailed map of the search area, a personal item of the desired being, and a still, windless day. The priest suspends the chimes above the map and passes a finger over it — when the chimes sound, the person''s location is revealed. Works even on dead persons, with the chimes tolling more slowly and sadly.'
WHERE LOWER(name_en) = LOWER('Chimes of Finding') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Kreis der Abgeschiedenheit',
  description = 'Schützt ein Lager vor Raubtieren und Eindringlingen. Der Priester streut Salz in einem Kreis von bis zu 15,2 m Durchmesser. Für die Dauer werden alle Geräusche und Gerüche innerhalb des Kreises gedämpft, wodurch das Gebiet von außen weniger wahrnehmbar wird. Die Begegnungschance wird um 50 % reduziert. Bietet keinen Schutz gegen Infravision oder magische Entdeckungsmethoden.',
  description_en = 'Protects a campsite from predators and trespassers. The caster sprinkles salt in a circle up to 15.2 m in diameter. For the duration, all sounds and scents within the circle are muted, making the area less noticeable from outside. Encounter chance is reduced by 50%. Provides no protection against infravision or magical detection methods.'
WHERE LOWER(name_en) = LOWER('Circle of Privacy') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Krallenwolke',
  description = 'Ruft einen Schwarm riesiger Raben (20+3W20) oder Riesenraben (10+2W6) herbei, sofern solche in Reichweite sind. Der Priester kann ihnen wie mit Tiersprache Anweisungen geben. Raben befolgen einfache Befehle wie „Verfolgt und greift diese Fliehenden an" oder „Folgt dieser Gruppe und berichtet zurück". Riesenraben (Intelligenz 5–7) können listigere Manöver ausführen. Der Schwarm kehrt bei der nächsten Morgendämmerung in den Wildzustand zurück.',
  description_en = 'Summons a flock of huge ravens (20+3d20) or giant ravens (10+2d6) if such birds are within range. The priest can instruct them as if using speak with animals. Ravens faithfully carry out simple instructions like "Follow those fleeing figures and attack them" or trailing a target and reporting back. Giant ravens (Intelligence 5–7) can perform cunning maneuvers. The flock returns to a wild state at the first dawn following summoning.'
WHERE LOWER(name_en) = LOWER('Clawcloud') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Klare Luft',
  description = 'Erzeugt einen Bereich, in dem die Luft vollkommen klar bleibt. Vertreibt Rauch, Gas, Nebel und lässt Partikel wie Sand, Ruß oder Staub sofort niederfallen. Gasförmige Kreaturen werden sofort aus dem Bereich vertrieben und können ihn nicht betreten, solange der Zauber wirkt. Der Effekt umgibt die berührte Kreatur und bewegt sich mit ihr.',
  description_en = 'Creates an area where the air remains perfectly clear. Banishes smoke, gas, fog, and instantly settles particles like sand, soot, or grit. Creatures in gaseous form are immediately expelled and cannot enter the area while the spell is in effect. The effect surrounds the touched creature and moves with it.'
WHERE LOWER(name_en) = LOWER('Clear Air') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Pestilenzwolke',
  description = 'Erzeugt eine unbewegliche, gelbgrüne Dampfwolke ähnlich Wolke des Todes. In jeder Runde innerhalb der Wolke ist ein Rettungswurf gegen Zauber nötig. 1. Runde: Bei Misserfolg 1W4 Schaden und heftiger Husten (kein Zaubern möglich). 2. Runde: Bei Misserfolg 3W4 Schaden, Verlangsamung und −2 auf Angriffswürfe. 3. Runde: Bei Misserfolg Bewusstlosigkeit und 4W6 Zusatzschaden. 4. Runde: Bei Misserfolg Tod. Der Wirker und Träger geweihter Talona-Symbole sind immun. Kann durch Magie Bannen aufgelöst werden.',
  description_en = 'Creates an immovable, yellowish-green vapor cloud resembling cloudkill. Each round inside requires a saving throw vs. spell. Round 1: Failure causes 1d4 damage and violent coughing (no spellcasting). Round 2: Failure causes 3d4 damage, slow effect, and −2 to attack rolls. Round 3: Failure causes unconsciousness and 4d6 additional damage. Round 4: Failure causes death. The caster and bearers of consecrated Talona holy symbols are immune. Can be dispelled.'
WHERE LOWER(name_en) = LOWER('Cloud of Pestilence') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Zwanghafte Ordnung',
  description = 'Zwingt ein Wesen, alles in seiner Umgebung in perfekte Ordnung zu bringen — Schätze nach Sorte stapeln, Leichen der Größe nach ordnen, Flusen von Kleidung entfernen. Bei jeder neuen Handlung muss eine geordnete Begründung geliefert werden; andernfalls verzögert sich die Aktion um 1W6 Runden. Betroffene können gewalttätig werden, wenn man sie am Ordnen hindert. Ein Rettungswurf gegen Zauber vermeidet den Effekt. Magie Bannen beendet die Wirkung.',
  description_en = 'Compels a being to place everything encountered into perfect order — sorting treasure by type, arranging corpses by size, removing lint from clothing. For every new action, an orderly rationale must be provided; otherwise the action is delayed by 1d6 rounds. Affected beings may become violent if prevented from organizing. A saving throw vs. spell avoids the effect. Dispel magic counters it.'
WHERE LOWER(name_en) = LOWER('Compulsive Order') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Reichtümer Verbergen — Zwerg',
  description = 'Lässt alle Gegenstände, die ein Wesen trägt, oder die sich in einem Bereich bis 6 × 6 × 6,1 m befinden, wertlos aussehen. Feine Kleidung wirkt schäbig, neue und teure Gegenstände erscheinen alt und abgenutzt. Die Illusion ist permanent, bis sie gebannt oder vom Wirker aufgelöst wird. Wird von Priestern Abbathors genutzt, um Schatzhorte und Reisende vor Diebstahl zu schützen.',
  description_en = 'Makes all items worn or carried by one being or within an area up to 6 × 6 × 6.1 m look worthless. Fine clothes appear shabby, new and expensive items look old and worn. The illusion is permanent until dispelled or dismissed by the caster. Used by priests of Abbathor to disguise treasure hoards and travelers against robbery attempts.'
WHERE LOWER(name_en) = LOWER('Conceal Riches — Dwarf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Dschungeldiener Herbeirufen',
  description = 'Verwandelt junge Krokodile oder Alligatoren (eines pro drei Erfahrungsstufen des Priesters) in Mindere Segarrans. Die Tiere müssen vorhanden und beim Wirken berührt werden. Die Diener kämpfen auf Befehl des Priesters für 2 Runden pro Stufe. Sie sind gezwungen, gefallene Feinde zu verschlingen (1–3 Runden), können dabei nicht angreifen. Wenn kein Opfer verschlungen wird, muss der Priester einen Rettungswurf gegen Zauber bestehen oder erhält einen Fluch.',
  description_en = 'Transforms baby crocodiles or alligators (one per three caster levels) into lesser segarrans. The animals must be at hand and touched during casting. The minions fight as commanded for 2 rounds per level. They are compelled to devour fallen enemies (1–3 rounds), unable to attack during this time. If no victim is devoured before the spell expires, the caster must save vs. spell or receive a bestow curse.'
WHERE LOWER(name_en) = LOWER('Conjure Jungle Minions') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Vertrag der Nephthys — Altes Reich',
  description = 'Bindet zwei Personen in eine gegenseitig akzeptierte Vereinbarung mit schweren Konsequenzen bei Vertragsbruch. Beide Parteien müssen willentlich teilnehmen und bei klarem Verstand sein. Höhere Gewalt: Geschäftserfolge werden durch Schicksalsschläge zunichtegemacht. Vorsätzlicher Bruch: Das Schicksal treibt den Vertragsbrecher in den Bankrott. Strafen enden 1 Jahr nach Vertragsschluss. Der Vertrag kann vom ursprünglichen Wirker mit Zustimmung beider Parteien aufgelöst werden.',
  description_en = 'Binds two individuals into a mutually acceptable agreement with severe consequences for contract violation. Both parties must be willing participants of sound mind. Force majeure: Business successes are thwarted by fate, yielding no net gain. Deliberate breach: Fate drives the violator into bankruptcy. Penalties cease 1 year after the contract''s creation. The contract can be negated by the original caster with consent of both parties.'
WHERE LOWER(name_en) = LOWER('Contract of Nephthys — Old Empire') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Todestyrann Kontrollieren — Betrachter',
  description = 'Ermöglicht einem Ältesten Kugelauge, einen Todestyrann innerhalb von 1,6 km pro aktuellem Trefferwürfel zu kontrollieren, ähnlich wie Person Bezaubern. Das Älteste Kugelauge kann gleichzeitig einen Todestyrann pro Intelligenzpunkt kontrollieren. Todestyranten können sich nicht gegen diese Kontrolle wehren, die alle ihre anderen Direktiven überschreibt. Nur ein Ältestes Kugelauge oder ein böser Priester mit Intelligenz 18+ kann diesen Zauber nutzen.',
  description_en = 'Enables an elder orb to control any death tyrant within 1.6 km per current Hit Die, similar to charm person. The elder orb can simultaneously control one death tyrant per point of Intelligence. Death tyrants cannot rebel against this control, which overrides all their directives. Only an elder orb or an evil priest of Intelligence 18 or greater can use this spell.'
WHERE LOWER(name_en) = LOWER('Control Death Tyrant — Beholder') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Rieseninsekt Kontrollieren',
  description = 'Kontrolliert ein riesiges oder magisch vergrößertes Insekt, das seinen Rettungswurf gegen Zauber nicht besteht. Nur ein Insekt pro Zauber. Das Insekt kann nicht als Reittier dienen, aber der Priester kann es durch eigene Bewegungen präzise steuern — einem komplexen Pfad folgen lassen, einen Hebel betätigen, Schachfiguren bewegen und ähnliche Aufgaben ausführen. Materialkomponente: Ein Körperteil desselben Insektentyps.',
  description_en = 'Controls a giant or magically enlarged insect that fails a saving throw vs. spell. Only one insect per spell. The insect cannot serve as a steed, but the priest can precisely control it through mirrored movements — forcing it to follow complex routes, pull levers, push chess pieces, and perform similar tasks. Material component: a body part from the same type of insect.'
WHERE LOWER(name_en) = LOWER('Control Giant Insect') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Verderben',
  description = 'Kontaminiert reines Wasser, erzeugt Schwachstellen in Steinwänden oder Rüstungsplatten und beschädigt Substanzen. Magische Tränke verlieren 1W4 Heilungspunkte oder 1W4 Runden Dauer. Weihwasser wird zu normalem Wasser; unheiliges Wasser verdoppelt seine Wirkung. Betroffene Gegenstände erleiden −3 auf Gegenstandsrettungswürfe und −2 Schaden bei Waffeneinsatz für 1W3 Runden. Drei Verderben-Zauber auf denselben nichtmagischen Gegenstand können ihn zerstören.',
  description_en = 'Contaminates pure water, creates weak spots in stone walls or armor plate, and damages substances. Magical potions lose 1d4 healing points or 1d4 rounds of duration. Holy water becomes ordinary water; unholy water doubles in efficacy. Affected items suffer −3 to item saving throws and −2 weapon damage for 1d3 turns. Three corrupt spells on the same nonmagical item may cause it to shatter.'
WHERE LOWER(name_en) = LOWER('Corrupt') AND spell_type = 'priest';
