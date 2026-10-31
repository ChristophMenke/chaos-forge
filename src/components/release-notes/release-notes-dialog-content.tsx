"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Release } from "@/lib/release-notes";
import { ReleaseNotesList } from "./release-notes-list";

/**
 * The dialog itself — loaded on demand by ReleaseNotesDialog, so pages without
 * unseen releases never ship it. Every way of closing (button, link, X,
 * Escape, click outside) goes through onOpenChange → onDismiss.
 */
export function ReleaseNotesDialogContent({
  releases,
  onDismiss,
}: {
  releases: Release[];
  onDismiss: () => void;
}) {
  const t = useTranslations("releaseNotes");

  return (
    <Dialog open onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent
        className="max-h-[85dvh] overflow-y-auto sm:max-w-lg"
        data-testid="release-notes-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("dialogTitle")}
          </DialogTitle>
        </DialogHeader>

        <ReleaseNotesList releases={releases} />

        <DialogFooter className="items-center sm:justify-between">
          <DialogClose
            render={<Link href="/settings" />}
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t("allNotesLink")}
          </DialogClose>
          <DialogClose render={<Button />}>{t("confirm")}</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
