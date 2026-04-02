-- ═══════════════════════════════════════════════════════════════════════════════
-- PSC1 Priest Spells Level 3 (Batch 3: 19 Spells — Determine Final Rest to Exaltation)
-- Metrisch, eng an Originaltexten orientiert
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.spells SET
  name = 'Letzte Ruhe Bestimmen',
  description = 'Ähnlich wie Gesinnung Erkennen ermöglicht dieser Zauber dem Priester, die Aura eines lebenden oder verstorbenen Wesens zu lesen, um festzustellen, welche Äußere Ebene und welche Schicht für die letzte Ruhe nach dem Tod bestimmt ist — basierend auf Religion, Natur und Gesinnung. Wurde ein Wesen an einen falschen Ort geschickt oder unfreiwillig umgeleitet, wird dies bemerkt, aber nicht das tatsächliche Ziel. Zauber, die Gesinnung Erkennen blockieren, hemmen auch diesen Zauber. Leichen erhalten normalerweise keinen Rettungswurf, es sei denn, sie sind Untote.',
  description_en = 'Similar to know alignment, this spell enables the priest to read the aura of a living or deceased creature to determine which Outer Plane and level is the correct final rest after death — based on religion, nature, and alignment. If a being has been sent to an incorrect rest or redirected unwillingly, this is noted but not the actual destination. Spells blocking know alignment also inhibit this spell. Corpses normally receive no saving throw unless they are undead.'
WHERE LOWER(name_en) = LOWER('Determine Final Rest') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Diktat',
  description = 'Eine verbesserte Version des Befehls-Zaubers der Stufe 1, die bis zu 6 Kreaturen in einem 6,1-m-Würfel betrifft. Der Zauberer kann einen Befehl von maximal zwölf Worten erteilen. Alle Kreaturen, die ihren Rettungswurf nicht bestehen, müssen den Anweisungen folgen, bis zu einer Runde pro Zauberstufe. Kreaturen, die die Sprache des Zauberers nicht verstehen, sind immun. Offensichtlich selbstmörderische Befehle bewirken nur den Verlust einer Runde. Verwirrende Befehle gewähren +1 bis +4 auf den Rettungswurf.',
  description_en = 'An improved version of the 1st-level command spell affecting up to 6 creatures in a 6.1 m cube. The caster can issue an order of no more than twelve words. All creatures failing their saving throws must follow the instructions for up to one round per caster level. Creatures that don''t understand the caster''s language are immune. Obviously self-destructive commands only cause loss of one round. Confusing commands grant +1 to +4 to saving throws.'
WHERE LOWER(name_en) = LOWER('Dictate') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Düsterer Gesang — Drache',
  description = 'Eine drakonische Variante von Gesang und Gebet. Erzeugt ein Gefühl drohenden Unheils, eine Aura des Verfalls und senkt die Temperatur im Wirkungsbereich auf knapp über den Gefrierpunkt. Gegner des Zauberers erleiden −2 auf Angriffs- und Schadenswürfe, die meisten Rettungswürfe und Moral. Rettungswürfe gegen Drachenfurcht und ähnliche Effekte erleiden −4. Hält an, solange der Drache singt, was Odemwaffen, Biss und verbale Zauber ausschließt. In geschlossenen Räumen hallt der Gesang 10 Runden nach.',
  description_en = 'A draconic variant of chant and prayer. Creates a sense of impending doom, an aura of decay, and lowers the temperature to just above freezing. Opponents suffer −2 to attack and damage rolls, most saving throws, and morale. Saving throws against dragon fear and similar effects suffer −4. Lasts as long as the dragon continues chanting, precluding breath weapons, bite, and verbal spells. In enclosed settings, the chant echoes for 10 rounds after ceasing.'
WHERE LOWER(name_en) = LOWER('Dire Chant — Dragon') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Untote Entlassen — Klosterpriester',
  description = 'Durch diesen Zauber kann ein Klosterpriester vorübergehend die Fähigkeit erhalten, Untote zu vertreiben (wenn gut oder neutral) oder sie zu befehligen (wenn böse). Für die Bestimmung von Erfolg oder Misserfolg des Vertreibungsversuchs gilt die Stufe des Klosterpriesters minus vier Stufen als Maßstab. Ein Klosterpriester der 7. Stufe vertreibt also Untote wie ein Abenteuerpriester der 3. Stufe. Dauer: 3W4 Runden. Wirkungsbereich: Kegel, 18,3 m lang, 6,1 m Durchmesser.',
  description_en = 'By casting this spell, a cloistered priest can temporarily gain the ability to turn undead (if good or neutral) or command them (if evil). For determining success or failure, the cloistered priest''s level counts as that of an adventurer-priest minus four levels. Thus a 7th-level cloistered priest turns undead as a 3rd-level adventurer-priest. Duration: 3d4 rounds. Area of effect: cone, 18.3 m long, 6.1 m diameter.'
WHERE LOWER(name_en) = LOWER('Dismiss Undead — Cloistered Priest') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Stille Bannen',
  description = 'Negiert die Wirkung magischer Stille im Bereich des Zaubers für seine Dauer. Nach dem Wirken können Zaubern, Sprechen und alle Handlungen normal fortgesetzt werden. Für die Dauer ist der geschützte Bereich immun gegen Stille-Zauber — sie funktionieren innerhalb des Bereichs nicht. Der Wirkungsbereich ist unbeweglich und folgt nicht dem Zauberer. Materialkomponenten sind eine Prise Diamantpulver im Wert von mindestens 50 GM und das Heilige Symbol.',
  description_en = 'Negates the effect of magical silence within the area for the spell''s duration. Following the casting, all spellcasting, speaking, and actions can proceed normally. For the duration, the protected area is proof against silence spells — they do not function within the area. The area of effect is immobile and does not move with the caster. Material components are a pinch of powdered diamond worth at least 50 gp and the holy symbol.'
WHERE LOWER(name_en) = LOWER('Dispel Silence') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Göttlicher Zweck',
  description = 'Hilft dem Zauberer, den Zweck eines Gegenstandes zu erkennen, auch wenn er zerbrochen ist oder nur ein Teil untersucht wird. Der Priester muss direkten Hautkontakt mit dem Gegenstand und seinem Heiligen Symbol herstellen. Die Chance beträgt 1 % pro Stufe plus 1 % pro Weisheitspunkt, plus 5 % bei gleicher Rasse des Herstellers, plus 10 % bei nichtmagischen Gegenständen, plus 10 % bei vertrauter Funktion. Kostet 1 Trefferpunkt beim Wirken. Jeder Gegenstand kann nur einmal untersucht werden.',
  description_en = 'Helps the caster discern the purpose of an item, even if broken or only partially examined. The priest must establish direct flesh-to-item contact with both the item and holy symbol. The chance is 1% per level plus 1% per Wisdom point, plus 5% if the maker is the same race, plus 10% if nonmagical, plus 10% if the function is personally familiar. Costs 1 hit point to cast. Each item can only be examined once.'
WHERE LOWER(name_en) = LOWER('Divine Purpose') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Göttliche Wahrheit',
  description = 'Ermöglicht dem Zauberer, eine Wahrheit über eine Sache oder Angelegenheit zu bestimmen. Die Chance auf eine bedeutungsvolle Antwort beträgt 75 % plus 1 % pro Stufe, maximal 95 %. Jede Frage kann gestellt werden, aber komplexere Fragen sollten allegorischere und kryptischere Antworten liefern. Mit steigender Stufe werden die Antworten klarer. Sobald eine Antwort empfangen wurde, endet der Zauber. Mehrfaches Wirken bringt keinen zusätzlichen Nutzen, es sei denn, es haben sich bedeutende Entwicklungen ergeben.',
  description_en = 'Allows the caster to determine a truth about one thing or matter. The chance of a meaningful answer is 75% plus 1% per level, to a maximum of 95%. Any question can be asked, but more complex questions should yield more allegorical and cryptic answers. As the priest advances in level, answers become clearer. Once an answer is received, the spell ends. Multiple castings provide no additional knowledge unless significant developments have occurred.'
WHERE LOWER(name_en) = LOWER('Divine Truth') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Schicksalshund — Halbling',
  description = 'Erschafft einen schattenhaften Mastiff, nur für den Zauberer und das Ziel sichtbar. Der Hund verfolgt die Kreatur unerbittlich, nähert sich nie näher als 3 m und fällt nicht weiter als 91,4 m zurück. Erzeugt eine unerschütterliche Todesvorahnung. Das erste Erscheinen verursacht Furcht (umgekehrtes Furcht Entfernen der Stufe 1). Solange der Hund verfolgt, erleidet die Kreatur −2 auf alle Rettungswürfe und Moralwürfe. Kann nur durch Fluch Entfernen, Begrenzter Wunsch oder Wunsch beendet werden.',
  description_en = 'Creates a shadowy mastiff visible only to the caster and the target. The hound inexorably stalks the creature, never closer than 3 m or further than 91.4 m behind. Creates an unshakable premonition of death. The initial appearance causes fear (reverse of 1st-level remove fear). While stalked, the creature suffers −2 on all saving throws and morale checks. Can only be ended by remove curse, limited wish, or wish.'
WHERE LOWER(name_en) = LOWER('Doomhound — Halfling') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Druidenverfall',
  description = 'Lässt eine einzelne tote Kreatur zu Staub zerfallen. Alternativ kann der Zauber bis zu 0,28 m³ totes Pflanzenmaterial zersetzen, einschließlich Holzobjekte. Gegenstände aus Pflanzenmaterial müssen einen Gegenstandsrettungswurf gegen Blitz bestehen oder werden zerstört. Getragene Gegenstände sind nur betroffen, wenn der Besitzer seinen Rettungswurf gegen Zauber nicht besteht. Wirkt nicht auf lebende Materie. Ein einzelner körperlicher Untoter mit bis zu 10 TW kann bei missglücktem Todesrettungswurf zerstört werden.',
  description_en = 'Causes a single dead creature to decompose into dust. Alternatively, can decompose up to 0.28 m³ of dead plant material including wood objects. Items of plant material must make an item saving throw vs. lightning or be destroyed. Worn items are only affected if the owner fails a saving throw vs. spell. Does not affect living matter. A single corporeal undead of up to 10 HD can be destroyed on a failed save vs. death magic.'
WHERE LOWER(name_en) = LOWER('Druid''s Decay') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Staubschild — Altes Reich',
  description = 'Erschafft eine schimmernde, unsichtbare Kraftwand, indem Staubpartikel in der Luft zu einer Barriere geformt werden. Der Priester stellt sich Form, Größe und Ausrichtung mental vor, aber die Barriere muss zweidimensional sein. Einmal gewirkt ist sie unbeweglich und von Magie außer Magie Bannen unbeeinflusst. Ist die Barriere kleiner als 1 Quadratmeter, kann sie am Unterarm befestigt werden und funktioniert als Schild mit +3 RK-Bonus insgesamt. Kann nicht mit einem regulären Schild oder Schildzauber kombiniert werden.',
  description_en = 'Creates a scintillating, invisible wall of force by forming dust particles in the air into a barrier. The priest mentally pictures the shape, size, and orientation, but it must be two-dimensional. Once cast, it is immovable and unaffected by magic except dispel magic. If smaller than 1 square meter, it can be attached to the forearm and functions as a shield providing +3 total AC bonus. Cannot be combined with a regular shield or shield spell.'
WHERE LOWER(name_en) = LOWER('Dust Shield — Old Empire') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Erdsinn — Zwerg',
  description = 'Befähigt den Priester, seine Sinne auf die umgebende Erde oder Steinstruktur abzustimmen. Überwacht alle Erde und alles Gestein in einem kugelförmigen Bereich von 9,1 m Radius pro Stufe. Der Priester spürt ein vages Gefühl der Unruhe bei ungewöhnlichen Ereignissen. Die Chance, das spezifische Ereignis zu identifizieren, beträgt 5 % pro Stufe. Der Priester muss ruhig am Wirkort verbleiben — Bewegung über 3 m oder anstrengende Aktivität beendet den Zauber. Erkennt Graben, Sappen, Erdbeben, natürliche Gefahren und Kampfhandlungen auf der Erde.',
  description_en = 'Empowers the priest to key senses into the surrounding earth or stone structure. Monitors all earth and stone in a spherical volume of 9.1 m radius per level. The priest senses a vague feeling of unease at unusual events. The chance of identifying the specific event is 5% per level. The priest must remain quietly in place — movement beyond 3 m or strenuous activity breaks the spell. Detects digging, sapping, earthquakes, natural hazards, and combat on the earth.'
WHERE LOWER(name_en) = LOWER('Earth Sense — Dwarf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Erdluft',
  description = 'Lässt die Erde um die Zielkreatur herum in einer heftigen Eruption aus Dreck und Stein nach oben und innen schießen. Die Anzahl der Steine beträgt 1W4 plus die Stufe des Zauberers. Jeder Stein verursacht 1 Schadenspunkt, stört Zauber und zählt als ein erfolgreicher Angriff für Steinhaut. Die Steine gelten als magische Waffen. Funktioniert nicht auf massivem Felsboden (wie Grundgestein, nicht Pflasterstein), es sei denn, der Zauberer ist Stufe 10 oder höher.',
  description_en = 'Causes the earth surrounding the target creature to surge upward and inward in a violent eruption of dirt and rock. The number of rocks is 1d4 plus the caster''s level. Each rock causes 1 point of damage, disrupts spellcasting, and counts as one hit for stoneskin. The rocks are considered magical weapons. Does not work on solid stone surfaces (like bedrock, not flagstone) unless the caster is level 10 or higher.'
WHERE LOWER(name_en) = LOWER('Earthenair') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Wirksamer Monsterschutz',
  description = 'Verhindert, dass Monster mit 2 oder weniger Trefferwürfeln den Wirkungsbereich betreten. Die Kreaturen erhalten einen Rettungswurf — bei Erfolg können sie eintreten. Der Bereich ist ein Würfel, dessen Seitenlänge der Stufe des Zauberers mal 3 m entspricht (z. B. 27,4 m Seitenlänge bei Stufe 9). Monster, die sich beim Wirken bereits im Bereich befinden, sind nicht betroffen, können aber nach Verlassen nicht zurückkehren. Monster außerhalb können Wurfwaffen und Zauber in den geschützten Bereich schleudern.',
  description_en = 'Prevents monsters of 2 or fewer Hit Dice from entering the area of effect. Creatures are allowed a saving throw; success means they can enter. The area is a cube with sides equal to the caster''s level times 3 m (e.g., 27.4 m sides at level 9). Monsters within the area when cast are unaffected but cannot return after leaving. Monsters outside can hurl missiles and cast spells into the warded area.'
WHERE LOWER(name_en) = LOWER('Efficacious Monster Ward') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Elas Segen',
  description = 'Verleiht dem Priester die speziellen Diebesfähigkeiten eines Diebes seiner Stufe für die Zauberdauer. Ein Priester der 5. Stufe erhält die Basis-Diebswerte (TP 15 %, SÖ 10 %, F/FE 5 %, LB 10 %, VS 5 %, GL 15 %, MW 60 %, SR 0 %), plus Rassen-, Rüstungs- und Geschicklichkeitsanpassungen sowie die 180 frei verteilbaren Punkte. Die Punkte können bei jedem Wirken anders verteilt werden. Der Priester kann diesen Zauber nur auf sich selbst wirken.',
  description_en = 'Grants the priest the special thieving skills of a thief of his or her level for the spell''s duration. A 5th-level priest gains base thief scores (PP 15%, OL 10%, F/RT 5%, MS 10%, HS 5%, DN 15%, CW 60%, RL 0%), plus racial, armor, and Dexterity adjustments and the 180 discretionary points. Points can be allocated differently each casting. The priest can only cast this on himself or herself.'
WHERE LOWER(name_en) = LOWER('Ela''s Blessing') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Verschanzung',
  description = 'Während der Zauberdauer werden alle Angriffe auf die geschützte Kreatur, die einen Angriffswurf erfordern, zweimal gewürfelt. Das für die Kreatur günstigere Ergebnis wird verwendet. Dauer: 7 Runden. Nur durch Berührung wirkbar.',
  description_en = 'While this spell is in effect, all attacks on the protected creature that require an attack roll are rolled twice. The result most favorable to the creature is used. Duration: 7 rounds. Cast by touch only.'
WHERE LOWER(name_en) = LOWER('Embattlement') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Emotionskontrolle',
  description = 'Kann auf zwei Arten gewirkt werden. A) Priester: Schützt eigene Emotionen vor magischer Untersuchung und projiziert eine falsche Emotion. Gewährt +2 auf Rettungswürfe gegen Zauber wie Schreck, Reizung, Gesinnung Erkennen, Furcht und Phantasmatischer Killer. B) Andere: Erzeugt eine einzelne emotionale Reaktion (Mut, Furcht, Freundschaft, Hoffnungslosigkeit) bei einer Kreatur pro fünf Stufen in einem 6,1-m-Würfel. Alle Kreaturen müssen einen Rettungswurf gegen Zauber bestehen, modifiziert um −1 pro drei Stufen des Priesters.',
  description_en = 'Can be cast in two ways. A) Priest: Shields own emotions from magical examination and projects a false emotion. Grants +2 on saving throws vs. spells like spook, irritation, know alignment, fear, and phantasmal killer. B) Other: Creates a single emotional reaction (courage, fear, friendship, hopelessness) in one creature per five levels within a 6.1 m cube. All creatures must save vs. spell, modified by −1 per three caster levels.'
WHERE LOWER(name_en) = LOWER('Emotion Control') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Ätherealität',
  description = 'Ähnlich dem Magierzauber der 5. Stufe, aber mit Einschränkungen: Der Priester kann die Grenzätherische Ebene nicht verlassen und muss bei Ablauf auf die Materielle Ebene zurückkehren. Nur willige Kreaturen können mitgenommen werden — eine pro zwei Stufen. Dauer: ein Zug plus eine Runde pro Stufe. Während der Ätherealität ist der Priester ohne Wahres Sehen unentdeckbar, kann durch feste Objekte hindurchgehen und nicht die physische Welt beeinflussen. Wer bei Ablauf ein festes Objekt besetzt, wird in die Tiefe Ätherebene geschleudert.',
  description_en = 'Similar to the 5th-level wizard spell, but with restrictions: the priest cannot leave the Border Ethereal and must return to the Prime Material when the spell ends. Only willing creatures can be brought along — one per two levels. Duration: one turn plus one round per level. While ethereal, the priest is undetectable without true seeing, can pass through solid objects, and cannot affect the physical world. Occupying a solid object when the spell ends hurls one into the Deep Ethereal.'
WHERE LOWER(name_en) = LOWER('Etherealness') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Unerschöpflicher Köcher — Elf',
  description = 'Verzaubert einen Köcher mit mindestens zwei Pfeilen. Jede Runde kann der Zauberer bis zu zwei Pfeile entnehmen, ohne den Gesamtbestand zu verringern. Werden mehr als zwei Pfeile in einer Runde entnommen, endet der Zauber sofort. Nur der Zauberer kann Pfeile entnehmen. Entnommene Pfeile sind nie magisch, selbst wenn der Köcher magische Pfeile enthält. Nicht sofort verwendete Pfeile verschwinden nach zwei Runden. Verschossene Pfeile bleiben bestehen, können aber nicht wiederverwendet werden.',
  description_en = 'Enchants a quiver containing at least two arrows. Each round, the caster can withdraw up to two arrows without depleting the supply. If more than two arrows are withdrawn in one round, the spell ends immediately. Only the caster can withdraw arrows. Drawn arrows are never magical even if the quiver contains magical arrows. Arrows not immediately used fade to nothingness in two rounds. Shot arrows persist but cannot be reused.'
WHERE LOWER(name_en) = LOWER('Everfull Quiver — Elf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Erhebung',
  description = 'Durch Berührung entfernt der Priester die Effekte von Furcht, Schlaf, Schwachsinn, Hunger, Schmerz, Übelkeit, Bewusstlosigkeit, Berauschung und Wahnsinn vom Empfänger und schützt gegen diese Effekte für die Zauberdauer. Empfänger anderen Glaubens und anderer Gesinnung müssen einen Rettungswurf bestehen; gleiche Gesinnung erhält −4, gleicher Glaube −6 Abzug. Erfolgreich Erhobene erhalten +1 bis +2 auf Moralwürfe je nach Übereinstimmung von Glaube und Gesinnung. Materialkomponenten: Weihwasser und Saphir/Diamant im Wert von 1.000 GM.',
  description_en = 'By touch, removes effects of fear, sleep, feeblemindedness, hunger, pain, nausea, unconsciousness, intoxication, and insanity from the recipient, and protects against these effects for the duration. Recipients of different faith and alignment must save; same alignment gives −4, same faith −6 penalty. Successfully exalted recipients receive +1 to +2 on morale checks depending on faith and alignment match. Material components: holy water and sapphire/diamond worth 1,000 gp.'
WHERE LOWER(name_en) = LOWER('Exaltation') AND spell_type = 'priest';
