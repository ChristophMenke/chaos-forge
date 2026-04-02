-- ═══════════════════════════════════════════════════════════════════════════════
-- PSC1 Priest Spells Level 2 (Batch 4: 18 Spells — Enhance Turning to Cudgel)
-- Metrisch, eng an Originaltexten orientiert
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.spells SET
  name = 'Untote Vertreiben Verbessern',
  description = 'Kann auf jedes Wesen mit der Fähigkeit, Untote zu vertreiben, gewirkt werden. Der Empfänger vertreibt Untote, als wäre er eine Erfahrungsstufe höher, und erhält +1 auf alle Vertreibungswürfe — sowohl für das Ergebnis als auch für die Anzahl vertriebener oder zerstörter Untoter. Mehrfaches Wirken bringt keinen zusätzlichen Vorteil.',
  description_en = 'Can be cast on any individual with the ability to turn undead. The recipient turns undead as if one experience level higher and gains +1 to all turning rolls — both for the initial result and the number of undead turned or destroyed. Multiple castings provide no additional benefit.'
WHERE LOWER(name_en) = LOWER('Enhance Turning') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Ätherische Barriere',
  description = 'Verteidigung gegen den Durchgang extradimensionaler Kreaturen, einschließlich phasenverschobener, ätherischer oder über Dimensionstor reisender Wesen. Der Priester erschafft eine unsichtbare Barriere von 3 m² pro Stufe. Blockiert nicht Teleportation, Tore oder astrale Kreaturen. Kann als kooperative Magie von mehreren Priestern gewirkt werden — dabei werden die Gesamtstufen verdoppelt für die Anzahl der 3-m²-Flächen. Dauer wird durch den höchststufigen Priester plus 1 Runde pro zusätzlichem Priester bestimmt.',
  description_en = 'Defense against passage of extradimensional creatures, including phased, ethereal, or dimension door travelers. The priest creates an imperceptible barrier of 3 m² per level. Does not bar teleportation, gates, or astral creatures. Can be cast as cooperative magic by multiple priests — total levels are doubled for the number of 3 m² squares. Duration is set by the highest-level priest plus 1 turn per additional priest.'
WHERE LOWER(name_en) = LOWER('Ethereal Barrier') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Exorzismus — Gelehrter',
  description = 'Vertreibt einen bösen Geist aus einem Objekt oder Bereich. Die Wirkzeit beträgt eine Runde pro TW des Geistes, während der der Priester wie durch Schutz vor Bösem 3 m Radius geschützt ist. Jede Runde muss der Priester einen 4W6-Wurf unter seiner Konstitution schaffen (minus 1 pro vier Stufen). Bei Misserfolg endet der Zauber. Nach Abschluss muss der Geist einen Rettungswurf gegen Zauber bestehen oder wird in das Reich der Toten zurückgedrängt. Bei erfolgreichem Rettungswurf wird er vertrieben und verliert ein Viertel seiner Trefferpunkte.',
  description_en = 'Exorcises an evil spirit from an object or area. Casting time equals one turn per spirit''s HD, during which the priest is shielded as by protection from evil 10'' radius. Each turn, the priest must roll 4d6 below Constitution (minus 1 per four levels). Failure ends the spell. On completion, the spirit must save vs. spell or be forced to the realm of the dead. On a successful save, it is driven away, losing one-quarter of its hit points.'
WHERE LOWER(name_en) = LOWER('Exorcism — Savant') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Glaubenspfeil — Elf',
  description = 'Verzaubert nichtmagische Pfeile mit göttlicher Kraft. Die Pfeile gelten als +3 magische Waffen. Ein normaler Schuss mit einem Glaubenspfeil trifft automatisch, solange das Ziel in Bogenreichweite und Sichtlinie ist. Verursacht doppelten Schaden gegen böse Gegner. Der Priester kann einen Pfeil pro drei Stufen erschaffen (maximal sieben gleichzeitig). Von anderen genutzte Pfeile zerfallen zu Staub, es sei denn, der Schütze teilt den Glauben des Priesters.',
  description_en = 'Enchants nonmagical arrows with divine power. The arrows count as +3 magical weapons. A normal shot with a faith arrow always hits if the target is within bow range and line of sight. Deals double damage against evil opponents. The priest can create one arrow per three levels (maximum seven at once). Arrows used by others crumble to dust unless the user shares the caster''s faith.'
WHERE LOWER(name_en) = LOWER('Faith Arrow — Elf') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Fänge der Vergeltung',
  description = 'Erschafft ein geisterhaftes Schlangenmaul mit gespaltener Zunge, das auf ein sichtbares Ziel innerhalb der Zauberreichweite zufliegt. Bei einem Treffer verursacht es Schadenspunkte in Höhe des Schadens, den das Ziel dem Priester am selben Tag zugefügt hat (kein Rettungswurf). Das Maul hat RK 1 und BW Fl 15 (A), trifft mit ETW0 15/12/10 in drei aufeinanderfolgenden Runden. Verblasst nach 3 Runden ohne Treffer. Verursacht keinen Schaden gegen Wesen, die den Priester nicht verletzt haben.',
  description_en = 'Creates a spectral fanged viper mouth that flies at a visible target within range. On a hit, it deals damage equal to what the target has caused the caster that same day (no saving throw). The mouth has AC 1 and MV Fl 15 (A), striking at THAC0 15/12/10 over three consecutive rounds. Fades after 3 rounds without a hit. Deals no damage against creatures that have not harmed the caster.'
WHERE LOWER(name_en) = LOWER('Fangs of Retribution') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Tymoras Gunst',
  description = 'Verleiht dem Empfänger Boni auf Rettungswürfe: +4 auf den ersten, +3 auf den zweiten, +2 auf den dritten, +1 auf den vierten. Danach ist die Magie erschöpft. Kann nicht durch Magie Bannen beendet werden; hält bis zum Tod des Empfängers oder Erschöpfung. Der Priester muss den Empfänger mit bloßer Hand berühren. Tymora erlaubt nicht, denselben Nichtgläubigen mehr als einmal pro Tag zu segnen. Hebt sich mit Beshabas Fluch gegenseitig auf.',
  description_en = 'Grants saving throw bonuses to the recipient: +4 on the first, +3 on the second, +2 on the third, +1 on the fourth. After four enhanced saves, the magic is exhausted. Cannot be ended by dispel magic; lasts until the recipient''s death or exhaustion. The priest must touch the recipient with a bare hand. Tymora does not allow the same nonworshipper to be blessed more than once per day. Cancels out Bane of Beshaba.'
WHERE LOWER(name_en) = LOWER('Favor Of Tymora') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Shaundakuls Gunst',
  description = 'Erzeugt ein glückliches Ereignis während einer beschwerlichen oder gefährlichen Reise. Der genaue Effekt wird vom SL bestimmt und ist vom Zauberer nicht kontrollierbar. Wirkt nur in der Wildnis oder bei extremem Wetter während einer Reise, nicht zu Hause. Typische Effekte: sicherer Lagerplatz, Feuer bei Nässe, Oase in der Wüste, seltenes Heilkraut oder eine Lichtquelle. Gewährt nie Boni oder Abzüge auf Würfe.',
  description_en = 'Creates a serendipitous occurrence during a taxing or dangerous journey. The exact effect is determined by the DM and not controlled by the caster. Only functions in wilderness or severe weather during a journey, not at home. Typical effects: safe campsite, fire in wet conditions, oasis in desert, rare healing herb, or a light source. Never gives bonuses or penalties to any roll.'
WHERE LOWER(name_en) = LOWER('Favor of Shaundakul') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Gunst der Göttin',
  description = 'Verleiht Pflanzen sofortige Fruchtbarkeit oder verdoppelt den Ertrag reifer, wachsender Pflanzen. Gepflückte Früchte schwellen auf die doppelte Größe an. Verdorbene, kranke oder vergiftete Pflanzen werden genießbar gemacht, aber natürlich schädliche Pflanzen werden nicht sicher. Die dramatische Volumenzunahme kann Behälter sprengen. Der Zauber kann jede Pflanze nur einmal betreffen; weiteres Wirken ist wirkungslos.',
  description_en = 'Confers instant fertility upon plants or doubles the yield of mature, growing plants. Picked fruits swell to twice their former size. Tainted, diseased, or poisoned plants are rendered wholesome, but naturally harmful plants are not made safe. The dramatic volume increase can break open containers. The spell can only affect a plant once; further castings are ineffective.'
WHERE LOWER(name_en) = LOWER('Favor of the Goddess') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Feuerschneise',
  description = 'Macht alle lebende Vegetation im Wirkungsbereich immun gegen normales Feuer und halbiert Schaden durch magisches Feuer. Pflanzenartige Monster und belebtes Pflanzenleben sind eingeschlossen. Totes Pflanzenmaterial kann noch brennen, ebenso lebende Pflanzen außerhalb des Bereichs. Wirkt nicht in Innenräumen oder unterirdisch. Bedeckt 74,3 m² pro Stufe (z. B. eine 3 m breite Schneise, 24,4 m lang pro Stufe).',
  description_en = 'Renders all living vegetation in the area immune to normal fire and halves damage from magical fire. Plant-like monsters and animated plant life are included. Dead plant matter can still burn, as can living plants moved outside the area. Does not function indoors or underground. Covers 74.3 m² per level (e.g., a 3 m wide firebreak, 24.4 m long per level).'
WHERE LOWER(name_en) = LOWER('Firebreak') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Faust des Glaubens',
  description = 'Eine unsichtbare Kraftfaust schlägt ein beliebiges sichtbares Wesen innerhalb der Reichweite. Die Faust trifft automatisch und verursacht 4W4 Schadenspunkte (4W6 gegen Untote). Beschädigt keine Gegenstände, wirkt nur auf lebende oder untote Körper. Nach einem Treffer ist die Kreatur 24 Stunden lang immun gegen weitere Faust-des-Glaubens-Zauber.',
  description_en = 'An invisible fist of force strikes any visible being within range. The fist never misses and deals 4d4 damage (4d6 to undead). Causes no damage to items, acting only on living or undead bodies. Once struck, a creature is immune to all fist of faith spells for 24 hours.'
WHERE LOWER(name_en) = LOWER('Fist of Faith') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Schmiedefeuer',
  description = 'Ermöglicht einem Zwerg, ein starkes, effizientes Feuer in einer Schmiede oder einem Schmelzofen zu erschaffen. Nur ein kleines Bündel Stöcke oder ein Stück Kohle wird benötigt — danach brennt das Feuer ohne weiteren Brennstoff für die Zauberdauer und erzeugt keine schädlichen Gase. Wirkt nur in einer geweihten Schmiede. Die bearbeitbaren Metalle hängen von der Stufe ab: Blei/Zink/Zinn ab 3., Eisen/Stahl ab 7., Mithral ab 9., Adamantit ab 16. Stufe.',
  description_en = 'Enables a dwarf to create a strong, efficient fire in a forge or furnace. Only a small bundle of sticks or a lump of coal is needed — thereafter the fire burns without fuel for the duration and produces no harmful gases. Only works in a consecrated smithy. Workable metals depend on level: lead/zinc/tin from 3rd, iron/steel from 7th, mithral from 9th, adamantite from 16th level.'
WHERE LOWER(name_en) = LOWER('Forge Fire') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Stärkender Eintopf',
  description = 'Der Priester kann eine Schale Brühe, Brei oder Eintopf pro Erfahrungsstufe verzaubern (ca. 0,2 Liter). Der Eintopf muss innerhalb einer Runde verzehrt werden. Wer eine volle Schale isst, erhält Nahrung für einen ganzen Tag und 1W4+1 vorübergehende Trefferpunkte für 2 Stunden plus 1 Runde pro Priesterstufe. Schaden wird zuerst von den Bonuspunkten abgezogen. Mehrfacher Genuss ist nicht kumulativ.',
  description_en = 'The priest can enchant one bowl of broth, porridge, or stew per experience level (about 0.2 liters). The stew must be consumed within one turn. Anyone eating a full bowl gains nourishment for an entire day and 1d4+1 temporary hit points for 2 hours plus 1 round per caster level. Damage is taken from bonus points first. Multiple helpings are not cumulative.'
WHERE LOWER(name_en) = LOWER('Fortifying Stew') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Standhaftigkeit — Drow',
  description = 'Verleiht dem Empfänger die Fähigkeit, tödliche Wunden zu ignorieren und weiterzukämpfen. Nachdem der Empfänger auf 0 oder weniger Trefferpunkte gebracht wurde, kann er für 1W4+1 Runden normal weiterkämpfen, selbst mit -1 bis -9 Trefferpunkten. Eine Kreatur, die auf -10 oder weniger Trefferpunkte fällt, stirbt sofort. Der Zauber endet, wenn die Kreatur stirbt oder das Bewusstsein verliert.',
  description_en = 'Gives the recipient the ability to ignore mortal wounds and continue fighting. After being brought to 0 hit points or less, the creature can fight normally for 1d4+1 rounds even with -1 to -9 hit points. A creature brought to -10 or fewer hit points dies immediately. The spell ends when the creature dies or falls unconscious.'
WHERE LOWER(name_en) = LOWER('Fortitude — Drow') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Freier Wille',
  description = 'Bricht alle Verzauberungen, Bezauberungen oder psionischen Effekte, die den Willen oder Geist des Empfängers beeinflussen. Beendet sofort Effekte von Bezaubern, Befehl, Verwirrung, Fesseln, Furcht, Hypnose, Suggestion usw. Wenn ein solcher Zauber auf einen Priester mit memoriertem Freier Wille gewirkt wird, kann er sofort damit reagieren (vor Rettungswurf oder Magieresistenz). Die Entscheidung zählt als Aktion der Runde.',
  description_en = 'Breaks all enchantments, charms, or psionic effects affecting the recipient''s will or mind. Immediately ends effects of charm, command, confusion, enthrall, fear, hypnosis, suggestion, etc. If such a spell is cast on a priest with a memorized free will, the priest can immediately respond with it (before saving throws or magic resistance). The decision counts as the round''s action.'
WHERE LOWER(name_en) = LOWER('Free Will') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Lebhafte Truhe',
  description = 'Verzaubert eine Truhe, ein Buch oder ein anderes nichtlebendes Objekt (maximal 3-m-Würfel, maximal 45,4 kg pro Stufe). Wenn eine Kreatur außer dem Zauberer sich auf 0,9 m nähert, sprießen dem Objekt Gliedmaßen und es flieht. Es kann Füße (BW 24), Flügel (Fl 24, MC B) oder Flossen (Sw 24) entwickeln. Das Objekt flieht nur durch offene Räume und greift nicht an. Der Zauber endet, wenn das Objekt 1W4+1 Runden festgehalten wird oder der Zauberer den Zauber aufhebt.',
  description_en = 'Enchants a chest, book, or other nonliving object (max 3 m cube, max 45.4 kg per level). When any creature other than the caster approaches within 0.9 m, the object sprouts appendages and flees. It can grow feet (MV 24), wings (Fl 24, MC B), or fins (Sw 24). The object only flees through open spaces and cannot attack. The spell ends if the object is restrained for 1d4+1 rounds or the caster negates it.'
WHERE LOWER(name_en) = LOWER('Frisky Chest') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Frostatem',
  description = 'Erzeugt einen geraden Strahl, der sich 6,1 m vom Brustkorb des Zauberers aus erstreckt. Die erste Kreatur, die den Strahl berührt, erleidet 2W4+2 Kälteschaden und muss einen Rettungswurf gegen Zauber bestehen oder ist den Rest der Runde vor Kälte zitternd handlungsunfähig (verbleibende Angriffe gehen verloren). Weitere getroffene Kreaturen erleiden 1W4 Kälteschaden (halb bei erfolgreichem Rettungswurf).',
  description_en = 'Creates a straight beam extending 6.1 m from the caster''s chest. The first creature to contact the beam suffers 2d4+2 cold damage and must save vs. spell or be chilled and shuddering for the rest of the round (remaining attacks are lost). Additional creatures struck suffer 1d4 cold damage (half on successful save).'
WHERE LOWER(name_en) = LOWER('Frost Breath') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Frostpeitsche',
  description = 'Erschafft einen Froststrahl, der von der Hand des Zauberers ausgeht. Der Strahl kann mit einer Runde Verzögerung an andere Körperextremitäten verlagert werden (nützlich beim Klettern oder Festgehalten-Werden). Die Peitsche hält bis zum Zauberende oder bis der Priester einen anderen Zauber wirkt. Sie kann durch Gegner hindurchgeschwungen werden und trifft alle in einem Bogen. Verursacht 4W4 Schaden pro Runde (halb bei Rettungswurf). Kann auch Fenster zufrieren, Wasser vereisen und Oberflächen rutschig machen.',
  description_en = 'Creates a beam of frost extending from the caster''s hand. The beam can be shifted to other extremities with a one-round delay (useful when climbing or pinned). The whip lasts until the spell expires or the priest casts another spell. It can be swung through opponents, hitting all in an arc. Deals 4d4 damage per round (half on save). Can also freeze windows shut, freeze water, and make surfaces slippery.'
WHERE LOWER(name_en) = LOWER('Frost Whip') AND spell_type = 'priest';

UPDATE public.spells SET
  name = 'Knüppelverzauberung',
  description = 'Verleiht dem Bronzeholz- oder Eichenknüppel des Priesters die Kraft, einen Gegner durch Berührung zu bezaubern. Der Priester kann einen schadlosen Berührungsangriff oder einen normalen Nahkampfangriff ausführen. Getroffene Kreaturen müssen einen Rettungswurf gegen Zauber bestehen oder werden bezaubert. Bei einem schadensverursachenden Angriff erhält das Ziel +1 pro Schadenspunkt auf den Rettungswurf. In Kombination mit Knüppelkeule: -1 auf den Rettungswurf. Bezauberte Kreaturen betrachten den Priester als Freund für 2W10 Runden.',
  description_en = 'Imbues the priest''s bronzewood or oaken cudgel with the power to charm an opponent by touch. The priest can make a nondamaging touch or normal melee attack. Hit creatures must save vs. spell or be charmed. On a damaging attack, the target gets +1 to save per damage point. Combined with shillelagh: -1 to save. Charmed creatures regard the priest as a friend for 2d10 rounds.'
WHERE LOWER(name_en) = LOWER('Spirit world (this is up to the DM)') AND spell_type = 'priest';
