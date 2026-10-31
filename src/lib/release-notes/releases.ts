/**
 * Release notes shown once per release (dialog) and in Settings → "What's new".
 *
 * Adding a release: put a new entry at the TOP. The id is the release day
 * (YYYY-MM-DD, group calendar); a second release on the same day gets "-2" …
 * "-9" so the ids keep sorting correctly as strings. Players whose account was
 * created on or after that day won't get the dialog for it.
 */

export type ReleaseIcon = "svenbot" | "level-up" | "effects" | "undo" | "sprocket";

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
