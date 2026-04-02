-- ═══════════════════════════════════════════════════════════════════════════════
-- PSC1 Priest Spells Level 6 (Batch 2: 20 Spells — Dance of the Fallen to Force Shapechange)
-- Metrisch, eng an Originaltexten orientiert
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.spells SET
  name = 'Tanz der Gefallenen',
  description = 'Wird oft verwendet, um Kreaturen zu fangen. Die Leichen gefallener Wesen im Wirkungsbereich (bis zu 6,1 m hoch) erheben sich und tanzen in einem unheimlichen Reigen. Lebende Kreaturen, die den Tanz beobachten, müssen einen Rettungswurf gegen Zauber bestehen oder werden gezwungen mitzutanzen — hilflos und verwundbar. Dauer: 1 Runde pro Stufe.',
  description_en = 'Often used to capture creatures. Corpses of fallen beings in the area of effect (up to 6.1 m high) rise and dance in an eerie reel. Living creatures watching the dance must save vs. spell or be compelled to join — helpless and vulnerable. Duration: 1 round per level.'
WHERE LOWER(name_en) = LOWER('Dance of the Fallen') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Dunkler Weg',
  description = 'Dient als unfehlbarer Richtungsweiser unter der Erde oder in Dunkelheit, der zum gewünschten Ziel führt. Der Priester sieht einen leuchtenden Pfad vor sich, der den sichersten Weg zum Ziel markiert. Der Pfad umgeht bekannte Gefahren und Sackgassen. Funktioniert nur unterirdisch oder in völliger Dunkelheit.',
  description_en = 'Serves as an unerring direction finder underground or in darkness, leading to the desired destination. The priest sees a glowing path ahead marking the safest route to the target. The path avoids known dangers and dead ends. Only functions underground or in complete darkness.'
WHERE LOWER(name_en) = LOWER('Dark Road') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Todesdrache',
  description = 'Erschafft eine bizarre drachenförmige Ansammlung aus Schädeln, Knochen, Haaren und Zähnen. Der Todesdrache gehorcht dem Priester und kämpft gegen Feinde. Er kann fliegen, Odemwaffen einsetzen und verursacht Furcht bei allen, die ihn sehen. Die Kreatur hält bis zur Zerstörung oder dem Ende des Zaubers.',
  description_en = 'Creates a weird dragon-shaped assemblage of skulls, bones, hair, and teeth. The death dragon obeys the priest and fights enemies. It can fly, use breath weapons, and causes fear in all who see it. The creature persists until destroyed or the spell ends.'
WHERE LOWER(name_en) = LOWER('Death Dragon') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Todesberührung',
  description = 'Durch diesen Zauber tötet der Priester ein anderes lebendes Wesen und überträgt einen Teil seiner Lebensenergie auf sich selbst. Der Priester muss das Opfer berühren (Angriffswurf erforderlich). Rettungswurf gegen Todesmagie negiert. Bei Misserfolg stirbt das Opfer sofort und der Priester erhält temporäre Trefferpunkte.',
  description_en = 'By casting this spell, the priest slays another living creature and transfers part of its life energy to himself. The priest must touch the victim (attack roll required). Saving throw vs. death magic negates. On failure, the victim dies instantly and the priest gains temporary hit points.'
WHERE LOWER(name_en) = LOWER('Death Touch') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Spähen Täuschen — Drow',
  description = 'Schützt den Priester oder ein berührtes Wesen vor magischer und psionischer Überwachung. Kristallkugeln, ESP, Hellsehen und ähnliche Magie zeigen falsche oder irreführende Informationen über das geschützte Wesen. Der Schutz ist nicht erkennbar — der Spähende glaubt, korrekte Informationen zu erhalten.',
  description_en = 'Protects the priest or another touched being from magical and psionic surveillance. Crystal balls, ESP, clairvoyance, and similar magic show false or misleading information about the protected being. The protection is undetectable — the scryer believes they are receiving correct information.'
WHERE LOWER(name_en) = LOWER('Deceive Prying — Drow') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Unglaube',
  description = 'Ermöglicht dem Priester, sich selbst vorübergehend davon zu überzeugen, dass bestimmte Objekte oder Effekte nicht real sind. Dies gewährt Immunität gegen Illusionen und illusionsbasierte Angriffe, kann aber auch dazu führen, dass der Priester reale Gefahren ignoriert. Dauer: 1 Runde pro Stufe.',
  description_en = 'Allows the caster to temporarily convince himself that certain objects or effects are not real. This grants immunity to illusions and illusion-based attacks, but can also cause the priest to ignore real dangers. Duration: 1 round per level.'
WHERE LOWER(name_en) = LOWER('Disbelief') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Scheibe der Konkordanten Opposition',
  description = 'Eine schwächere Version eines Zaubers von Boccob dem Gleichgültigen. Erzeugt eine schimmernde Scheibe aus ausbalancierter positiver und negativer Energie. Die Scheibe kann als Schild (RK-Verbesserung) oder als Waffe (Energieschaden bei Berührung) eingesetzt werden. Gut und Böse werden gleichermaßen betroffen.',
  description_en = 'A weaker version of a spell used by Boccob the Uncaring. Creates a shimmering disc of balanced positive and negative energy. The disc can be used as a shield (AC improvement) or as a weapon (energy damage on contact). Good and evil are equally affected.'
WHERE LOWER(name_en) = LOWER('Disc of Concordant Opposition') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Göttliches Ereignis',
  description = 'Kombiniert drei Effekte: Vergangenheit Erspüren, Gegenwart Erspüren und Zukunft Erspüren. Der Priester erhält Visionen über ein bestimmtes Ereignis — was geschah, was gerade geschieht und was wahrscheinlich geschehen wird. Die Genauigkeit der Zukunftsvision nimmt mit der zeitlichen Entfernung ab.',
  description_en = 'Combines three effects: Divine Past, Divine Present, and Divine Future. The priest receives visions about a specific event — what happened, what is happening, and what is likely to happen. The accuracy of the future vision decreases with temporal distance.'
WHERE LOWER(name_en) = LOWER('Divine Event') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Schmerzhafte Verwesung',
  description = 'Betrifft ein einzelnes, aktuell verletztes lebendes Wesen — Untote und gesunde Kreaturen sind immun. Die Wunden des Opfers beginnen zu faulen und sich auszubreiten. Jede Runde verliert das Opfer weitere Trefferpunkte, und Heilmagie ist nur halb so effektiv. Nur Krankheit Heilen oder Wunsch beendet den Effekt.',
  description_en = 'Affects a single currently injured living being — undead and healthy creatures are immune. The victim''s wounds begin to rot and spread. Each round, the victim loses additional hit points, and healing magic is only half as effective. Only Cure Disease or Wish ends the effect.'
WHERE LOWER(name_en) = LOWER('Dolorous Decay') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Drachenbann',
  description = 'Verhindert, dass jeder Drache, der seinen Rettungswurf nicht besteht, den geschützten Bereich betritt. Der Bannkreis ist für Drachen sichtbar und strahlt mächtige Abwehrmagie aus. Drachen, die den Rettungswurf bestehen, können den Bereich betreten, fühlen sich aber unwohl. Dauer: 1 Runde pro Stufe.',
  description_en = 'Prevents any dragon that fails its saving throw from entering the protected area. The ward is visible to dragons and radiates powerful defensive magic. Dragons that make the save can enter the area but feel uncomfortable. Duration: 1 turn per level.'
WHERE LOWER(name_en) = LOWER('Dragonbane') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Sterbender Fluch — Altes Imperium',
  description = 'Der Priester rächt einen zukünftigen Tod. Jeder, der den Priester tötet, wird sofort und automatisch vom Fluch getroffen — kein Rettungswurf. Der Fluch kann verschiedene Formen annehmen (Krankheit, Pech, Schwäche) und hält permanent an, bis er durch mächtige Magie aufgehoben wird. Der Zauber muss vor dem Tod gewirkt werden.',
  description_en = 'The priest avenges a future death. Anyone who kills the priest is immediately and automatically struck by the curse — no saving throw. The curse can take various forms (disease, misfortune, weakness) and is permanent until lifted by powerful magic. The spell must be cast before death.'
WHERE LOWER(name_en) = LOWER('Dying Curse — Old Empire') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Erdwandeln — Zwerg',
  description = 'Ermöglicht dem Priester, in Stein und Erde einzutreten und sich durch diese hindurchzubewegen, als wäre sie Wasser. Der Priester kann Wände, Böden und Decken durchqueren. Die Bewegungsrate ist halb so schnell wie normal. Der Priester muss vor Ablauf des Zaubers die Erde wieder verlassen — sonst wird er im Stein eingeschlossen.',
  description_en = 'Enables the priest to pass into and through stone and earth as if it were water. The priest can traverse walls, floors, and ceilings. Movement rate is half normal. The priest must exit the earth before the spell expires — otherwise they become trapped in the stone.'
WHERE LOWER(name_en) = LOWER('Earth Walk — Dwarf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Erdverwüstung',
  description = 'Lässt einen Bereich Erde unfruchtbar und verdorrt werden. Gesunde Pflanzen welken, der Boden wird sauer und lebensfeindlich. Keine Pflanze kann auf dem betroffenen Boden für 1 Jahr pro Stufe des Priesters wachsen. Der Zauber betrifft auch unterirdische Wurzeln und Samen. Ein böser Akt.',
  description_en = 'Causes an area of soil to become barren and blighted. Healthy plants wilt, the soil turns sour and hostile to life. No plant can grow on the affected ground for 1 year per priest level. The spell also affects underground roots and seeds. An evil act.'
WHERE LOWER(name_en) = LOWER('Earthwrack') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Dauerhafte Wacht — Altes Imperium',
  description = 'Wirkt als begrenzte Form des Permanenz-Zaubers für Priesterzauber. Der Priester kann einen anderen Zauber auf einem Gegenstand oder Ort permanent machen. Nur bestimmte Schutzzauber können auf diese Weise permanentisiert werden. Der Prozess ist anstrengend und kostet den Priester temporäre Konstitutionspunkte.',
  description_en = 'Acts as a limited form of the Permanency spell for priest spells. The priest can make another spell permanent on an object or location. Only certain protective spells can be made permanent this way. The process is taxing and costs the priest temporary Constitution points.'
WHERE LOWER(name_en) = LOWER('Enduring Ward — Old Empire') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Ewig Blutende Wunden — Gnom',
  description = 'Legt einen Fluch auf das Ziel, der den Effekten eines Schwerts der Verwundung ähnelt. Das Opfer verliert 1 Trefferpunkt pro Runde und Wunde, und die Blutung kann nicht durch normale Heilmagie gestoppt werden — nur durch Fluch Brechen, Heilung oder physische Wundbehandlung (1 Runde pro Wunde). Rettungswurf gegen Zauber negiert.',
  description_en = 'Inflicts a curse similar to the effects of a Sword of Wounding. The victim loses 1 hit point per round per wound, and the bleeding cannot be stopped by normal healing magic — only by Remove Curse, Heal, or physical wound treatment (1 round per wound). Saving throw vs. spell negates.'
WHERE LOWER(name_en) = LOWER('Everbleeding Wounds — Gnome') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Immerwandelndes Selbst',
  description = 'Lässt den Körper des Priesters ständig Form und Aussehen verändern. Der Priester wechselt alle paar Runden zufällig in ein anderes humanoide Erscheinungsbild. Dies macht ihn extrem schwer zu verfolgen, zu identifizieren oder magisch aufzuspüren. Der Priester behält seine eigenen Attribute und Fähigkeiten. Dauer: 1 Runde pro Stufe.',
  description_en = 'Causes the caster''s body to constantly change shape and appearance. The priest randomly shifts to a different humanoid appearance every few rounds. This makes him extremely difficult to track, identify, or magically locate. The priest retains his own attributes and abilities. Duration: 1 turn per level.'
WHERE LOWER(name_en) = LOWER('Everchanging Self') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Fallende Mauer',
  description = 'Dieser mächtige Zauber wirkt nur auf Stein, Mauerwerk und Mörtel. Der Priester muss eine stehende Mauer berühren, die dann umstürzt und auf die gewünschte Seite fällt. Alle Kreaturen im Fallbereich erleiden Quetschschaden basierend auf der Mauergröße. Der Priester kann die Fallrichtung bestimmen.',
  description_en = 'This powerful spell works only upon stone, masonry, and mortar. The priest must touch a standing wall, which then topples and falls to the desired side. All creatures in the fall area suffer crushing damage based on wall size. The priest can determine the fall direction.'
WHERE LOWER(name_en) = LOWER('Falling Wall') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Falscher Sonnenaufgang',
  description = 'Ruft ein helles rötliches Licht herbei, als würde ein Sonnenaufgang stattfinden. Untote und lichtempfindliche Kreaturen werden geschädigt oder vertrieben. Drow und andere Wesen mit Lichtempfindlichkeit erleiden Kampfnachteile. Das Licht hält 1 Runde pro Stufe und kann einen Bereich von 91,4 m Radius erhellen.',
  description_en = 'Calls into existence a bright reddish light as if a sunrise were occurring. Undead and light-sensitive creatures are harmed or driven away. Drow and other beings with light sensitivity suffer combat penalties. The light lasts 1 turn per level and can illuminate an area of 91.4 m radius.'
WHERE LOWER(name_en) = LOWER('False Dawn') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Fantastische Maschine',
  description = 'Erschafft ein illusorisches, vielarmiges, lärmendes mechanisches Konstrukt von beeindruckender Erscheinung. Die Maschine schüchtert Feinde ein (Moral-Prüfung) und kann auch physischen Schaden verursachen, wenn die Illusion für real gehalten wird. Kreaturen, die die Illusion durchschauen, erleiden keinen Schaden. Der Priester steuert die Maschine mental.',
  description_en = 'Creates an illusory, many-armed, noisy mechanical construct of impressive appearance. The machine intimidates enemies (morale check) and can deal physical damage if the illusion is believed real. Creatures that see through the illusion take no damage. The priest controls the machine mentally.'
WHERE LOWER(name_en) = LOWER('Fantastic Machine') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Gestaltwandel Erzwingen',
  description = 'Ermöglicht dem Shukenja, jeden Gestaltwandler zu zwingen, seine wahre Form zu enthüllen. Der Gestaltwandler erhält einen Rettungswurf gegen Zauber mit −2. Bei Misserfolg wird er sofort in seine natürliche Form zurückverwandelt und kann sich für die Dauer des Zaubers nicht erneut verwandeln. Wirkt auf Lykanthropen, Doppelgänger und alle anderen formwandelnden Kreaturen.',
  description_en = 'Allows the shukenja to force any shapechanger to reveal its true form. The shapechanger receives a saving throw vs. spell at −2. On failure, it is immediately reverted to its natural form and cannot change shape again for the spell''s duration. Works on lycanthropes, doppelgangers, and all other shape-shifting creatures.'
WHERE LOWER(name_en) = LOWER('Force Shapechange') AND spell_type = 'priest';
