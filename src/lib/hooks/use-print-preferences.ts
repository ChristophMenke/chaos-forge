"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { PrintPreferences, PrintSectionId } from "@/lib/print-config";
import {
  DEFAULT_PRINT_PREFERENCES,
  loadPrintPreferences,
  savePrintPreferences,
} from "@/lib/print-config";

let currentPrefs: PrintPreferences = DEFAULT_PRINT_PREFERENCES;
let currentCharId: string | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): PrintPreferences {
  return currentPrefs;
}

function getServerSnapshot(): PrintPreferences {
  return DEFAULT_PRINT_PREFERENCES;
}

function initForCharacter(characterId: string) {
  if (currentCharId !== characterId) {
    currentCharId = characterId;
    currentPrefs = loadPrintPreferences(characterId);
    notify();
  }
}

function updateAndPersist(characterId: string, prefs: PrintPreferences) {
  currentPrefs = prefs;
  savePrintPreferences(characterId, prefs);
  notify();
}

export function usePrintPreferences(characterId: string) {
  initForCharacter(characterId);

  const preferences = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const moveSection = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (toIndex < 0 || toIndex >= currentPrefs.sections.length) return;
      const newSections = [...currentPrefs.sections];
      const [moved] = newSections.splice(fromIndex, 1);
      newSections.splice(toIndex, 0, moved);
      updateAndPersist(characterId, { sections: newSections });
    },
    [characterId]
  );

  const toggleSection = useCallback(
    (sectionId: PrintSectionId) => {
      const newSections = currentPrefs.sections.map((s) =>
        s.id === sectionId ? { ...s, visible: !s.visible } : s
      );
      updateAndPersist(characterId, { sections: newSections });
    },
    [characterId]
  );

  const resetPreferences = useCallback(() => {
    updateAndPersist(characterId, DEFAULT_PRINT_PREFERENCES);
  }, [characterId]);

  return { preferences, moveSection, toggleSection, resetPreferences };
}
