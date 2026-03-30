-- Add description columns to nonweapon_proficiencies
-- Short 1-2 sentence descriptions based on PHB Chapter 5

ALTER TABLE public.nonweapon_proficiencies
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS description_en text;

-- ─── GENERAL ────────────────────────────────────────────────────────────────

UPDATE public.nonweapon_proficiencies SET
  description = 'Wissen über Anbau, Ernte und Pflege von Nutzpflanzen sowie typische Arbeiten auf einem Bauernhof.',
  description_en = 'Knowledge of planting, harvesting, and tending crops as well as typical farming tasks.'
WHERE id = 'agriculture';

UPDATE public.nonweapon_proficiencies SET
  description = 'Ermöglicht bessere Kontrolle über Pack- und Lasttiere. Erfolgreicher Wurf beruhigt aufgeregte Tiere.',
  description_en = 'Enables greater control over pack animals and beasts of burden. A successful check calms excited animals.'
WHERE id = 'animal_handling';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann eine Tierart trainieren, ihr Befehle und Tricks beizubringen. Allgemeine Aufgaben brauchen 3 Monate, spezielle Tricks 2W6 Wochen.',
  description_en = 'Can train one creature type to obey commands and perform tricks. General tasks require 3 months, specific tricks 2d6 weeks.'
WHERE id = 'animal_training';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann alle Arten von Metallarbeiten ausführen, einschließlich Rüstungen und Schilde herstellen und reparieren.',
  description_en = 'Can perform all types of metalworking including making and repairing armor and shields.'
WHERE id = 'blacksmithing';

UPDATE public.nonweapon_proficiencies SET
  description = 'Ausgebildet im Brauen von Bier und anderen Getränken. Kann Rezepte erstellen, Zutaten wählen und Gärung kontrollieren.',
  description_en = 'Trained in brewing beers and other drinks. Can prepare formulas, select ingredients, and manage fermentation.'
WHERE id = 'brewing';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann Holzarbeiten ausführen wie Hausbau und Schrankwerk. Einfache Gegenstände ohne Pläne, komplexe benötigen Baupläne.',
  description_en = 'Can do woodworking including building and cabinetry. Basic items without plans, complicated items require engineering plans.'
WHERE id = 'carpentry';

UPDATE public.nonweapon_proficiencies SET
  description = 'Erfahrener Koch. Fertigkeitswurf nur nötig für wirklich herausragende Mahlzeiten.',
  description_en = 'Accomplished cook. A proficiency check is only needed when preparing truly magnificent meals.'
WHERE id = 'cooking';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kennt viele Tanzstile von Volkstänzen bis zu formalen Hofbällen.',
  description_en = 'Knows many dance styles from folk dances to formal court balls.'
WHERE id = 'dancing';

UPDATE public.nonweapon_proficiencies SET
  description = 'Angeborener Richtungssinn. Nach 1W6 Runden Konzentration kann die Himmelsrichtung bestimmt werden. Verirrungschance in der Wildnis -5%.',
  description_en = 'Innate sense of direction. After concentrating 1d6 rounds can determine heading. Reduces chance of getting lost in wilderness by 5%.'
WHERE id = 'direction_sense';

UPDATE public.nonweapon_proficiencies SET
  description = 'Versteht angemessenes Verhalten und Anrede in vielen Situationen, besonders bei Adligen und hochrangigen Personen.',
  description_en = 'Understands proper forms of behavior and address in various situations, especially with nobility and persons of rank.'
WHERE id = 'etiquette';

UPDATE public.nonweapon_proficiencies SET
  description = 'Braucht keinen Feuerstein. Bei trockenem Holz 2W20 Minuten, bei schlechten Bedingungen 3W20 Minuten mit Fertigkeitswurf.',
  description_en = 'Does not need tinderbox to start fire. Requires 2d20 minutes with dry tinder, 3d20 in adverse conditions with successful check.'
WHERE id = 'fire_building';

UPDATE public.nonweapon_proficiencies SET
  description = 'Geschickt im Fischen mit Haken, Netz oder Speer. Pro Stunde ein Wurf; Erfolg liefert Fische.',
  description_en = 'Skilled in fishing with hook, net, or spear. One check per hour of fishing; success yields a catch.'
WHERE id = 'fishing';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann Wappen und Symbole identifizieren. Heimatsymbole automatisch bekannt; fremde Heraldik erfordert Fertigkeitswurf.',
  description_en = 'Can identify crests and symbols. Automatically knows homeland heraldry; foreign signs require a successful check.'
WHERE id = 'heraldry';

UPDATE public.nonweapon_proficiencies SET
  description = 'Hat eine moderne Sprache des bekannten Landes erlernt. Ein Lehrer wird benötigt.',
  description_en = 'Has learned to speak a language of the known world. A teacher must be available.'
WHERE id = 'languages_modern';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann Leder gerben und verarbeiten sowie Kleidung, Lederrüstung und Lederartikel herstellen.',
  description_en = 'Can tan and treat leather and make leather clothing, leather armor, backpacks, saddlebags, and harnesses.'
WHERE id = 'leatherworking';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann einen Bergbaustandort bestimmen und Minenoperationen beaufsichtigen. Erfolg zeigt guten Standort.',
  description_en = 'Can site and supervise mine operations. A successful check finds a good mining site.'
WHERE id = 'mining';

UPDATE public.nonweapon_proficiencies SET
  description = 'Beherrscht Navigation nach Sternen, Strömungen und Landzeichen. Erfolg reduziert Verirrungschance auf See um 20%.',
  description_en = 'Has learned navigation by stars, currents, and signs of land. Successful check reduces chance of getting lost at sea by 20%.'
WHERE id = 'navigation';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann Tongefäße und Behälter anfertigen. Benötigt Drehscheibe und Brennofen. Zwei kleine oder ein großes Stück pro Tag.',
  description_en = 'Can create clay vessels and containers. Requires wheel and kiln. Can make two small/medium items or one large item per day.'
WHERE id = 'pottery';

UPDATE public.nonweapon_proficiencies SET
  description = 'Geschickt im Reiten und Handling von Pferden oder anderen Landreittieren. Kann Sprünge, Beschleunigung und Kampfmanöver ausführen.',
  description_en = 'Skilled in riding and handling horses or ground mounts. Can perform jumps, speed surges, and combat maneuvers.'
WHERE id = 'riding_land';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann erstaunliche Dinge mit Seilen bewirken und kennt viele Knotentypen. +2 mit Lasso, +10% beim Klettern mit Seil.',
  description_en = 'Can accomplish amazing feats with rope and tie specialized knots. +2 to lasso attacks, +10% climbing bonus with rope.'
WHERE id = 'rope_use';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann Kleidungsstücke nähen, ausbessern und anfertigen.',
  description_en = 'Can sew, mend, and tailor garments.'
WHERE id = 'seamstress';

UPDATE public.nonweapon_proficiencies SET
  description = 'Versierter Sänger der andere unterhalten kann. Kein Wurf nötig zum normalen Singen.',
  description_en = 'Accomplished singer who can entertain others. No check required for normal singing.'
WHERE id = 'singing';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann schwimmen und sich gemäß Schwimmregeln bewegen. Ohne diese Fertigkeit kann man nicht schwimmen.',
  description_en = 'Knows how to swim and can move according to swimming rules. Characters without this proficiency cannot swim.'
WHERE id = 'swimming';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann intelligente Vorhersagen über kommendes Wetter machen. Erfolg zeigt Bedingungen der nächsten 6 Stunden.',
  description_en = 'Can make intelligent guesses about upcoming weather. Successful check predicts general conditions for the next 6 hours.'
WHERE id = 'weather_sense';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann Stoffe, Wandteppiche und Drapierungen aus Wolle oder Baumwolle weben. Benötigt Spinnrad und Webstuhl.',
  description_en = 'Can create garments, tapestries, and draperies from wool or cotton. Requires spinning apparatus and loom.'
WHERE id = 'weaving';

-- ─── WARRIOR ────────────────────────────────────────────────────────────────

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann alle Rüstungstypen anfertigen und reparieren. Zeitaufwand: zwei Wochen pro RK-Stufe unter 10.',
  description_en = 'Can make and repair all armor types. Time required equals two weeks per AC level below 10.'
WHERE id = 'armorer';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann in völliger Dunkelheit mit nur -2 Penalty kämpfen (statt -4). Bei Sternenlicht nur -1 Penalty.',
  description_en = 'In total darkness suffers only -2 penalty to attack rolls instead of -4. In starlight only -1 penalty.'
WHERE id = 'blind_fighting';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann Bögen, Armbrüste und Pfeile herstellen. Die Qualität hängt vom Fertigkeitswurf ab.',
  description_en = 'Can craft bows, crossbows, and arrows. Quality depends on the proficiency check result.'
WHERE id = 'bowyer';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann doppelt so lange anstrengende körperliche Aktivität verrichten, bevor Erschöpfung eintritt.',
  description_en = 'Can perform strenuous physical activity for twice as long as normal before fatigue effects occur.'
WHERE id = 'endurance';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann Wild in der Wildnis aufspüren und erlegen. Erfolg findet Beute in 100-180 m Entfernung.',
  description_en = 'Can stalk and bring down game in the wilderness. Success locates an animal 100-180 m away.'
WHERE id = 'hunting';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann schwierige Kletterungen mit Spikes und Seilen durchführen. +10% Bonus pro Slot zum Klettern für die gesamte Gruppe.',
  description_en = 'Can make difficult climbs with spikes and ropes. +10% climbing bonus per slot for the entire party.'
WHERE id = 'mountaineering';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann sich einen Tag lang mit doppelter Bewegungsrate fortbewegen. Danach Fertigkeitswurf für jeden weiteren Tag.',
  description_en = 'Can move at twice normal movement rate for a day. After the first day, a proficiency check is needed each day.'
WHERE id = 'running';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann einfache Fallen und Schlingen bauen, vor allem für Kleinwild. Fertigkeitswurf beim Bau und beim Aufstellen.',
  description_en = 'Can make simple snares and traps primarily for small game. Proficiency check when constructed and when set.'
WHERE id = 'set_snares';

UPDATE public.nonweapon_proficiencies SET
  description = 'Grundkenntnisse zum Überleben in einer spezifischen Umgebung (arktisch, Wald, Wüste, etc.). Kann Wasser und Nahrung finden.',
  description_en = 'Basic survival knowledge for a specific environment (arctic, woodland, desert, etc.). Can find water and food with a check.'
WHERE id = 'survival';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann Spuren von Kreaturen über verschiedene Terrains verfolgen. Nicht-Ranger: -6 Penalty. Viele Modifikatoren je nach Bedingungen.',
  description_en = 'Can follow trails of creatures across most terrain. Non-rangers roll with -6 penalty. Multiple modifiers apply by terrain and conditions.'
WHERE id = 'tracking';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann Metallwaffen anfertigen, besonders Klingenwaffen. Benötigt voll ausgestattete Schmiede.',
  description_en = 'Can make metal weapons, particularly bladed weapons. Requires a fully equipped smithy.'
WHERE id = 'weaponsmithing';

-- ─── PRIEST ─────────────────────────────────────────────────────────────────

UPDATE public.nonweapon_proficiencies SET
  description = 'Beherrscht eine alte, seltene Sprache, die vor allem in antiken Schriften vorkommt. Wahl zwischen Sprechen oder Lesen/Schreiben.',
  description_en = 'Has mastered a difficult ancient tongue primarily found in old writings. Choice of reading/writing or speaking.'
WHERE id = 'ancient_languages';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kennt natürliche Medizin und Erste Hilfe. Erfolgreicher Wurf innerhalb einer Runde nach Verwundung stellt 1W3 TP wieder her.',
  description_en = 'Knows natural medicines and basic first aid. Successful check within one round of wounding restores 1d3 hit points.'
WHERE id = 'healing';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann Pflanzen und Pilze identifizieren sowie nichtmagische Tränke, Salben und Gifte herstellen.',
  description_en = 'Can identify plants and fungi and prepare nonmagical potions, poultices, salves, and plant-based poisons.'
WHERE id = 'herbalism';

UPDATE public.nonweapon_proficiencies SET
  description = 'Wissensspeicher der regionalen Geschichte. Kennt lokale Orte, Ereignisse und kann unterhaltsame Geschichten erzählen (+2 CHA).',
  description_en = 'Storehouse of regional history facts. Knows local sites, events, and can retell entertaining stories (+2 CHA bonus).'
WHERE id = 'local_history';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann ein bestimmtes Musikinstrument spielen. Zusätzliche Instrumente kosten extra Slots. Wurf nur bei außergewöhnlichen Umständen nötig.',
  description_en = 'Can play a specific musical instrument. Additional instruments require extra slots. Check only needed in extraordinary circumstances.'
WHERE id = 'musical_instrument';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann eine moderne Sprache lesen und schreiben, die man spricht. Ein Lehrer wird benötigt.',
  description_en = 'Can read and write a modern language the character speaks. A teacher must be available.'
WHERE id = 'reading_writing';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kennt Glaubenssysteme der Heimat und Nachbarregionen. Grundwissen automatisch; spezielle Informationen erfordern Wurf.',
  description_en = 'Knows common beliefs and cults of homeland and major faiths of neighboring regions. Special info requires a check.'
WHERE id = 'religion';

UPDATE public.nonweapon_proficiencies SET
  description = 'Vertrautheit mit verschiedenen Formen des Zauberns. Kann versuchen, Zauber beim Wirken zu identifizieren.',
  description_en = 'Familiarity with different forms and rites of spellcasting. Can attempt to identify spells being cast.'
WHERE id = 'spellcraft';

-- ─── ROGUE ──────────────────────────────────────────────────────────────────

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann den Wert von Edelsteinen, Schmuck, Kunstwerken und anderen wertvollen Gegenständen schätzen.',
  description_en = 'Can estimate the value of gems, jewelry, art objects, and other valuable items.'
WHERE id = 'appraising';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann sich als Person ähnlicher Größe und Rasse verkleiden. Andere Rasse/Geschlecht: -7 Penalty; spezifische Person: -10.',
  description_en = 'Can disguise as a general type of similar height, age, and race. Different race/sex: -7 penalty; specific person: -10.'
WHERE id = 'disguise';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann Dokumente und Handschriften fälschen sowie Fälschungen anderer erkennen.',
  description_en = 'Can create duplicates of documents and handwriting and detect forgeries created by others.'
WHERE id = 'forgery';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kennt gängige Glücksspiele (Karten, Würfel). Kann fair spielen oder mit +1 Bonus betrügen (bei 17-20 ertappt).',
  description_en = 'Knows common games of chance and skill. Can play fairly or cheat with +1 bonus (caught on roll of 17-20).'
WHERE id = 'gaming';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann rohe Edelsteine schleifen (1W10 pro Tag). Erfolg erhöht den Wert; eine natürliche 1 steigert in nächsthöhere Kategorie.',
  description_en = 'Can finish rough gems at 1d10 per day. Success increases stone value; a natural 1 raises to the next gem category.'
WHERE id = 'gem_cutting';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann jonglieren zur Unterhaltung. Kann kleine geworfene Gegenstände auffangen (Angriff gegen RK 0).',
  description_en = 'Can juggle for entertainment. Can attempt to catch small thrown items with an attack roll vs. AC 0.'
WHERE id = 'juggling';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann mit Anlauf weiter und höher springen als andere Charaktere. Verbessert Weitsprung und Hochsprung.',
  description_en = 'Can perform running and standing long jumps and high jumps better than unproficient characters.'
WHERE id = 'jumping';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann Rede von sichtbaren aber unhörbaren Personen verstehen. Innerhalb 9 m; Erfolg versteht 70% des Gesprächs.',
  description_en = 'Can understand speech of those visible but inaudible. Must be within 30 feet; success understands 70% of conversation.'
WHERE id = 'reading_lips';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann auf engen Seilen oder Balken gehen (18 m/Runde). Kann kämpfend mit -5 auf Angriff. Penalty je nach Breite.',
  description_en = 'Can walk narrow ropes or beams at 60 feet per round. Can fight with -5 to attacks. Penalty varies by width.'
WHERE id = 'tightrope_walking';

UPDATE public.nonweapon_proficiencies SET
  description = 'Trainiert in Akrobatik, Rollen und Saltos. Kann RK um 4 verbessern gegen gerichtete Angriffe. Halbiert Fallschaden bis 18 m.',
  description_en = 'Practiced in acrobatics, dives, rolls, somersaults. Can improve AC by 4 against directed attacks. Halves fall damage up to 60 ft.'
WHERE id = 'tumbling';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann die Stimme "werfen", um andere zu täuschen. Fertigkeitswurf pro Satz. Beschränkt auf Laute, die man selbst erzeugen kann.',
  description_en = 'Can throw voice to deceive others. One check per sentence. Limited to sounds the character could make.'
WHERE id = 'ventriloquism';

-- ─── WIZARD ─────────────────────────────────────────────────────────────────

UPDATE public.nonweapon_proficiencies SET
  description = 'Kennt antike Geschichtsereignisse, Legenden und vergessene Reiche. Erfolg liefert nützliche historische Fakten.',
  description_en = 'Knows ancient historical events, legends, and forgotten realms. Success yields useful historical facts.'
WHERE id = 'ancient_history';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann die Einflüsse der Sterne studieren und Vorhersagen für die nächsten 30 Tage machen. +1 Navigationsbonus bei Sternenlicht.',
  description_en = 'Can study stars and make forecasts up to 30 days ahead. Provides +1 navigation bonus in starlight.'
WHERE id = 'astrology';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann Pläne für Maschinen und Gebäude erstellen. Kennt Belagerungstaktiken und kann Festungsmängel erkennen.',
  description_en = 'Can prepare plans for machines and buildings. Familiar with siegecraft principles and can detect defensive flaws.'
WHERE id = 'engineering';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann rohe Edelsteine schleifen (1W10 pro Tag). Erfolg erhöht den Wert; eine natürliche 1 steigert in nächsthöhere Kategorie.',
  description_en = 'Can finish rough gems at 1d10 per day. Success increases stone value; a natural 1 raises to the next gem category.'
WHERE id = 'gem_cutting_wiz';

UPDATE public.nonweapon_proficiencies SET
  description = 'Beherrscht eine alte, seltene Sprache, die vor allem in antiken Schriften vorkommt. Wahl zwischen Sprechen oder Lesen/Schreiben.',
  description_en = 'Has mastered a difficult ancient tongue primarily found in old writings. Choice of reading/writing or speaking.'
WHERE id = 'languages_ancient';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann eine moderne Sprache lesen und schreiben, die man spricht. Ein Lehrer wird benötigt.',
  description_en = 'Can read and write a modern language the character speaks. A teacher must be available.'
WHERE id = 'reading_writing_wiz';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kennt Glaubenssysteme der Heimat und Nachbarregionen. Grundwissen automatisch; spezielle Informationen erfordern Wurf.',
  description_en = 'Knows common beliefs and cults of homeland and major faiths of neighboring regions. Special info requires a check.'
WHERE id = 'religion_wiz';

UPDATE public.nonweapon_proficiencies SET
  description = 'Vertrautheit mit verschiedenen Formen des Zauberns. Kann versuchen, Zauber beim Wirken zu identifizieren.',
  description_en = 'Familiarity with different forms and rites of spellcasting. Can attempt to identify spells being cast.'
WHERE id = 'spellcraft_wiz';

-- ─── ADDED IN 00031 ────────────────────────────────────────────────────────

UPDATE public.nonweapon_proficiencies SET
  description = 'Natürliches künstlerisches Talent in einer Kunstform (Malerei, Bildhauerei, Musik etc.). +1 Bonus auf künstlerische Fertigkeitswürfe.',
  description_en = 'Natural talent in one art form (painting, sculpture, composition, etc.). Grants +1 bonus to artistic proficiency checks.'
WHERE id = 'artistic_ability';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann Schuhe, Stiefel und Sandalen anfertigen und reparieren.',
  description_en = 'Can fashion and repair shoes, boots, and sandals.'
WHERE id = 'cobbling';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kennt Verhalten, Lebensräume und Gewohnheiten von Tieren. Kann Tierarten identifizieren und ihr Verhalten vorhersagen.',
  description_en = 'Knows behavior, habitats, and habits of animals. Can identify species and predict their behavior.'
WHERE id = 'animal_lore';

UPDATE public.nonweapon_proficiencies SET
  description = 'Vertraut mit Booten und Schiffen. Kann als Matrose arbeiten. Gut ausgebildete Seeleute verbessern Schiffsbewegung um 50%.',
  description_en = 'Familiar with boats and ships. Qualified to work as crewman. Trained seamen improve inland boat movement rates by 50%.'
WHERE id = 'seamanship';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann Steinarbeiten ausführen, Mauern errichten und Steingebäude planen und reparieren.',
  description_en = 'Can perform stone masonry work, build walls, and plan and repair stone buildings.'
WHERE id = 'stonemasonry';

UPDATE public.nonweapon_proficiencies SET
  description = 'Ausgebildet im Reiten fliegender Reittiere. Kann Sprung-, Sturzflug- und Geschwindigkeitsmanöver durchführen.',
  description_en = 'Trained in handling flying mounts. Can perform leap, dive, speed surge, and knee-guiding maneuvers.'
WHERE id = 'riding_airborne';

UPDATE public.nonweapon_proficiencies SET
  description = 'Kann Schlösser herstellen, reparieren und öffnen. Versteht verschiedene Schlossmechanismen.',
  description_en = 'Can make, repair, and open locks. Understands various lock mechanisms.'
WHERE id = 'locksmithing';
