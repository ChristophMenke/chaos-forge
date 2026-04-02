-- ═══════════════════════════════════════════════════════════════════════════════
-- Cleanup: Fehlende Beschreibungen für echte Spells + Artefakt-Einträge löschen
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── ARTEFAKTE LÖSCHEN (fehlerhafte Parsing-Einträge aus Seed) ──────────────

DELETE FROM public.spells WHERE name_en = 'Reversible ee' AND spell_type = 'wizard';
DELETE FROM public.spells WHERE name_en = '— Red Wizard' AND spell_type = 'wizard';
DELETE FROM public.spells WHERE name_en = 'Detect the Living —' AND spell_type = 'wizard';
DELETE FROM public.spells WHERE name_en = 'Fire)' AND spell_type = 'wizard';
DELETE FROM public.spells WHERE name_en = 'Reversible a a' AND spell_type = 'wizard';
DELETE FROM public.spells WHERE name_en = 'Nonmagical Gas' AND spell_type = 'wizard';
DELETE FROM public.spells WHERE name_en LIKE '''s Cloak of Protection' AND spell_type = 'wizard';
DELETE FROM public.spells WHERE name_en = 'See a day in the life' AND spell_type = 'priest';
DELETE FROM public.spells WHERE name_en = 'Beastlord of the FoRGOTTEN REALMS setting' AND spell_type = 'priest';
DELETE FROM public.spells WHERE name_en LIKE 'See Haela%' AND spell_type = 'priest';
DELETE FROM public.spells WHERE name_en = 'Elementals' AND spell_type = 'priest' AND level = 4;
DELETE FROM public.spells WHERE name_en LIKE 'HD. These are predators%' AND spell_type = 'priest';
DELETE FROM public.spells WHERE name_en LIKE 'Reversible a a%' AND spell_type = 'priest';
DELETE FROM public.spells WHERE name_en LIKE 'Bestow Hit Points — Savant Notes%' AND spell_type = 'priest';
DELETE FROM public.spells WHERE name_en LIKE 'Se ean e a%' AND spell_type = 'priest';
DELETE FROM public.spells WHERE name_en LIKE 'Sphere; Necromantic%' AND spell_type = 'priest';

-- ─── FEHLENDE WSC1 WIZARD BESCHREIBUNGEN ────────────────────────────────────

UPDATE public.spells SET
  name = 'Aufladen',
  description = 'Lädt einen magischen Gegenstand mit zusätzlicher magischer Energie auf. Der Gegenstand erhält vorübergehend zusätzliche Ladungen oder verstärkte Effekte. Die Anzahl der zusätzlichen Ladungen hängt von der Stufe des Zauberkundigen ab. Der Effekt ist temporär — nach Ablauf kehrt der Gegenstand zu seinem normalen Zustand zurück.',
  description_en = 'Charges a magical item with additional magical energy. The item temporarily gains extra charges or enhanced effects. The number of additional charges depends on the caster''s level. The effect is temporary — after expiration, the item returns to its normal state.'
WHERE LOWER(name_en) = LOWER('Charge') AND spell_type = 'wizard';

-- ─── FEHLENDE PSC1 PRIEST BESCHREIBUNGEN ────────────────────────────────────

UPDATE public.spells SET
  name = 'Beruhigen',
  description = 'Beruhigt ein aufgeregtes oder aggressives Wesen. Das Ziel wird friedlich und passiv, greift nicht an und verhält sich freundlich. Rettungswurf gegen Zauber negiert. Jede feindliche Aktion gegen das beruhigte Wesen beendet den Effekt sofort. Dauer: 1 Runde pro Stufe.',
  description_en = 'Calms an agitated or aggressive creature. The target becomes peaceful and passive, does not attack, and behaves friendly. Saving throw vs. spell negates. Any hostile action against the calmed creature ends the effect immediately. Duration: 1 round per level.'
WHERE LOWER(name_en) = LOWER('Calm') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Gleichgewicht Entdecken',
  description = 'Enthüllt die moralische und ethische Balance eines Wesens, Gegenstands oder Bereichs. Der Priester erkennt, ob Gut, Böse, Ordnung oder Chaos vorherrscht, und wie stark die Ausrichtung ist. Funktioniert ähnlich wie Böses Entdecken, deckt aber das gesamte Gesinnungsspektrum ab.',
  description_en = 'Reveals the moral and ethical balance of a creature, object, or area. The priest detects whether good, evil, law, or chaos predominates, and how strong the alignment is. Functions similarly to Detect Evil but covers the full alignment spectrum.'
WHERE LOWER(name_en) = LOWER('Detect Balance') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Schwarzer Grabhügel',
  description = 'Erschafft einen unheimlichen schwarzen Grabhügel aus Erde und Stein, der als Falle oder Wächter dient. Kreaturen, die den Hügel betreten oder berühren, werden von nekromantischer Energie durchströmt und müssen einen Rettungswurf gegen Todesmagie bestehen oder erleiden schweren Schaden. Der Hügel hält permanent.',
  description_en = 'Creates an eerie black cairn of earth and stone that serves as a trap or guardian. Creatures entering or touching the cairn are flooded with necromantic energy and must save vs. death magic or suffer severe damage. The cairn is permanent.'
WHERE LOWER(name_en) = LOWER('Black Cairn') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Schwarze Klaue',
  description = 'Verwandelt die Hand des Priesters in eine schwarze, klauenbewehrte Pranke, die bei Berührung nekromantischen Schaden verursacht. Die Klaue greift mit +2 Angriffsbonus an und verursacht 2W4 Schaden plus Energieentzug. Dauer: 1 Runde pro Stufe.',
  description_en = 'Transforms the priest''s hand into a black, clawed paw that deals necrotic damage on touch. The claw attacks with +2 bonus and deals 2d4 damage plus energy drain. Duration: 1 round per level.'
WHERE LOWER(name_en) = LOWER('Black Talon') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Tier Rufen — Schamane',
  description = 'Ermöglicht dem Schamanen, ein einzelnes Tier aus der Umgebung zu rufen. Das Tier erscheint innerhalb von 1W4 Runden und dient dem Schamanen für die Dauer des Zaubers. Es kann einfache Befehle befolgen, kämpfen oder als Kundschafter dienen. Die Art des Tieres hängt von der Umgebung ab.',
  description_en = 'Enables the shaman to call a single animal from the surroundings. The animal appears within 1d4 rounds and serves the shaman for the spell''s duration. It can follow simple commands, fight, or serve as a scout. The type of animal depends on the environment.'
WHERE LOWER(name_en) = LOWER('Call Animal — Shaman') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Gerät Analysieren — Gnom',
  description = 'Ermöglicht dem gnomischen Priester, die Funktion und den Zustand eines mechanischen Geräts zu analysieren. Der Priester erkennt, was das Gerät tut, wie es funktioniert, ob es beschädigt ist und wie es repariert werden kann. Funktioniert auch bei magischen Maschinen und Konstrukten.',
  description_en = 'Enables the gnomish priest to analyze the function and condition of a mechanical device. The priest learns what the device does, how it works, whether it is damaged, and how it can be repaired. Also works on magical machines and constructs.'
WHERE LOWER(name_en) = LOWER('Analyze Contraption — Gnome') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Rudel Rufen',
  description = 'Beschwört ein Rudel wilder Tiere (typischerweise Wölfe, Hunde oder ähnliche Raubtiere) aus der Umgebung. Die Anzahl hängt von der Stufe des Priesters ab. Das Rudel kämpft auf Seiten des Priesters und gehorcht einfachen Befehlen. Dauer: 1 Runde pro Stufe.',
  description_en = 'Summons a pack of wild animals (typically wolves, dogs, or similar predators) from the surroundings. The number depends on the priest''s level. The pack fights on the priest''s side and obeys simple commands. Duration: 1 turn per level.'
WHERE LOWER(name_en) = LOWER('Call Pack') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Adamantitkeule',
  description = 'Verwandelt die Waffe des Priesters (typischerweise eine Keule oder einen Streitkolben) vorübergehend in Adamantit. Die Waffe wird unzerstörbar, erhält +3 Angriffsbonus und verursacht doppelten Schaden gegen Konstrukte und Kreaturen mit Härte-basierter Verteidigung. Dauer: 1 Runde pro Stufe.',
  description_en = 'Temporarily transforms the priest''s weapon (typically a mace or club) into adamantite. The weapon becomes indestructible, gains +3 attack bonus, and deals double damage against constructs and creatures with hardness-based defenses. Duration: 1 round per level.'
WHERE LOWER(name_en) = LOWER('Adamantite Mace') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Flammendes Schwert — Halbling',
  description = 'Erschafft ein leuchtendes Schwert aus göttlichem Feuer in der Hand des Priesters. Das Schwert verursacht 2W6 Feuerschaden plus 1W6 heiligen Schaden gegen Untote und böse Kreaturen. Der Priester ist mit dem Schwert geübt, unabhängig von seinen normalen Waffenfertigkeiten. Dauer: 1 Runde pro Stufe.',
  description_en = 'Creates a glowing sword of divine fire in the priest''s hand. The sword deals 2d6 fire damage plus 1d6 holy damage against undead and evil creatures. The priest is proficient with the sword regardless of normal weapon proficiencies. Duration: 1 round per level.'
WHERE LOWER(name_en) = LOWER('Blazing Sword — Halfling') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Grabhügel',
  description = 'Erschafft einen steinernen Grabhügel über einer Leiche, der als permanentes Grabmal und Schutz dient. Der Grabhügel verhindert, dass die Leiche als Untoter auferstehen kann, und schützt sie vor Störung. Der Hügel ist extrem widerstandsfähig gegen physische und magische Zerstörung.',
  description_en = 'Creates a stone cairn over a corpse that serves as a permanent tomb and protection. The cairn prevents the corpse from being raised as undead and protects it from disturbance. The cairn is extremely resistant to physical and magical destruction.'
WHERE LOWER(name_en) = LOWER('Cairn') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Berronars Gunst — Zwerg',
  description = 'Ein Segen der Zwergen-Göttin Berronar Truesilver. Der Empfänger erhält göttlichen Schutz: +2 auf alle Rettungswürfe, Immunität gegen Furcht und Gift, und regeneriert 1 TP pro Runde für die Dauer des Zaubers. Kann nur auf Zwerge gewirkt werden. Dauer: 1 Runde pro Stufe.',
  description_en = 'A blessing of the dwarven goddess Berronar Truesilver. The recipient gains divine protection: +2 to all saving throws, immunity to fear and poison, and regenerates 1 HP per round for the spell''s duration. Can only be cast on dwarves. Duration: 1 turn per level.'
WHERE LOWER(name_en) = LOWER('Berronar''s Favor — Dwarf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Geisterrudel Rufen',
  description = 'Beschwört ein Rudel geisterhafter Raubtiere (typischerweise Geisterwölfe), die auf der ätherischen Ebene existieren aber die materielle Ebene beeinflussen können. Das Rudel kann Kreaturen angreifen, die gegen nicht-magische Waffen immun sind. Die Geistertiere verursachen Kälteschaden und Furcht. Dauer: 1 Runde pro Stufe.',
  description_en = 'Summons a pack of spectral predators (typically ghost wolves) that exist on the ethereal plane but can affect the material plane. The pack can attack creatures immune to non-magical weapons. The spirit animals deal cold damage and cause fear. Duration: 1 turn per level.'
WHERE LOWER(name_en) = LOWER('Call Ghost Pack') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Azuths Feuerraserei',
  description = 'Erfüllt den Priester mit göttlichem Feuer Azuths, das jeden gewirkten Feuerzauber für die Dauer massiv verstärkt. Alle Feuerzauber des Priesters verursachen maximalen Schaden und die Rettungswürfe der Ziele sind um −4 erschwert. Der Priester strahlt ein intensives Feuerleuchten aus. Dauer: 1 Runde pro Stufe.',
  description_en = 'Fills the priest with Azuth''s divine fire, massively enhancing every fire spell cast for the duration. All of the priest''s fire spells deal maximum damage and targets'' saving throws are at −4. The priest radiates an intense fiery glow. Duration: 1 round per level.'
WHERE LOWER(name_en) = LOWER('Azuth''s Firing Frenzy') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Zeremonie — Kleriker',
  description = 'Ermöglicht dem Priester, verschiedene religiöse Zeremonien durchzuführen: Hochzeiten, Bestattungen, Segnungen, Weihungen, Exorzismen und andere kirchliche Rituale. Die spezifischen Effekte hängen von der Art der Zeremonie und der Gottheit des Priesters ab. Einige Zeremonien gewähren temporäre Boni oder schützen vor bestimmten Gefahren.',
  description_en = 'Enables the priest to perform various religious ceremonies: weddings, funerals, blessings, consecrations, exorcisms, and other ecclesiastical rituals. Specific effects depend on the ceremony type and the priest''s deity. Some ceremonies grant temporary bonuses or protect against specific dangers.'
WHERE LOWER(name_en) = LOWER('Ceremony — Cleric') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Faust von Gond',
  description = 'Erschafft eine riesige mechanische Faust aus göttlicher Energie, die auf Befehl des Priesters zuschlägt. Die Faust verursacht 4W6 Quetschschaden und kann Türen, Mauern und Befestigungen einschlagen. Sie trifft automatisch (kein Angriffswurf nötig für unbelebte Objekte). Gegen Kreaturen ist ein Angriffswurf mit +4 erforderlich. Dauer: 1 Runde pro Stufe.',
  description_en = 'Creates a massive mechanical fist of divine energy that strikes at the priest''s command. The fist deals 4d6 crushing damage and can smash doors, walls, and fortifications. It hits automatically (no attack roll needed for inanimate objects). Against creatures, an attack roll at +4 is required. Duration: 1 round per level.'
WHERE LOWER(name_en) = LOWER('Fist of Gond') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Klingensegen',
  description = 'Segnet eine Waffe mit göttlicher Kraft. Die gesegnete Waffe erhält +1 Angriffs- und Schadensbonus, leuchtet schwach und gilt als magische Waffe. Gegen Untote und böse Außenplanare verursacht sie zusätzlichen heiligen Schaden (1W4). Die Segnung hält 1 Runde pro Stufe und kann nicht mit anderen Waffenverzauberungen kombiniert werden.',
  description_en = 'Blesses a weapon with divine power. The blessed weapon gains +1 to attack and damage, glows faintly, and counts as a magical weapon. Against undead and evil outsiders, it deals additional holy damage (1d4). The blessing lasts 1 turn per level and cannot be combined with other weapon enchantments.'
WHERE LOWER(name_en) = LOWER('Bladebless') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Blutverbindung',
  description = 'Erschafft eine mystische Verbindung zwischen dem Priester und einem anderen Wesen durch geteiltes Blut. Beide Parteien spüren den Zustand des anderen (Verletzungen, Emotionen, ungefähre Entfernung und Richtung). Heilmagie, die auf eine Partei gewirkt wird, heilt auch die andere teilweise (25 % Übertragung). Der Priester weiß sofort, wenn die verbundene Person in Lebensgefahr ist. Dauer: 1 Tag pro Stufe.',
  description_en = 'Creates a mystical connection between the priest and another being through shared blood. Both parties sense each other''s condition (injuries, emotions, approximate distance and direction). Healing magic cast on one party also partially heals the other (25% transfer). The priest instantly knows if the linked person is in mortal danger. Duration: 1 day per level.'
WHERE LOWER(name_en) = LOWER('Blood Link') AND spell_type = 'priest';
