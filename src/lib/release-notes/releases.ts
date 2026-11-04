/**
 * Release notes shown once per release (dialog) and in Settings → "What's new".
 *
 * Adding a release: put a new entry at the TOP. The id is the release day
 * (YYYY-MM-DD, group calendar); a second release on the same day gets "-2" …
 * "-9" so the ids keep sorting correctly as strings. Players whose account was
 * created on or after that day won't get the dialog for it.
 */

export type ReleaseIcon =
  "svenbot" | "level-up" | "effects" | "undo" | "sprocket" | "gallery" | "push";

interface LocalizedText {
  de: string;
  en: string;
}

export interface ReleaseItem {
  icon: ReleaseIcon;
  title: LocalizedText;
  text: LocalizedText;
}

export interface Release {
  id: string;
  /** Calendar day of the release, YYYY-MM-DD (equals the id without suffix). */
  date: string;
  items: ReleaseItem[];
}

export const RELEASES: Release[] = [
  {
    id: "2026-11-04",
    date: "2026-11-04",
    items: [
      {
        icon: "gallery",
        title: { de: "Die Galerie des Chaos", en: "The Gallery of Chaos" },
        text: {
          de: "Euer Spielleiter hängt jetzt Szenen aus unseren Abenteuern auf. Ihr findet sie im Menü unter „Galerie“ – tippt auf ein Bild und blättert im Vollbild mit Wischen oder den Pfeiltasten.",
          en: "Your game master now hangs up scenes from our adventures. Find them under “Gallery” in the menu – tap an image and page through in fullscreen by swiping or with the arrow keys.",
        },
      },
      {
        icon: "push",
        title: { de: "Benachrichtigungen aufs Handy", en: "Notifications on your phone" },
        text: {
          de: "Unter Einstellungen → „Benachrichtigungen“ schaltet ihr Push pro Gerät ein: Neue Szenen, Spieltermine, Gold und EP kommen dann direkt aufs Handy. Auf dem iPhone legt ihr Chaos Forge dafür zuerst über Teilen → „Zum Home-Bildschirm“ ab.",
          en: "Turn on push per device under Settings → “Notifications”: new scenes, game dates, gold and XP then arrive right on your phone. On iPhone, first add Chaos Forge via Share → “Add to Home Screen”.",
        },
      },
    ],
  },
  {
    id: "2026-11-02",
    date: "2026-11-02",
    items: [
      {
        icon: "svenbot",
        title: { de: "SvenBot kennt eure Helden", en: "SvenBot knows your heroes" },
        text: {
          de: "Nennt im Chat einen Helden beim Namen, und Sven kennt seine Werte, Zauber und Ausrüstung – auch bei Folgefragen. Fragt ihr „Wer von uns …?“, vergleicht er die ganze Gruppe. Unter der Antwort steht, wen er kannte.",
          en: "Name a hero in the chat and Sven knows their stats, spells and gear – follow-up questions included. Ask “Which of us …?” and he compares the whole party. The line below each answer shows whom he knew.",
        },
      },
    ],
  },
  {
    id: "2026-10-31",
    date: "2026-10-31",
    items: [
      {
        icon: "svenbot",
        title: { de: "SvenBot lebt!", en: "SvenBot lives!" },
        text: {
          de: "Der Regel-Chat heißt jetzt SvenBot und antwortet als euer Spielleiter: korrekt, kurz und mit einer Prise Häme. Sein Gesicht findet ihr in der Navigation.",
          en: "The rules chat is now SvenBot and answers as your game master: correct, short and with a pinch of gloating. Look for his face in the navigation.",
        },
      },
      {
        icon: "level-up",
        title: { de: "Stufenaufstieg-Assistent", en: "Level-up assistant" },
        text: {
          de: "Genug XP gesammelt? Ein Banner im Charakterbogen und im Spielmodus führt euch durch den Aufstieg: Trefferwürfel eintragen, Diebespunkte verteilen, alle Änderungen auf einen Blick.",
          en: "Earned enough XP? A banner on the character sheet and in play mode guides you through levelling up: enter your hit die roll, spend thief points, see every change at a glance.",
        },
      },
      {
        icon: "effects",
        title: { de: "Temporäre Effekte", en: "Temporary effects" },
        text: {
          de: "Zauber, Gifte, Zustände und Verletzungen lassen sich als Effekt an den Charakter hängen – aus über 30 Vorlagen oder frei. Die Werte rechnen sich automatisch um, temporäre TP inklusive.",
          en: "Spells, poisons, conditions and injuries can be attached to your character as effects — from 30+ templates or your own. Stats update automatically, temporary HP included.",
        },
      },
      {
        icon: "undo",
        title: { de: "Rückgängig & Wiederherstellen", en: "Undo & redo" },
        text: {
          de: "Verklickt? Die Pfeile oben in der Charakterleiste nehmen die letzten Schritte zurück – Schaden, Münzen, Zauber, Effekte und Änderungen am Bogen.",
          en: "Misclicked? The arrows in the character bar take back your last steps — damage, coins, spells, effects and sheet edits.",
        },
      },
      {
        icon: "sprocket",
        title: { de: "Sprockets Kondensator", en: "Sprocket's condenser" },
        text: {
          de: "Übertakten mit Ingenieurskunst-Wurf und Kühlung Stunde für Stunde, Reparatur mit Kupferelixier und Checklisten für Mixturen samt Fundorten.",
          en: "Overclocking with an engineering check and hour-by-hour cooling, repairs with copper elixir and checklists for mixtures including where to find the parts.",
        },
      },
    ],
  },
];

export const LATEST_RELEASE_ID = RELEASES[0].id;
