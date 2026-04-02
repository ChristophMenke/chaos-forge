-- ═══════════════════════════════════════════════════════════════════════════════
-- WSC1 Wizard Spells Level 5 (Batch 2: 15 Spells — Blastcloak to Create Slipgate)
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.spells SET
  description = 'Mächtigere Version von Rückschlag. Schleudert Flammen- und Feuerzauber an ihre Quelle zurück UND reflektiert auch Kälte-/Eis-Zauber (nicht Blitze oder reine Hitze). Schützt eine einzelne Kreatur. Funktioniert automatisch ohne Konzentration. Reflektiert alle feurigen UND kalten Angriffe in einer Runde, dann endet der Zauber. Wird die Quelle auf einer anderen Ebene gesucht: Angriffsmagie wird negiert. Hält bis Aktivierung, Magie Bannen, 1 Runde + 1/Stufe, Tod oder Ebenenwechsel. Komponente: V.',
  description_en = 'More powerful version of Backblast. Hurls back flame/fire spells at their source AND also reflects cold/ice spells (not lightning or heat alone). Protects a single creature. Functions automatically without concentration. Reflects all fiery AND cold attacks in a single round, then ends. If the source is on another plane: the attacking magic is negated. Lasts until activated, Dispel Magic, 1 turn + 1/level, death, or plane change. Component: V.'
WHERE LOWER(name_en) = LOWER('Blastcloak — Phaerimm') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Der Zauberkundige berührt die Zielkreatur und sendet sie an einen anderen Ort in Sichtweite. Die Person bleibt dort für eine Runde und kehrt dann mit allem Getragenen zum Ausgangspunkt zurück. Am Zielort hat die Person eine freie Runde zum Handeln (Gegenstand aufheben, Hebel betätigen, Schloss prüfen etc.). Kann nicht auf unwillige Kreaturen gewirkt werden. Die Rückkehr ist automatisch und fehlerfrei. Materialkomponente: V, S, M.',
  description_en = 'The caster touches the target creature and sends it to another location within sight. The individual remains there for one round, then returns with all carried items to the starting point. At the destination, the person has a free round to act (pick up an object, pull a lever, examine a lock, etc.). Cannot be cast on unwilling creatures. The return is automatic and error-free. Material component: V, S, M.'
WHERE LOWER(name_en) = LOWER('Bowgentle''s Fleeting Journey') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Erzeugt eine unsichtbare Kraftebene (15,2 m Seitenlänge), die völlig undurchlässig für alle drachischen Odemwaffen ist. Der Drache kann die Wand überall innerhalb der Reichweite positionieren und muss bei der Entstehung NICHT in Kontakt damit sein. Die Wand kann sich nicht bewegen. Hält jedem Odem stand: Feuer, Kälte, Säure, Gas, Blitz etc. Hat keine Wirkung auf andere Angriffe oder Zauber. Dauer 1 Runde pro 2 Alterskategorien. Komponente: V.',
  description_en = 'Creates an invisible plane of force (15.2 m on a side) that is totally impervious to all draconic breath weapons. The dragon can create the wall anywhere within range and need NOT be in contact with it. The wall cannot move. Withstands any breath: fire, cold, acid, gas, lightning, etc. Has no effect on other attacks or spells. Duration 1 round per 2 age categories. Component: V.'
WHERE LOWER(name_en) = LOWER('Breathblock — Dragon') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Ein gehaltener oder berührter Gegenstand wird untersucht, um die Art seiner Verzauberung zu identifizieren. Anders als Identifizieren entfällt die 8-Stunden-Meditationsanforderung und der Systemschock-Wurf. Der Zauber enthüllt eine Eigenschaft pro Runde Konzentration, wobei gängige Eigenschaften zuerst enthüllt werden. Bei mächtigeren Gegenständen (Artefakte etc.) sind nur grundlegende Funktionen erkennbar. Verfluchte Gegenstände werden als verflucht erkannt, aber die genaue Art des Fluchs wird möglicherweise nicht enthüllt. Materialkomponente: V, S, M.',
  description_en = 'A held or touched item is examined to identify the nature of its enchantment. Unlike Identify, the 8-hour meditation requirement and system shock roll are eliminated. The spell reveals one property per round of concentration, with common properties revealed first. For more powerful items (artifacts, etc.), only basic functions are discernible. Cursed items are recognized as cursed, but the exact nature may not be revealed. Material component: V, S, M.'
WHERE LOWER(name_en) = LOWER('Bubka''s Superior Identification') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Variante des Stolpern-Zaubers, betrifft aber bis zu 4 Kreaturen (alle müssen beim Wirken sichtbar sein). Bei 4 Zielen: normaler RW. Bei 3: RW mit −1. Bei 2: −2. Bei 1: −3. Betroffene Kreaturen stolpern, fallen, lassen Gegenstände fallen und sind für 1W4 Runden unfähig, koordiniert zu handeln. Materialkomponente: V, S.',
  description_en = 'Variation of the Fumble spell, but affects up to 4 creatures (all must be visible at casting). With 4 targets: normal save. 3: save at −1. 2: −2. 1: −3. Affected creatures stumble, fall, drop items, and are unable to act in a coordinated manner for 1d4 rounds. Material component: V, S.'
WHERE LOWER(name_en) = LOWER('Caddelyn''s Catastrophe') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Erzeugt einen „Auge des Sturms"-Effekt und reduziert selbst Orkanwinde im Wirkungsbereich auf eine leichte Brise. Ozeanwellen werden NICHT beeinflusst — sturmgepeitschte Gewässer bleiben gefährlich. Normale Windeffekte wie Staubstürme, Sandstürme und ähnliches werden ebenfalls reduziert. Komponenten: V, S.',
  description_en = 'Creates an "eye of the storm" effect, reducing even gale force winds to a breeze within the area of effect. Ocean waves are NOT affected — storm-tossed waters remain dangerous. Normal wind effects like dust storms, sandstorms, and similar are also reduced. Components: V, S.'
WHERE LOWER(name_en) = LOWER('Calm Wind') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Verursacht bei erfolgreichem Berührungsangriff 3W8+3 Schaden (der Zauberkundige erhält +2 auf den Angriffswurf). Nichtkörperliche, nichtlebende und extraplanare Kreaturen werden nicht betroffen, außer Untoten — diese werden stattdessen geheilt. Oft mit Spektralhand (2. Stufe) kombiniert. Das Wirken ist eine böse Handlung. Materialkomponente: V, S, M (Paste auf die Hände, durch Befehlswort aktiviert; 350 GM für fünf Anwendungen).',
  description_en = 'Inflicts 3d8+3 damage on a successful touch attack (caster has +2 on the attack roll). Noncorporeal, nonliving, and extraplanar creatures are unaffected, except undead — which are cured instead. Often combined with Spectral Hand (2nd level). Casting is an evil act. Material component: V, S, M (paste on hands, activated by command word; 350 gp for five castings).'
WHERE LOWER(name_en) = LOWER('Cause Critical Wounds') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Betrifft normale und riesengroße Versionen nichtmonströser Tiere mit tierischer oder halb-intelligenter Stufe (INT 1, 2-4). Gewöhnliche Wölfe oder Riesenwölfe ja, aber keine Winterwölfe (übernatürlich) oder Warge (monströs). Die Kreaturen betrachten den Zauberkundigen als vertrauenswürdigen Freund und Verbündeten. Bis zu 2W4 Tiere oder Tiere mit zusammen max. 2× der Stufe des Zauberkundigen TW. Im Kampf: die Tiere kämpfen für den Zauberkundigen. Dauer: abhängig von der INT der Tiere (3 Monate bei INT 1, 2 Monate bei INT 2-4). Rettungswurf gegen Zauber negiert für einzelne Tiere. Materialkomponente: V, S.',
  description_en = 'Affects normal and giant-sized versions of nonmonstrous animals of animal or semi-intelligence (INT 1, 2-4). Common wolves or dire wolves yes, but not winter wolves (supernatural) or worgs (monstrous). The creatures regard the caster as a trusted friend and ally. Up to 2d4 animals or animals totaling max 2× the caster''s level in HD. In combat: the animals fight for the caster. Duration: depends on the animals'' INT (3 months at INT 1, 2 months at INT 2-4). Save vs. spell negates for individual animals. Material component: V, S.'
WHERE LOWER(name_en) = LOWER('Charm Animals') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Erzeugt eine schimmernde Klinge aus ständig wechselnder Farbe — nadelschmal und magisch scharf. Leuchtet stets zwischen Farben flackernd. Die Klinge kann als Langschwert geführt werden (+1 auf Treffer, 1W8+1 Schaden). Einmal pro Runde kann der Zauberkundige einen speziellen Farbeffekt aktivieren (wie Chromatische Kugel, basierend auf der aktuellen Stufe). Die Klinge existiert für die Zauberdauer oder bis der Zauberkundige sie fallen lässt. Kann nicht von anderen geführt werden. Materialkomponente: V, S, M.',
  description_en = 'Creates a shimmering blade of constantly changing hue — needle-width and magically sharp. Glows at all times flickering between colors. The blade can be wielded as a long sword (+1 to hit, 1d8+1 damage). Once per round the caster can activate a special color effect (like Chromatic Orb, based on current level). The blade exists for the duration or until dropped. Cannot be wielded by others. Material component: V, S, M.'
WHERE LOWER(name_en) = LOWER('Chromatic Blade') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Sehr seltener Zauber. Der Zauberkundige muss die Scherben des Eis gesammelt haben, aus dem der zu befehlende Drache geschlüpft ist. Der betroffene Drache wird gezwungen, zum Zauberkundigen zu kommen und dessen Befehlen zu gehorchen — einschließlich Kampf und Selbstaufopferung. Der Drache erhält einen Rettungswurf gegen Zauber mit einem Bonus gleich seiner Alterskategorie. Bei Erfolg ist der Drache immun gegen den Zauber für 1 Jahr. Materialkomponente: V, S, M (Eischerben des Drachen).',
  description_en = 'Very rare spell. The caster must have collected the shards of the egg from which the dragon to be commanded hatched. The affected dragon is forced to come to the caster and obey commands — including combat and self-sacrifice. The dragon gets a save vs. spell with a bonus equal to its age category. On success, the dragon is immune to the spell for 1 year. Material component: V, S, M (the dragon''s egg shards).'
WHERE LOWER(name_en) = LOWER('Command Dragon') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Der Zauberkundige kann vorübergehend bis zu 5 Geschosse (typischerweise Pfeile) mit Zaubern der 4. Stufe oder niedriger verzaubern. Der Zauber erweitert damit die Reichweite eines Zaubers — das Geschoss wird zum Träger. Beim Aufprall wird der eingebettete Zauber auf das Ziel freigesetzt. Jedes Geschoss kann einen anderen Zauber tragen. Die Geschosse müssen innerhalb von 1 Runde pro Stufe nach dem Wirken abgefeuert werden oder der eingebettete Zauber vergeht. Materialkomponente: V, S.',
  description_en = 'The caster can temporarily enchant up to 5 missiles (typically arrows) with spells of 4th level or less. The spell thus extends the range of a spell — the missile becomes the carrier. On impact, the embedded spell is released on the target. Each missile can carry a different spell. The missiles must be fired within 1 round per level after casting or the embedded spell dissipates. Material component: V, S.'
WHERE LOWER(name_en) = LOWER('Conduit — Elf') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Beschwört einen Nachtmahr (Nightmare) von der Traumebene, der gerade einen Träumer auf seinem schrecklichen Ritt trägt. Der beschwörene Nachtmahr wird immer von einem verängstigten Reiter begleitet (der bei Ankunft sofort in Ohnmacht fällt). Der Nachtmahr dient als Reittier für die Zauberdauer, gehorcht aber nur widerwillig. Bei Misshandlung (Schaden, Beleidigung) oder wenn die Kontrolle des Zauberkundigen nachlässt, greift der Nachtmahr an. Materialkomponente: V, S, M.',
  description_en = 'Summons a nightmare from the Plane of Dreams, currently carrying a dreamer on its terrible ride. The summoned nightmare is always accompanied by a terrified rider (who faints immediately upon arrival). The nightmare serves as a mount for the duration but obeys reluctantly. If mistreated (damage, insults) or the caster''s control slips, the nightmare attacks. Material component: V, S, M.'
WHERE LOWER(name_en) = LOWER('Conjure Nightmare') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Wirkt wie Monster Bezaubern auf einen einzelnen Untoten. Kein Rettungswurf wenn der Untote weniger TW als die Stufe der Hexe hat. Bei gleichen oder höheren TW: normaler Rettungswurf gegen Zauber. Der bezauberte Untote gehorcht der Hexe und dient ihr treu. Der Zauber hält, bis die Hexe den Untoten freilässt, der Zauber gebannt wird oder der Untote zerstört wird. Materialkomponente: V, S.',
  description_en = 'Works like Charm Monster on a single undead creature. No saving throw if the undead has fewer HD than the witch''s level. At equal or higher HD: normal save vs. spell. The charmed undead obeys the witch and serves faithfully. The spell holds until the witch releases it, the spell is dispelled, or the undead is destroyed. Material component: V, S.'
WHERE LOWER(name_en) = LOWER('Control Undead — Witch') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Nur von bösen Zauberkundigen wirkbar. Verwandelt einen normalen Menschen (bis 3. Stufe) durch magische Rituale und Qualen in ein wahnsinniges, mörderisches Wesen — einen „Auserwählten". Der Auserwählte hat erhöhte STR (18/00), KON (18), ist immun gegen Furcht und Bezauberung und kämpft bis zum Tod. Er gehorcht nur seinem Erschaffer (telepathische Befehle in 1,6 km Reichweite). Der Prozess ist permanent und irreversibel (außer durch Wunsch). Der Auserwählte hat keine eigene Persönlichkeit mehr. Materialkomponente: V, S, M.',
  description_en = 'Only castable by evil wizards. Transforms a normal human (up to 3rd level) through magical rituals and torments into a maddened, murderous creature — a "Chosen One." The Chosen One has enhanced STR (18/00), CON (18), is immune to fear and charm, and fights to the death. Obeys only its creator (telepathic commands within 1.6 km). The process is permanent and irreversible (except by Wish). The Chosen One has no personality left. Material component: V, S, M.'
WHERE LOWER(name_en) = LOWER('Create Chosen One — Red Wizard') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Der Chronomant verdreht das Momentum der Zeit und erzeugt ein permanentes Tor zwischen der Realität und der Halbebene der Zeit. Das Tor ist völlig flach, kann aber jede zusammenhängende Form annehmen (max. 3 × 3 m). Jede Kreatur oder jedes Objekt, das das Tor durchschreitet, wird zur Halbebene der Zeit transportiert. Das Tor ist in beide Richtungen funktionsfähig. Kann nicht auf einer anderen Ebene als der Materiellen Ebene gewirkt werden. Das Tor ist permanent bis es durch Magie Bannen oder mächtigere Magie zerstört wird. Materialkomponente: V, S.',
  description_en = 'The chronomancer twists time''s momentum to create a permanent gate between reality and the Demiplane of Time. The gate is totally flat but can be any contiguous shape (max 3 × 3 m). Any creature or object passing through is transported to the Demiplane of Time. The gate is functional in both directions. Cannot be cast on a plane other than the Prime Material. The gate is permanent until destroyed by Dispel Magic or more powerful magic. Material component: V, S.'
WHERE LOWER(name_en) = LOWER('Create Slipgate') AND spell_type = 'wizard';
