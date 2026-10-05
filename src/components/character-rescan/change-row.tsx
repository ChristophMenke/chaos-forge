"use client";

/**
 * Eine Zeile der Rescan-Review-Liste: Auswahl, Vorher/Nachher, Herkunft und —
 * falls gedruckter und handschriftlicher Wert auseinandergehen — ein
 * Umschalter zwischen beiden.
 */

import { useTranslations, useLocale } from "next-intl";
import { Input } from "@/components/ui/input";
import { localized } from "@/lib/utils/localize";
import { CLASSES } from "@/lib/rules/classes";
import { FIGHTING_STYLES } from "@/lib/rules/fighting-styles";
import { Keyboard, PenLine, Plus, Minus, ArrowRight, Info } from "lucide-react";
import type { ScanChange } from "@/lib/scan/character-diff-types";

export interface ChangeRowProps {
  change: ScanChange;
  selected: boolean;
  /** Aktueller Zielwert — Nutzer-Eingabe oder Scan-Vorschlag. */
  value: unknown;
  onToggle: (selected: boolean) => void;
  onValueChange: (value: unknown) => void;
}

/**
 * Übersetzt technische IDs in lesbare Namen. Klassen und Kampfstile kommen
 * als ID aus dem Diff, weil dieser bewusst keine Lokalisierung kennt.
 */
function useLabelText(change: ScanChange): string {
  const locale = useLocale();
  const raw = change.labelText ?? "";
  if (!raw) return "";

  const classDef = CLASSES[raw as keyof typeof CLASSES];
  if (classDef) return localized(classDef.name, classDef.name_en, locale);

  const styleDef = FIGHTING_STYLES[raw];
  if (styleDef) return localized(styleDef.name, styleDef.name_en, locale);

  return raw;
}

function KindIcon({ kind }: { kind: ScanChange["kind"] }) {
  if (kind === "list-add") return <Plus className="h-3.5 w-3.5 text-emerald-400" aria-hidden />;
  if (kind === "list-remove") return <Minus className="h-3.5 w-3.5 text-destructive" aria-hidden />;
  return <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />;
}

export function ChangeRow({ change, selected, value, onToggle, onValueChange }: ChangeRowProps) {
  const t = useTranslations("rescan");
  const labelText = useLabelText(change);
  const testId = `rescan-change-${change.id}`;

  const label = change.labelKey.startsWith("field.")
    ? t(change.labelKey)
    : t(change.labelKey, { name: labelText });

  const isPrintedActive = change.conflict ? value === change.conflict.printed : false;

  function handleEdit(raw: string) {
    const next = change.valueType === "number" ? Number(raw) : raw;
    onValueChange(Number.isNaN(next as number) ? 0 : next);
    // Wer einen Wert anpasst, will ihn übernehmen — sonst geht die Eingabe
    // stillschweigend verloren.
    if (!selected) onToggle(true);
  }

  function toggleConflictSource() {
    if (!change.conflict) return;
    onValueChange(isPrintedActive ? change.conflict.handwritten : change.conflict.printed);
    if (!selected) onToggle(true);
  }

  return (
    <div
      className="rounded-lg border border-border/40 bg-background/20 px-3 py-2 transition-colors hover:bg-background/40"
      data-testid={testId}
    >
      {/* Auf schmalen Viewports stapeln sich Label und Werte — sonst quetscht
          die Wertespalte das Label auf ein einzelnes Zeichen zusammen, und
          genau am Handy wird der Bogen abfotografiert. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
        <span className="flex min-w-0 flex-1 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onToggle(e.target.checked)}
            className="h-4 w-4 shrink-0 rounded"
            aria-label={label}
            data-testid={`${testId}-checkbox`}
          />
          <KindIcon kind={change.kind} />
          <span className="truncate" data-testid={`${testId}-label`}>
            {label}
          </span>
        </span>

        {/* Vorher → Nachher */}
        <span className="flex items-center gap-2 pl-6 text-sm sm:pl-0">
          {change.kind !== "list-add" && (
            <span
              className="text-muted-foreground line-through decoration-muted-foreground/40"
              data-testid={`${testId}-current`}
            >
              {formatValue(change.currentValue, t("valueEmpty"))}
            </span>
          )}

          {change.valueType === "none" ? (
            change.kind !== "list-remove" && (
              <span className="font-medium text-primary" data-testid={`${testId}-value`}>
                {formatValue(value, t("valueEmpty"))}
              </span>
            )
          ) : (
            <Input
              type={change.valueType === "number" ? "number" : "text"}
              value={value === null || value === undefined ? "" : String(value)}
              onChange={(e) => handleEdit(e.target.value)}
              className={`h-8 text-sm ${change.valueType === "number" ? "w-24" : "w-full sm:w-48"}`}
              aria-label={label}
              data-testid={`${testId}-input`}
            />
          )}

          <span
            className="ml-auto flex shrink-0 items-center gap-1 text-xs text-muted-foreground sm:ml-0"
            title={
              change.source === "handwritten"
                ? t("sourceHandwrittenTitle")
                : t("sourcePrintedTitle")
            }
            data-testid={`${testId}-source`}
          >
            {change.source === "handwritten" ? (
              <PenLine className="h-3 w-3" aria-hidden />
            ) : (
              <Keyboard className="h-3 w-3" aria-hidden />
            )}
            {change.source === "handwritten" ? t("sourceHandwritten") : t("sourcePrinted")}
          </span>
        </span>
      </div>

      {change.conflict && (
        <div
          className="mt-1.5 flex flex-wrap items-center gap-2 pl-7 text-xs text-amber-200/80"
          data-testid={`${testId}-conflict`}
        >
          <span>
            {t("conflictHint", {
              printed: formatValue(change.conflict.printed, "—"),
              handwritten: formatValue(change.conflict.handwritten, "—"),
            })}
          </span>
          <button
            type="button"
            onClick={toggleConflictSource}
            className="rounded border border-amber-700/40 px-1.5 py-0.5 text-amber-200 hover:bg-amber-950/40"
            data-testid={`${testId}-conflict-toggle`}
          >
            {isPrintedActive ? t("useHandwritten") : t("usePrinted")}
          </button>
        </div>
      )}

      {change.noteKey && (
        <p
          className="mt-1.5 flex items-center gap-1.5 pl-7 text-xs text-muted-foreground"
          data-testid={`${testId}-note`}
        >
          <Info className="h-3 w-3 shrink-0" aria-hidden />
          {t(change.noteKey)}
        </p>
      )}
    </div>
  );
}

function formatValue(value: unknown, emptyLabel: string): string {
  if (value === null || value === undefined || value === "") return emptyLabel;
  if (typeof value === "boolean") return value ? "✓" : "✗";
  if (Array.isArray(value)) return String(value.length);
  return String(value);
}
