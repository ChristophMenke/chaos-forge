-- ═══════════════════════════════════════════════════════════════════════════════
-- PSC1 Priest Spells Level 7 (Batch 2: 12 Spells — Crown of Glory to Fortunate Fate)
-- Metrisch, eng an Originaltexten orientiert
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.spells SET
  name = 'Krone der Herrlichkeit — Archon',
  description = 'Verleiht dem Priester vorübergehend die Aura planarer Autorität und inspiriert Ehrfurcht und Gehorsam bei allen, die ihn sehen. Verbündete erhalten +2 auf Moral und Angriffswürfe. Feinde müssen einen Rettungswurf gegen Zauber bestehen oder sind eingeschüchtert (−2 auf Angriff und Moral). Der Priester strahlt ein goldenes Leuchten aus und seine Stimme trägt über große Entfernungen.',
  description_en = 'Temporarily bestows the aura of planar authority on the caster, inspiring awe and obedience in all who see him. Allies gain +2 to morale and attack rolls. Enemies must save vs. spell or be intimidated (−2 to attack and morale). The priest radiates a golden glow and his voice carries over great distances.'
WHERE LOWER(name_en) = LOWER('Crown Of Glory — Archon') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Fluch von Yondalla',
  description = 'Reserviert für Kreaturen, die etwas Schreckliches gegen Halblinge oder Yondallas Kinder begangen haben. Der Fluch ist extrem mächtig und dauerhaft. Die genaue Form wird von Yondalla selbst bestimmt und kann Schrumpfen, Verlust von Fähigkeiten, ewiges Wandern oder Verwandlung in ein harmloses Tier umfassen. Nur göttliche Intervention kann den Fluch aufheben.',
  description_en = 'Reserved for creatures that have done something horrible against halflings or Yondalla''s children. The curse is extremely powerful and permanent. The exact form is determined by Yondalla herself and can include shrinking, ability loss, eternal wandering, or transformation into a harmless animal. Only divine intervention can lift the curse.'
WHERE LOWER(name_en) = LOWER('Curse of Yondalla') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Todespakt',
  description = 'Durch Abschluss dieses Rituals schmiedet ein Hohepriester einen mächtigen Pakt mit seiner Gottheit. Im Falle des Todes des Priesters wird er automatisch wiederbelebt — einmal. Der Pakt verbraucht sich nach der Wiederbelebung. Der Priester muss dafür einen dauerhaften Konstitutionspunkt opfern. Der Pakt kann nur einmal pro Priesterleben geschlossen werden.',
  description_en = 'By completing this ritual, a high priest forges a powerful pact with his deity. In the event of the priest''s death, he is automatically resurrected — once. The pact is consumed after the resurrection. The priest must sacrifice a permanent Constitution point. The pact can only be forged once per priest''s lifetime.'
WHERE LOWER(name_en) = LOWER('Death Pact') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Todessymbol von Bane',
  description = 'Der Auferstandene Kult von Bane verwendet ein spezielles Symbol, das vor langer Zeit mit direkter Unterstützung Banes erschaffen wurde. Wird das Symbol aktiviert, sterben alle Kreaturen in Sichtweite, die den Rettungswurf gegen Todesmagie nicht bestehen. Kreaturen, die bestehen, erleiden 6W6 Schaden. Das Symbol bleibt permanent, bis ausgelöst.',
  description_en = 'The Risen Cult of Bane uses a special symbol created long ago with Bane''s direct assistance. When activated, all creatures in sight that fail a saving throw vs. death magic die. Creatures that succeed suffer 6d6 damage. The symbol remains permanently until triggered.'
WHERE LOWER(name_en) = LOWER('Death Symbol of Bane') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Dehydrieren',
  description = 'Dieser schreckliche Zauber lässt Wasser rapide aus dem Körper der Zielkreatur verdunsten. Das Opfer erleidet jede Runde massiven Schaden durch Austrocknung und ist unfähig zu zaubern oder sich zu konzentrieren. Rettungswurf gegen Zauber für halben Schaden. Pflanzenkreaturen und wasserbasierte Wesen erleiden doppelten Schaden.',
  description_en = 'This awful spell causes water to evaporate rapidly from the target creature''s body. The victim suffers massive dehydration damage each round and is unable to cast spells or concentrate. Saving throw vs. spell for half damage. Plant creatures and water-based beings suffer double damage.'
WHERE LOWER(name_en) = LOWER('Dehydrate') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Göttlicher Wind',
  description = 'Beschwört mächtige Hurrikankraft-Winde auf Befehl des Shukenja. Die Winde fegen alles in ihrem Pfad hinweg — kleine Kreaturen werden weggeblasen, mittlere zu Boden geworfen, große stark behindert. Gebäude erleiden Sturmschaden. Der Shukenja selbst steht im ruhigen Auge des Sturms. Dauer: 1 Runde pro Stufe.',
  description_en = 'Summons mighty hurricane-force winds at the shukenja''s command. The winds sweep everything in their path — small creatures are blown away, medium ones knocked down, large ones severely hindered. Buildings suffer storm damage. The shukenja stands in the calm eye of the storm. Duration: 1 round per level.'
WHERE LOWER(name_en) = LOWER('Divine Wind') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Dweomer-Weissagung',
  description = 'Ermöglicht dem Priester, die magischen Eigenschaften eines einzelnen Gegenstands oder einer Kreatur im Detail zu analysieren. Pro Runde wird eine magische Eigenschaft enthüllt. Der Priester hat eine Grundchance von 50 % + 2 % pro Stufe, jede Eigenschaft korrekt zu identifizieren. Mächtiger als der Magier-Zauber Identifizieren.',
  description_en = 'Enables the priest to analyze the magical properties of a single item or creature in detail. One magical property is revealed per round. The priest has a base 50% + 2% per level chance to correctly identify each property. More powerful than the wizard spell Identify.'
WHERE LOWER(name_en) = LOWER('Dwoemer Divination') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Elementarbruch',
  description = 'Zerreißt das Gefüge des Raums innerhalb einer Elementarebene selbst. Eine riesige Spalte öffnet sich und verbindet zwei Punkte auf der Elementarebene oder öffnet einen Durchgang zu einer angrenzenden Ebene. Der Bruch ist instabil und gefährlich — Kreaturen in der Nähe riskieren, hineingesogen zu werden. Dauer: 1 Runde pro Stufe.',
  description_en = 'Rends the very fabric of space itself inside an Elemental Plane. A huge rift opens connecting two points on the Elemental Plane or opening a passage to an adjacent plane. The breach is unstable and dangerous — creatures nearby risk being drawn in. Duration: 1 round per level.'
WHERE LOWER(name_en) = LOWER('Elemental Breach') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Anderswo-Gesang',
  description = 'Transportiert zwei lebende Kreaturen (eine kann der Priester sein) oder einen Priester und einen Gegenstand an einen beliebigen dem Priester bekannten Ort auf derselben Ebene. Die Teleportation ist fehlerfrei, wenn der Priester den Zielort persönlich kennt. Bei unbekannten Orten besteht eine Chance auf leichte Abweichung.',
  description_en = 'Transports two living creatures (one may be the caster) or a priest and an object to any location known to the priest on the same plane. The teleportation is error-free if the priest personally knows the destination. For unknown locations, there is a chance of slight deviation.'
WHERE LOWER(name_en) = LOWER('Elsewhere Chant') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Eruption',
  description = 'Kann nur auf Boden mit Erd- oder Gesteinsfundament gewirkt werden. Verursacht eine vulkanische Eruption aus dem Boden — Lava, Felsen und Asche schießen empor. Alle Kreaturen im Wirkungsbereich erleiden massiven Feuer- und Quetschschaden. Der Bereich bleibt für die Dauer des Zaubers gefährlich (Lava, heiße Asche). Extrem zerstörerisch für Gebäude und Befestigungen.',
  description_en = 'Can only be cast upon ground with a foundation of earth or rock. Causes a volcanic eruption from the ground — lava, rocks, and ash shoot upward. All creatures in the area of effect suffer massive fire and crushing damage. The area remains dangerous for the spell''s duration (lava, hot ash). Extremely destructive to buildings and fortifications.'
WHERE LOWER(name_en) = LOWER('Eruption') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Katzengestalt',
  description = 'Ähnlich dem Gestaltwandel-Zauber der 9. Stufe für Magier, erlaubt aber nur die Verwandlung in Katzenartige — Hauskatze, Gepard, Leopard, Löwe, Tiger, Panther usw. Der Priester erhält alle physischen Fähigkeiten der gewählten Katzenform (Klauen, Biss, Geschwindigkeit, Nachtsicht), behält aber seine eigene Intelligenz. Kann die Form wechseln.',
  description_en = 'Similar to the 9th-level wizard Shapechange spell, but only allows transformation into felines — house cat, cheetah, leopard, lion, tiger, panther, etc. The priest gains all physical abilities of the chosen cat form (claws, bite, speed, night vision) but retains own intelligence. Can change form.'
WHERE LOWER(name_en) = LOWER('Feline Form') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Glückliches Schicksal',
  description = 'Legt einen vorbeugenden Zauber auf ein Wesen, der aktiviert wird, wenn das Wesen auf 0 oder weniger Trefferpunkte fällt. In diesem Moment wird automatisch ein Heilungszauber ausgelöst, der das Wesen stabilisiert und teilweise heilt. Der Zauber „wartet" bis zum Auslöseereignis und hat keine zeitliche Begrenzung (hält, bis er ausgelöst wird oder durch Magie Bannen entfernt wird).',
  description_en = 'Places a contingent spell on a being that activates when the being is reduced to 0 or fewer hit points. At that moment, a healing spell is automatically triggered, stabilizing and partially healing the being. The spell "waits" for the trigger event and has no time limit (persists until triggered or removed by Dispel Magic).'
WHERE LOWER(name_en) = LOWER('Fortunate Fate') AND spell_type = 'priest';
