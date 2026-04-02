-- ═══════════════════════════════════════════════════════════════════════════════
-- PSC1 Priest Spells Level 1 (Batch 2: 21 Spells — Detect Disease to Ore Finder)
-- Metrisch, eng an Originaltexten orientiert
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.spells SET
  name = 'Krankheit Entdecken',
  description = 'Offenbart, ob ein Wesen oder Gegenstand eine Krankheit trägt (einschließlich Lykanthropie, Mumienfäule oder magischer Krankheiten) und ob der Priester sie heilen kann. Der Zauber identifiziert die Art der Krankheit nicht genau, sondern zeigt nur ihre Anwesenheit und Heilbarkeit an.',
  description_en = 'Reveals whether a creature or object carries a disease (including lycanthropy, mummy rot, or magical disease), and whether the caster can cure it. The spell does not precisely identify the type of disease, only indicating its presence and curability.'
WHERE LOWER(name_en) = LOWER('Detect Disease') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Drow Entdecken — Zwerg, Gnom',
  description = 'Entdeckt die Anwesenheit von Nachtelfen (Drow) und ihren Verwandten in einem Pfad von 3 m Breite und bis zu 27,4 m Länge in Blickrichtung des Priesters. Der Zauber durchdringt dünne Barrieren, wird aber durch 0,9 m Stein, 2,5 cm Metall oder dünne Bleischichten blockiert.',
  description_en = 'Detects the presence of night elves (drow) and their kin in a path 3 m wide and up to 27.4 m long in the direction the priest is facing. The spell penetrates thin barriers but is blocked by 0.9 m of stone, 2.5 cm of metal, or thin lead sheets.'
WHERE LOWER(name_en) = LOWER('Detect Drow — Dwarf, Gnome') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Zwerge Entdecken — Zwerg',
  description = 'Entdeckt lebende Zwerge, tote Zwerge, Azer, Duergar, Derro, Halbzwerge und vergossenes Zwergenblut in einem Pfad von 3 m Breite und bis zu 27,4 m Länge. Nützlich zum Aufspüren vermisster Kameraden oder verborgener Verwandter unter Tage.',
  description_en = 'Detects living dwarves, dead dwarves, azer, duergar, derro, half-dwarves, and spilled dwarven blood in a path 3 m wide and up to 27.4 m long. Useful for locating missing comrades or hidden relatives underground.'
WHERE LOWER(name_en) = LOWER('Detect Dwarves — Dwarf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Schädliches Gas Entdecken — Zwerg',
  description = 'Nützlich beim Bergbau und bei der Unterwelterkundung. Entdeckt die Anwesenheit von schädlichem Gas in einer Kugel von 18,3 m Durchmesser um den Priester. Der Zauber identifiziert die Art des Gases und seine ungefähre Konzentration. Warnt vor Grubengas, giftigen Dämpfen und erstickenden Atmosphären.',
  description_en = 'Useful in mining and underground exploration. Detects the presence of harmful gas in a sphere 18.3 m in diameter around the caster. The spell identifies the type of gas and its approximate concentration. Warns of mine gas, toxic fumes, and suffocating atmospheres.'
WHERE LOWER(name_en) = LOWER('Detect Harmful Gas — Dwarf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Harmonie Entdecken',
  description = 'Gibt dem Shukenja allgemeine Informationen über das Gleichgewicht und die spirituelle Harmonie eines Bereichs oder eines Individuums. Der Priester erkennt, ob ein Ort oder eine Person in Einklang mit der natürlichen Ordnung steht oder ob Disharmonie herrscht (z.B. durch Flüche, böse Einflüsse oder spirituelle Störungen). Wirkung: Sofort.',
  description_en = 'Gives the shukenja general information on the balance and spiritual harmony of an area or individual. The priest senses whether a place or person is in accord with the natural order or whether disharmony exists (e.g. from curses, evil influences, or spiritual disturbances). Effect: Instantaneous.'
WHERE LOWER(name_en) = LOWER('Detect Harmony') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Raubtier Entdecken',
  description = 'Ermöglicht dem Priester, die Anwesenheit räuberischer Kreaturen zu spüren — einschließlich Haie, Aale, Rochen und intelligenter Meereskreaturen wie Sahuagin. Der Zauber gibt Richtung und ungefähre Entfernung an. Besonders nützlich für Unterwasser-Expeditionen und Küstenreisen.',
  description_en = 'Allows the caster to sense the presence of any predatory creatures — including sharks, eels, rays, and intelligent marine creatures such as sahuagin. The spell indicates direction and approximate distance. Especially useful for underwater expeditions and coastal travel.'
WHERE LOWER(name_en) = LOWER('Detect Predator') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Waffen Entdecken — Zwerg',
  description = 'Entdeckt Waffen in einem Pfad von 3 m Breite und bis zu 27,4 m Länge in Blickrichtung des Priesters. Der Priester erkennt die ungefähre Art und Anzahl der Waffen. Der Zauber durchdringt dünne Barrieren, wird aber durch 0,9 m Stein, 2,5 cm Metall oder dünne Bleischichten blockiert.',
  description_en = 'Detects weapons in a path 3 m wide and up to 27.4 m long in the direction the priest is facing. The caster senses the approximate type and number of weapons. The spell penetrates thin barriers but is blocked by 0.9 m of stone, 2.5 cm of metal, or thin lead sheets.'
WHERE LOWER(name_en) = LOWER('Detect Weapons — Dwarf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Diktat',
  description = 'Lässt alle vom Priester oder Personen innerhalb von 3 m gesprochenen Worte automatisch auf einem Stück Papier oder einer leeren Buchseite erscheinen. Nützlich zum Protokollieren von Gesprächen, Verhören und Verhandlungen. Die Schrift erscheint in der Sprache des Sprechers. Dauer: 1 Runde pro Stufe.',
  description_en = 'Causes any words spoken by the priest or anyone within 3 m of him to appear on a piece of paper or blank book page. Useful for recording conversations, interrogations, and negotiations. The writing appears in the speaker''s language. Duration: 1 round per level.'
WHERE LOWER(name_en) = LOWER('Dictation') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Dunkelheit Bannen',
  description = 'Löst alle Bereiche magischer Dunkelheit im Wirkungsbereich auf und verhindert, dass sie sich für mindestens 8 Runden neu bilden. Normale Dunkelheit ist nicht betroffen — nur magisch erzeugte. Nützlich gegen Drow und andere Kreaturen, die magische Dunkelheit als Kampftaktik einsetzen.',
  description_en = 'Dispels all areas of magical darkness within the area of effect, rendering them unable to reform for at least 8 turns. Normal darkness is not affected — only magically created darkness. Useful against drow and other creatures that use magical darkness as a combat tactic.'
WHERE LOWER(name_en) = LOWER('Dispel Darkness') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Erschöpfung Bannen',
  description = 'Entfernt physische Ermüdung oder Erschöpfung vom Subjekt, indem die physiologischen Auswirkungen seiner Anstrengungen rückgängig gemacht werden. Das Subjekt ist sofort erfrischt und kann wieder normal agieren. Der Zauber heilt keine Trefferpunkte und behebt keine Verletzungen — nur Müdigkeit und Erschöpfung.',
  description_en = 'Removes physical fatigue or exhaustion from the subject by undoing the physiological effects of exertions. The subject is instantly refreshed and can act normally again. The spell does not heal hit points or cure injuries — only tiredness and exhaustion.'
WHERE LOWER(name_en) = LOWER('Dispel Fatigue') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Göttliche Blutlinie',
  description = 'Ermöglicht dem Priester, jede Spur edler Herkunft im betroffenen Wesen festzustellen. Ein erfolgreicher Rettungswurf gegen Zauber negiert den Effekt und verbirgt die Abstammung. Offenbart, ob das Wesen königliches, adliges oder göttliches Blut trägt.',
  description_en = 'Enables the caster to ascertain any trace of noble lineage in the affected creature. A successful saving throw vs. spell negates and hides the ancestry. Reveals whether the creature carries royal, noble, or divine blood.'
WHERE LOWER(name_en) = LOWER('Divine Bloodline') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Romantisches Interesse Erkennen — Elf',
  description = 'Ermöglicht dem Priester, die Existenz und das Subjekt einer unausgesprochenen Liebe, Schwärmerei oder romantischen Zuneigung des ersten Wesens zu erkennen, dem sein Blick nach dem Wirken begegnet. Der Zauber offenbart nur die Existenz und allgemeine Richtung des Interesses, nicht die Identität der geliebten Person.',
  description_en = 'Enables the priest to divine the existence and subject of the unspoken love, crush, or romantic interest of the first creature he gazes upon after casting. The spell reveals only the existence and general direction of the interest, not the identity of the beloved.'
WHERE LOWER(name_en) = LOWER('Divine Romantic Interest — Elf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Ebenholzhand',
  description = 'Diese kleine Meditationsfokussierung konzentriert eine unheilvolle nekromantische Aura in der gewählten Hand des Priesters und umhüllt die Finger in einer dunklen, flackernden Strahlung. Die Ebenholzhand verursacht bei Berührung zusätzlichen nekromantischen Schaden. Nützlich im Nahkampf als Ergänzung zu normalen Angriffen.',
  description_en = 'This minor meditation focuses a baneful necromantic aura in the caster''s chosen hand, enveloping the fingers in a dark, flickering radiance. The Ebony Hand deals additional necrotic damage on touch. Useful in melee as a supplement to normal attacks.'
WHERE LOWER(name_en) = LOWER('Ebony Hand') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Emotionen Lesen',
  description = 'Ermöglicht dem Priester eine sofortige Ablesung des emotionalen Zustands eines einzelnen Subjekts. Funktioniert bei jedem Wesen mit Intelligenz 1 oder höher. Der Priester erkennt Angst, Wut, Freude, Trauer, Liebe, Hass und andere starke Emotionen. Gibt keine Gedanken oder Informationen preis — nur den emotionalen Zustand.',
  description_en = 'Allows the priest to perform an instantaneous reading of a single subject''s emotional state. Works on any creature with Intelligence 1 or higher. The priest detects fear, anger, joy, sadness, love, hatred, and other strong emotions. Reveals no thoughts or information — only the emotional state.'
WHERE LOWER(name_en) = LOWER('Emotion Read') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Ewiger Schlaf — Drache',
  description = 'Stellt sicher, dass der Geist eines toten Drachen für alle Ewigkeit in die Äußeren Ebenen übergeht. Einmal auf die Leiche eines Drachen gewirkt, kann diese nie wieder als Untoter auferstehen oder durch Nekromantie manipuliert werden. Der Zauber schützt auch die Grabstätte des Drachen vor Störungen.',
  description_en = 'Ensures that a dead dragon''s spirit passes for all eternity to the Outer Planes. Once cast on a dragon''s corpse, that corpse can never be raised as undead or manipulated by necromancy again. The spell also protects the dragon''s burial site from disturbance.'
WHERE LOWER(name_en) = LOWER('Eternal Sleep — Dragon') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Übermäßiger Genuss',
  description = 'Bewirkt, dass das Zielwesen sich auf seine aktuelle Tätigkeit bis zum Punkt der Maßlosigkeit konzentriert. Ein essendes Wesen isst weiter, bis es krank wird; ein trinkendes Wesen trinkt bis zur Bewusstlosigkeit; ein kämpfendes Wesen kämpft rücksichtslos. Rettungswurf gegen Zauber negiert. Dauer: 1 Runde pro Stufe.',
  description_en = 'Causes the target creature to focus on its current activities to the point of overindulgence. An eating creature eats until sick; a drinking creature drinks until unconscious; a fighting creature fights recklessly. Saving throw vs. spell negates. Duration: 1 round per level.'
WHERE LOWER(name_en) = LOWER('Excessive Indulgence') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Trinkwasser Finden',
  description = 'Vermittelt dem Priester die genaue Richtung, ungefähre Entfernung und ein vages mentales Bild der nächsten trinkbaren Wasserquelle innerhalb der Zauberreichweite. Der Priester kann einschätzen, wie ergiebig die Quelle ist. Nützlich in Wüsten und anderen trockenen Gebieten.',
  description_en = 'Imparts to the caster the precise direction, approximate distance, and a vague mental picture of the nearest spot with drinkable water within spell range. The priest can estimate how plentiful the water is. Useful in deserts and other arid regions.'
WHERE LOWER(name_en) = LOWER('Find Drinkable Water') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Wasser Finden',
  description = 'Ermöglicht dem Priester, jede Wasserquelle innerhalb der Zauberreichweite zu finden und ihre Ergiebigkeit einzuschätzen. Kann unterirdische Wasseradern, verborgene Quellen und Grundwasser aufspüren. Nach dem Wirken zeigt der Priester in die Richtung der nächsten Wasserquelle.',
  description_en = 'Enables the caster to find any water source within spell range and estimate how plentiful it is. Can detect underground water veins, hidden springs, and groundwater. After casting, the priest points toward the nearest water source.'
WHERE LOWER(name_en) = LOWER('Find Water') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Stärke von Uthgar',
  description = 'Stärkt den Empfänger mit Geistes- und Körperkraft, die es ihm ermöglicht, Schmerz und Widrigkeiten mutig zu ertragen. Ein Schamane Uthgars wirkt diesen Zauber als Segen vor dem Kampf. Der Empfänger erhält Bonusse auf Rettungswürfe gegen Furcht, Schmerz und Moral-Effekte. Dauer: 1 Runde pro Stufe.',
  description_en = 'Fortifies the recipient with strength of mind and body that enables them to endure pain or adversity with courage. A shaman of Uthgar casts this spell as a blessing before battle. The recipient gains bonuses to saving throws against fear, pain, and morale effects. Duration: 1 round per level.'
WHERE LOWER(name_en) = LOWER('Fortitude of Uthgar') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Frostfinger',
  description = 'Eine Kälteversion des Brennende-Hände-Zaubers der 1. Stufe. Beim Wirken schießen eisige Kälte und Eissplitter von den Fingerspitzen des Priesters. Verursacht 1W3 Schaden + 2 Punkte pro Stufe des Priesters in einem Kegel vor dem Priester. Rettungswurf gegen Zauber für halben Schaden. Entzündet keine Gegenstände, kann aber Wasser einfrieren.',
  description_en = 'A cold form of the Burning Hands 1st-level wizard spell. When cast, freezing cold and ice shards blast from the caster''s fingertips. Deals 1d3 damage + 2 points per priest level in a cone in front of the priest. Saving throw vs. spell for half damage. Does not ignite objects but can freeze water.'
WHERE LOWER(name_en) = LOWER('Frost Fingers') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Erz Finden — Altes Imperium, Zwerg, Gnom',
  description = 'Ermöglicht dem Priester, den Standort einer bestimmten Art von Erz- oder Mineralvorkommen zu erspüren. Der Priester konzentriert sich auf ein bestimmtes Material (Gold, Silber, Eisen, Edelsteine usw.) und erhält die Richtung und ungefähre Entfernung zum nächsten Vorkommen. Reichweite abhängig von der Priesterstufe.',
  description_en = 'Enables the caster to divine the location of a single type of ore or mineral deposit. The priest concentrates on finding a specific material (gold, silver, iron, gems, etc.) and receives the direction and approximate distance to the nearest deposit. Range depends on priest level.'
WHERE LOWER(name_en) = LOWER('— Old Empire, Dwarf, Gnome') AND spell_type = 'priest';
