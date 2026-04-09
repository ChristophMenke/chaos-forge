"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const t = useTranslations("confirm");
  const tcom = useTranslations("common");
  const resolvedConfirmLabel = confirmLabel ?? tcom("delete");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onCancel}
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
      data-testid="confirm-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="mx-4 flex w-full max-w-sm flex-col gap-4 rounded-lg border border-border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-dialog-title" className="font-heading text-xl text-primary">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} data-testid="confirm-cancel">
            {t("cancel")}
          </Button>
          <Button variant="destructive" onClick={onConfirm} data-testid="confirm-delete">
            {resolvedConfirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
