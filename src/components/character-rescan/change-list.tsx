"use client";

/**
 * Die kuratierbare Änderungsliste nach einem Rescan.
 *
 * Hält Auswahl und Nutzer-Eingaben; die Entscheidung, was daraus geschrieben
 * wird, trifft `buildApplyPlan()`. Änderungen sind nach Kategorie gruppiert,
 * riskante Vorschläge starten abgewählt (siehe `defaultSelected` im Diff).
 */

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ScanChange, SelectedChange, ChangeCategory } from "@/lib/scan/character-diff-types";
import { ChangeRow } from "./change-row";

/** Reihenfolge der Gruppen: vom Häufigsten zum Seltensten. */
const CATEGORY_ORDER: ChangeCategory[] = ["core", "lists", "identity", "extended"];

const CATEGORY_LABEL_KEYS: Record<ChangeCategory, string> = {
  core: "categoryCore",
  lists: "categoryLists",
  identity: "categoryIdentity",
  extended: "categoryExtended",
};

/**
 * Eine Gruppe startet offen, wenn sie mindestens eine vorausgewählte Änderung
 * enthält. Was gleich geschrieben wird, ist damit sofort sichtbar; rein
 * riskante Gruppen (nur Entfernungen, nur Stammdaten) bleiben zu, verraten
 * über den Zähler aber, dass dort etwas liegt.
 */
function initiallyOpenCategories(changes: ScanChange[]): Set<ChangeCategory> {
  return new Set(changes.filter((c) => c.defaultSelected).map((c) => c.category));
}

interface RowState {
  selected: boolean;
  /** Nur gesetzt, wenn der Nutzer den Wert angefasst hat. */
  editedValue?: unknown;
}

export interface ChangeListProps {
  changes: ScanChange[];
  onApply: (changes: SelectedChange[]) => void;
  applying?: boolean;
}

export function ChangeList({ changes, onApply, applying = false }: ChangeListProps) {
  const t = useTranslations("rescan");

  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(changes.map((c) => [c.id, { selected: c.defaultSelected }]))
  );
  const [openCategories, setOpenCategories] = useState<Set<ChangeCategory>>(() =>
    initiallyOpenCategories(changes)
  );

  const grouped = useMemo(() => {
    const map = new Map<ChangeCategory, ScanChange[]>();
    for (const change of changes) {
      const list = map.get(change.category) ?? [];
      list.push(change);
      map.set(change.category, list);
    }
    return map;
  }, [changes]);

  const selectedCount = changes.filter((c) => rows[c.id]?.selected).length;

  function setRow(id: string, patch: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function setAllSelected(selected: boolean) {
    setRows((prev) =>
      Object.fromEntries(Object.entries(prev).map(([id, row]) => [id, { ...row, selected }]))
    );
  }

  function toggleCategory(category: ChangeCategory) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  function handleApply() {
    onApply(
      changes.map((change) => ({
        ...change,
        selected: rows[change.id]?.selected ?? false,
        editedValue: rows[change.id]?.editedValue,
      }))
    );
  }

  if (changes.length === 0) {
    return (
      <div
        className="glass glow-neutral rounded-xl p-6 text-center"
        data-testid="rescan-no-changes"
      >
        <p className="text-sm">{t("noChanges")}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t("noChangesHint")}</p>
      </div>
    );
  }

  return (
    <div className="glass glow-neutral rounded-xl p-4 sm:p-6" data-testid="rescan-change-list">
      {/* Kopfzeile: Titel, Zähler, Massenauswahl */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg text-primary">{t("changesTitle")}</h2>
          <p className="text-xs text-muted-foreground">
            <span data-testid="rescan-total-count">{changes.length}</span> {t("changesFound")}
            {" · "}
            <span data-testid="rescan-selected-count">{selectedCount}</span> {t("changesSelected")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAllSelected(true)}
            data-testid="rescan-select-all"
          >
            {t("selectAll")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAllSelected(false)}
            data-testid="rescan-select-none"
          >
            {t("selectNone")}
          </Button>
        </div>
      </div>

      {/* Gruppen */}
      <div className="flex flex-col gap-3">
        {CATEGORY_ORDER.filter((category) => grouped.has(category)).map((category) => {
          const items = grouped.get(category)!;
          const open = openCategories.has(category);
          return (
            <div key={category} data-testid={`rescan-group-${category}`}>
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left text-sm font-medium text-muted-foreground hover:text-foreground"
                aria-expanded={open}
                aria-label={t("toggleCategory")}
                data-testid={`rescan-group-toggle-${category}`}
              >
                {open ? (
                  <ChevronDown className="h-4 w-4" aria-hidden />
                ) : (
                  <ChevronRight className="h-4 w-4" aria-hidden />
                )}
                <span className="flex-1">{t(CATEGORY_LABEL_KEYS[category])}</span>
                <span
                  className="rounded-full bg-muted px-2 py-0.5 text-xs"
                  data-testid={`rescan-group-count-${category}`}
                >
                  {items.length}
                </span>
              </button>

              {open && (
                <div className="mt-1.5 flex flex-col gap-1.5">
                  {items.map((change) => (
                    <ChangeRow
                      key={change.id}
                      change={change}
                      selected={rows[change.id]?.selected ?? false}
                      value={
                        rows[change.id]?.editedValue !== undefined
                          ? rows[change.id].editedValue
                          : change.proposedValue
                      }
                      onToggle={(selected) => setRow(change.id, { selected })}
                      onValueChange={(editedValue) => setRow(change.id, { editedValue })}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Aktion */}
      <div className="mt-5 flex justify-end">
        <Button
          type="button"
          onClick={handleApply}
          disabled={selectedCount === 0 || applying}
          data-testid="rescan-apply-button"
        >
          {applying ? (
            <>
              <Spinner className="mr-2" />
              {t("applying")}
            </>
          ) : selectedCount === 0 ? (
            t("nothingSelected")
          ) : selectedCount === 1 ? (
            t("applyChangesOne")
          ) : (
            t("applyChanges", { count: selectedCount })
          )}
        </Button>
      </div>
    </div>
  );
}
