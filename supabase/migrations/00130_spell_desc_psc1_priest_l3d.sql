-- ═══════════════════════════════════════════════════════════════════════════════
-- PSC1 Priest Spells Level 3 (Batch 4: 10 Spells — Extradimensional Detection to Frenzy of the Celts)
-- Metrisch, eng an Originaltexten orientiert
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.spells SET
  name = 'Extradimensionale Erkennung',
  description = 'Erkennt extradimensionale Räume oder Taschen in einem 3 m breiten und 18,3 m langen Pfad in Blickrichtung. Der Priester kann sich drehen und pro Runde einen 60°-Bogen abtasten. Erkennt Räume von Seiltrick, Beuteln der Aufbewahrung, Portablen Löchern sowie Ebenentore und Extradimensionale Faltung. Größe und Quelle des Raumes werden nicht enthüllt. Die Chance, die Art der beteiligten Magie zu bestimmen, beträgt 10 % pro Stufe. Kann durch 30 cm Stein, 2,5 cm Metall oder 0,9 m Holz blockiert werden.',
  description_en = 'Detects extradimensional spaces or pockets in a 3 m wide and 18.3 m long path in the direction faced. The priest can turn, scanning a 60° arc each round. Detects spaces from rope trick, bags of holding, portable holes, as well as interplanar gates and extradimensional folding. Size and source are not revealed. The chance to determine the type of magic involved is 10% per level. Can be blocked by 30 cm of stone, 2.5 cm of metal, or 0.9 m of wood.'
WHERE LOWER(name_en) = LOWER('Extradimensional Detection') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Feuerauge — Altes Reich',
  description = 'Das linke Auge des Priesters sendet einen lodernden Feuerstrahl aus, der mit der Hitze der Sonne brennt. Der Priester zeigt auf die sichtbare Zielkreatur und spricht das mulhorandische Wort für Vergeltung. Verursacht 1W4 Schadenspunkte pro Stufe, maximal 10W4. Untote erleiden 1W6 pro Stufe, maximal 10W6. Ein erfolgreicher Rettungswurf gegen Zauber halbiert den Schaden. Der intensive Strahl kann brennbare Gegenstände entzünden oder andere Gegenstände schmelzen.',
  description_en = 'The priest''s left eye emits a blazing beam of fire burning with the sun''s intense heat. The priest points at the visible target creature and utters the Mulhorandi word for vengeance. Deals 1d4 damage per level, maximum 10d4. Undead suffer 1d6 per level, maximum 10d6. A successful saving throw vs. spell halves the damage. The intense beam can ignite combustible items or melt other items.'
WHERE LOWER(name_en) = LOWER('Eye of Fire — Old Empire') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Augen der Untoten',
  description = 'Kann auf jeden toten oder untoten Körper der Größe K (klein) oder größer gewirkt werden. Schmiedet eine Verbindung, die dem Zauberer erlaubt, durch die Augen und Ohren des Leichnams zu sehen und zu hören. Der Zauberer kann die untote Kreatur nicht durch diesen Zauber kontrollieren. Je intelligenter und selbstbewusster der Untote, desto nützlicher die Eindrücke. Der Leichnam muss beim Wirken innerhalb von 36,6 m sein, kann sich aber danach bis zu 1,6 km entfernen und weiterhin übertragen.',
  description_en = 'Can be cast on any dead or undead body of size S or larger. Forges a link allowing the caster to see and hear through the corpse. The caster cannot control the undead through this spell. The more intelligent and self-willed the undead, the more useful the views. The corpse must be within 36.6 m when cast but can move up to 1.6 km away and still transmit.'
WHERE LOWER(name_en) = LOWER('Eyes of the Undead') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Ilmaters Gunst',
  description = 'Zwei mögliche Formen: A) Schmerz Bannen: Verbannt Schmerz und Übelkeit, sodass der Empfänger nicht durch Verstümmelungen, Folter oder schwere Verletzungen betäubt werden kann. Verbannt außerdem Schwachsinn, Delirium und Bezauberungseffekte; befreit von Hypnose, Irrgarten und Verwirrung. Dauer: 1 Zug pro Stufe. B) Schaden Übertragen: Stellt die Trefferpunkte einer Kreatur durch Berührung wieder her, wobei der Zauberer den Schaden erleidet. Der Zauberer kann die Menge der übertragenen TP nicht begrenzen.',
  description_en = 'Two possible forms: A) Banish Pain: Banishes pain and nausea so the recipient cannot be stunned by amputations, torture, or severe injuries. Also banishes feeblemindedness, delirium, and charm effects; frees from hypnosis, maze, and confusion. Duration: 1 turn per level. B) Transfer Damage: Restores a creature''s hit points by touch, with the caster suffering the damage. The caster cannot limit the number of hit points transferred.'
WHERE LOWER(name_en) = LOWER('Favor of Ilmater') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Yathageras Gunst',
  description = 'Das verzauberte Reittier (typischerweise ein Pferd, aber auch Zentaur, Einhorn oder Pegasus) erhält sofort ein Paar Flügel ähnlich denen von Pegasi. Das geflügelte Reittier kann mit BW 48 und Manövrierklasse C fliegen (D wenn beritten). Der Zauberer wird für die Dauer im Luftreiten geübt. Jeder Sattel oder Zaum fällt sofort ab — das Reittier muss ohne Sattel geritten werden. Bei Sturzangriffen aus 15,2 m oder höher erhalten Hufangriffe +2 und verursachen doppelten Schaden.',
  description_en = 'The enchanted equine (typically a horse, but also centaur, unicorn, or pegasus) immediately sprouts pegasus-like wings. The winged steed can fly at MV 48 with maneuverability class C (D if mounted). The caster becomes proficient in aerial riding for the duration. Any saddle or bridle falls off — the steed must be ridden bareback. Dive attacks from 15.2 m or higher grant +2 to hoof attacks and deal double damage.'
WHERE LOWER(name_en) = LOWER('Favor of Yathaghera') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Portal Finden',
  description = 'Enthüllt alle normalen oder magischen Portale im Wirkungsbereich, einschließlich Türen, Fenster, magischer Tore, Tunnelöffnungen, Teleportale, verschieblicher Wände, Geheimtüren und durch Illusionen verborgener Öffnungen. Falsche oder illusionäre Türen werden ausgeschlossen. Der Zauberer erfährt nichts über Schlösser, Fallen oder Funktionsweise des Portals. Ist ein Portal selbst magisch oder magisch verborgen, besteht eine Chance von 10 % pro Stufe, die Art der Magie zu bestimmen.',
  description_en = 'Reveals all normal or magical portals within the area, including doors, windows, magical gates, tunnel openings, teleportals, shifting walls, secret doors, and openings concealed by illusions. False or illusionary doors are excluded. The caster gains no information about locks, traps, or method of operation. If a portal is magical or magically concealed, there is a 10% per level chance to determine the type of magic involved.'
WHERE LOWER(name_en) = LOWER('Find Portal') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Flammenschild',
  description = 'Erschafft einen pulsierenden, 1,8 m hohen Schild aus Dunkelheit an der Hand des Zauberers. Der Schild ist gewichtslos und immateriell — Geschosse und feste Objekte durchdringen ihn ungehindert. Wirkt gegen Flammen: Löscht Fackeln und Kerzen sofort, halbiert Feuerballschaden, zerstört Flammenklingen, und hebt Feuerschlag bei direktem Vorhalten komplett auf (zerstört dabei den Schild). Flammenbasierte Illusionen haben keine Wirkung auf Wesen, die durch den Schild blicken. Materialkomponenten: Phosphor, Quecksilber und ein Spinnennetz.',
  description_en = 'Creates a pulsating, 1.8 m high shield of darkness at the caster''s hand. The shield is weightless and intangible — missiles and solid objects pass through it. Works against flame: extinguishes torches and candles instantly, halves fireball damage, destroys flame blades, and fully cancels flame strike if held directly overhead (destroying the shield). Flame-related illusions have no effect on beings viewing through the shield. Material components: phosphorus, mercury, and a cobweb.'
WHERE LOWER(name_en) = LOWER('Flame Shield') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Kraftschutz',
  description = 'Erschafft einen unbeweglichen, kugelförmigen Schutzbereich mit schwachem Leuchten. Beim Wirken müssen alle Kreaturen außer den vom Priester berührten oder benannten einen Rettungswurf gegen Zauber bestehen oder werden 3 m pro Stufe zurückgedrängt. Geschosse und Zauber können frei hinein- und herausgeschossen werden. Kreaturen außerhalb können versuchen einzudringen (Rettungswurf mit −3). Der Schutz endet sofort, wenn der Priester den Bereich verlässt, getötet oder bewusstlos wird. Magie Bannen zerstört den Kraftschutz sofort.',
  description_en = 'Creates an immobile, spherical area of protection with a faint glow. When cast, all creatures except those touched or named by the priest must save vs. spell or be forced back 3 m per caster level. Missiles and spells can be launched freely in and out. Creatures outside can attempt to break in (saving throw at −3). The ward ends instantly if the priest leaves, is slain, or rendered unconscious. Dispel magic destroys the forceward instantly.'
WHERE LOWER(name_en) = LOWER('Forceward') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Gepflegter Schutz',
  description = 'Kann nur auf Kreaturen gewirkt werden, die bereits über natürliche Magieresistenz verfügen. Erhöht die Magieresistenz um 2 Prozent pro Stufe des Zauberers für die Zauberdauer. Die Magieresistenz kann unter keinen Umständen 95 % überschreiten. Materialkomponente ist ein Tropfen Blut oder Ichor einer magieresistenten Kreatur.',
  description_en = 'Can only be cast on creatures that already possess natural magic resistance. Increases magic resistance by 2 percent per caster level for the spell''s duration. Under no circumstances can the creature''s magic resistance exceed 95%. Material component is a drop of blood or ichor from a magic-resistant creature.'
WHERE LOWER(name_en) = LOWER('Fostered Protection') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Keltische Raserei',
  description = 'Versetzt Armeen in Kampfraserei. Betrifft 20 Trefferwürfel an Kreaturen pro Wirken (üblicherweise zehn Krieger der 2. Stufe). Betroffene müssen nie Moral prüfen, erhalten +1 auf alle Rettungswürfe und Angriffswürfe und können sich ohne Abzug um 50 % weiter als ihre normale Distanz bewegen. Betroffene stürmen sofort auf die nächsten feindlichen Kräfte zu und kämpfen, ob dies klug ist oder nicht. Krieger ohne Anführer nach Ablauf des Zaubers fliehen zu den eigenen Linien zurück.',
  description_en = 'Drives armies into battle frenzy. Affects 20 Hit Dice of creatures per casting (usually ten 2nd-level warriors). Those affected never check morale, gain +1 to all saving throws and attack rolls, and can move 50% more than normal distance without penalty. Affected creatures immediately charge the closest enemy forces regardless of wisdom. Warriors without a leader after the spell ends run back to their own lines.'
WHERE LOWER(name_en) = LOWER('Frenzy of the Celts') AND spell_type = 'priest';
