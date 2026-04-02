-- ═══════════════════════════════════════════════════════════════════════════════
-- PSC1 Priest Spells Level 3 (Batch 1: 18 Spells — Ability Alteration to Chant of Fangs)
-- Metrisch, eng an Originaltexten orientiert
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.spells SET
  name = 'Attributsveränderung',
  description = 'Der Priester kann eines oder mehrere seiner physischen Attribute verbessern, indem er vorübergehend ein anderes physisches Attribut unterdrückt. Das Verhältnis beträgt 2 ausgegebene Punkte zu 1 gewonnenen. Kein Attributswert kann durch diesen Zauber unter 8 gesenkt werden, und Rassenmaxima/-minima dürfen nicht überschritten werden. Ausnahmestärke ist möglich, kostet aber 2 Punkte pro 10 % Gewinn. Bei Ablauf des Zaubers werden die ursprünglichen Werte wiederhergestellt.',
  description_en = 'The priest can enhance one or more physical abilities by temporarily suppressing another physical ability. The ratio is 2 points expended to 1 gained. No ability score can be reduced below 8, and racial maximums or minimums cannot be exceeded. Exceptional strength is possible but costs 2 points per 10% gain. When the spell expires, original ability scores are restored.'
WHERE LOWER(name_en) = LOWER('Ability Alteration') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Beschleunigte Heilung',
  description = 'Ermöglicht der betroffenen Kreatur, natürliche Heilung mit doppelter Geschwindigkeit für 1W4 Tage zu erfahren. Ein betroffenes Individuum regeneriert 2 Trefferpunkte pro Tag normaler Ruhe oder 6 Trefferpunkte pro Tag Bettruhe. Der Zauber hat keine Wirkung auf Heiltränke oder andere magische Heilungsformen.',
  description_en = 'Enables the affected creature to experience natural healing at twice the normal rate for 1d4 days. An affected individual regains 2 hit points per day of normal rest or 6 hit points per day of bed rest. The spell has no effect on potions of healing or other magical forms of healing.'
WHERE LOWER(name_en) = LOWER('Accelerate Healing') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Luftlinse',
  description = 'Der Priester erschafft eine magische Linse hoch in der Luft, mit der er gebündelte Sonnenstrahlen gegen Feinde richten kann. Der Zauberer muss für die Dauer im Sonnenlicht stehen. Die Linse kann zweimal pro Runde angreifen, gegen ein oder zwei Kreaturen in Reichweite. Jeder Treffer verursacht 2W6 Schadenspunkte. Kreaturen mit Hitze- oder Feuerresistenz erleiden nur halben Schaden. Brennbare Materialien können entzündet werden; persönliche Ausrüstung kann mit −4 Abzug gezielt werden.',
  description_en = 'The priest creates a magical lens high in the air to direct intensified rays of the sun against enemies. The caster must be in sunlight for the duration. The lens can attack twice per round against one or two creatures within range. Each hit inflicts 2d6 damage. Creatures resistant to heat or fire take only half damage. Flammable materials can be ignited; personal equipment can be targeted at a −4 penalty.'
WHERE LOWER(name_en) = LOWER('Air Lens') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Amanuensis',
  description = 'Erzeugt eigene Tinte und animiert eine Schreibfeder, um nichtmagische Schriften exakt zu kopieren. Die Feder schreibt so schnell wie der Zauberer und kopiert so viel wie möglich vor Ablauf des Zaubers. Perfekte Fälschungen sind möglich. Die Feder arbeitet unabhängig weiter, selbst wenn der Zauberer nicht anwesend ist — nur Zerstörung der Schreibfläche oder Magie Bannen stoppt sie. Magische Schriften oder Symbole können nicht kopiert werden.',
  description_en = 'Generates its own ink and animates a quill pen to precisely duplicate nonmagical writing. The quill writes as fast as the caster and copies as much as possible before the spell expires. Perfect forgeries are possible. The quill continues independently even without the caster present — only destruction of the writing surface or dispel magic stops it. Magical writing or symbols cannot be copied.'
WHERE LOWER(name_en) = LOWER('Amanuensis') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Tiertrick',
  description = 'Ermöglicht vorübergehend jedem Tier, einen Trick auszuführen, den es normalerweise nicht kennt oder für den es nicht intelligent genug ist. Das Tier muss innerhalb von 27,4 m sein und gesprochene Befehle hören können. Kreaturen mit weniger als 5 TW und ohne vorherige Bindung erhalten keinen Rettungswurf. Der Zauberer muss spezifische Anweisungen geben, keine allgemeinen Befehle. Der Trick darf die physischen Grenzen des Tieres nicht überschreiten.',
  description_en = 'Temporarily enables any animal to perform a trick it normally doesn''t know or lacks the intelligence to execute. The animal must be within 27.4 m and able to hear spoken commands. Creatures with less than 5 HD and no prior allegiances receive no saving throw. The caster must give specific instructions, not general commands. The trick cannot exceed the animal''s physical limitations.'
WHERE LOWER(name_en) = LOWER('Animal Trick') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Schützenschanze — Elf',
  description = 'Erschafft eine unsichtbare, unbewegliche Barriere mit einem schmalen Pfeilschlitz, die den Zauberer vollständig umschließt. Bietet RK 2 gegen Frontalangriffe und RK 0 gegen alle anderen Angriffe, plus +1 auf Rettungswürfe. Man kann die Schanze nicht bewegen; Verlassen beendet den Zauber. Der Pfeilschlitz kann mental vom Zauberer umpositioniert werden. Bögen und Armbrüste können ungehindert abgefeuert werden, aber Nahkampf- oder Wurfwaffen sind nicht möglich.',
  description_en = 'Creates an immobile, invisible barrier with a narrow arrow slit that totally encompasses the caster. Provides AC 2 against frontal attacks and AC 0 against all other attacks, plus +1 to saving throws. The redoubt cannot be moved; leaving ends the spell. The arrow slit can be mentally repositioned by the caster. Bows and crossbows can be fired without hindrance, but melee or hurled weapons cannot be used.'
WHERE LOWER(name_en) = LOWER('Archer''s Redoubt — Elf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Rüstung der Dunkelheit',
  description = 'Erschafft einen flackernden Mantel magischer Dunkelheit um die berührte Kreatur. Verbessert die RK um 1 Punkt pro vier Erfahrungsstufen des Zauberers. Reduziert nichtmagischen Schaden um 1W4 Punkte pro Runde (2W4 ab Stufe 12). Gewährt Infravision mit 18,3 m Reichweite und Immunität gegen hypnotische Magie. Der Träger erhält +2 auf Rettungswürfe gegen Verzauberungs-/Bezauberungszauber. Untote mit dieser Rüstung sind immun gegen sichtbasiertes Vertreiben.',
  description_en = 'Creates a flickering shroud of magical darkness around the creature touched. Improves AC by 1 point per four caster levels. Reduces nonmagical damage by 1d4 points per round (2d4 at level 12+). Grants 18.3 m infravision and immunity to hypnotic magic. The wearer receives +2 on saving throws vs. enchantment/charm spells. Undead wearing this armor are immune to sight-based turning attempts.'
WHERE LOWER(name_en) = LOWER('Armor of Darkness') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Astaroths Stärkung',
  description = 'Erhöht dauerhaft einen Attributswert (oder zwei Unterattribute mit optionalen Regeln) um 1 Punkt, maximal auf 18. Zur Aufrechterhaltung muss der Zauberer einmal pro Quartal ein Individuum in einer Machtposition verderben oder ein hilfloses Wesen in Gargauths Namen opfern. Wird der Vertrag gebrochen, verliert der Zauberer sofort 3 Punkte im erhöhten Attribut. Fällt ein Attribut unter 3 durch kumulative Strafen, wird der Zauberer in einen Lemure verwandelt und nach Baator transportiert. Das Wirken dieses Zaubers ist eine ausdrücklich böse Tat.',
  description_en = 'Permanently raises one ability score (or two subability scores with optional rules) by 1 point, to a maximum of 18. To maintain this, the caster must corrupt one individual in power or sacrifice one helpless sentient every quarter in Gargauth''s name. If the contract is broken, the caster immediately loses 3 points in the augmented ability. If any ability falls below 3 from cumulative penalties, the caster is transformed into a lemure and transported to Baator. Casting this spell is a patently evil act.'
WHERE LOWER(name_en) = LOWER('Astaroth''s Augmentation') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Fetisch Binden',
  description = 'Bindet dauerhaft einen Fetischgeist an einen festen Gegenstand aus Holz, Knochen, Keramik oder Stein, der von einem geschickten Handwerker gefertigt wurde. Der Gegenstand muss verstörend oder unangenehm aussehen, damit der Geist sich wohlfühlt. Der Fetischgeist erhält einen Rettungswurf gegen Zauber — bei Erfolg kann er den Zauberer angreifen. Fühlt sich der Geist im Objekt nicht wohl, unternimmt er wiederholte Fluchtversuche. Nur ein Fetischgeist kann in einem Fetischobjekt wohnen.',
  description_en = 'Permanently binds a fetish spirit to a solid object made of wood, bone, pottery, or rock fashioned by a skilled craftsman. The object must look disturbing or unpleasant so the fetish feels at home. The spirit is allowed a saving throw vs. spell — success means it can attack the caster. If the spirit does not feel at ease, it makes repeated escape attempts. Only one fetish spirit can dwell in a fetish object.'
WHERE LOWER(name_en) = LOWER('Bind Fetish') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Raubvogel — Altes Reich',
  description = 'Erschafft eine falkenförmige Kraftregion, die über der Zielkreatur schwebt. Jede zweite Runde stürzt der Raubvogel mit +3 Initiativebonus und dem ETW0 des Priesters mit +2 Bonus herab. Ein Treffer verursacht 2W4+2 Schadenspunkte. Der Raubvogel steigt auf 9,1 bis 12,2 m über den Zauberer und verfolgt sein Ziel unabhängig. Unsichtbarkeit bietet keinen Schutz. Nur Magie Bannen beendet den Effekt; alternativ endet er durch Blink, Dimensionstor oder Teleportation des Ziels. Ein Schildzauber lässt den Raubvogel automatisch verfehlen.',
  description_en = 'Creates a hawk-shaped region of force hovering above the target creature. Every second round, the bird dives with +3 initiative bonus and the priest''s THAC0 with +2 bonus. A hit inflicts 2d4+2 damage. The bird climbs to 9.1 to 12.2 m above the caster and pursues its target independently. Invisibility offers no protection. Only dispel magic ends the effect; alternatively, blink, dimension door, or teleport by the target dissipates it. A shield spell causes it to miss automatically.'
WHERE LOWER(name_en) = LOWER('Bird Of Prey — Old Empire') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Schwarze Hand',
  description = 'Negiert die Wirkung von Schutz vor Bösem, einschließlich der 3-m-Radius-Version, und kann die Schutzaura von Paladinen unterdrücken. Die Hände des Priesters werden von einer schwarzen Aura umhüllt. Jede Runde kann er bei Konzentration auf eine Zielkreatur in Reichweite zeigen. Paladine erhalten einen Rettungswurf gegen Zauber — bei Erfolg wird ihre Aura für 1 Runde pro 2 Stufen des Priesters aufgehoben, bei Misserfolg für 2 Runden pro Stufe.',
  description_en = 'Negates the effect of protection from evil spells, including the 3 m radius version, and can suppress a paladin''s protection aura. The priest''s hands become enveloped in a black aura. Each round while concentrating, the priest can point at one target creature within range. Paladins receive a saving throw vs. spell — on success their aura is canceled for 1 round per 2 caster levels, on failure for 2 rounds per caster level.'
WHERE LOWER(name_en) = LOWER('Blackhand') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Schwarzlicht',
  description = 'Erschafft einen stationären Bereich totaler Dunkelheit, undurchdringlich für normales Sehen und Infravision — aber der Zauberer kann darin normal sehen, sich bewegen und zaubern. Andere im Bereich erhalten jede Runde einen Rettungswurf gegen Zauber mit −3 Abzug. Kreaturen im Schwarzlichtbereich erleiden −4 auf Angriffswürfe, Rettungswürfe und Rüstungsklasse. Charaktere mit Blindkampf-Fertigkeit haben nur −2 auf Angriffs- und Rettungswürfe ohne RK-Abzug.',
  description_en = 'Creates a stationary area of total darkness, impenetrable to normal vision and infravision — but the caster can see, move, and cast spells normally within. Others in the area receive a saving throw vs. spell at −3 each round. Creatures in the area suffer −4 to attack rolls, saving throws, and Armor Class. Characters with blind-fighting proficiency suffer only −2 to attack and saving throws with no AC penalty.'
WHERE LOWER(name_en) = LOWER('Blacklight') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Gesegnete Handwerkskunst — Zwerg',
  description = 'Verbessert die Fertigkeiten des Empfängers bei einem bestimmten Projekt. Die Verzauberung ist vorübergehend, aber das bearbeitete Objekt wird dauerhaft verbessert. Der Empfänger muss mindestens 8 Stunden täglich ohne wesentliche Unterbrechung am gewählten Objekt arbeiten. Der Zauber gewährt +3 auf den NWP-Wurf für jede handwerkliche Fertigkeit wie Rüstungsschmied, Schmied, Zimmermann, Edelsteinschleifer, Lederverarbeitung, Töpferei, Steinmetz oder Waffenschmied. Eine 20 ist dennoch immer ein Fehlschlag.',
  description_en = 'Augments the recipient''s skills while working on a particular project. The enchantment is temporary, but the item worked on is permanently enhanced. The recipient must work a minimum of 8 hours per day on the selected object without significant interruption. The spell adds +3 to the NWP check for any artisan proficiency such as armorer, blacksmithing, carpentry, gem cutting, leatherworking, pottery, stone masonry, or weaponsmithing. A roll of 20 is still a failure.'
WHERE LOWER(name_en) = LOWER('Blessed Craftsmanship — Dwarf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Glückssegen',
  description = 'Erhöht vorübergehend die Fähigkeiten eines Abenteurers. Der Empfänger kann unbekannte Waffen ohne Abzug führen und erhält +2 auf Angriffs- und Schadenswürfe mit vertrauten Waffen sowie +2 auf alle Attributswürfe. Wirkt nur auf zweibeinige Landsäugetiere (nicht unter Wasser). Der Zauber kann nicht vorzeitig beendet werden, außer durch magische Gegenwirkung. Es gilt als Sünde für Priester Tymoras, den Zauber auf sich selbst zu wirken, es sei denn, dies dient direkt den Zielen der Göttin.',
  description_en = 'Temporarily increases an adventurer''s abilities. The recipient can wield unfamiliar weapons without penalty and gains +2 to attack and damage rolls with proficient weapons, plus +2 to all ability checks. Only effective on bipedal land mammals (not underwater). The spell cannot expire early unless magically countered. It is considered sinful for a priest of Tymora to use this spell on themselves unless directly serving the goddess''s aims.'
WHERE LOWER(name_en) = LOWER('Boon of Fortune') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Dornenstock',
  description = 'Lässt einen gewöhnlichen Holzstab oder Knüppel dicke, extrem harte Dornen an einem Ende sprießen. Der Stab gewährt +2 auf den Angriffswurf des Zauberers und verursacht doppelten Schaden für die Dauer des Zaubers. Ein Dornenstock kann Kreaturen treffen, die nur von magischen Waffen verletzt werden können.',
  description_en = 'Causes an ordinary wooden staff or club to sprout thick, extremely hard spikes on one end. The staff adds +2 to the caster''s attack roll and inflicts double damage for the duration. A bramblestaff can affect any creature harmed only by magical weapons.'
WHERE LOWER(name_en) = LOWER('Bramblestaff') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Gefolgsmann Rufen — Waldläufer',
  description = 'Ein Waldläufer, der noch nicht alle seine Gefolgsleute erhalten hat, kann versuchen, einen herbeizurufen. Nach dem Wirken konsultiert der SL heimlich eine Tabelle oder Liste. Wenn ein potenzieller Gefolgsmann im Wirkungsbereich ist, erscheint er innerhalb der nächsten 24 Stunden. Der Waldläufer kann keinen bestimmten Typ rufen — die Art wird vom SL bestimmt. Dieser Zauber kann höchstens einmal pro Monat versucht werden.',
  description_en = 'A ranger who has not yet received his full allotment of followers can attempt to summon one. After casting, the DM secretly consults an appropriate table or list. If a potential follower is within the area of effect, it appears within 24 hours. The ranger cannot call a specific type — the type is determined by the DM. This spell can be attempted no more than once per month.'
WHERE LOWER(name_en) = LOWER('Call Follower — Ranger') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Züchtigung',
  description = 'Der Shukenja kann eine vernichtende Zurechtweisung gegen Feinde schleudern. Feinde gleicher Gesinnung müssen einen Rettungswurf gegen Zauber bestehen oder werden für 1W3 Runden taub. Feinde mit einer abweichenden Gesinnungskomponente erleiden 1 Schadenspunkt pro Stufe (halber Schaden bei erfolgreichem Rettungswurf). Feinde mit beiden abweichenden Komponenten erleiden 1W4 Schaden pro Stufe (halbiert bei erfolgreichem Wurf).',
  description_en = 'The shukenja delivers a blasting rebuke against foes. Foes of the same alignment must save vs. spell or be deafened for 1d3 rounds. Foes with one differing alignment component take 1 point of damage per caster level (half on successful save). Foes with both components different take 1d4 damage per level (half on successful save).'
WHERE LOWER(name_en) = LOWER('Castigate') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Gesang der Reißzähne',
  description = 'Durch lautes Singen erschafft der Priester ein Paar geisterhafte Kiefer — schwebende Reißzähne, die aus der Hand oder Brust des Zauberers fliegen und ein Ziel mit BW Fl 15 (A) verfolgen. Sie schlagen zweimal pro Runde mit dem ETW0 des Zauberers zu und agieren unabhängig. Der Biss verursacht 2W4 Schadenspunkte (Rettungswurf für halben Schaden) als energiestehlenden Angriff, der jede physische Rüstung bis hin zu Plattenrüstung durchdringt. Das Ziel kann nach der ersten Runde einmalig gewechselt werden.',
  description_en = 'By chanting loudly, the priest creates a pair of spectral jaws — floating fangs that fly from the caster''s hand or chest and pursue a target at MV Fl 15 (A). They strike twice per round at the caster''s THAC0 and operate independently. The bite inflicts 2d4 damage (save for half) as an energy-stealing attack that penetrates any physical protection up to plate armor. The target can be changed once after the first round.'
WHERE LOWER(name_en) = LOWER('Chant of Fangs') AND spell_type = 'priest';
