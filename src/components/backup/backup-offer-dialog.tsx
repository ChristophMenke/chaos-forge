"use client";

import { HardDriveDownload } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BackupPanel } from "./backup-panel";

/** "Save a backup?" — shown to the admin after saving a session text. */
export function BackupOfferDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean, ...rest: unknown[]) => void;
}) {
  const t = useTranslations("backup");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="backup-offer-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-lg">
            <HardDriveDownload className="h-5 w-5 text-primary" />
            {t("offerTitle")}
          </DialogTitle>
          <DialogDescription>{t("offerText")}</DialogDescription>
        </DialogHeader>
        <BackupPanel />
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>{t("later")}</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
