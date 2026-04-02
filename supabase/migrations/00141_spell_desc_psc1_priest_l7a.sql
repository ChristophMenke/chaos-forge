-- ═══════════════════════════════════════════════════════════════════════════════
-- PSC1 Priest Spells Level 7 (Batch 1: 13 Spells — Age Dragon to Crown of Glory)
-- Metrisch, eng an Originaltexten orientiert
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.spells SET
  name = 'Drachen Altern',
  description = 'Ermöglicht dem Priester, einen Drachen vorübergehend eine Alterskategorie gewinnen oder verlieren zu lassen. Ältere Drachen werden stärker, jüngere schwächer. Der Effekt dauert 1 Runde pro Stufe. Kein Rettungswurf, wenn der Drache willig ist; unwillige Drachen erhalten einen Rettungswurf gegen Zauber. Betrifft alle Drachenattribute: Odemwaffe, RK, TW, Zauberfähigkeiten.',
  description_en = 'Allows the caster to cause any dragon to temporarily gain or lose one age category. Older dragons become stronger, younger ones weaker. The effect lasts 1 turn per level. No saving throw if the dragon is willing; unwilling dragons receive a saving throw vs. spell. Affects all dragon attributes: breath weapon, AC, HD, spellcasting abilities.'
WHERE LOWER(name_en) = LOWER('Age Dragon') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Akadis Wirbel',
  description = 'Ähnlich dem Winde-Akadis-Zauber, erzeugt aber zusätzlich Kettenblitze. Der Wirbel bewegt sich nach dem Willen des Priesters und verursacht massiven Wind- und Blitzschaden. Alle Kreaturen im Pfad müssen Rettungswürfe gegen Odem und gegen Zauber bestehen oder erleiden vollen Schaden aus beiden Quellen.',
  description_en = 'Similar to the Winds of Akadi spell, but additionally emits chain lightning. The vortex moves at the priest''s will and causes massive wind and lightning damage. All creatures in the path must save vs. breath weapon and vs. spell or suffer full damage from both sources.'
WHERE LOWER(name_en) = LOWER('Akadi''s Vortex') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Uralter Fluch',
  description = 'Ermöglicht dem Priester, den Zorn der Schutzgottheit in Form eines verheerenden Fluchs auf eine Kreatur herabzurufen. Der Fluch ist äußerst mächtig und kann nur durch göttliche Intervention, Wunsch oder eine Queste aufgehoben werden. Die genaue Form des Fluchs wird von der Gottheit bestimmt und kann körperliche Entstellung, Pech, Krankheit oder Verwandlung umfassen.',
  description_en = 'Allows the priest to call down the patron power''s wrath as a devastating curse on a creature. The curse is extremely powerful and can only be lifted by divine intervention, Wish, or a quest. The exact form is determined by the deity and can include physical disfigurement, misfortune, disease, or transformation.'
WHERE LOWER(name_en) = LOWER('Ancient Curse') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Azuths Zauberschild',
  description = 'Macht den Empfänger in der Runde nach dem Wirken immun gegen alle magischen Effekte. Kein Zauber, keine magische Waffe und kein magischer Gegenstand kann den Empfänger in dieser Runde beeinflussen — weder schädlich noch nützlich. Der Schutz ist absolut und durchdringt auch Magieresistenz-ignorierende Effekte.',
  description_en = 'Renders the recipient immune to all magical effects on the round after casting. No spell, magical weapon, or magical item can affect the recipient that round — neither harmful nor beneficial. The protection is absolute and pierces even magic-resistance-ignoring effects.'
WHERE LOWER(name_en) = LOWER('Azuth''s Spell Shield') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Fluch der Entweihler',
  description = 'Wirkt als Schutz gegen Entweihungsmagie (Defiling Magic). Alle Entweihungszauber, die im Wirkungsbereich gewirkt werden, scheitern automatisch, und der Entweihler erleidet Rückschlagschaden. Dauer: 1 Tag. Besonders nützlich in Athas-Kampagnen gegen Defiler-Magier.',
  description_en = 'Acts as protection against defiling magic. All defiling spells cast within the area of effect automatically fail, and the defiler suffers backlash damage. Duration: 1 day. Especially useful in Athas campaigns against defiler wizards.'
WHERE LOWER(name_en) = LOWER('Bane of the Defilers') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Gargauth Anrufen',
  description = 'Ermöglicht dem Priester, Gargauth zu kontaktieren, wo immer er sich auf Toril befindet. Der Priester kann eine Frage stellen oder um einen Gefallen bitten. Gargauth antwortet nach eigenem Ermessen und kann Gegenleistungen verlangen. Ein gefährlicher Zauber, da Gargauth ein Erzschurke ist und seine „Hilfe" oft einen verborgenen Preis hat.',
  description_en = 'Enables the caster to contact Gargauth, wherever he is on Toril. The priest can ask one question or request a favor. Gargauth responds at his own discretion and may demand payment. A dangerous spell, as Gargauth is an archvillain and his "help" often has a hidden price.'
WHERE LOWER(name_en) = LOWER('Call Upon Gargauth') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Rufende Melodie — Schamane',
  description = 'Wird ähnlich dem Geisterhafte-Klänge-Zauber der 3. Stufe gewirkt: Der Schamane spielt eine Melodie auf einem Instrument, die Geister aus der Geisterwelt anlockt. Die Geister erscheinen und können vom Schamanen zu verschiedenen Diensten aufgefordert werden — Informationen, Schutz oder Kampf. Die Melodie muss für die gesamte Dauer aufrechterhalten werden.',
  description_en = 'Cast similarly to the 3rd-level Haunting Notes spell: the shaman plays a melody on an instrument that attracts spirits from the spirit world. The spirits appear and can be requested by the shaman for various services — information, protection, or combat. The melody must be maintained for the entire duration.'
WHERE LOWER(name_en) = LOWER('Calling Melody — Shaman') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Umhang von Gaer — Drow',
  description = 'Umgibt das geschützte Wesen mit einer schwachen magischen Aura, die als mächtiger Schutzschild fungiert. Der Umhang absorbiert Zauberschaden, reflektiert niedrigstufige Zauber und gewährt einen Bonus auf alle Rettungswürfe. Wird durch eine bestimmte Menge absorbierten Schadens aufgebraucht.',
  description_en = 'Surrounds the protected creature with a faint magical aura that functions as a powerful protective shield. The cloak absorbs spell damage, reflects low-level spells, and grants a bonus to all saving throws. Depleted after absorbing a certain amount of damage.'
WHERE LOWER(name_en) = LOWER('Cloak of Gaer — Drow') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Zwingen — Shukenja',
  description = 'Der Shukenja versucht, das Verhalten einer anderen Kreatur zu korrigieren. Das Ziel muss einen Rettungswurf gegen Zauber bestehen oder ist gezwungen, eine vom Shukenja festgelegte Verhaltensänderung zu befolgen — z.B. aufhören zu lügen, Gewalt einzustellen oder einen Eid zu halten. Der Zwang hält permanent an, bis durch Wunsch aufgehoben.',
  description_en = 'The shukenja attempts to correct the behavior of another creature. The target must save vs. spell or is compelled to follow a behavioral change specified by the shukenja — such as ceasing to lie, stopping violence, or keeping an oath. The compulsion is permanent until lifted by Wish.'
WHERE LOWER(name_en) = LOWER('Compel — Shukenja') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Rat der Geister — Schamane',
  description = 'Der Schamane steckt ein Gebiet von bis zu 30,5 m Durchmesser ab und markiert die Grenzen. Innerhalb dieses Bereichs erscheinen die Geister der Ahnen und bilden einen Rat. Der Schamane kann den Geistern Fragen stellen, und sie beraten ihn über komplexe Probleme, geben Warnungen und teilen Wissen. Die Geister bleiben für die Dauer des Zaubers.',
  description_en = 'The shaman stakes out an area up to 30.5 m across, marking the boundaries. Within this area, ancestral spirits appear and form a council. The shaman can ask the spirits questions, and they advise on complex problems, give warnings, and share knowledge. The spirits remain for the spell''s duration.'
WHERE LOWER(name_en) = LOWER('Council Of Spirits — Shaman') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Schreckwächter Erschaffen',
  description = 'Verwandelt ein unbelebtes Skelett der Größe M oder kleiner in einen Schreckwächter — eine mächtigere Version des Bannwächters. Der Schreckwächter kann magische Waffen führen, Zauber absorbieren und strahlt eine Furchtaura aus. Er gehorcht den bei der Erschaffung festgelegten Befehlen und bewacht einen bestimmten Bereich bis zur Zerstörung.',
  description_en = 'Transforms an inanimate skeleton of size M or smaller into a direguard — a more powerful version of the baneguard. The direguard can wield magical weapons, absorb spells, and radiates a fear aura. It obeys commands set during creation and guards a specific area until destroyed.'
WHERE LOWER(name_en) = LOWER('Create Direguard') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Treant Erschaffen',
  description = 'Verwandelt vorübergehend den grundlegenden Lebensbaum in einen Treant — ein intelligentes, mobiles Baumwesen. Der Treant gehorcht dem Priester und kann kämpfen, sprechen und Bäume in der Umgebung befehligen. Der Baum muss gesund und alt genug sein (mindestens 50 Jahre). Nach Ablauf des Zaubers kehrt der Baum in seinen normalen Zustand zurück.',
  description_en = 'Temporarily transforms a basic living tree into a treant — an intelligent, mobile tree being. The treant obeys the priest and can fight, speak, and command nearby trees. The tree must be healthy and old enough (at least 50 years). When the spell expires, the tree returns to its normal state.'
WHERE LOWER(name_en) = LOWER('Create Treant') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Untoten Diener Erschaffen',
  description = 'Erschafft eine Form von Untoten. Der Typ des erschaffenen Untoten hängt von der Stufe des Priesters und den verwendeten Materialien ab. Niedrigstufige Priester erschaffen Skelette und Zombies; hochstufige Priester können mächtigere Untote wie Schatten oder Schemen erschaffen. Die Untoten gehorchen dem Priester bedingungslos.',
  description_en = 'Creates a form of undead. The type of undead created depends on the priest''s level and materials used. Low-level priests create skeletons and zombies; high-level priests can create more powerful undead such as shadows or wraiths. The undead obey the priest unconditionally.'
WHERE LOWER(name_en) = LOWER('Create Undead Minion') AND spell_type = 'priest';
