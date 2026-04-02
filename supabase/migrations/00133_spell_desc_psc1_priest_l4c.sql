-- ═══════════════════════════════════════════════════════════════════════════════
-- PSC1 Priest Spells Level 4 (Batch 3: 17 Spells — Creature of Darkness to Duplicate)
-- Metrisch, eng an Originaltexten orientiert
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.spells SET
  name = 'Kreatur der Dunkelheit',
  description = 'Erschafft ein bewegliches, vage menschenförmiges Feld magischer Dunkelheit, das magisches Licht und Dauerlicht bei Kontakt auslöscht. Der Priester kann es bis 9,1 m pro Stufe steuern und mit BW 12 schweben lassen. Er nimmt die Umgebung des Schattenwesens schwach wahr — nicht genug zum Lesen oder Erkennen von Gesichtern. Lebewesen können hindurchgehen, ohne es aufzulösen. Ein Wesen im Schatten wird vollständig verhüllt. Der Wirker kann darin bis zu 4 Runden levitieren oder Federfall nutzen, was den Zauber beendet.',
  description_en = 'Creates a mobile, vaguely humanoid field of magical darkness that quenches magical light and continual light on contact. The priest can control it up to 9.1 m per level and float it at MV 12. The caster dimly perceives the creature''s surroundings — not enough to read or recognize faces. Living beings can pass through without dispelling it. A being within is completely cloaked. The caster can use it to levitate for up to 4 rounds or feather fall, ending the spell.'
WHERE LOWER(name_en) = LOWER('Creature of Darkness') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Druck der Tiefe — Sahuagin',
  description = 'Erhöht augenblicklich den Luft- oder Wasserdruck im Wirkungsbereich auf 453,6 kg pro Quadratzoll (entspricht über 609,6 m Meerestiefe). Kreaturen, die den Rettungswurf gegen Zauber nicht bestehen, können 1W4 Runden lang keine komplexeren Handlungen als normale Bewegung oder Sprache ausführen und erleiden −4 auf Rettungswürfe sowie +4 Angriffsbonus für Gegner. Kreaturen, die nicht bis 609,6 m tief tauchen können, erleiden zusätzlich 2W4 Schaden. Wirkungslos in Tiefen über 1.152,4 m.',
  description_en = 'Momentarily increases air or water pressure in the area of effect to 453.6 kg per square inch (equivalent to over 609.6 m depth). Creatures failing a saving throw vs. spell cannot perform actions more complex than normal movement or speech for 1d4 rounds and suffer −4 to saving throws with +4 attack bonus for opponents. Creatures unable to dive to 609.6 m also take 2d4 damage. Ineffective at depths greater than 1,152.4 m.'
WHERE LOWER(name_en) = LOWER('Crush Of The Depths — Sahuagin') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Fluch des Erstickenden Sandes',
  description = 'Verwandelt Trinkwasser in leblosen Sand bei Berührung mit den Lippen des Opfers (Rettungswurf gegen Zauber zum Vermeiden). Hält 1 Tag pro Stufe des Wirkers an. Alle 8 Stunden unter dem Fluch: Konstitutionswurf (mit kumulativem −1 Abzug) oder 2 Stärkepunkte verlieren. Tod bei Stärke 0. Fluch Entfernen oder vollständiges Untertauchen in Wasser beendet den Effekt sofort. In Sand verwandelte Flüssigkeiten bleiben Sand.',
  description_en = 'Transforms drinking water into lifeless sand upon touching the victim''s lips (saving throw vs. spell to avoid). Lasts 1 day per caster level. Every 8 hours under the curse: Constitution check (cumulative −1 penalty) or lose 2 Strength points. Death occurs at Strength 0. Remove curse or complete immersion in water ends the effect immediately. Liquids turned to sand remain sand.'
WHERE LOWER(name_en) = LOWER('Curse of the Choking Sands') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Dunkle Aura',
  description = 'Erzeugt eine sphärische Atmosphäre aus Düsternis und Bedrohung mit 6,1 m Durchmesser pro Stufe, zentriert auf den Wirker. Böse Wesen erhalten +1 auf Angriffs- und Schadenswürfe; gute Wesen erleiden −1 auf Angriffs- und Schadenswürfe. Der Wirker persönlich erhält +3 auf Angriffs- und Schadenswürfe. Neutrale Wesen sind unberührt. Gute Wesen dürfen jede Runde einen Rettungswurf gegen Zauber mit −2 Abzug versuchen. Der Zauber umreißt gute Wesen mit farbigen Auren, die ihre Gesinnung offenbaren.',
  description_en = 'Creates a spherical miasma of gloom and menace with 6.1 m diameter per level, centered on the caster. Evil beings gain +1 to attack and damage rolls; good beings suffer −1 to attack and damage rolls. The caster personally gains +3 to attack and damage rolls. Neutral beings are unaffected. Good creatures may attempt a saving throw vs. spell at −2 each round. The spell outlines good beings with colored auras revealing their alignment.'
WHERE LOWER(name_en) = LOWER('Dark Aura') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Dunkle Umarmung — Drow',
  description = 'Manifestiert sich als schwarze Samtmaske auf dem Gesicht des Wirkers, die 1 Runde plus 1 Runde pro Stufe anhält. In einer folgenden Runde kann der Priester einen memorierten Zauber der Stufe 3 oder niedriger mit einem einzigen Machtwort auslösen (Wirkzeit 1). Nur Berührungs- oder Flächenzauber ohne physische Manifestation sind erlaubt. Die Maske wirkt als Träger: Kein Rettungswurf gegen die Umarmung selbst, aber Magieresistenz und Rettungswürfe gegen den übertragenen Zauber gelten — mit 10 % Abzug auf Magieresistenz und −3 auf den Rettungswurf.',
  description_en = 'Manifests as a black velvet half-mask on the caster''s face lasting 1 turn plus 1 round per level. In a subsequent round, the priest can unleash a memorized spell of 3rd level or less with a single word of power (casting time 1). Only touch-delivered or area-effect spells without physical manifestation are allowed. The mask acts as a carrier: no saving throw against the embrace itself, but magic resistance and saving throws against the carried spell apply — with 10% penalty to magic resistance and −3 to saving throws.'
WHERE LOWER(name_en) = LOWER('Dark Embrace — Drow') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Dunkelblitz',
  description = 'Schleudert einen 10,2 cm breiten Strahl der Dunkelheit in gerader Linie aus der Hand des Wirkers. Ein Dunkelblitz pro Runde bis der Zauber abläuft oder ein anderer Zauber gewirkt wird. Lebende Kreaturen erleiden 2W4 Kälteschaden; Untote werden für 1 Runde gelähmt (Rettungswurf gegen Lähmung negiert bei Untoten). Getroffene Kreaturen werden zudem für 1W4 Runden magisch zum Schweigen gebracht. Erfolgreicher Rettungswurf gegen Zauber verhindert die Stille, nicht den Schaden.',
  description_en = 'Hurls a 10.2 cm beam of darkness in a straight line from the caster''s hand. One darkbolt per round until the spell expires or another spell is cast. Living creatures take 2d4 chill damage; undead are held for 1 round (saving throw vs. paralyzation negates for undead). Struck creatures are also silenced for 1d4 rounds. A successful saving throw vs. spell negates the silence but not the damage.'
WHERE LOWER(name_en) = LOWER('Darkbolt') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Totenmarsch',
  description = 'Animiert bis zu 10 Leichen oder Körperteile pro Stufe, ohne sie zu Untoten zu machen. Die animierten Objekte schweben 1–4,3 m über dem Boden und driften mit BW Fl 10 (E) in eine Richtung. Der Wirker kann sie jederzeit durch Konzentration umlenken, auch während er andere Zauber wirkt. Die Magie wird durch Stürze, Unterwasser oder Kleidung nicht beendet. Einzelgegenstände dürfen nicht mehr als 90,7 kg wiegen. Kann nicht durch Untoten-Magie beeinflusst oder vertrieben werden.',
  description_en = 'Animates up to 10 corpses or body parts per level without making them undead. The animated objects float 1–4.3 m above ground and drift at MV Fl 10 (E) in a single direction. The caster can redirect them at any time by concentrating, even while casting other spells. The magic is not broken by falls, underwater travel, or dressing the dead. Individual items cannot weigh over 90.7 kg. Cannot be affected by undead-controlling magic or turned.'
WHERE LOWER(name_en) = LOWER('Dead March') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Tödlicher Tanz',
  description = 'Wirkt auf den Zauberwirker oder eine berührte vierbeinige zweibeinige Kreatur (z. B. einen Menschen). Verfällt, wenn auf eine andere Kreaturart angewandt oder die Gestalt gewechselt wird. Erhöht Geschicklichkeit um 2, verleiht perfekte Balance und erlaubt präzise Sprünge, Zauber und Angriffe im Sprung. Jede Runde kann der Empfänger entweder mit +3 auf Angriffswürfe angreifen oder die doppelte Anzahl normaler Angriffe ausführen.',
  description_en = 'Affects the caster or a touched four-limbed bipedal creature (such as a human). Wasted if used on another creature type or if the recipient changes form. Increases Dexterity by 2, grants perfect balance, and allows pinpoint leaps, spellcasting, and attacks mid-leap. Each round the recipient can either attack with a +3 bonus to attack rolls or take double the usual number of normal attacks.'
WHERE LOWER(name_en) = LOWER('Deadly Dance') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Zersetzen',
  description = 'Verwandelt organisches Material bis zu 68 kg sofort in Humus oder Kompost. Lebende Materie ist nicht betroffen, aber Leichen (auch frische) schon. Untote mit körperlicher Form müssen bei missglücktem Rettungswurf gegen Todesmagie betroffen werden. Magische Gegenstände aus organischem Material erfordern einen Rettungswurf gegen Auflösung. Nichtmagische organische Gegenstände (Türen, Teppiche) erhalten keinen Rettungswurf. Zersetzte Kreaturen können wiederbelebt werden, wenn der Staub sorgfältig gesammelt wird.',
  description_en = 'Instantly turns organic material up to 68 kg into humus or compost. Living matter is unaffected, but corpses (even fresh ones) are. Undead with corporeal forms are affected on a failed saving throw vs. death magic. Magical items of organic composition require a saving throw vs. disintegration. Nonmagical organic items (doors, rugs) receive no saving throw. Decomposed creatures can be raised if the dust is carefully collected.'
WHERE LOWER(name_en) = LOWER('Decompose') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Defensive Harmonie',
  description = 'Muss auf mindestens zwei Kreaturen gewirkt werden (eine pro zwei Stufen, alle innerhalb von 0,9 m). Danach können sich die Betroffenen frei bewegen. Jede betroffene Kreatur erhält +1 auf Rüstungsklasse pro weitere betroffene Kreatur (maximal +5). Bei vier Betroffenen hat also jeder +3 RK-Bonus. Dieser Bonus stellt eine mystische Koordination von Angriff und Verteidigung dar. Die Gruppe muss in einem einzigen Kampf kämpfen; teilt sie sich auf, verfällt der Bonus.',
  description_en = 'Must be cast on at least two creatures (one per two levels, all within 0.9 m). Afterward, affected individuals can move freely. Each affected creature gains +1 to Armor Class per other affected creature (maximum +5). With four affected, each gets +3 AC bonus. This bonus represents mystical coordination of attack and defense. The group must fight in a single battle; if split, the bonus is lost.'
WHERE LOWER(name_en) = LOWER('Defensive Harmony') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Schändergeruch',
  description = 'Ermöglicht dem Priester zu erkennen, ob ein bestimmtes Wesen ein Schänder (Defiler) ist, gibt aber keinen Aufschluss darüber, ob es ein Zauberwirker ist. Der Priester wählt eine Kreatur innerhalb von 9,1 m pro Stufe, konzentriert sich 1 Runde lang und wartet auf die spirituellen Gerüche. Bewahrer und normale Kreaturen riechen gewöhnlich; Schänder tragen den bitteren Geruch von schwellendem Fleisch.',
  description_en = 'Allows the priest to discern whether a particular being is a defiler, but does not reveal if the creature is a spellcaster. The priest picks a creature within 9.1 m per level, concentrates for one round, and waits for the spiritual odors. Preservers and normal creatures smell normally; defilers carry the bitter scent of smoldering meat.'
WHERE LOWER(name_en) = LOWER('Defiler Scent') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Psionik Ablenken — Duergar',
  description = 'Lenkt psionische Angriffe gegen den Priester ab. Für die Dauer des Zaubers muss jeder Angreifer, der eine psionische Attacke auf den Wirker richtet, erst einen Rettungswurf gegen Zauber bestehen. Bei Erfolg wirkt der Angriff normal. Bei Misserfolg wird der Angriff auf ein anderes Wesen innerhalb von 9,1 m umgelenkt (nach PSP, dann Intelligenz, dann Zufall). Ist kein geeignetes Ziel in Reichweite, trifft der Angriff den Priester normal.',
  description_en = 'Deflects psionic attacks against the priest. For the duration, any being directing a psionic attack at the caster must first make a saving throw vs. spell. On success, the attack proceeds normally. On failure, the attack is shifted to another being within 9.1 m (by most PSPs, then highest Intelligence, then random). If no suitable target is in range, the attack proceeds normally against the priest.'
WHERE LOWER(name_en) = LOWER('Deflect Psionics — Duergar') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Tierangreifer Entdecken',
  description = 'Gibt dem Druiden ein visuelles Bild entweder der Kreatur, die ein Tier verletzt hat, oder des Tieres, das ein Opfer angegriffen hat (je nach Wirkweise). Wirkt nur innerhalb 1 Stunde pro Stufe nach der Verletzung. Der Druide berührt die Wunde kurz und erhält eine flüchtige Vision des Angreifers zum Zeitpunkt des Angriffs, einschließlich Größe, primärer Angriffsmethode und Gesinnung. Wenn der Angreifer noch lebt und seinen Rettungswurf nicht besteht, spürt der Wirker Position und Reiserichtung.',
  description_en = 'Gives the druid a visual image of either the creature that injured an animal or the animal that attacked a victim (depending on how cast). Works only within 1 hour per caster level after the injury. The druid briefly touches the wound and receives a fleeting vision of the attacker at the time of attack, including size, primary attack method, and alignment. If the attacker still lives and fails a saving throw vs. spell, the caster senses position and direction of travel.'
WHERE LOWER(name_en) = LOWER('Detect Animal Attacker') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Dimensionsfaltung',
  description = 'Faltet den dreidimensionalen Raum durch eine höhere Dimension und öffnet ein kreisförmiges Tor von bis zu 3 m Durchmesser für 1 volle Runde. Das Tor ermöglicht augenblicklichen, bidirektionalen Zugang zu einem entfernten Ort auf derselben Existenzebene. Die Sicht durch das Tor ist klar und ungehindert in beide Richtungen. Anders als bei Teleportation besteht kein Risiko einer falschen Ankunft, da das Tor immer innerhalb von 1,5 m des gewünschten Ziels erscheint. Birgt jedoch ein Zeitverzerrungsrisiko.',
  description_en = 'Folds three-dimensional space through a higher dimension, opening a circular gate up to 3 m in diameter for 1 full round. The gate allows instantaneous, bidirectional access to a distant locale on the same plane. Vision through the gate is clear and unobstructed in both directions. Unlike teleport, there is no risk of wrong destination — the gate always opens within 1.5 m of the desired location. However, carries a risk of time distortion.'
WHERE LOWER(name_en) = LOWER('Dimensional Folding') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Flut des Verderbens',
  description = 'Erzeugt einen schwarzen, kriechenden Nebel aus maximal acht 3 × 3 m Würfeln direkt vor dem Wirker. Kann stationär sein oder sich mit 2,7 m pro Runde vorwärtsbewegen (Wahl beim Wirken, nicht änderbar). Alle Geschoss- und gezielten Angriffe (inkl. Zauber) erleiden −4. Alle Kreaturen darin erleiden −4 Initiativeabzug. Wesen unter Stufe/TW 7 müssen jede Runde einen Rettungswurf gegen Zauber bestehen oder sind benommen. Zerstörbar durch Magie Bannen, magischen Windstoß oder dampfbeeinflussende Magie.',
  description_en = 'Creates a black, creeping mist of up to eight 3 × 3 m cubes directly in front of the caster. Can be stationary or move at 2.7 m per round (chosen at casting, not alterable). All missile and aimed attacks (including spells) suffer −4. All creatures within suffer −4 initiative penalty. Beings below level/HD 7 must save vs. spell each round or are dazed. Destroyed by dispel magic, magical gust of wind, or vapor-affecting magic.'
WHERE LOWER(name_en) = LOWER('Doomtide') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Münzverdopplung',
  description = 'Verbraucht eine einzelne Münze oder Metallscheibe und ersetzt sie durch zwei identische Kopien — einschließlich aller Kratzer und Markierungen. Der Zauber zerstört jeden vorhandenen Dweomer auf den Münzen. Bei jedem Wirken muss der Priester einen Rettungswurf gegen Zauber bestehen. Bei Misserfolg: permanenter Verlust von 1 Trefferpunkt, aber 2W12 zusätzliche Kopien erscheinen. Wirkt nur auf Metall, nicht auf Edelsteine, Holzmarken oder Mischgegenstände.',
  description_en = 'Consumes a single coin or metal disc and replaces it with two identical copies — including all scratches and markings. The spell destroys any dweomer on the coins. Each casting requires the priest to make a saving throw vs. spell. On failure: permanent loss of 1 hit point, but 2d12 additional copies appear. Works only on metal, not on gems, wooden tokens, or composite items.'
WHERE LOWER(name_en) = LOWER('Doublecoin') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Drachenschuppen',
  description = 'Lässt Drachenschuppen aus der Haut des Priesters wachsen, die den gesamten Körper außer dem Kopf bedecken. Verleiht eine Basis-RK von 4 oder +2 RK-Bonus, je nachdem was besser ist. Der Wirker bestimmt die Farbe der Schuppen, die einer chromatischen Drachenart entsprechen muss (weiß, schwarz, grün, blau oder rot). Materialkomponente: das Heilige Symbol des Priesters und eine einzelne Drachenschuppe.',
  description_en = 'Causes dragon scales to grow from the priest''s skin, covering the entire body except the head. Grants a base AC of 4 or a +2 AC bonus, whichever is better. The caster determines the tint of the scales, which must correspond to a chromatic dragon species (white, black, green, blue, or red). Material components: the priest''s holy symbol and a single dragon scale.'
WHERE LOWER(name_en) = LOWER('Dragon Scales') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Duplizieren',
  description = 'Lässt eine durchscheinende, magische Federkiel erscheinen, die eigene Tinte erzeugt und jede Schrift oder Inschrift in Reichweite auf eine verfügbare Schreibfläche kopiert. Kann Zauber kopieren und identisch funktionierende Duplikate von Explosive Runen, Glyphen und ähnlichem erstellen, ohne diese auszulösen. Wenn die Fläche oder Dauer nicht für die vollständige Kopie ausreicht, verblasst alles Kopierte. Jedes Wirken kostet den Priester 1 TP pro Stufe (nur heilbar durch Begrenzter Wunsch, Wunsch oder Heilung in einem Oghma-Tempel).',
  description_en = 'Conjures a translucent magical quill that generates its own ink and copies any writing or inscription within range onto an available surface. Can copy spells, creating identically functioning duplicates of explosive runes, glyphs, and similar magic without triggering them. If the surface or duration is insufficient for the full copy, all copied writing fades. Each casting costs the priest 1 HP per level (only recoverable via limited wish, wish, or heal in an Oghma temple).'
WHERE LOWER(name_en) = LOWER('Duplicate') AND spell_type = 'priest';
