---
date: 2026-11-02T16:27:01+00:00
git_commit: e25723d024edb2b2339aa62e0dd5bde175648f05
branch: feature/svenbot-character-data
topic: "SvenBot kennt die Charaktere"
tags: [plan, rulebook-chat, svenbot, characters, spell-resources, datenschutz]
status: ready
---

# PLAN: SvenBot kennt die Charaktere

SvenBot soll Fragen zu konkreten Charakteren beantworten können, z. B. zu Werten, Zauberbüchern, Schulen und Sphären oder zur Ausrüstung. Dafür erkennt der Server Charakternamen in der Frage, lädt die passenden Charaktere über die RLS des Fragenden und schickt sie als kompakten Text mit an Gemini.

Grundlage ist die Recherche `docs/agents/research/2026-11-02-svenbot-character-data.md`.

## Acceptance Criteria

**Namenserkennung**

- Nennt eine Frage einen sichtbaren Charakter, kennt SvenBot dessen Daten. Als Nennung zählt der ganze Name oder ein Namensteil mit mindestens 3 Zeichen, unabhängig von Groß- und Kleinschreibung und Akzenten.

**Umfang der Charakterdaten**

- Alles, was SvenBot zu einem Charakter bekommt:
  - Grunddaten: Rasse, Klassen und Stufen (Dual-Class ruhend gekennzeichnet), Kit, Gesinnung.
  - Attribute: gespeichert und effektiv, inklusive Sub-Stats.
  - Kampfwerte: TP, temporäre TP, RK, ETW0 (Basis und effektiv), Rettungswürfe, Angriffe pro Runde, Wahrnehmung, Diebesfertigkeiten, Hinterhalt-Multiplikator, Magieresistenz und Zauberpatzer.
  - Zauber: Name DE/EN, Grad, Schule bzw. Sphäre, memoriert/gewirkt. Dazu Slots oder Zauberpunkte samt Verbrauch, Spezialisierung mit Oppositionsschulen, bei Priestern Gottheit, Priesterschaft und Sphären (Haupt- und Nebenzugang).
  - Ausrüstung: Waffen mit Treffer- und Schadensbonus, Rüstung und Schild, magische Items mit Effekten, epische Ausrüstung mit Schadensstufe und freigeschalteten Fähigkeiten, Inventar, Börse.
  - Weitere: Waffen- und allgemeine Fertigkeiten, Kampfstile, Sprachen, Traits und Nachteile, aktive temporäre Effekte.
- Nicht enthalten sind Notizen, persönliche Angaben (Spielername, Alter, Größe, Gewicht, Geschlecht, Haar, Augen), Avatar und XP-Historie.

**Sichtbarkeit**

- Im Spieler-Chat findet SvenBot nur Charaktere, die die RLS liefert: eigene, geteilte und öffentliche. NPCs sind ausgeschlossen.
- Im GM-Chat findet er zusätzlich die NPCs, die die RLS dem GM-Account über den Auto-Share liefert.

**Auswahl der Charaktere**

- Pro Frage gibt es höchstens 3 Charaktere mit allen Details.
- Steht kein Name in der Frage, gilt die jüngste Nachricht im Verlauf, die einen Namen enthält. Gibt es keine, gilt die Zusammenfassung.
- Bei Gruppenfragen bekommt SvenBot alle aktiven, sichtbaren Spielercharaktere (keine NPCs) in kompakter Form: Werte und Kampf. Genannte Namen kommen zusätzlich mit allen Details.
  - Auslöser sind nur eindeutige Gruppenausdrücke: „Gruppe“, „Party“, „wer von uns/euch“, „jeder von uns“, „unsere Helden/Charaktere“, „alle Helden“ und auf Englisch „group“, „party“, „who of us“, „which of us“, „each of us“, „our heroes/characters“.
  - Bloßes „wir/uns“ wie in „Wie würfeln wir Initiative?“ löst nichts aus.

**Verhalten von SvenBot**

- Die laufende Zusammenfassung hält als ersten Punkt fest, um welchen Charakter es zuletzt ging.
- SvenBot erfindet keine Charakterwerte. Fehlen Daten, zum Beispiel bei „ich“ ohne Namen, fragt er nach dem Helden.

**Anzeige**

- Unter jeder Antwort mit Charakterdaten steht „📜 Kannte: Elandril, Thorin“ bzw. „📜 Kannte: Gruppe (5)“. Die Zeile bleibt nach dem Neuladen erhalten.

**Datenschutz und Doku**

- Die Datenschutzerklärung nennt Charakterdaten als Inhalt, der an Google geht.
- Die App-Hilfe nennt die Charakterkenntnis. Der falsche Pfad `/characters/[id]/spellbook` wird korrigiert.

## Technical Key Decisions and Tradeoffs

1. **Namenserkennung auf dem Server, keine Auswahl im UI.**
   - Why: Wunsch des Users, keine zusätzliche Bedienung.
   - Impact: Es gibt einen reinen Matcher. Die Kandidaten kommen pro Frage aus einer leichten RLS-Query (`id, name, is_npc, is_active`).

2. **Nutzer-Client statt Service-Client, auch im GM-Chat.**
   - Why: Niemand erfährt über SvenBot mehr, als er in der App sehen könnte. Der GM sieht über den Auto-Share alle aktiven Charaktere einschließlich NPCs (`src/lib/master/auto-share.ts`). Das GM-Cookie gilt nur für `path: "/master"` und würde die API ohnehin nie erreichen.
   - Impact: Der Client schickt `scope`. `scope: "gm"` schaltet nur NPCs als Treffer frei, die RLS gilt trotzdem. `epic_items` folgt automatisch seiner eigenen RLS, ist also bei öffentlichen Charakteren nicht dabei. Archivierte Charaktere sind im GM-Chat nur dabei, soweit die RLS sie liefert. Das ist akzeptiert. Jeder Client kann `gm` schicken, sieht damit aber höchstens zusätzlich öffentliche NPCs. Auch das ist akzeptiert.
   - **Sicherheitsgrenze:** Die Kind-Tabellen `character_equipment`, `character_spells`, `character_*_proficiencies`, `character_languages`, `character_classes` und `character_inventory` haben `USING (true)`. Sie erben die Sichtbarkeit also **nicht**. Geschützt ist nur, was über die IDs läuft: `loadCharacterBundles` darf ausschließlich IDs aus der RLS-gebundenen Kandidaten-Query bekommen. Ein Test in `character-context.test.ts` sichert das ab.

3. **Charakter als kompakter Markdown-Text im Prompt.**
   - Why: Gemini liest das gut, und die reine Funktion ist testbar.
   - Impact: Es gibt eine Detailfassung (`full`) und eine Kurzfassung (`compact`). Die Werte kommen aus `computeCharacterCombatData` und der neuen `computeSpellResources`. `computeCharacterCombatData` liefert dafür künftig auch `effectiveStats`, damit die Overclock-Logik nicht dupliziert wird.
   - Zauber stehen ohne Beschreibung im Text, die liefert weiter die Regelbuch-Suche.
   - Bei Priestern stehen nur die eigenen `character_spells` und die Sphären-Namen im Text. Den Sphären-Katalog (`fetchAvailablePriestSpells`, mehr als 1000 Zeilen) lädt der Chat nie.

4. **Zauberressourcen als reine Funktion herauslösen.**
   - Why: Slots und Punkte werden heute nur in `play-spellbook-panel.tsx` (`useMemo`, :87-196) berechnet.
   - Impact: Die Funktion `computeSpellResources` landet in `src/lib/rules/spell-resources.ts`, und das Panel nutzt sie.
   - Das Panel hat **keine Tests**. Deshalb kommen zuerst Charakterisierungstests, dann der Umbau.
   - Die Semantik bleibt 1:1: WE **effektiv** (wie `play-mode.tsx:1150`), IN für Magierpunkte **gespeichert** (`character.int`, wie im Panel :125).

5. **Anzeige über den Response-Header `X-SvenBot-Characters`.**
   - Why: Der Stream bleibt reiner Text, und `fetch` hat die Header schon vor dem ersten Chunk.
   - Impact: Der Header-Inhalt ist `encodeURIComponent(JSON.stringify({ names, groupSize }))`. Die Antwortnachricht bekommt das optionale Feld `context`. `parseChat` entfernt ein kaputtes `context` von der Nachricht, statt den ganzen Verlauf zu verwerfen.

6. **Reihenfolge bei der Auswahl.**
   - Why: Die aktuelle Frage hat Vorrang, danach gilt die jüngste Nennung. So treffen Folgefragen den richtigen Helden.
   - Impact: Der Server prüft der Reihe nach die Frage, dann den Verlauf vom neuesten zum ältesten (Nutzer- und SvenBot-Nachrichten) und zuletzt die Zusammenfassung. Die erste Quelle mit Treffern gewinnt. Gruppenwörter zählen nur in der aktuellen Frage.

## Current State

```
Client ──{message, history, bookFilter, summary}──► /api/rulebook-chat
                                                     ├─ getUser, Rate-Limit, Keys
                                                     ├─ Voyage → match_rulebook_chunks (8)
                                                     ├─ monsters ilike (Service, max 3)
                                                     └─ streamText(SYSTEM_PROMPT, history,
                                                          summary + chunks + monster + APP_HELP + Frage)
```

- In `src/lib/rulebook-chat/system-prompt.ts` stützt sich Modus A nur auf die Regelbuch-Ausschnitte. Der Summary-Prompt kennt keinen Charakterbezug.
- Die Charakterdaten werden pro Seite geladen (Standard-Set, siehe Recherche §3). Es gibt keinen Serializer.
- `ChatMessage` (`chat-history.ts`) besteht aus `id`, `role`, `content`, `status` und `errorMessage`.

## Desired End State

```
Client ──{message, history, bookFilter, summary, scope}──► /api/rulebook-chat
                                                     ├─ … (wie bisher)
                                                     ├─ buildCharacterContext(supabase, {message, history, summary, scope})
                                                     │    ├─ Kandidaten: characters (RLS) id,name,is_npc,is_active
                                                     │    ├─ selectCharacters → {fullIds ≤3, groupIds, source}
                                                     │    ├─ loadCharacterBundles(supabase, ids)  (.in("character_id", ids))
                                                     │    └─ formatCharacter(bundle, "full"|"compact")
                                                     ├─ Prompt: summary + chunks + monster + CHARAKTERDATEN + APP_HELP + Frage
                                                     └─ Header X-SvenBot-Characters: {"names":["Elandril"],"groupSize":null}

Chat:   [Sven] Elandril hat noch 2 Grad-1-Slots …
               📜 Kannte: Elandril
```

Beispiel für den Charakterblock (Detailfassung, gekürzt):

```
--- Charakterdaten (Chaos Forge, aktueller Stand) ---
## Elandril (Spieler-Charakter, aktiv)
- Elf, Magier (Hervorrufer) 7 · Kit: Militärmagier · Gesinnung: chaotisch gut
- Attribute: ST 9 · GE 16 · KO 12 · IN 18 (effektiv 19) · WE 11 · CH 13
- TP 21/24 (+4 temporär) · RK 4 · ETW0 18 (effektiv 17) · Angriffe/Runde 1 · Wahrnehmung 14
- Rettungswürfe: Lähmung/Gift/Tod 13 · Stab/Rute/Zauberstab 9 · Versteinerung 11 · Odem 13 · Zauber 10
- Zauber (Slots): Grad 1: 3/5 frei · Grad 2: 1/3 frei · Grad 3: 2/2 frei · Grad 4: 0/1 frei
  Opposition: Verzauberung, Bannmagie
  Zauberbuch: Grad 1: Magisches Geschoss (Magic Missile, Hervorrufung) [memoriert ×2, 1 gewirkt] · Schlaf (Sleep, Verzauberung) …
- Waffen: Dolch +1 (Treffer +1, Schaden +1, angelegt) · …
- Rüstung: — · Magische Items: Ring des Schutzes +2 (RK −2, RW +2, angelegt)
- Episch: Klinge des Wassers (Stufe 2/4, angelegt) – Fähigkeiten: Wasserwandeln …
- Fertigkeiten: Dolch · Zauberkunde (IN) · … · Kampfstile: — · Sprachen: Elfisch, Gemeinsprache
- Traits: … · Nachteile: … · Aktive Effekte: Hast (Angriffe ×2, RK +2) …
- Inventar: Seil (15 m) ×1 · … · Börse: 12 PM, 340 GM, 5 SM
```

## Abstractions and Code Reuse

- `src/lib/rules/`
  - `spell-resources.ts` (neu): `computeSpellResources({ character, classEntries, effectiveWis, epicBonusSpellPoints, spells })` liefert `{ casterClass, classGroups, mode: "slots" | "points" | "none", totalSlots: number[], expendedByLevel, totalPoints, pointsRemaining, maxSpellLevel }`. Die Logik wird 1:1 aus dem Panel übernommen. `classEntries` enthält nur aktive Klassen, `classGroups` leitet die Funktion selbst ab. IN, `spell_system`, `spell_points_used` und `spell_slots_adj` kommen aus `character`. `expendedByLevel` zählt nur `prepared`-Zauber.
  - `spell-resources.test.ts` (neu)
- `src/components/play-mode/play-spellbook-panel.tsx`: nutzt `computeSpellResources` in einem einzigen `useMemo`. Neu: `play-spellbook-panel.test.tsx` mit Charakterisierungstests.
- `src/lib/rules/character-computed.ts`: `CharacterCombatData.effectiveStats`, das Ergebnis von `resolveEffectiveStats` inklusive Overclock (:135-149), wird nur durchgereicht.
- `src/lib/rulebook-chat/`
  - `character-match.ts` (neu, rein):
    - `normalizeName`: Kleinschreibung und NFD ohne Akzente.
    - `findMentionedCharacters(text, candidates)`: Wortgrenzen. Der ganze Name zählt vor Namensteilen ab 3 Zeichen, Stoppwörter gelten nicht als Namensteil.
    - `hasGroupWords(text)`
    - `selectCharacters({ message, history, summary, candidates, scope })` liefert `{ fullIds, groupIds, names, groupSize }`.
  - `character-bundle.ts` (neu, I/O): `loadCharacterBundles(supabase, ids, { detail: "full" | "compact" })`. Das ist das Standard-Set aus dem Play Mode **plus `character_languages`** (wie `rescan/page.tsx:85`). Alle Abfragen laufen in einem `Promise.all` über `.in("character_id", ids)`, Effekte nur mit `ended_at IS NULL`. Die Kurzfassung lädt nur `characters`, `character_classes`, `character_equipment`, `epic_items`, `character_weapon_proficiencies`, `character_fighting_styles` und `character_effects`.
  - `character-format.ts` (neu, rein): `formatCharacter(bundle, "full" | "compact")` und `formatCharacterBlock(full, compact)`. Nutzt `computeCharacterCombatData` (inklusive `effectiveStats`), `computeSpellResources`, `getKitSpellFailure`, `getOppositionSchools`, `getPriestSpheres(classId, priesthood, alignment)`, `getAlignmentLabel`, `getRace`, `getClass`, `getKit`, `getUnlockedSpellAbilities` und `spellName`. Längen sind gedeckelt: Inventar höchstens 40 Einträge, Effekt-Notizen höchstens 200 Zeichen.
  - `character-context.ts` (neu): `buildCharacterContext(supabase, input)` liefert `{ block: string, names: string[], groupSize: number | null }`. Fehler werden geschluckt, dann gibt es `{ block: "", names: [], groupSize: null }`.
  - `system-prompt.ts`:
    - `SYSTEM_PROMPT` bekommt den Abschnitt CHARAKTERDATEN.
    - `SUMMARY_SYSTEM_PROMPT` bekommt die Regel „Aktueller Charakter“.
    - `APP_HELP_CONTEXT` wird korrigiert und ergänzt.
  - `chat-history.ts`: `ChatMessage.context?: { names: string[]; groupSize: number | null }`, `parseChat` entfernt ein ungültiges `context`, bevor validiert wird.
  - `chat-store.ts`: schickt `scope` explizit über `SendOptions` mit (aus `useRulebookChat(scope, userId)`, nicht aus dem Key geparst), liest den Header und setzt `context` an der Antwort.
- `src/app/api/rulebook-chat/route.ts`: nimmt `scope` an, startet `buildCharacterContext` per `Promise.all` zusammen mit `embedQuery`, setzt den Charakterblock unter eigener Überschrift **vor** „Relevante Regelbuch-Ausschnitte:“ und setzt den Header.
- `src/components/rulebook-chat/chat-message.tsx`: Prop `context`, Zeile „📜 Kannte: …“.
- Weitere Dateien: `messages/de.json`, `messages/en.json`, `src/app/datenschutz/page.tsx`, `src/lib/release-notes/releases.ts` und `CLAUDE.md`.

## Logging & Observability

- Wirft `buildCharacterContext` einen Fehler, schreibt der Server `console.error("SvenBot character context:", message)`. Der Chat läuft dann ohne Charakterdaten weiter, so wie heute schon bei der Monster-Suche.
- Namen und Inhalte werden nicht geloggt.

## Implementation

### Phase 1: Genannter Charakter

Dependencies: None

Ziel der Phase: Wer in der Frage einen sichtbaren Charakter nennt, bekommt Antworten auf Basis von dessen Daten. Dazu werden Datenschutz und App-Hilfe angepasst.

**Tasks**:

- [x] `play-spellbook-panel.test.tsx` neu anlegen: Charakterisierungstests der heutigen Slot- und Punkte-Anzeige (Magier 7 mit Slots, Priester mit WE-Bonus, Punkte-Modus, `spell_slots_adj`, gewirkte Zauber). Sie müssen vor dem Umbau grün sein.
- [x] `src/lib/rules/spell-resources.ts` und Tests anlegen. Die Logik kommt aus `play-spellbook-panel.tsx:87-196`: Caster-Klasse, Barde/Magier/Priester, Punkte, Basis-Slots, WE-Bonus, Spezialistenbonus, `spell_slots_adj` und `expendedByLevel`. Tests decken ab:
  - Magier 7 mit Slots
  - Hervorrufer mit Bonus-Slots
  - Priester WE 17 mit Bonus
  - Punkte-Modus Magier und Priester
  - Barde
  - Nicht-Zauberer (`mode: "none"`)
  - `spell_slots_adj`
  - Dual-Class ruhend
- [x] `play-spellbook-panel.tsx` auf `computeSpellResources` umstellen. Die Charakterisierungstests bleiben grün.
- [x] `character-computed.ts`: `effectiveStats` in `CharacterCombatData` aufnehmen und `character-computed.test.ts` um eine Assertion erweitern.
- [x] `src/lib/rulebook-chat/character-match.ts` und Tests anlegen, zunächst `normalizeName`, `findMentionedCharacters` und `selectCharacters` nur für die aktuelle Frage. Tests decken ab:
  - ganzer Name
  - Vorname aus „Elandril der Weise“
  - Groß- und Kleinschreibung
  - Akzente („Éowyn“ ↔ „eowyn“)
  - Wortgrenze („Tor“ trifft nicht „Torte“)
  - Teil unter 3 Zeichen trifft nicht
  - zwei Charaktere mit gleichem Vornamen kommen beide
  - höchstens 3
  - NPC nur bei `scope: "gm"`
- [x] `src/lib/rulebook-chat/character-bundle.ts` anlegen. `loadCharacterBundles(supabase, ids, detail)` lädt alles in einem `Promise.all` mit `.in()`, inklusive `character_languages`, Effekte nur aktiv, und gruppiert nach `character_id`. Bei leeren `ids` gibt es keine Abfrage. Tests laufen gegen einen Fake-Supabase-Builder (`from().select().in().is()`).
- [x] `src/lib/rulebook-chat/character-format.ts` und Tests anlegen, mit `formatCharacter(bundle, "full")`. Fixtures:
  - Magier-Spezialist mit Zauberbuch und memorierten Zaubern
  - Priester mit Sphären und Punkten
  - Krieger mit magischem Ring und epischem Item
  - aktiver Effekt verändert IN und ETW0
  - Dual-Class ruhend

  Die Tests prüfen Schlüsselzeilen. Außerdem prüfen sie, dass Notizen und persönliche Angaben nicht vorkommen und dass die Länge gedeckelt ist. Zauberpatzer = Epic + Effekte + Kit/Rüstung (`getKitSpellFailure`). Priester: nur eigene Zauber und Sphären-Namen, kein Katalog.

- [x] `src/lib/rulebook-chat/character-context.ts` und Tests anlegen. `buildCharacterContext` holt die Kandidaten (`characters` mit `id, name, is_npc, is_active`), wählt aus, lädt und formatiert. Bei einem Fehler kommt ein leerer Kontext zurück. Ein Test stellt sicher, dass `loadCharacterBundles` nur IDs aus der Kandidaten-Query bekommt (Sicherheitsgrenze).
- [x] `route.ts`: `scope` aus dem Body lesen, nur `"gm"` oder `"player"` zulassen, Standard ist `"player"`. `buildCharacterContext` per `Promise.all` zusammen mit `embedQuery` starten. Reihenfolge im Prompt: Zusammenfassung → `Charakterdaten:` (nur wenn vorhanden) → `Relevante Regelbuch-Ausschnitte:` → Monster → App-Hilfe → Frage. Der Header folgt in Phase 3.
- [x] `chat-store.ts`: `scope` explizit über `SendOptions` mitschicken, `use-rulebook-chat.ts` reicht es durch. `chat-store.test.ts` um einen Test erweitern, der den Body prüft.
- [x] `system-prompt.ts`: Abschnitt „CHARAKTERDATEN“ in `SYSTEM_PROMPT` einfügen:
  - Werte im Block sind der aktuelle Stand aus der App und gelten als Fakten über den Helden.
  - Regeln weiter aus den Ausschnitten.
  - Nichts ergänzen, was nicht im Block steht.
  - Wird ein Held gemeint, der nicht im Block steht, nach dem Namen fragen.
  - Spott über die Helden ist erlaubt, über die Spieler nicht.

  Modus A wird angepasst: Charakterdaten dürfen mit den Ausschnitten kombiniert werden. `system-prompt.test.ts` erweitern, auch mit einer Assertion auf die Nachfrage-Regel.

- [x] `APP_HELP_CONTEXT`:
  - `/characters/[id]/spellbook` ersetzen durch „Zauber: Charakterbogen → Tab Zauber bzw. Play Mode“.
  - Unter SVENBOT ergänzen: „Nenne einen Helden beim Namen, dann kenne ich seine Werte, Zauber und Ausrüstung (nur Helden, die du auch in der App sehen kannst).“
- [x] `src/app/datenschutz/page.tsx`:
  - KI-Abschnitt (:52-57) ergänzen: Werden Charaktere im SvenBot-Chat genannt, gehen deren Spielwerte (Werte, Zauber, Ausrüstung, Effekte; keine Notizen oder persönlichen Angaben) zur Beantwortung an Google.
  - Abschnitt :153-156 entsprechend anpassen.

**Automated Verification**:

- [x] `npx vitest run src/lib/rules/spell-resources.test.ts src/lib/rulebook-chat` grün
- [x] Play-Mode-Tests (`npx vitest run src/components/play-mode`) grün
- [x] `npm run verify` grün

**Manual Verification**:

- [ ] Unter `/chat` „Welche Zauber hat <eigener Magier> memoriert?“ fragen. Die Antwort nennt die Zauber aus dem Play Mode.
- [ ] Nach den Rettungswürfen eines öffentlichen, fremden Charakters fragen. Die Antwort enthält die Werte.
- [ ] Nach einem NPC fragen: im Spieler-Chat ohne Daten, im GM-Chat mit Daten.

### Phase 2: Folgefragen und Gruppe

Dependencies: Phase 1

Ziel der Phase: Folgefragen ohne Namen und Fragen zur ganzen Gruppe funktionieren, und die Zusammenfassung behält den Charakterbezug.

**Tasks**:

- [x] `selectCharacters` erweitern: Ohne Treffer in der Frage den `history` vom neuesten zum ältesten Eintrag durchsuchen (Nutzer- und SvenBot-Nachrichten), danach die `summary`. Die erste Quelle mit Treffern gewinnt. Tests:
  - Folgefrage nach einer Antwort, die „Elandril“ nennt
  - Die aktuelle Frage schlägt den Verlauf
  - Fallback auf die Zusammenfassung
  - Ohne irgendeinen Namen kommt nichts
- [x] `hasGroupWords` mit eindeutigen Gruppenausdrücken (DE/EN, siehe Acceptance Criteria) und Wortgrenzen anlegen. Gilt nur für die aktuelle Frage. Ergebnis `groupIds` = alle Kandidaten mit `is_active && !is_npc` außer den `fullIds`. Tests:
  - „Wer von uns …“
  - „unsere Gruppe“
  - „our party“
  - „which of us“
  - „Wie würfeln wir Initiative?“ löst **nichts** aus
  - „Gruppenzwang“ zählt nicht
  - Name und Gruppe zusammen
  - Kurzfassung schließt NPCs aus, auch bei `scope: "gm"`
- [x] `formatCharacter(bundle, "compact")`: eine bis drei Zeilen (Rasse/Klasse/Stufe, TP, RK, ETW0, Rettungswürfe, Angriffe pro Runde, Wahrnehmung, Diebesfertigkeiten, Magieresistenz), Test dazu. `buildCharacterContext` lädt die Gruppe mit `detail: "compact"`.
- [x] `SUMMARY_SYSTEM_PROMPT`: Wurde im Gespräch ein bestimmter Held besprochen, beginnt die Zusammenfassung mit „Aktueller Charakter: <Name>“, gefolgt vom zuletzt besprochenen. `system-prompt.test.ts` erweitern.

**Automated Verification**:

- [x] `npx vitest run src/lib/rulebook-chat` grün
- [x] `npm run verify` grün

**Manual Verification**:

- [ ] Zuerst „Was hat Thorin für eine RK?“ fragen, dann „Und seine Rettungswürfe?“. Die zweite Antwort nennt Thorins Werte.
- [ ] „Wer von uns hat den besten Rettungswurf gegen Gift?“ fragen. Die Antwort vergleicht die aktiven Helden.

### Phase 3: Anzeige „Kannte: …“, Release Notes und Doku

Dependencies: Phase 1, Phase 2

Ziel der Phase: Man sieht unter der Antwort, welche Charakterdaten SvenBot hatte. Release Notes und Doku werden nachgezogen.

**Tasks**:

- [x] `route.ts`: Header `X-SvenBot-Characters` setzen, wenn `names.length > 0` oder `groupSize` gesetzt ist. Inhalt ist `encodeURIComponent(JSON.stringify({ names, groupSize }))`. Ein Helfer `encodeCharacterHeader`/`decodeCharacterHeader` in `character-context.ts` bekommt Roundtrip-Tests mit Umlauten und kaputten Werten.
- [x] `chat-history.ts`: `ChatMessage.context?: { names: string[]; groupSize: number | null }`. `parseChat` bereinigt zuerst (ein ungültiges `context` wird entfernt) und validiert dann. Ein kaputtes `context` darf nie den ganzen Verlauf verwerfen (`every(isMessage)`, :135). `chat-history.test.ts`: gültig, fehlend, kaputt (Verlauf bleibt).
- [x] `chat-store.ts`: Nach `response.ok` den Header lesen und `context` mit dem ersten Stream-Update an die Antwortnachricht schreiben. Es bleibt auch bei späterem Fehler oder Abbruch erhalten. `apiHistory` schickt `context` nicht mit. Tests:
  - mit Header
  - ohne Header
  - kaputter Header
  - `context` übersteht das Neuladen
- [x] `chat-message.tsx`: Prop `context`. Unter der Antwort, außer bei `streaming` mit leerem Inhalt, steht `t("knewCharacters", { names })` bzw. bei Gruppe `t("knewGroup", { count })`, in `text-xs text-muted-foreground` mit 📜. `rulebook-chat.tsx` reicht das Feld durch. `chat-message.test.tsx` erweitern.
- [x] i18n `rulebook`:
  - `knewCharacters`: „Kannte: {names}“ / „Knew: {names}“
  - `knewGroup`: „Gruppe ({count})“ / „Party ({count})“

  Mit Namen und Gruppe zusammen lautet die Zeile „Kannte: Elandril · Gruppe (5)“.

- [x] `releases.ts`: neuer Eintrag oben, ID = Release-Tag. Der Text sagt, dass SvenBot eure Helden kennt, wenn man sie beim Namen nennt, inklusive Gruppenfragen. Icon `svenbot`, DE/EN.
- [x] `CLAUDE.md`:
  - Roadmap 32 „SvenBot kennt die Charaktere“
  - im Supabase-Abschnitt ein Stichpunkt „SvenBot-Charakterkontext“ (Matcher, RLS über den Nutzer-Client, GM über Auto-Share, Header, Grenzen)
  - Projektstruktur `lib/rulebook-chat/` und `lib/rules/spell-resources.ts` ergänzen

**Automated Verification**:

- [x] `npx vitest run src/lib/rulebook-chat src/components/rulebook-chat` grün
- [x] `npm run verify` grün

**Manual Verification**:

- [ ] Unter einer Antwort zu einem genannten Helden steht „📜 Kannte: <Name>“. Nach dem Neuladen steht die Zeile weiter da.
- [ ] Bei einer Gruppenfrage steht „📜 Kannte: Gruppe (n)“, bei einer reinen Regelfrage steht keine Zeile.
- [ ] Der Release-Dialog zeigt den neuen Eintrag.

## Implementation Notes

- Phase 1–3 wurden in einem Durchgang umgesetzt: `selectCharacters` kann Verlauf, Zusammenfassung und Gruppe von Anfang an, die Header-Helfer liegen in `character-info.ts` (schlank, damit der Browser-Bundle nicht den Formatierer samt Regel-Engine lädt).
- Gruppenfrage ohne Namen holt bewusst **nicht** den zuletzt besprochenen Helden aus dem Verlauf (sonst „Kannte: Thorin · Gruppe (5)“ bei jeder Gruppenfrage).
- Bekannte Eigenheit: Nach einer Frage zu einem Helden bekommt auch eine reine Regelfrage („Was macht Schlaf?“) dessen Daten mit (jüngste Nennung im Verlauf) — sichtbar an „Kannte: …“, kostet nur Tokens.
- Name-Matching akzeptiert den deutschen Genitiv („Thorins RK“).

- Abweichung von der Freigabe (Review-Befund): Bloßes „wir/uns/unser“ löst keine Gruppe aus, weil es in normalen Regelfragen ständig vorkommt. Nur eindeutige Gruppenausdrücke zählen.
- Kandidaten werden pro Frage neu geladen (kleine Gruppe, wenige Zeilen). Ein Cache ist nicht nötig.
- Stoppwörter für Namensteile: Artikel und Füllwörter (der, die, das, von, van, de, the, of, und, and). Damit trifft „Elandril der Weise“ nicht schon über „der“.

## References

- Recherche: `docs/agents/research/2026-11-02-svenbot-character-data.md`
- Vorgänger: `docs/agents/plans/2026-11-01-persistent-svenbot-chat.md`
- `src/app/api/rulebook-chat/route.ts`, `src/lib/rulebook-chat/system-prompt.ts`, `src/lib/rules/character-computed.ts:106`, `src/lib/rules/effective-stats.ts:92`, `src/components/play-mode/play-spellbook-panel.tsx:87-196`, `src/app/characters/[id]/play/page.tsx:28-111`, `src/lib/master/auto-share.ts`
