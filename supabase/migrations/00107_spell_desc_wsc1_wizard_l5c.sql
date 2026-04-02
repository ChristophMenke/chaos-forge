-- ═══════════════════════════════════════════════════════════════════════════════
-- WSC1 Wizard Spells Level 5 (Batch 3: 18 Spells — Create Talisman of Pluma to Dream Globe)
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.spells SET
  description = 'Erschafft einen dauerhaften magischen Gegenstand aus Pluma-Magie: einen Federtalisman. Der Talisman kann verschiedene Formen annehmen — ein Federumhang (ermöglicht Flug), eine Plumadecke (Federfall-Effekt), ein Plumateppich (schwebendes Transportmittel) oder andere Federwerk-Gegenstände. Die genaue Art des Talismans hängt von der Stufe des Zauberkundigen und den verwendeten Materialien ab. Der Prozess erfordert tagelanges sorgfältiges Federweben. Materialkomponente: V, S, M (hochwertige Federn und Webmaterialien).',
  description_en = 'Creates a permanent magical item of pluma magic: a feather talisman. The talisman can take various forms — a feathercloak (enables flight), a plumablanket (feather fall effect), a plumarug (hovering transport), or other featherwork items. The exact type depends on the caster''s level and materials used. The process requires days of careful featherweaving. Material component: V, S, M (high-quality feathers and weaving materials).'
WHERE LOWER(name_en) = LOWER('Create Talisman of Pluma') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Erzeugt eine sich ausbreitende Masse übernatürlicher Dunkelheit, die sich von einem Punkt aus langsam ausdehnt (3 m pro Runde). Die Dunkelheit ist undurchdringlich — selbst Infrasicht und magisches Licht versagen (nur Dauerlicht oder Magie Bannen kann sie aufheben). Kreaturen in der Dunkelheit sind effektiv blind (−4 Angriff, +4 RK, +2 Initiative). Die Dunkelheit kriecht um Ecken und durch Spalten. Der Zauberkundige selbst ist immun gegen die Effekte seiner eigenen Schleichenden Dunkelheit. Materialkomponente: V, S, M.',
  description_en = 'Creates a spreading mass of supernatural darkness that slowly expands from a point (3 m per round). The darkness is impenetrable — even infravision and magical light fail (only Continual Light or Dispel Magic can counter it). Creatures in the darkness are effectively blind (−4 attack, +4 AC, +2 initiative). The darkness creeps around corners and through cracks. The caster is immune to the effects of his own Creeping Darkness. Material component: V, S, M.'
WHERE LOWER(name_en) = LOWER('Creeping Darkness') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Erzeugt eine leuchtend rote Peitsche aus magischer Energie (3,7 m lang). Die Peitsche verursacht 2W6 Schaden pro Treffer und markiert das Opfer mit einer leuchtenden roten Narbe, die 1 Tag pro Stufe des Zauberkundigen sichtbar bleibt. Markierte Kreaturen können nicht unsichtbar werden und sind leicht zu verfolgen. Die Peitsche trifft mit dem ETW0 des Zauberkundigen +2 Bonus. Kann nicht von anderen geführt werden. Materialkomponente: V, S, M.',
  description_en = 'Creates a glowing red whip of magical energy (3.7 m long). The whip deals 2d6 damage per hit and marks the victim with a luminous red scar visible for 1 day per caster level. Marked creatures cannot become invisible and are easy to track. The whip hits with the caster''s THAC0 +2 bonus. Cannot be wielded by others. Material component: V, S, M.'
WHERE LOWER(name_en) = LOWER('Crimson Scourge') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Erzeugt eine menschengroße humanoide Gestalt aus Feuer, die den Zauberkundigen beschützt. Der feurige Beschützer hat RK 2, TP gleich denen des Zauberkundigen und bewegt sich mit Rate 12. Er greift automatisch jede Kreatur an, die den Zauberkundigen bedroht (ETW0 und Schaden wie ein Kämpfer der Stufe des Zauberkundigen). Bei Berührung verursacht er 2W4 Feuerschaden zusätzlich. Kann nicht weiter als 9,1 m vom Zauberkundigen entfernt werden. Erfordert keine Konzentration. Verbrennt alle brennbaren Materialien bei Kontakt. Materialkomponente: V, S, M.',
  description_en = 'Creates a man-sized humanoid figure of fire that protects the caster. The fiery protector has AC 2, HP equal to the caster''s, and moves at rate 12. It automatically attacks any creature threatening the caster (THAC0 and damage as a fighter of the caster''s level). On touch, it deals 2d4 extra fire damage. Cannot go more than 9.1 m from the caster. Requires no concentration. Burns all combustible materials on contact. Material component: V, S, M.'
WHERE LOWER(name_en) = LOWER('Daltim''s Fiery Protector') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Der Alhoon feuert einen Bolzen aus konzentrierter Dunkelheit auf ein Ziel in Sichtweite. Der Bolzen trifft automatisch (kein Angriffswurf) und verursacht 1W4+1 Schaden pro 2 Stufen des Zauberkundigen (max. 5W4+5 bei Stufe 10). Kein Rettungswurf. Der Bolzen ignoriert normale und magische Rüstung (nur Kraftbarrieren wie Schild oder Kraftwand schützen). Verursacht ein dumpfes, betäubendes Gefühl — das Opfer erleidet −1 auf Initiative für 1W4 Runden. Materialkomponente: V, S.',
  description_en = 'The alhoon fires a bolt of concentrated darkness at a visible target. The bolt hits automatically (no attack roll) and deals 1d4+1 damage per 2 caster levels (max 5d4+5 at level 10). No saving throw. The bolt ignores normal and magical armor (only force barriers like Shield or Wall of Force protect). Causes a numbing sensation — the victim suffers −1 to initiative for 1d4 rounds. Material component: V, S.'
WHERE LOWER(name_en) = LOWER('Darkbolt — Alhoon') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Erzeugt eine verzauberte Spieluhr, die eine vom Zauberkundigen gehörte Melodie perfekt wiedergibt. Die Musik hat Verzauberungseigenschaften — Kreaturen innerhalb von 9,1 m, die die Musik hören, müssen einen Rettungswurf gegen Zauber bestehen oder werden ruhig und friedlich (wie Beruhigung). Die Spieluhr spielt für die Zauberdauer und kann durch den Zauberkundigen ein- und ausgeschaltet werden. Materialkomponente: V, S, M (eine Miniatur-Spieluhr).',
  description_en = 'Creates an enchanted music box that perfectly reproduces a melody the caster has heard. The music has enchantment properties — creatures within 9.1 m hearing the music must save vs. spell or become calm and peaceful (as Calm). The music box plays for the duration and can be turned on and off by the caster. Material component: V, S, M (a miniature music box).'
WHERE LOWER(name_en) = LOWER('Darsson''s Music Box') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Der Ghul berührt ein lebendes Opfer und verursacht einen plötzlichen Schmerzstoß, der 2W8 Schaden zufügt und das Opfer für 1 Runde betäubt (Rettungswurf gegen Tod negiert die Betäubung, nicht den Schaden). Der Schaden ist nekromantischer Natur. Bei 0 oder weniger TP stirbt das Opfer sofort und erhebt sich in 1W4 Runden als Ghul unter der Kontrolle des Wirkenden. Materialkomponente: V, S.',
  description_en = 'The ghul touches a living victim and causes a sudden burst of pain dealing 2d8 damage and stunning the victim for 1 round (save vs. death negates the stun, not the damage). The damage is necromantic in nature. At 0 or fewer HP, the victim dies instantly and rises as a ghoul under the caster''s control in 1d4 rounds. Material component: V, S.'
WHERE LOWER(name_en) = LOWER('Death Bump — Ghul') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Erzeugt eine Rauchwolke (9,1-m-Radius), die aus den Überresten einer Leiche aufsteigt. Jede Kreatur in der Wolke muss einen Rettungswurf gegen Gift bestehen oder erleidet 3W6 Schaden und wird für 1W4 Runden benommen (halbe Bewegungsrate, −2 auf Angriffe und RK). Bei erfolgreichem RW: halber Schaden, keine Benommenheit. Untote und Konstrukte sind immun. Die Wolke bewegt sich nicht und löst sich nach der Zauberdauer auf. Materialkomponente: V, S, M (eine Leiche und Schwefel).',
  description_en = 'Creates a smoke cloud (9.1 m radius) rising from the remains of a corpse. Every creature in the cloud must save vs. poison or suffer 3d6 damage and be dazed for 1d4 rounds (half movement, −2 on attacks and AC). On success: half damage, no daze. Undead and constructs are immune. The cloud does not move and dissipates after the duration. Material component: V, S, M (a corpse and sulphur).'
WHERE LOWER(name_en) = LOWER('Death Smoke') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Schützt den Empfänger vor dem nächsten Zauber oder magischen Effekt, der ihn töten würde. Wenn ein tödlicher Effekt eintritt, absorbiert der Schutz den tödlichen Aspekt — der Empfänger erleidet trotzdem Schaden, stirbt aber nicht (wird auf 1 TP stabilisiert). Der Schutz verbraucht sich nach einmaligem Einsatz. Schützt nicht gegen physischen Schaden, nur gegen magische Todeseffekte (Finger des Todes, Machtwort: Tod, Todesmagie etc.). Materialkomponente: V, S, M.',
  description_en = 'Protects the recipient from the next spell or magical effect that would kill them. When a lethal effect occurs, the guard absorbs the lethal aspect — the recipient still takes damage but doesn''t die (stabilized at 1 HP). The protection is consumed after single use. Does not protect against physical damage, only magical death effects (Finger of Death, Power Word: Kill, death magic, etc.). Material component: V, S, M.'
WHERE LOWER(name_en) = LOWER('Deathguard — Old Empire') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Erschafft eine Phiole mit einer tödlichen magischen Flüssigkeit. Wird die Phiole geworfen und zerbricht (Angriffswurf als Granatenwaffe), verursacht die Flüssigkeit 4W6 nekromantischen Schaden an allen Kreaturen im 3-m-Radius (Rettungswurf gegen Tod für halben Schaden). Untote im Bereich werden stattdessen um 2W6 TP geheilt. Die Phiole bleibt potent für 1 Tag pro Stufe des Zauberkundigen. Das Wirken dieses Zaubers ist eine böse Handlung. Materialkomponente: V, S, M (eine leere Kristallphiole und ein Tropfen Gift).',
  description_en = 'Creates a vial of deadly magical liquid. When thrown and broken (attack roll as grenade), the liquid deals 4d6 necrotic damage to all creatures in a 3 m radius (save vs. death for half). Undead in the area are instead healed 2d6 HP. The vial remains potent for 1 day per caster level. Casting is an evil act. Material component: V, S, M (an empty crystal vial and a drop of poison).'
WHERE LOWER(name_en) = LOWER('Deathmaster''s Vial') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Erzeugt magische Dissonanz in einem Bereich von 12-m-Radius. Alle Kreaturen im Bereich (außer dem Zauberkundigen und bis zu 1 Kreatur pro Stufe, die er ausschließen kann) müssen einen Rettungswurf gegen Zauber bestehen oder können für die Zauberdauer nicht koordiniert zusammenarbeiten. Betroffene Kreaturen können nicht als Gruppe angreifen, sich nicht gegenseitig unterstützen und erleiden −2 auf Moralwürfe. Kommunikation ist möglich aber ineffektiv — geplante Strategien scheitern. Materialkomponente: V, S.',
  description_en = 'Creates magical dissonance in a 12 m radius area. All creatures in the area (except the caster and up to 1 creature per level excluded) must save vs. spell or be unable to coordinate for the duration. Affected creatures cannot attack as a group, support each other, and suffer −2 on morale. Communication is possible but ineffective — planned strategies fail. Material component: V, S.'
WHERE LOWER(name_en) = LOWER('Discord — Elf') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Verbirgt die wahre Blutlinie einer Kreatur vor allen Erkennungszaubern und -fähigkeiten. Die geschützte Kreatur erscheint bei allen Blutlinien-Erkennungen als gewöhnlicher Mensch ohne besondere Abstammung. Schützt auch vor Zaubern, die Rasse, Spezies oder übernatürliche Herkunft erkennen. Wahres Sehen durchdringt die Tarnung. Komponenten: V, S.',
  description_en = 'Conceals the true bloodline of a creature from all detection spells and abilities. The protected creature appears as an ordinary human with no special lineage to all bloodline detections. Also protects against spells detecting race, species, or supernatural origin. True Seeing penetrates the disguise. Components: V, S.'
WHERE LOWER(name_en) = LOWER('Disguise Bloodline') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Verkleidet einen einzelnen Untoten als lebende Kreatur ähnlicher Größe und Form. Das Skelett oder der Zombie erscheint als normaler Mensch/Halbmensch/Humanoid mit gesundem Fleisch, normaler Hautfarbe und unauffälligem Aussehen. Der verkleidete Untote strahlt keine Untoten-Aura aus — Untote Entdecken funktioniert nicht. Priester, die Untote Vertreiben versuchen, müssen zuerst einen Weisheitswurf bestehen, um den Untoten überhaupt als solchen zu erkennen. Wahres Sehen und Illusion Erkennen durchschauen die Verkleidung. Materialkomponente: V, S, M.',
  description_en = 'Disguises a single undead as a living creature of similar size and shape. The skeleton or zombie appears as a normal human/demihuman/humanoid with healthy flesh, normal skin color, and unremarkable appearance. The disguised undead radiates no undead aura — Detect Undead doesn''t work. Priests attempting to Turn Undead must first make a Wisdom check to even recognize the undead. True Seeing and Detect Illusion penetrate the disguise. Material component: V, S, M.'
WHERE LOWER(name_en) = LOWER('Disguise Undead') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Beseitigt alle Effekte körperlicher Erschöpfung bei bis zu 4 Kreaturen. Die Empfänger fühlen sich, als hätten sie eine volle Nacht geruht. Der Zauber heilt KEINE TP, stellt keine Zauber wieder her und stillt weder Hunger noch Durst. Er entfernt nur Erschöpfung, Müdigkeit und die damit verbundenen Abzüge. Am Ende der Zauberdauer kehrt die Erschöpfung zurück — die Empfänger müssen dann normal ruhen. Materialkomponente: V, S.',
  description_en = 'Removes all effects of physical exhaustion from up to 4 creatures. Recipients feel as if they had a full night''s rest. The spell does NOT heal HP, restore spells, or satisfy hunger/thirst. It only removes exhaustion, fatigue, and associated penalties. At the end of the duration, the exhaustion returns — recipients must then rest normally. Material component: V, S.'
WHERE LOWER(name_en) = LOWER('Dispel Exhaustion') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Wie Distort Life I, aber mächtiger. Kann zwei Aspekte einer ungeborenen Kreatur gleichzeitig verändern (statt nur einem). Die Erfolgschancen sind 10% höher als beim Zauber der 4. Stufe. Außerdem kann der Zauber auch innere Merkmale ansatzweise verändern: verbesserte Verdauung, stärkere Knochen, dickere Haut (aber keine Organveränderungen oder Gehirnmodifikationen). Erfordert zwei volle Stunden und ein Labor. Materialkomponente: V, S, M.',
  description_en = 'Like Distort Life I but more powerful. Can alter two aspects of an unborn creature simultaneously (instead of one). Success chances are 10% higher than the 4th-level spell. Can also partially modify internal traits: improved digestion, stronger bones, thicker skin (but no organ changes or brain modifications). Requires two full hours and a laboratory. Material component: V, S, M.'
WHERE LOWER(name_en) = LOWER('Distort Life II') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Verursacht unerträgliche Schmerzen in einer einzelnen Kreatur. Rettungswurf gegen Zauber negiert. Bei Misserfolg: die Kreatur erleidet solche Qualen, dass sie für 1W4+1 Runden zu keiner Handlung fähig ist (außer zu schreien und sich zu winden). Nachdem der Schmerz nachlässt, erleidet die Kreatur für weitere 2W4 Runden −2 auf alle Würfe. Kreaturen ohne Schmerzempfinden (Untote, Konstrukte, Pflanzen) sind immun. Materialkomponente: V, S.',
  description_en = 'Causes unbearable pain in a single creature. Save vs. spell negates. On failure: the creature suffers such agony that it is incapable of any action for 1d4+1 rounds (except screaming and writhing). After the pain subsides, the creature suffers −2 on all rolls for another 2d4 rounds. Creatures without pain sensation (undead, constructs, plants) are immune. Material component: V, S.'
WHERE LOWER(name_en) = LOWER('Dolor') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Verleiht dem Zauberkundigen die Fähigkeit zu fliegen — Bewegungsrate 18 (MK: B). Anders als normales Fliegen: der Zauberkundige kann zusätzlich zum Flug auch andere Aktionen ausführen (Zaubern, Fernkampf etc.) ohne die Flugkontrolle zu verlieren. Kann mit voller Geschwindigkeit manövrieren und gleichzeitig kämpfen. Der Zauber endet sofort bei Bewusstlosigkeit. Materialkomponente: V, S, M.',
  description_en = 'Grants the caster the ability to fly — movement rate 18 (MC: B). Unlike normal flying: the caster can perform other actions (casting, ranged combat, etc.) while flying without losing flight control. Can maneuver at full speed and fight simultaneously. The spell ends instantly on unconsciousness. Material component: V, S, M.'
WHERE LOWER(name_en) = LOWER('Drawmij''s Flying Feat') AND spell_type = 'wizard';

UPDATE public.spells SET
  description = 'Erzeugt eine schwebende, leuchtende Kugel (30 cm Durchmesser), die Bilder aus den Träumen einer schlafenden Kreatur innerhalb von 9,1 m zeigt. Die Bilder erscheinen auf der Kugeloberfläche wie ein kleiner Bildschirm. Der Zauberkundige und alle in der Nähe können die Traumbilder sehen. Die Traumkugel beeinflusst die Träume nicht — sie zeigt nur passiv, was der Schläfer träumt. Kann als Ermittlungswerkzeug dienen (Traumanalyse, Gedächtnisuntersuchung). Der Schläfer bemerkt die Kugel nicht. Materialkomponente: V, S, M (eine Glaskugel und Silberstaub).',
  description_en = 'Creates a floating, luminous sphere (30 cm diameter) that displays images from the dreams of a sleeping creature within 9.1 m. The images appear on the sphere''s surface like a small screen. The caster and all nearby can see the dream images. The dream globe does not influence the dreams — it only passively shows what the sleeper is dreaming. Can serve as an investigation tool (dream analysis, memory examination). The sleeper does not notice the globe. Material component: V, S, M (a glass sphere and silver dust).'
WHERE LOWER(name_en) = LOWER('Dream Globe') AND spell_type = 'wizard';
