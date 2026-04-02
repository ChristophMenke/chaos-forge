-- ═══════════════════════════════════════════════════════════════════════════════
-- PSC1 Priest Spells Level 5 (Batch 3: 20 Spells — Dark Promise to Extradimensional Pocket)
-- Metrisch, eng an Originaltexten orientiert
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.spells SET
  name = 'Dunkles Versprechen',
  description = 'Zwingt eine Kreatur, ein Versprechen zu befolgen, das den Interessen der Gottheit des Priesters dient (nicht suizidal). Beispiele: „Kehre nie nach [Ort] zurück" oder „Greife nie wieder einen Priester von Bane an." Rettungswurf gegen Zauber. Bei Verletzung des Versprechens verliert die Kreatur permanent 1 Trefferpunkt pro Verstoß (nicht heilbar, außer durch Wunsch). Kann durch den Originalzauberer, einen Wunsch oder Fluch Brechen eines stärkeren guten Priesters aufgehoben werden. Nur ein Dunkles Versprechen kann gleichzeitig auf ein Wesen wirken.',
  description_en = 'Forces a creature to follow a promise that serves the caster''s patron deity''s interests (not suicidal). Examples: "Do not return to [place]" or "Never again attack a priest of Bane." Saving throw vs. spell. If the promise is violated, the creature permanently loses 1 hit point per violation (not curable except by wish). Can be lifted by the original caster, a wish, or remove curse from a higher-level good priest. Only one dark promise can affect a being at a time.'
WHERE LOWER(name_en) = LOWER('Dark Promise') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Tote-Magie-Schild',
  description = 'Erzeugt einen schimmernden, scheibenförmigen Kraftschild von 0,6 m Durchmesser am Unterarm des Priesters. Beeinflusst weder Rüstungsklasse noch physische Angriffe. Wird der Schild zwischen den Priester und einen Zauber gehalten, löst er den Zauber harmlos auf — auch Flächenzauber können blockiert werden. Zum Blockieren ist ein Rettungswurf gegen Zauber mit +1 pro drei Erfahrungsstufen (max. +5) nötig. Selbst bei Misserfolg erhält der Priester +2 auf seinen normalen Rettungswurf gegen den Zauber.',
  description_en = 'Creates a shimmering disc-shaped shield of force 0.6 m in diameter on the caster''s forearm. Does not affect Armor Class or physical attacks. If interposed between the caster and a spell, it harmlessly dissipates the spell — area-of-effect spells can also be blocked. Blocking requires a saving throw vs. spell with +1 per three experience levels (max +5). Even on failure, the wielder still gets +2 on any normal saving throw against the spell.'
WHERE LOWER(name_en) = LOWER('Dead Magic Shield') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Trümmerbarriere',
  description = 'Belebt nichtlebende Weltraumtrümmer (maximal menschengroß) in einem ovalen Bereich von bis zu 3 m pro Stufe Länge und 1,5 m pro Stufe Breite/Tiefe. Der Priester kann das Feld als Barriere oder Angriffswaffe nutzen. Kreaturen im Feld erleiden 4W4 Schaden pro Runde. Freiliegende Keramik-, Knochen- oder Glasgegenstände müssen jede Runde einen Gegenstandsrettungswurf bestehen oder werden zerstört. Das Feld bewegt sich mit Rate 18 (Manövrierfähigkeit C) und kann durch Konzentration des Priesters gelenkt werden.',
  description_en = 'Animates nonliving space debris (man-size or smaller) in an oval area up to 3 m per level long and 1.5 m per level wide/deep. The priest can use the field as barrier or offensive weapon. Creatures in the field suffer 4d4 damage per round. Exposed ceramic, bone, or glass items must make an item saving throw each round or be destroyed. The field moves at rate 18 (MC: C) and can be directed by the priest''s concentration.'
WHERE LOWER(name_en) = LOWER('Debris Barrier') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Tod Verweigern',
  description = 'Versetzt willige oder bewusstlose Wesen, die innerhalb der letzten Runde verletzt wurden, in eine Art Scheintod. Funktioniert nicht bei feindlichen, noch bewussten Wesen oder solchen unter magischem Schlaf/Bezauberung. Verhindert weiteren Blutverlust, Gift-Ausbreitung und Trefferpunktverlust. Schützt auch vor zusätzlichem Schaden durch nicht-magische Angriffe oder Handhabung (z.B. Ziehen über rauen Boden). Der Priester kann den Effekt jederzeit willentlich beenden. Betroffene können sich nicht selbst wecken.',
  description_en = 'Places willing or unconscious beings injured within the last turn into suspended animation. Does not work on hostile conscious beings or those under magical sleep/charm. Prevents further blood loss, poison dispersal, and hit point loss. Also protects against additional damage from nonmagical attacks or handling (e.g. dragging over rough ground). The caster can end the effect instantly at will from any distance. Recipients cannot rouse themselves.'
WHERE LOWER(name_en) = LOWER('Deny Death') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Dimensionale Translokation',
  description = 'Versiegelt die multidimensionale Existenz einer magischen, untoten oder extraplanaren Kreatur. Die Kreatur kann komplett in ihre extraplanare Dimension verbannt oder vollständig in die Primäre Materielle Ebene gezwungen werden. Kreaturen mit weniger TW/Stufen als der Priester erhalten keinen Rettungswurf. Verbannte Kreaturen können für die Zauberdauer nicht zurückkehren. In die Primäre Ebene gezwungene Kreaturen können RK-Verlust, verringerten magischen Waffenbedarf, permanenten Tod, Verlust von Zauber-ähnlichen Fähigkeiten oder den Verlust der Energiedrainungs-Fähigkeit erleiden.',
  description_en = 'Seals off the multidimensional existence of a magical, undead, or extraplanar creature. The creature can be banished entirely to its extraplanar dimension or forced entirely into the Prime Material Plane. Creatures with fewer HD/levels than the priest get no saving throw. Banished creatures cannot return for the spell''s duration. Creatures forced to the Prime Material may suffer AC reduction, lowered magical weapon requirement, permanent death, loss of spell-like powers, or loss of energy drain ability.'
WHERE LOWER(name_en) = LOWER('Dimensional Translocation') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Göttliche Investitur',
  description = 'Wird bei Geburt eines Adelserben, einer Krönung oder Titelverleihung gewirkt und erfordert mindestens eine Runde Zeremoniedauer. Der Empfänger wird in ein flackerndes Strahlennimbus gehüllt (ähnlich Feenfeuern). Während der Zeremonie kann der Priester illusorische Zeremonialeffekte erzeugen (ähnlich Spektralkraft). Das Vermächtnis von Siamorphe: ein dauerhafter magischer Effekt, der dem Rang des Empfängers entspricht — typisch +1 CHA-Bonus gegenüber Untertanen, +1 auf Rettungswürfe gegen Gift, oder +1 auf Trefferwürfe mit dem Zeremonialschwert. Unwillige Empfänger können den Effekt ablehnen.',
  description_en = 'Cast at a noble''s birth, coronation, or investiture, requiring at least one turn of ceremony. The recipient is bathed in a flickering nimbus of radiance (similar to faerie fire). During the ceremony, the priest can create illusory pageantry (similar to spectral force). The legacy of Siamorphe: a lasting magical effect corresponding to the recipient''s rank — typically +1 CHA bonus with subjects, +1 to saving throws vs. poison, or +1 to hit with the ceremonial sword. Unwilling recipients can forego the effects.'
WHERE LOWER(name_en) = LOWER('Divine Investiture') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Erdbeben* — Altes Reich',
  description = 'Eine schwächere, gezieltere Form des Stufe-7-Zaubers Erdbeben. Der Wirkungsbereich ist kreisförmig, von 0,9 m Durchmesser bis 0,9 m pro Stufe. Wesen im Bereich müssen einen Rettungswurf gegen Zauber bestehen oder werden zu Boden geworfen, für 1W4 Runden betäubt und erleiden 2W8 Schaden (bei Erfolg: zu Boden geworfen, 1W8 Schaden). Gebäude erleiden 2 Strukturschadenspunkte. Kann als kooperativer Zauber gewirkt werden: bei mehreren gleichzeitigen Priestern wird der Strukturschaden multipliziert (max. 5 Priester für 50 Strukturschaden). Personenschaden wird nicht multipliziert.',
  description_en = 'A weaker, more targetable form of the 7th-level earthquake spell. The area of effect is circular, from 0.9 m diameter up to 0.9 m per level. Beings in the area must save vs. spell or be thrown down, stunned for 1d4 rounds, and take 2d8 damage (on success: thrown down, 1d8 damage). Buildings suffer 2 structural damage points. Can be cast cooperatively: with multiple simultaneous priests, structural damage is multiplied (max 5 priests for 50 structural damage). Creature damage is not multiplied.'
WHERE LOWER(name_en) = LOWER('Earthshake* — Old Empire') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Leichter Marsch',
  description = 'Ermöglicht einer Anzahl von Kreaturen gleich der Priesterstufe, für ebenso viele Tage einen Gewaltmarsch zu absolvieren. Betroffene Kreaturen können das 2,5-fache ihrer normalen Bewegungsrate ohne Erschöpfungsrisiko zurücklegen (keine Konstitutionsprüfung am Tagesende). Alle betroffenen Kreaturen erleiden −1 auf Trefferwürfe für die Dauer (nicht kumulativ). Der Modifikator kann nicht durch Rasten aufgehoben werden. Hat keinen Einfluss auf Gelände-, Erschöpfungs- oder Wettermodifikatoren auf Bewegung. Materialkomponente: Ein Stück Schuhleder.',
  description_en = 'Enables a number of creatures equal to the caster''s level to force march for that many days. Affected creatures can travel 2.5 times their normal movement rate without fatigue risk (no Constitution check at day''s end). All affected suffer −1 to attack rolls for the duration (not cumulative). The modifier cannot be negated by resting. Has no effect on terrain, fatigue, or weather modifiers to movement. Material component: a piece of shoe leather.'
WHERE LOWER(name_en) = LOWER('Easy March') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Ebenholzranken',
  description = 'Beschwört einen schwarzen Klumpen von 1,5 m Durchmesser mit vier 3 m langen Armen. Berührung des zentralen Klumpens verursacht Tod (Rettungswurf gegen Tod). Die Arme greifen mit der Trefferchance des Priesters an und verursachen 1W10+2 Korrosions- und Quetschschaden. Getroffene Kreaturen haben eine Chance, sich zu befreien (wie Tür öffnen). In der Folgerunde zieht der Arm die Kreatur gegen den Klumpen (erneuter Rettungswurf gegen Tod). Danach erleidet die festgehaltene Kreatur weiterhin Korrosions- und Quetschschaden.',
  description_en = 'Summons a lump of blackness 1.5 m in diameter with four 3 m arms. Touching the central lump causes death (saving throw vs. death). The arms attack with the priest''s chance to hit, inflicting 1d10+2 corrosive and constriction damage. Struck creatures get one chance to break free (as opening a door). Next round, the arm drags the creature against the lump (saving throw vs. death again). Thereafter, held creatures continue to suffer corrosion and constriction damage.'
WHERE LOWER(name_en) = LOWER('Ebony Tendrils') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Echoortung',
  description = 'Sendet Schallimpulse aus und empfängt dreidimensionale Darstellungen der Unterwasser-Umgebung — wie ein Delfin. Gibt dem Priester detaillierte Eindrücke von Objekten, Kreaturen, Durchgängen und Strukturen in alle Richtungen innerhalb von 91,4 m. Erkennt auch nicht-magisch verborgene oder geheime Türen. Der Priester kann normal sprechen und Zauber wirken. Andere Meeresbewohner können die Schallimpulse hören (erschwert Schleichen). Der Priester kann die Impulse zu einer Schallwelle bündeln: 5W6 Schaden, 1W4 Runden Betäubung (beendet den Zauber sofort). Danach 1 Stunde lang nicht sprachfähig.',
  description_en = 'Sends out sound pulses and receives three-dimensional representations of underwater surroundings — like a dolphin. Gives the priest detailed impressions of objects, creatures, passages, and structures in all directions within 91.4 m. Also detects nonmagically concealed or secret doors. The priest can speak and cast normally. Other marine creatures can hear the pulses (makes sneaking difficult). The caster can focus pulses into a sonic wave: 5d6 damage, 1d4 rounds stunning (instantly ends the spell). Afterwards, unable to speak for one hour.'
WHERE LOWER(name_en) = LOWER('Echolocation') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Ältestes Auge — Drow',
  description = 'Eines der Augen des Priesters verwandelt sich für 7 Runden in ein leuchtendes goldenes Orb des Bösen. Jede Runde kann der Priester eine einzelne lebende Kreatur innerhalb von 6,1 m mit dem bösen Blick treffen (zusätzlich zu anderen Aktionen). Bei misslingendem Rettungswurf gegen Zauber (−3) erblindet die Kreatur magisch (nicht heilbar durch Ruhe oder Wundheilung — erfordert Magie Bannen, Fluch Brechen oder Blindheit/Taubheit Heilen). Der Blick kann durch Zauber oder magische Effekte reflektiert werden. 1% kumulative Chance pro Nutzung, dass das Auge des Priesters permanent erblindet.',
  description_en = 'One of the caster''s eyes transforms into a glowing golden orb of evil for 7 rounds. Each round, the priest can glare at a single living creature within 6.1 m (in addition to other actions). On a failed saving throw vs. spell (−3), the creature is magically blinded (not curable by rest or cure wounds — requires dispel magic, remove curse, or cure blindness). The gaze can be reflected by spells or magical effects. 1% noncumulative chance per use that the priest''s eye is permanently blinded.'
WHERE LOWER(name_en) = LOWER('Elder Eye — Drow') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Elementarverbot',
  description = 'Verhindert das Betreten des Wirkungsbereichs durch alle Elementare. Elementare außerhalb können keine physischen Angriffe gegen Wesen innerhalb durchführen, können aber Zauber und Fernkampfangriffe in den Bereich wirken. Der Zauber betrifft einen Würfel mit Seitenlänge gleich der Priesterstufe mal 1,5 m (ein Priester der 12. Stufe betrifft einen 18,3 m × 18,3 m × 18,3 m Würfel). Elementare, die sich beim Wirken bereits im Bereich befinden, sind nicht betroffen — verlassen sie ihn aber, können sie nicht zurückkehren. Materialkomponente: Vier verschiedenfarbige Glasperlen (gelb, grün, rot, blau).',
  description_en = 'Prevents entry of all elementals into the area of effect. Elementals outside cannot make physical attacks against those inside but can cast spells and make missiles into the area. The spell affects a cube with sides equal to caster level times 1.5 m (a 12th-level priest affects an 18.3 m × 18.3 m × 18.3 m cube). Elementals inside when cast are unaffected — but if they leave, they cannot reenter. Material component: four glass beads of different colors (yellow, green, red, blue).'
WHERE LOWER(name_en) = LOWER('Elemental Forbiddance') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Elementarschutz',
  description = 'Macht eine Kreatur gegen die Auswirkungen eines bestimmten Elementtyps immun (bei Wirkung gewählt). Passiver Schaden (Umgebungshitze, Sturz in Feuergrube) wird komplett ignoriert. Aktiver Schaden (Drachenatem, Feuerball, kochendes Öl) wird halbiert, mit +4 auf Rettungswürfe. Entwickelt von einem ebenenreisenden Priester und beliebt bei Besuchern der Elementarebenen oder gefährlicher Gebiete wie Stygia oder Muspelheim. Bietet keine Atemfähigkeit auf der jeweiligen Ebene. Materialkomponente: Heiliges Symbol des Priesters.',
  description_en = 'Renders one creature immune to effects of one specific element type (chosen at casting). Passive damage (environmental heat, falling into fire pit) is completely ignored. Active damage (dragon breath, fireball, boiling oil) is halved with +4 to saving throws. Developed by a planewalker priest and popular with visitors to the Elemental Planes or dangerous areas like Stygia or Muspelheim. Does not provide breathing ability on the plane. Material component: priest''s holy symbol.'
WHERE LOWER(name_en) = LOWER('Elemental Protection') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Phylakterium Verzaubern',
  description = 'Verzaubert eine kleine öffenbare Schachtel (Phylakterium), sodass ein Zauber beim Öffnen ausgelöst wird. Der zweite Zauber muss in der unmittelbar folgenden Runde vom selben Priester gewirkt werden und wirkt mit der Stufe zum Zeitpunkt der Verzauberung. Ist das Phylakterium auf ein Wesen abgestimmt (z.B. Lich-Phylakterium), löst es sich nicht aus, wenn dieses Wesen es öffnet. Nur ein Zauber pro Phylakterium möglich — eine erneute Verzauberung ersetzt die vorherige. Materialkomponente: Spinnwebe, Wimper und Fingernagelsplitter des Zauberwirkers.',
  description_en = 'Enchants a small openable box (phylactery) so a spell takes effect when opened. The second spell must be cast by the same priest in the immediately following round and takes effect at the level at time of enchanting. If the phylactery is attuned to a being (e.g. lich''s phylactery), it does not trigger when that being opens it. Only one spell per phylactery — a subsequent enchant replaces the previous. Material component: spiderweb strand, eyelash, and fingernail sliver from the caster.'
WHERE LOWER(name_en) = LOWER('Enchant Phylactery') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Steine Verzaubern',
  description = 'Ein hochspezialisierter Zauber, der nur Priestern des keltischen Gottes Belenus ab Stufe 10 gewährt wird — einmal pro Jahr. Erfordert eine ganze Woche ununterbrochenes Wirken; jede Unterbrechung vereitelt den Zauber. Der Priester hat ein Jahr Zeit, einen Steinkreis zu errichten. Scheitert er, entzieht die Gottheit ihm alle Zauber — dauerhaft. Die Gottheit erlaubt nur einen Versuch pro Jahr. Materialkomponente: Ein kleiner Stein vom selben Steinbruch wie die Steine des Kreises.',
  description_en = 'A highly specialized spell available only to priests of the Celtic deity Belenus at 10th level — granted once per year. Requires an entire week of uninterrupted casting; any interruption negates it. The priest has one year to create a circle of standing stones. Failure means the deity permanently takes back all spells. The deity allows only one attempt per year. Material component: a small stone quarried from the same place as the circle stones.'
WHERE LOWER(name_en) = LOWER('Enchant Stones') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Ewige Flamme',
  description = 'Durch Berührung verleiht dieser Zauber einem Gegenstand (maximal das doppelte Körpervolumen des Priesters) eine empfängliche neutrale Verzauberung, die es ermöglicht, später Magie hineinzufließen. Pro Stufe des Priesters kann ein Zauber oder magischer Effekt ohne Rettungswurf, Fehlschlagchance oder Schaden in den Gegenstand eingebracht werden. Die Möglichkeit endet erst durch einen Erweckungszauber. Im Gegensatz zu Gegenstand Verzaubern macht dieser Zauber den Gegenstand nicht zu einem nutzbaren magischen Gegenstand — er hält nur Magie bereit, bis ein Erweckungszauber gewirkt wird.',
  description_en = 'By touch, imbues an item (max twice the caster''s body volume) with a receptive neutral enchantment that allows magic to be fed into it. One spell or magical effect per caster level can enter the item without saving throw, failure chance, or damage. The opportunity ends only by casting an awakening spell. Unlike enchant an item, this spell merely allows an item to hold enchantments — it is not a usable magical item until an awakening spell is successfully cast upon it.'
WHERE LOWER(name_en) = LOWER('Eternal Flame') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Extradimensionale Manipulation',
  description = 'Verändert die Eigenschaften extradimensionaler Räume (wie Seil-Trick, Beutel der Aufbewahrung oder Tragbares Loch). Zwei Anwendungen: A) Raum Verändern — Kapazität verdoppeln/halbieren (bis Stufe 10), verdreifachen/dritteln (Stufe 11-16) oder vervierfachen/vierteln (ab Stufe 17). Überschüssiger Inhalt wird ausgestoßen oder in die Astralebene verbannt. B) Tasche Versiegeln — verhindert die üblichen Katastrophen beim Platzieren eines extradimensionalen Raums in einem anderen für die Zauberdauer. Von einem Zauberer aufrechterhaltene Räume (z.B. Seil-Trick) erlauben einen Rettungswurf gegen Zauber.',
  description_en = 'Alters characteristics of extradimensional spaces (such as rope trick, bags of holding, or portable holes). Two uses: A) Alter Space — double/halve capacity (up to level 10), triple/third (level 11-16), or quadruple/quarter (level 17+). Excess contents are expelled or sent to the Astral Plane. B) Seal Pocket — prevents the usual catastrophic consequences of placing an extradimensional space inside another for the spell''s duration. Spaces maintained by a spellcaster (e.g. rope trick) allow a saving throw vs. spell.'
WHERE LOWER(name_en) = LOWER('Extradimensional Manipulation') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Extradimensionale Tasche',
  description = 'Erzeugt einen extradimensionalen Raum in einem Behälter (Sack, Tasche, Rucksack), der innen größer ist als außen — funktioniert für die Dauer wie ein Beutel der Aufbewahrung. Gewicht und Kapazität hängen von der Priesterstufe ab. Dauer: 2 Runden pro Stufe plus 1W12 Runden. Überladung oder Durchstechen des Behälters lässt ihn platzen und der Inhalt geht in der Astralebene verloren. Gegenstände im Behälter bei Zauberende gehen ebenfalls in der Astralebene verloren. Materialkomponente: 200 GM Diamantpulver und eine Platinplatte (500 GM) mit einer Klein-Flasche-Gravur.',
  description_en = 'Creates an extradimensional space in a container (sack, bag, backpack) that is larger inside than outside — functions as a bag of holding for the duration. Weight and capacity depend on caster level. Duration: 2 rounds per level plus 1d12 rounds. Overloading or piercing the container ruptures it and contents are lost in the Astral Plane. Items inside when the spell ends are also lost in the Astral Plane. Material component: 200 gp diamond dust and a platinum sheet (500 gp) inscribed with a Klein bottle drawing.'
WHERE LOWER(name_en) = LOWER('Extradimensional Pocket') AND spell_type = 'priest';
