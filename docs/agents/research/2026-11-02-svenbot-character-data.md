---
date: 2026-11-02T15:56:57+00:00
git_commit: e25723d024edb2b2339aa62e0dd5bde175648f05
branch: main
topic: "Wie könnte SvenBot an Charakterdaten kommen — Ist-Zustand"
tags: [research, codebase, rulebook-chat, svenbot, characters, rls, master-dashboard, datenschutz]
status: complete
---

# Research: Wie könnte SvenBot an Charakterdaten kommen — Ist-Zustand

## Research Question

Ist-Zustand dokumentieren für:

1. den Ablauf von `/api/rulebook-chat` (Auth, RAG, System-Prompt, Grenzen, Modell);
2. die Tabellen und Spalten eines Charakters sowie vorhandene Loader und Resolver;
3. Sichtbarkeit und RLS (Spieler, GM);
4. was der Chat im Client über Nutzer, Bereich und „aktuellen Charakter“ weiß;
5. den Datenschutztext zum Chat.

## Summary

- **SvenBot bekommt heute keine Charakterdaten.** Der Request-Body ist `{message, history, bookFilter, summary}`. Der Prompt setzt sich zusammen aus:
  - Zusammenfassung des älteren Gesprächs,
  - 8 Regelbuch-Chunks (Voyage-Embedding plus RPC `match_rulebook_chunks`),
  - bis zu 3 Monster-Treffern (Service-Client, `ilike` auf Wörter ab 4 Zeichen),
  - `APP_HELP_CONTEXT`,
  - der Frage.

  `SYSTEM_PROMPT` beschränkt Modus A ausdrücklich auf die bereitgestellten Regelbuch-Ausschnitte.

- **Ein Charakter verteilt sich auf rund 12 Tabellen.** Abgeleitete Werte wie THAC0, RK, Rettungswürfe, Wahrnehmung, Diebesfertigkeiten und effektive Attribute sind nicht gespeichert. Sie entstehen aus reinen Funktionen (`computeCharacterCombatData`, `resolveEffectiveStats`). Ein Text- oder Markdown-Serializer für Charaktere existiert nicht.
- **Der Lade-Code ist dupliziert.** Play Mode, Manage, Print, Rescan und die GM-NPC-Seiten laden je ein nahezu identisches „Standard-Set“ an Tabellen (Server-Client, mehrere Wellen). Eine gemeinsame Ladefunktion gibt es nicht.
- **Sichtbarkeit ist uneinheitlich:**
  - `characters` liefert eigene, geteilte (`character_shares`) und öffentliche (`is_public`) Charaktere.
  - Die meisten Kind-Tabellen haben `USING (true)`, Ausnahme `epic_items`: nur Besitzer und Geteilte, nicht öffentlich.
  - NPC-Flag und `is_active` spielen in der RLS keine Rolle.
  - Der GM-Bereich lädt per Service-Client alles. Beim Öffnen von `/master` teilt `auto-share.ts` alle aktiven Charaktere mit dem GM-Account.
- **Der Chat hat keinen Charakterbezug.** Bekannt sind nur `scope` (`player` | `gm`) und `userId`. Es gibt keinen Kontext „aktueller Charakter“ und keinen Link von Charakterseiten zum Chat.
- **Datenschutz:** Die Erklärung nennt „Fragen an SvenBot“ und „die letzten Nachrichten“ als Daten an Google. Charakterwerte im Chat-Kontext sind dort nicht erwähnt. Beim Scan gehen Charakterbögen als Bild an Google, Session-Beiträge bei der Zusammenfassung ebenfalls.

```
src/
  app/api/rulebook-chat/
    route.ts                  # Chat: Auth, Rate-Limit, Voyage, RAG, Monster, Prompt, Stream
    summary/route.ts          # laufende Zusammenfassung (nur Chat-Inhalt)
  lib/rulebook-chat/
    system-prompt.ts          # SYSTEM_PROMPT (Modus A/B), APP_HELP_CONTEXT, SUMMARY_SYSTEM_PROMPT
    chat-store.ts             # Client-Store, Body {message, history, bookFilter, summary}
  components/rulebook-chat/
    rulebook-chat.tsx         # Props: scope, userId
  app/chat/page.tsx           # <RulebookChat scope="player" userId />
  components/master/master-dashboard.tsx  # <RulebookChat scope="gm" userId /> (:522)
  lib/rules/
    character-computed.ts     # computeCharacterCombatData (:106)
    effective-stats.ts        # resolveEffectiveStats (:92)
    epic-items.ts / magic-items.ts / temporary-effects.ts / spellslots.ts
  app/characters/[id]/
    play|manage|print|rescan/page.tsx   # Loader ("Standard-Set")
  app/master/page.tsx         # Service-Client, alle Charaktere (:39-95)
  lib/master/auto-share.ts    # teilt aktive Charaktere mit dem GM-Account
  app/datenschutz/page.tsx    # KI-Abschnitt (:52-57), Empfänger (:107-119), Chat lokal (:153-156)
```

```
heute:
 Client ──{message, history, bookFilter, summary}──► /api/rulebook-chat
                                                         │ getUser() (401)
                                                         │ checkRateLimit (20/min)
                                                         │ embedQuery ─► Voyage
                                                         │ rpc match_rulebook_chunks (8, ≥0.3)
                                                         │ monsters ilike (Service, max 3)
                                                         ▼
                        streamText(SYSTEM_PROMPT, history, summary + chunks + monster + APP_HELP + Frage)
                                                         │ Gemini, maxOutputTokens 8192
                                                         ▼
                                                   text/plain Stream
```

## Detailed Findings

### 1. `/api/rulebook-chat` (`src/app/api/rulebook-chat/route.ts`)

- **Auth und Grenzen:**
  - Server-Client `createClient()` mit `auth.getUser()` (:13-20), 401 ohne Nutzer. Kein `is_approved`-Check.
  - Rate-Limit `checkRateLimit(user.id)` (:23), 20 pro Minute, geteilt mit der Zusammenfassung.
  - 503 ohne `GOOGLE_API_KEY` oder `VOYAGE_API_KEY` (:31-41).
  - Body `{message, history, bookFilter, summary}` (:44). `message` höchstens 5000 Zeichen (:50).
- **RAG:**
  - `embedQuery(message)` (:55), danach RPC `match_rulebook_chunks` mit `match_threshold 0.3`, `match_count 8` und `filter_books` (:58-63). Der RPC läuft über den Nutzer-Client.
  - Monster: Service-Client, Wörter ab 4 Zeichen, höchstens 5 Begriffe, `ilike` auf `name`/`name_en`, `limit(3)`, Narrative je Abschnitt auf 800 Zeichen gekürzt (:70-151).
- **Prompt:**
  - Zusammengesetzt als `contextBlock = rulesContext + monsterContext + APP_HELP_CONTEXT` (:164).
  - Die History wird auf `API_HISTORY_LENGTH` (20) gefiltert und gekürzt, Inhalte höchstens `MAX_HISTORY_CONTENT_LENGTH` (:168-184).
  - Die Zusammenfassung ist höchstens `MAX_SUMMARY_LENGTH` (:187-190) lang.
  - User-Prompt: `${summaryBlock}Relevante Regelbuch-Ausschnitte:\n\n${contextBlock}\n\n---\n\nFrage: ${message}` (:196).
- **Modell:**
  - `streamText({system, history, prompt, maxOutputTokens: 8192})` (:193-200).
  - Das Modell setzt `src/lib/gemini/generate-text.ts` (Alias `gemini-flash-latest`). Das Denkbudget zählt gegen `maxOutputTokens` (Kommentar :197).
- **System-Prompt** (`src/lib/rulebook-chat/system-prompt.ts:63-96`):
  - Persona SvenBot.
  - Themen nur AD&D 2e und App-Bedienung.
  - **Modus A** (Regeln): „AUSSCHLIESSLICH auf den bereitgestellten Regelbuch-Ausschnitten“, Monster-Daten für taktische Hinweise.
  - **Modus B** (App-Hilfe): nur `APP_HELP_CONTEXT`.
  - `APP_HELP_CONTEXT` (:8-61) nennt `/characters/[id]/spellbook`. Diese Route existiert nicht, Zauber liegen in Manage → Zauber-Tab und im Play Mode.
  - `SUMMARY_SYSTEM_PROMPT` (:102-110) behält „erwähnte Charaktere, Klassen, Stufen und Gegenstände“.

### 2. Datenmodell eines Charakters

**`characters`** (Basis `00001_initial_schema.sql:11`, Erweiterungen):

| Bereich              | Spalten                                                                                                             | Migration                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Attribute            | `str`, `str_exceptional`, `dex`, `con`, `int`, `wis`, `cha`                                                         | `00004:6`                          |
| Sub-Stats            | `*_stamina/muscle/aim/balance/health/fitness/reason/knowledge/intuition/willpower/leadership/appearance`            | `00014:17`                         |
| Basis                | `level`, `race_id`, `class_id` (Legacy), `hp_current`, `hp_max`, `notes`, `avatar_url`                              | `00004:6`                          |
| Gesinnung, XP, Börse | `alignment`, `xp_current`, `gold_pp/gp/ep/sp/cp`                                                                    | `00009:5`                          |
| Persönliches         | `player_name`, `age`, `height_cm`, `weight_kg`, `gender`, `hair_color`, `eye_color`                                 | `00014:6`                          |
| Dieb                 | `thief_*` (7 Werte)                                                                                                 | `00016:5`                          |
| Sichtbarkeit         | `is_public` / `is_active` / `is_npc`, `npc_visible_to_players`                                                      | `00025` / `00027` / `00183`        |
| Kit, Priester        | `kit` / `deity`, `priesthood`                                                                                       | `00029` / `00066`                  |
| Zaubersystem         | `spell_system` (`slots`/`points`), `spell_slots_adj`, `spell_points_used`, `allowed_spell_books`, `spell_whitelist` | `00041`, `00037`, `00045`, `00069` |
| P.O.                 | `traits`, `disadvantages` (jsonb, bilingual)                                                                        | `00167:25`                         |

**Kind-Tabellen:**

| Tabelle                             | Inhalt                                                                                                                                                                                                                              | Migration                             |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `character_classes`                 | `class_id`, `level`, `xp_current`, `is_active` (Dual-Class), `switch_level`                                                                                                                                                         | `00015:6`, `00077`                    |
| `character_spells`                  | `spell_id`, `prepared`, `expended`. Magier: Zeile = im Zauberbuch, `prepared` = memoriert. Priester: Zeilen = vorbereitete Sprüche, verfügbare dynamisch über `fetchAvailablePriestSpells` (`src/lib/supabase/priest-spells.ts:32`) | `00004:39`, `00045:5`                 |
| `spells`                            | `name`/`name_en`, `level`, `spell_type`, `school`, `sphere`, `range`, `duration`, `area_of_effect`, `components`, `casting_time`, `saving_throw`, `description(_en)`, `source_book`                                                 | `00002:67` ff.                        |
| `character_equipment`               | `weapon_id`/`armor_id` (Joins `weapons`, `armor`), `quantity`, `equipped`, `hit_bonus`, `damage_bonus`, `magic_effects` (jsonb), `custom_label`, `magic_item_id`                                                                    | `00004:24`, `00036`, `00070`, `00192` |
| `epic_items`                        | `name(_en)`, `description(_en)`, `equipped`, `damage_level`, `damage_levels`, `simple_effects` (u. a. Overclock-Zustand)                                                                                                            | `00049:2`, `00231`                    |
| `character_weapon_proficiencies`    | `weapon_name`, `specialization`                                                                                                                                                                                                     | `00010:18`                            |
| `character_nonweapon_proficiencies` | `proficiency_id` → Katalog `nonweapon_proficiencies`                                                                                                                                                                                | `00010:26`, `00059`                   |
| `character_fighting_styles`         | `style_id`, `slots_invested`                                                                                                                                                                                                        | `00032:4`                             |
| `character_languages`               | `language_name`                                                                                                                                                                                                                     | `00011:72`                            |
| `character_inventory`               | `item_id` → `general_items`, `custom_name`, `quantity`, `notes`                                                                                                                                                                     | `00017:30`                            |
| `character_effects`                 | `name`, `notes`, `duration_text`, `modifiers`, `flags`, `temp_hp_remaining`, `ended_at` (NULL = aktiv)                                                                                                                              | `00230:10`                            |
| `xp_history`                        | XP-Verlauf                                                                                                                                                                                                                          | `00034:2`                             |

TS-Typen stehen in `src/lib/supabase/types.ts`: `CharacterRow` :3, `CharacterSpellRow` :225, `SpellRow` :267, `CharacterEquipmentWithDetails` :294, `EpicItemRow` :350, `CharacterClassRow` :417, `CharacterEffectRow` :720.

### 3. Loader

**„Standard-Set“** (Server-Client, jeweils `.eq("character_id", id)`):

```
characters *
character_classes *
character_equipment *, weapon:weapons(*), armor:armor(*)
character_spells *, spell:spells(*)
character_weapon_proficiencies *
character_nonweapon_proficiencies *, proficiency:nonweapon_proficiencies(*)
character_inventory *, item:general_items(*)
epic_items *
character_fighting_styles *
```

**Loader pro Seite:**

- **Play Mode**, `src/app/characters/[id]/play/page.tsx:28-111`:
  - Welle 1: `characters`. NPCs werden auf `/master/npcs/[id]/play` umgeleitet.
  - Welle 2: Standard-Set plus aktive `character_effects`.
  - Welle 3: `fetchAvailablePriestSpells` bei Priesterklassen.
- **Manage**, `.../manage/page.tsx:30-118`: Standard-Set plus Sprachen, Effekte, `xp_history`, Sessions und NWP-Katalog.
- **Print**, `.../print/page.tsx:28-92`: Standard-Set plus Sprachen und Priesterzauber, ohne Effekte.
- **Rescan**, `.../rescan/page.tsx:25-103`: Standard-Set plus Sprachen, daraus `CharacterSnapshot`.
- **Epic**, `.../epic/page.tsx:15-58`: Teilmenge.
- **GM**, `src/app/master/page.tsx:39-95`: Service-Client. Lädt alle Charaktere und Kind-Tabellen (Zauber nur `character_id, spell:spells(*)`, ohne `prepared`) und ruft `computeCharacterCombatData` auf (:122, :136).
- **GM-NPC-Seiten**, `src/app/master/npcs/[id]/*`: Standard-Set über den Service-Client.
- **Dashboard**, `src/app/dashboard/page.tsx:180-441, 679`: Teilmengen für die Party, `computeCharacterCombatData`.

### 4. Resolver und Serialisierung

**Resolver** (reine Funktionen):

- `computeCharacterCombatData(character, classes, equipment, epicItems, weaponProficiencies, fightingStyles = [], effects = [])`, `src/lib/rules/character-computed.ts:106`.
  - Liefert `thac0`, `thac0Effective`, `effectSummary`, `tempHp`, `ac`, `saves`, `perception`, `classGroups`, `maxLevel`, `hpCurrent`/`hpMax`/`hpDelta`, `backstabMultiplier`, `thiefSkills`, `epicEffects`, `magicResistance`, `magicSpellFailure`, `magicResistances`, `magicPassiveAbilities`, `magicSpellAbilities` und `primaryWeapon` (:64-99).
- `resolveEffectiveStats(character, {epicEffects, magicEffects, overclockActive?}, effects)`, `src/lib/rules/effective-stats.ts:92`.
  - Liefert `{values, modified, subs, mods}`.
- **Hilfsfunktionen:**
  - `getEpicEffects` (`epic-items.ts:211`)
  - `getMagicItemEffects` (`magic-items.ts:80`)
  - `aggregateEffects` (`temporary-effects.ts:174`)
- **Slots und Punkte** (`spellslots.ts`): nehmen Zahlen entgegen, z. B. `getWizardSpellSlots(level)` :144 und `getPriestBonusSlots(wis)` :170. Zusammengesetzt werden sie in Komponenten (`play-spellbook-panel.tsx`, `spellbook/resource-tracker.tsx`, `tab-spells.tsx`) und in `combat-simulator/adapters.ts`.

**Serialisierung:**

- `generateCharacterDocx(PrintSheetProps)`, `src/lib/utils/docx-export.ts:355`: Word, Props :62.
- Druck-HTML: `print-sheet.tsx`.
- Backup: JSON.
- Kampfsimulator: `characterToCombatEntity`.

Einen Text- oder Markdown-Serializer gibt es nicht.

### 5. Sichtbarkeit und RLS

- **`characters`** (SELECT, `00025_character_visibility.sql:35-40`): `auth.uid() = user_id OR is_public OR EXISTS(character_shares … shared_with_user_id = auth.uid())`.
- **Kind-Tabellen** `character_classes`, `character_inventory`, `character_equipment`, `character_spells`, `character_*_proficiencies`, `character_languages`, `character_fighting_styles`: SELECT `USING (true)` für alle Angemeldeten (`00015:19`, `00017:41`, `00113:12-37`, `00032:18`).
- **`epic_items`**: nur Besitzer und Geteilte, ausdrücklich nicht öffentlich (`00114:8-18`).
- **`character_effects`**: erbt die Sichtbarkeit von `characters` (`00230:35-37`).
- **NPCs und Archiv:** `is_npc` und `is_active` kommen in keiner Policy vor.
  - `/characters` blendet NPCs im Code aus (`src/app/characters/page.tsx:57`).
  - Gruppen in der Liste:
    - eigene aktive und eigene inaktive (eingeklappt);
    - geteilte (`character_shares` des Nutzers);
    - öffentliche.
- **GM:**
  - Token: PIN-Cookie `gm_session` (HMAC, 24 h, `path: "/master"`, `src/app/master/actions.ts:19-80`). Das Token hängt an keinem Nutzer, `/master` verlangt aber zusätzlich einen Login (`page.tsx:28`).
  - `after(() => shareActiveCharactersWith(user.id))` (`page.tsx:37`, `src/lib/master/auto-share.ts:12-23`): Alle aktiven Charaktere, NPCs eingeschlossen, werden mit dem GM-Account geteilt.
  - Danach lädt der Service-Client alles (:39-95).

### 6. Chat im Client

- `RulebookChat` hat nur die Props `scope` und `userId` (`rulebook-chat.tsx:14-25`). Der Store-Key ist `${scope}:${userId}` (`chat-store.ts:54`).
- Einbindung:
  - `/chat` mit `scope="player"` (`src/app/chat/page.tsx:7`).
  - GM-Tab mit `scope="gm"` (`master-dashboard.tsx:522`). Der angesehene Charakter steckt dort im lokalen State `viewingCharacterId` (:325).
- Navigation:
  - `src/lib/navigation.ts:40-46` (Sidebar, Menü „Mehr“).
  - `master-sidebar.tsx:76-92`, `master-bottom-nav.tsx:42`.
- Weder ein Context-Provider noch localStorage halten einen „aktuellen Charakter“, und keine Charakterseite verlinkt den Chat.

### 7. Datenschutz (`src/app/datenschutz/page.tsx`)

- :52-57: „Deine Fragen an den Regelbuch-Chat (SvenBot), hochgeladene Charakterbögen und Monster-Statblocks sowie Session-Beiträge zur Zusammenfassung werden zur Bearbeitung an Google (Gemini) übermittelt; für die Regelbuch-Suche zusätzlich an Voyage AI (Embeddings).“
- :107-108: Google Gemini (USA) für KI-Chat, Import, Zusammenfassungen und Bilder.
- :119: Voyage AI für Embeddings.
- :153-156: Der Chat liegt nur lokal; „für die Beantwortung gehen die Fragen und die letzten Nachrichten wie oben beschrieben an Google.“
- Weitere Stellen, an denen Gruppendaten an Gemini gehen: Session-Zusammenfassung (`src/app/api/summarize-session/route.ts:40-68`) und Session-Bild (`src/app/api/generate-session-image/route.ts:46-82`, Charakternamen und Einträge).

## Code References

- `src/app/api/rulebook-chat/route.ts:44` – Body des Chat-Requests
- `src/app/api/rulebook-chat/route.ts:164-200` – Kontextblock und `streamText`
- `src/lib/rulebook-chat/system-prompt.ts:82-91` – Modus A/B
- `src/lib/rulebook-chat/chat-store.ts:241-252` – Client-Request
- `src/lib/rules/character-computed.ts:64-106` – `CharacterCombatData` / `computeCharacterCombatData`
- `src/lib/rules/effective-stats.ts:92` – `resolveEffectiveStats`
- `src/app/characters/[id]/play/page.tsx:28-111` – Loader-Vorlage (Standard-Set + Effekte + Priesterzauber)
- `src/lib/supabase/priest-spells.ts:32` – verfügbare Priesterzauber
- `supabase/migrations/00025_character_visibility.sql:35-40` – SELECT auf `characters`
- `supabase/migrations/00113_rls_shared_character_data.sql:12-37` – Kind-Tabellen `USING (true)`
- `supabase/migrations/00114_rls_epic_items_shared_only.sql:8-18` – Epic nur Besitzer/Geteilte
- `src/app/master/page.tsx:37-95` – GM: Auto-Share und Service-Laden
- `src/app/datenschutz/page.tsx:52-57,153-156` – Chat-Datenschutz

## Architecture Documentation

- KI-Routen prüfen Auth per `getUser()`. Kontext wird serverseitig geladen (Monster über den Service-Client), der Client schickt nur Freitext.
- Abgeleitete Charakterwerte entstehen ausschließlich in reinen Funktionen unter `src/lib/rules/`. Seiten laden Rohdaten serverseitig in parallelen Wellen.
- Spielerseiten laden mit dem Nutzer-Client (RLS), GM-Seiten mit dem Service-Client.
- Lokalisierte DB-Texte haben `name`/`name_en`, die Anzeige läuft über `localized()`.

## Open Questions

- Keine zum Ist-Zustand. Die Auswahl des Charakters, der Umfang und die Sichtbarkeit sind Planungsentscheidungen.
