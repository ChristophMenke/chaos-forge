/**
 * Tutorial step definitions per page.
 * Each page referenced by a key (e.g. "dashboard") maps to an array of steps.
 * Target selectors should reference data-testid attributes that exist in the UI.
 *
 * Steps display in order. The last step should point to the chat for further help.
 */

export interface TutorialStep {
  /** CSS selector for the element to highlight. Use data-testid when possible. */
  target?: string;
  titleKey: string; // i18n key under "tutorial.<page>"
  descriptionKey: string;
  /** Position of the tooltip relative to the target. Default "bottom". */
  position?: "top" | "bottom" | "left" | "right";
}

export const TUTORIAL_STEPS: Record<string, TutorialStep[]> = {
  dashboard: [
    {
      titleKey: "dashboard.welcomeTitle",
      descriptionKey: "dashboard.welcomeDesc",
    },
    {
      target: '[data-testid="dashboard-character-grid"]',
      titleKey: "dashboard.charactersTitle",
      descriptionKey: "dashboard.charactersDesc",
      position: "bottom",
    },
    {
      target: '[data-testid="notification-bell"]',
      titleKey: "dashboard.notificationsTitle",
      descriptionKey: "dashboard.notificationsDesc",
      position: "right",
    },
    {
      titleKey: "dashboard.chatTitle",
      descriptionKey: "dashboard.chatDesc",
    },
  ],
  characters: [
    {
      titleKey: "characters.welcomeTitle",
      descriptionKey: "characters.welcomeDesc",
    },
    {
      target: '[data-testid="character-mode-nav"]',
      titleKey: "characters.modesTitle",
      descriptionKey: "characters.modesDesc",
      position: "bottom",
    },
    {
      titleKey: "characters.chatTitle",
      descriptionKey: "characters.chatDesc",
    },
  ],
  party: [
    {
      titleKey: "party.welcomeTitle",
      descriptionKey: "party.welcomeDesc",
    },
    {
      target: '[data-testid="party-gold-panel"]',
      titleKey: "party.goldTitle",
      descriptionKey: "party.goldDesc",
      position: "bottom",
    },
    {
      target: '[data-testid="party-items-panel"]',
      titleKey: "party.itemsTitle",
      descriptionKey: "party.itemsDesc",
      position: "top",
    },
    {
      titleKey: "party.chatTitle",
      descriptionKey: "party.chatDesc",
    },
  ],
  chronicle: [
    {
      titleKey: "chronicle.welcomeTitle",
      descriptionKey: "chronicle.welcomeDesc",
    },
    {
      target: '[data-testid="chronicle-npcs"]',
      titleKey: "chronicle.npcsTitle",
      descriptionKey: "chronicle.npcsDesc",
      position: "left",
    },
    {
      target: '[data-testid="chronicle-quotes"]',
      titleKey: "chronicle.quotesTitle",
      descriptionKey: "chronicle.quotesDesc",
      position: "right",
    },
    {
      titleKey: "chronicle.chatTitle",
      descriptionKey: "chronicle.chatDesc",
    },
  ],
};

export type TutorialPage = keyof typeof TUTORIAL_STEPS;

const STORAGE_KEY = "chaos-forge-tutorial-dismissed";

export function isTutorialDismissed(page: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const obj = JSON.parse(raw) as Record<string, boolean>;
    return obj[page] === true;
  } catch {
    return false;
  }
}

export function dismissTutorial(page: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const obj = (raw ? (JSON.parse(raw) as Record<string, boolean>) : {}) as Record<
      string,
      boolean
    >;
    obj[page] = true;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    /* noop */
  }
}

export function resetTutorials(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
