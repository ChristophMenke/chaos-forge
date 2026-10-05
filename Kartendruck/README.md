# Kartendruck

Fertige, druckreife Kartensets für alle vier Helden — bereit zum Hochladen, sortiert nach Anbieter und Format.

```
Kartendruck/
├── meinspiel.de/
│   ├── 70x120/       ← ★ EMPFOHLEN — größere Karten, besser lesbarer Regeltext
│   └── 59x91/        ← Alternative, günstiger, aber kleine Schrift
└── printerstudio.de/ ← Fallback, Tarot-Format 70×121 mm
```

Alle Varianten enthalten dieselben vier Pakete — **ein vollständiges Deck pro Held**, jeweils in der Reihenfolge Referenzkarte → Epic Items → Zauberkarten:

| Paket                 | Karten | Inhalt                                                                                                                  |
| --------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| `nowi-zauberdeck`     | **33** | Referenz + Tricksters Choice + Netherese Blooded + 30 Zauber (L1–L4)                                                    |
| `sprocket-zauberdeck` | **26** | Referenz + Konstitutions-Kondensator + Scharfsicht-Brille + Mix-and-Match-Klingen + 22 Zauber (L1–L4, nur vorbereitete) |
| `larry-karten`        | **2**  | Referenz + Klinge des Wassers                                                                                           |
| `isolde-karten`       | **3**  | Referenz + Schattentänzer + Ring der vielen Gesichter                                                                   |

Larry und Isolde sind keine Zauberwirker, daher kein Zauberteil. Sprockets Deck zieht nur seine tatsächlich vorbereiteten Zauber, nicht das komplette Illusionisten-Kompendium.

Jedes ZIP enthält die Vorderseiten nummeriert (`01_referenz.png`, `02_...`, …) plus eine `_ruckseite.png` — die Rückseite ist pro Held individuell (Portrait + Name + Runensiegel), gilt aber für alle Karten seines Decks.

### Warum 70×120 mm

Der Regeltext auf den Zauberkarten ist der Engpass. Die beiden Rendering-Profile unterscheiden sich deutlich:

| Format        | Regeltext-Basis         | physisch               |
| ------------- | ----------------------- | ---------------------- |
| 59×91 mm      | 24 px auf 768 px Breite | ≈ 2,0 mm (~5,8 pt)     |
| **70×120 mm** | 34 px auf 898 px Breite | **≈ 2,9 mm (~8,2 pt)** |

5,8 pt ist Kleingedruckt-Territorium — bei langen Zaubern am Spieltisch mühsam. 70×120 mm ist außerdem das klassische große Tarotformat (Waite-Tarot) mit entsprechender Verpackungsauswahl.

---

### Ein Set für alles: `alle-helden` (80 Karten)

Weil pro Set nur **eine** Rückseite möglich ist, gibt es zusätzlich zu den vier Einzelpaketen ein kombiniertes Set mit allen Karten und der **charakterunabhängigen Grimoire-Rückseite** (`neutrale-ruckseite.png`, erzeugt via `node back.mjs --tarot70`):

| Block                                     | Karten |
| ----------------------------------------- | ------ |
| Nowi (Referenz + 2 Epics + 30 Zauber)     | 33     |
| Sprocket (Referenz + 3 Epics + 22 Zauber) | 26     |
| Sprocket — Lernvorschläge                 | 16     |
| Larry (Referenz + Epic)                   | 2      |
| Isolde (Referenz + 2 Epics)               | 3      |
| **gesamt**                                | **80** |

Damit im gemischten Set erkennbar bleibt, wem ein Zauber gehört, trägt jede Zauberkarte oben mittig ein **Besitzer-Kürzel** (`Nowi` bzw. `FixIt`) — gesteuert über `OWNER_LABEL` in `generate-deck.mjs`.

Die 16 Lernvorschläge (`*_sprocket-neu-*`, erzeugt via `node render-extra-cards.mjs FixIt --tarot70 --deck=sprocket`) sind Zauber, die Sprocket **noch nicht** kennt:

- **14 aus Nowis Repertoire**, gefiltert auf das, was ein Illusionist lernen darf. Die Oppositionsschulen Necromancy / Invocation / Abjuration sind gesperrt — deshalb fehlen hier Magic Missile, Fireball, Dispel Magic, Alarm, Stinking Cloud, Lance of Disruption und Dig.
- **2 Empfehlungen**: _Shadow Monsters_ (L4, Illusion) als einzige echte Kampfoption, da ihm die gesamte Invocation-Schule versperrt ist, und _Rope Trick_ (L2, Alteration) als sicherer Rastplatz, den die Gruppe bisher nicht hat.

80 Karten passen genau in meinspiels Umfang-Kategorie „73 – 80 Karten".

---

### Zweites Set: `kompendium` (81 Karten)

Das zweite Bestellset — kein Helden-Deck, sondern das, was auf keinem Charakterbogen steht. Rückseite ist die neutrale Grimoire-Karte, weil das Set niemandem einzeln gehört.

| Block                  | Karten | Inhalt                                                                                                      |
| ---------------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| Lady Catrina of Tiamat | **1**  | Referenzkarte (Human Crusader 11), Klasse und Stufe aus `character_classes`                                 |
| Spielleiter            | **1**  | Das Artwork aus dem PIN-Gate des GM-Bereichs                                                                |
| Sprocket — Nachzügler  | **1**  | Hold Person, siehe Nachtrag unten                                                                           |
| Ausrüstung             | **9**  | Die magischen Gegenstände der aktiven Helden — mit Besitzer                                                 |
| Zustände               | **8**  | Zum Auslegen: Bezaubert, Schlafend, Gehalten, Geblendet, Verängstigt, Unsichtbar, Beschleunigt, Verlangsamt |
| Chronik-NPCs           | **28** | Porträt, Ort und Beschreibung, nach Ort sortiert                                                            |
| Zitate                 | **31** | Die gesammelten Sprüche aus der Chronik                                                                     |
| **gesamt**             | **81** |                                                                                                             |

**Die Ausrüstungskarten zeigen nur, was wirklich jemandem gehört.** Quelle ist `character_equipment` der aktiven Helden, nicht der `magic_items`-Katalog — ein Katalogeintrag, den niemand trägt, ergibt keine Karte für den Spieltisch. Der Besitzer steht als Kopfzeile auf jeder Karte. Larrys Klinge des Wassers fehlt bewusst: die hat als Epic Item schon eine eigene, ausführlichere Karte im ersten Set. Ladungen werden **nicht** gedruckt, nur „Verbrauchsgegenstand" — den Verbrauch führen die Spielenden selbst, eine gedruckte Zahl wäre ab der ersten Sitzung falsch.

**Die Bilder entstehen über Gemini** (`generate-image.mjs`, Modell `gemini-3-pro-image-preview`) — vorher lief das über Imagen. Gemini hält sich spürbar besser an die Vorgaben, vor allem an „kein Text im Bild": die neun Ausrüstungsbilder gingen alle im ersten Versuch durch die Prüfung, bei Imagen brauchte es teils vier Anläufe. Das Modul sammelt die Schlüssel aus **beiden** Quellen — `.env.local` und `keys.env` — und wechselt bei Kontingent- oder Zugriffsfehlern zum nächsten. Jeder Schlüssel aus einem eigenen Google-Projekt bringt ein eigenes Tageskontingent.

**Jedes erzeugte Artwork wird geprüft, bevor es auf eine Karte darf** (`check-art.mjs`, ebenfalls über Gemini). Verworfen wird bei falschem Motiv, sichtbarem Text und abgebildeten Menschen; dekorative Fantasy-Runen sind erwünscht und werden nicht als Text gewertet. Bis zu vier Versuche je Gegenstand. Der Filter ist kein Luxus: Imagen lieferte ein Porträtfoto statt eines Gürtels, den Prompt als Bildunterschrift und einmal ein wolfsähnliches Tier mit Sprechblase. **Der Bildprompt darf den Kartennamen nicht enthalten** — „Short Sword +1/-1" landete sonst als Schriftzug im Bild.

Die NPC-Karten (`node build-npc-cards.mjs --tarot70`) nutzen die Avatare aus dem Supabase-Storage — es wird kein Bild erzeugt, nur geladen und von oben zugeschnitten, damit die Gesichter sitzen. Die Ortsbadge ist nach Region eingefärbt (Berrybuck gold, die Burg rot, Finnigans Höhlen teal, Greifen blau, Archenbridge/Archendale violett), sodass sich der Stapel nach Orten sortieren lässt. Reicht der Platz für einen langen Text nicht, rückt die Schrift stufenweise enger (26 → 19 px), statt das Porträt auf einen Streifen zu quetschen.

Die Zustandskarten (`node build-condition-cards.mjs --tarot70`) legt man vor sich, solange der Zustand läuft — das erinnert den Tisch daran und sagt zugleich, was er bewirkt. Ausgewählt sind genau die acht Zustände, die **eure eigenen Zauber** auslösen: Nowi wirkt Charm Person, Sleep und Hold Person, Sprocket Blindness, Fear, Invisibility und Haste; Slow gehört als Gegenstück zu Haste dazu. Jede Regelangabe stammt aus `spells.description` in der Datenbank, nichts ist hinzugedichtet. Ein farbiger Balken zeigt quer über den Tisch, ob der Zustand schadet (rot) oder hilft (teal).

Die Zitatkarten (`node build-quote-cards.mjs --tarot70`) kommen ohne Artwork und ohne einen einzigen KI-Aufruf aus — der Spruch ist die Karte. Der Sprecher erscheint in seiner Klassenfarbe.

Die Sonderkarten (`node build-special-card.mjs --tarot70`) tragen **nur** das Zitat und das Bild — keine Rubrik, keine Zuschreibung, keine Fußzeile. Der Schriftzug sitzt am unteren Rand, damit der Teller Labskaus frei bleibt; er ist die Pointe des Bildes. Der Verlauf verdunkelt nur das untere Fünftel, statt die Bildmitte grau zu überziehen. Anders als bei den Gegenstandskarten sind hier Menschen im Bild erwünscht — geprüft wird deshalb nur auf sichtbaren Text.

„Zurück an den Absender" nutzt das PIN-Gate-Artwork als **Bildvorlage**: `generateImage()` nimmt über `refImage` ein Referenzbild entgegen, sodass der Spielleiter auf der Karte wiedererkennbar bleibt und seinen eigenen Zauber zurück ins Gesicht bekommt. Zwei umlaufende goldene Pfeile zitieren die bekannte Reverse-Geste, ohne deren Gestaltung nachzubauen.

Die Spielleiterkarte (`node build-gm-card.mjs --tarot70`) schneidet das PIN-Gate-Artwork oben an: dort sitzt das Gesicht, und der Schriftzug „Master of Chaos" im aufgeschlagenen Buch fällt aus dem Bild. Name und Text lassen sich über `--name=` und `--text=` überschreiben.

Nicht enthalten: der Testeintrag `QA-NPC-ms06kp11`, der als einziger NPC kein Porträt hat.

Die 23 Regelkarten sind bewusst **nicht** Teil des Sets — THAC0, Rettungswürfe und Attributstabellen stehen bereits auf den Charakterbögen. Das Skript bleibt: `node build-rules-cards.mjs --tarot70` erzeugt sie in Sekunden neu, ganz ohne KI, mit Werten direkt aus `rules-js/`.

**Zum Hochladen:** Der Ordner `kompendium-upload/` enthält alle 80 Vorderseiten fortlaufend nummeriert (`01_…` bis `80_…`) plus `_ruckseite.png`. Alle Dateien sind 898 × 1488 px mit eingetragener 300-dpi-Angabe — im Konfigurator die Bilder in dieser Reihenfolge hochladen und `_ruckseite.png` als Rückseite zuweisen. Wer lieber PDFs hochlädt, nimmt `kompendium-vorderseiten.pdf` und `kompendium-ruckseite.pdf`; `kompendium.zip` ist derselbe Inhalt gepackt.

Verpackt mit `node build-print-packages.mjs tarot70 --set2` und `node build-print-pdf.mjs tarot70 --set2`.

81 Karten liegen **eine über** meinspiels Umfang-Kategorie „73 – 80 Karten". Wer in der Stufe bleiben will, lässt eine Zitatkarte weg — die Nummerierung vergibt `build-print-packages.mjs` beim nächsten Lauf ohnehin neu.

---

### Nachtrag: `sprocket-nachtrag` (1 Karte)

Ordner `meinspiel.de/70x120/sprocket-nachtrag/` bzw. `sprocket-nachtrag.zip` — **Hold Person** (L3, Enchantment/Charm) mit Besitzer-Kürzel `FixIt` und Sprockets Rückseite.

Der Zauber gehört nach den oben genannten Regeln in Sprockets Lernvorschläge (er steht in Nowis Repertoire und Enchantment ist für Illusionisten nicht gesperrt), fiel beim ersten Lauf aber durch. Er ist bewusst **nicht** in die bestehenden Pakete eingearbeitet, weil das `alle-helden`-Set damit auf 81 Karten käme und aus meinspiels Umfang-Kategorie „73 – 80 Karten" fiele.

Erzeugt via `node render-extra-cards.mjs FixIt --tarot70 --deck=sprocket-nachtrag --spells="Hold Person"`. In `render-extra-cards.mjs` ist Hold Person inzwischen auch in der Standard-Liste ergänzt — ein kompletter Neubau des Sets zieht ihn also künftig mit.

---

## ★ meinspiel.de — 70×120 mm (empfohlen)

Ordner `meinspiel.de/70x120/`. Alle Bilder/PDF-Seiten **76×126 mm** (70×120 mm Endformat + 3 mm Beschnitt umlaufend, 300 dpi = **898×1488 px**) — exakt meinspiels Dokumentgröße laut ihrem [Gestaltungsleitfaden 70×120 mm](https://www.meinspiel.de/gestaltungsleitfaden-spielkarten-format-70x120-mm/). Gestaltbarer Bereich 62×112 mm (Endformat minus 4 mm Sicherheitsabstand), Eckenradius 5 mm, Beschnitt farblich identisch zum Kartenrand.

**Ablauf:**

1. Gehe zu **[meinspiel.de/tarotkarten-selbst-gestalten-drucken/](https://www.meinspiel.de/tarotkarten-selbst-gestalten-drucken/)**
2. Schritt 1 "Format": **70 × 120 mm** wählen — der Konfigurator bietet insgesamt 7 Formate an, nur dieses passt zu den Dateien hier
3. Schritt 2–4: Umfang pro Set, Verpackung, Stückzahl
4. Gestaltungsoption **"PDF hochladen"** → die passende `*-vorderseiten.pdf`, dazu die `*-ruckseite.pdf`
   - alternativ **"JPEG oder PNG hochladen"** → ZIP entpacken, Bilder in nummerierter Reihenfolge hochladen, `_ruckseite.png` als Rückseite zuweisen
5. Proof genau prüfen (Farben, Beschnitt, Ränder)

| Datei                                  | Inhalt                                                    |
| -------------------------------------- | --------------------------------------------------------- |
| `nowi-zauberdeck-vorderseiten.pdf`     | 33 Seiten, eine Karte pro Seite, exakt 76×126 mm          |
| `sprocket-zauberdeck-vorderseiten.pdf` | 26 Seiten                                                 |
| `larry-karten-vorderseiten.pdf`        | 2 Seiten                                                  |
| `isolde-karten-vorderseiten.pdf`       | 3 Seiten                                                  |
| `*-ruckseite.pdf`                      | je 1 Seite, die gemeinsame Rückseite des jeweiligen Decks |
| `*.zip`                                | dieselben Karten als nummerierte PNGs (898×1488 px)       |

Der Unterordner `einzelbilder/` enthält dieselben PNGs bereits entpackt, nach Upload-Reihenfolge nummeriert — praktisch, wenn der Editor Karte für Karte abfragt.

**Bildqualität:** 898×1488 px auf 76×126 mm = **300 dpi**, verlustfreies PNG, 8 bit RGB, keine Kompressionsartefakte. Die 300-dpi-Angabe steht seit dem Verpacken auch **im PNG selbst** (pHYs-Chunk) — Playwright-Screenshots enthalten sie nicht, wodurch Upload-Editoren 72 dpi annehmen und die Karte zu klein platzieren (sichtbarer weißer Rand statt randlos). `build-print-packages.mjs` ergänzt sie automatisch.

**Randlos platzieren:** Die Karten sind auf Anschnitt gebaut — das Motiv muss im Editor die **volle Fläche bis über die Beschnittkante** füllen, nicht in den Sicherheitsrahmen eingepasst werden. Bleibt in der Vorschau ein weißer Rand, ist das Bild zu klein platziert und würde so gedruckt.

**Vorbehalt zum PDF-Weg:** Das sind normale, exakt bemaßte PDFs (RGB, Seitengröße 76,00×126,00 mm inkl. Beschnitt), aber **keine PDF/X-4-Druckdaten** — kein CMYK, kein ICC-Profil. Falls meinspiel das reklamiert, den ZIP-Weg mit Einzelbildern nehmen.

---

## meinspiel.de — 59×91 mm (Alternative)

Ordner `meinspiel.de/59x91/`. Alle Bilder/PDF-Seiten **65×97 mm** (59×91 mm Endformat + 3 mm Beschnitt, 300 dpi = 768×1146 px) — meinspiels Vorgabe für ihr Standardformat, gegengeprüft gegen deren "Layoutvorgaben Kompakt-Übersicht" (gestaltbarer Bereich 51×83 mm, 4 mm Sicherheitsabstand, kein Kartenumriss/Beschnittmarken).

Günstiger und mit größerer Verpackungsauswahl, aber der Regeltext ist mit ~5,8 pt klein. Ablauf identisch zu oben, nur Format **59×91 mm** wählen. Die ZIPs heißen hier `*-meinspiel.zip`.

Historische Notiz: Zauber-/Referenz-/Epic-Item-Karten lagen von Anfang an innerhalb der 4-mm-Grenze; auf den **Kartenrückseiten** saßen Name und Klasse mit nur ~2 mm zu nah am Rand — das wurde gefixt.

---

## printerstudio.de (Tarot-Format, 70×121 mm)

Ordner `printerstudio.de/`. Alle Bilder **898×1500 px** (70×121 mm Endformat + 3 mm Beschnitt, 300 dpi) — passend zu PrinterStudios Mindestgröße für ihr "Tarot Format" (897×1497 px). Nur 12 px höher als die meinspiel-70×120-Variante, sonst identisch.

**Ablauf:**

1. Gehe zu **[printerstudio.de/machen/tarot-format-personalisierbares-kartenspiel-blanko.html](https://www.printerstudio.de/machen/tarot-format-personalisierbares-kartenspiel-blanko.html)**
2. Klick auf **"Gestalte es"**
3. Kartenanzahl: 33 (Nowi) / 26 (Sprocket) / 2 (Larry) / 3 (Isolde)
4. Verpackung wählen (Folienverschweißt, Faltschachtel, Samttasche, …) — Geschmackssache
5. Design-Modus **"Bild & Text"** wählen (Text ist bereits ins Bild eingebrannt)
6. ZIP entpacken, Bilder in nummerierter Reihenfolge hochladen
7. `_ruckseite.png` als Rückseite hochladen (nicht sicher geprüft, ob eine gemeinsame Rückseite für alle Karten unterstützt wird oder pro Karte einzeln nötig ist — im Editor nachschauen)
8. Vor dem Bestellen: Proof genau prüfen

Offizielle Vorlagen zum Abgleich: [PDF](https://www.printerstudio.de/dl/templates/playingcard/tarot-size.pdf) · [PSD](https://www.printerstudio.de/dl/templates/playingcard/tarot-size.psd) · [AI](https://www.printerstudio.de/dl/templates/playingcard/tarot-size.ai)

Der Online-Designer ist ein mehrstufiger, interaktiver Assistent (kein Bulk-ZIP-Import) — Uploads müssen einzeln durchgeklickt werden.

---

## Woher die Dateien kommen (falls neu generiert werden muss)

Erzeugt über `scripts/spell-cards/` im Projekt-Repo. Es gibt drei Formatprofile, die in getrennte Ausgabeordner schreiben:

| Profil               | Flag        | Pixel    | Ausgabe                                         |
| -------------------- | ----------- | -------- | ----------------------------------------------- |
| meinspiel 70×120     | `--tarot70` | 898×1488 | `out/decks-tarot70/`, `out/char-cards-tarot70/` |
| printerstudio 70×121 | `--tarot`   | 898×1500 | `out/decks-tarot/`, `out/char-cards-tarot/`     |
| meinspiel 59×91      | _(ohne)_    | 768×1146 | `out/decks/`, `out/char-cards/`                 |

```bash
cd scripts/spell-cards

# 1. Karten rendern — hier für das empfohlene 70×120-Profil
node generate-deck.mjs Nowi --tarot70
node generate-deck.mjs sprocket --tarot70
for c in nowi sprocket larry isolde; do node build-char-cards.mjs --tarot70 --only=$c; done
for c in nowi sprocket larry isolde; do node portrait-back.mjs $c --tarot70; done

# 2. Pakete schnüren (nummerierte Ordner + ZIPs) und PDFs bauen
node build-print-packages.mjs tarot70     # ohne Argument: alle Profile
node build-print-pdf.mjs tarot70          # Profile: tarot70 | std

# 3. Ergebnis hierher kopieren
cp out/print-ready/meinspiel-70x120/*.zip \
   out/print-ready/meinspiel-pdf-70x120/*.pdf   ../../Kartendruck/meinspiel.de/70x120/
```

Für die anderen Profile dasselbe mit `--tarot` bzw. ohne Flag; Zielordner entsprechend `printerstudio.de/` bzw. `meinspiel.de/59x91/`.

Sprockets Deck zieht nur seine tatsächlich vorbereiteten Zauber (`character_spells.prepared = true`) — steuerbar über `fetchLearnedWizardSpells(id, { preparedOnly })` in `lib.mjs`.

**Welche Karte in welches Paket gehört, steht zentral in `print-manifest.mjs`** — `build-print-packages.mjs` (ZIPs) und `build-print-pdf.mjs` (PDFs) lesen beide daraus, damit ZIP und PDF nie auseinanderlaufen. Neues Epic Item oder neuer Held: dort eintragen, dann die Build-Schritte laufen lassen.

**Zwei Fallstricke beim Neu-Rendern:**

- `build-char-cards.mjs` rendert ohne `--only=` **alle** Charaktere mit `is_active = true` — darunter rund 50 QA-Testcharaktere aus den E2E-Läufen. Deshalb oben die Schleife mit `--only=`.
- Der Bild-Cache (`cache/portraits/`, `cache/art-items/`) wird von beiden Tarot-Profilen geteilt (Suffix `-tarot`, identische Pixelmaße). Das ist Absicht — sonst würde Gemini alle Artworks kostenpflichtig neu generieren.

**Exakte Seitengröße der PDFs:** Chromium rundet die Seitengröße auf ganze CSS-Pixel auf (aus 76×126 mm würde 76,2×126,32 mm). `build-print-pdf.mjs` korrigiert die MediaBox deshalb nachträglich längentreu auf den Sollwert — Ergebnis ist 76,00×126,00 mm.
