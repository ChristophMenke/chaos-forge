"use client";

import { useTranslations } from "next-intl";
import { Redo2, Undo2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { UndoLabel } from "@/lib/undo/types";
import { useUndo } from "./undo-context";

/** ↶ / ↷ for the character mode bar; renders nothing without a provider. */
export function UndoButtons() {
  const undo = useUndo();
  const t = useTranslations("undo");
  if (!undo) return null;

  const text = (l: UndoLabel) => t(`labels.${l.key}` as never, l.values as never);
  const buttons = [
    {
      id: "undo",
      Icon: Undo2,
      label: undo.undoLabel ? t("undoAction", { label: text(undo.undoLabel) }) : t("nothingToUndo"),
      enabled: Boolean(undo.undoLabel),
      onClick: undo.undo,
    },
    {
      id: "redo",
      Icon: Redo2,
      label: undo.redoLabel ? t("redoAction", { label: text(undo.redoLabel) }) : t("nothingToRedo"),
      enabled: Boolean(undo.redoLabel),
      onClick: undo.redo,
    },
  ];

  return (
    <div className="flex items-center gap-1 border-l border-border/50 pl-1">
      {buttons.map(({ id, Icon, label, enabled, onClick }) => (
        <Tooltip key={id}>
          <TooltipTrigger
            render={<button type="button" disabled={!enabled || undo.busy} />}
            onClick={() => void onClick()}
            aria-label={label}
            className="flex items-center rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            data-testid={`${id}-button`}
          >
            <Icon className="h-3.5 w-3.5 lg:h-4 lg:w-4" aria-hidden />
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
