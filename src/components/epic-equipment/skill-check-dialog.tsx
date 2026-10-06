"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** „+2“, „−1“ (echtes Minuszeichen) oder leer für 0. */
export function formatModifier(modifier: number): string {
  if (modifier === 0) return "";
  return modifier > 0 ? `+${modifier}` : `−${Math.abs(modifier)}`;
}

/**
 * Probe als Text: „Ingenieurskunst 11 (−1)“ mit Zielwert (enthält den
 * Modifikator schon), sonst „Ingenieurskunst (−1)“ bzw. nur der Name.
 */
export function formatCheck(skill: string, modifier: number, target?: number | null): string {
  const mod = formatModifier(modifier);
  const value = target != null ? ` ${target}` : "";
  return `${skill}${value}${mod ? ` (${mod})` : ""}`;
}

interface SkillCheckDialogProps {
  open: boolean;
  title: string;
  /** Probe, z. B. aus formatCheck(). */
  check: string;
  /** Hinweise, was passiert (Heilung, Folgen eines Fehlschlags). */
  hints?: string[];
  /** Zusätzliche Eingaben, z. B. „Kupferelixier verwenden“. */
  children?: ReactNode;
  onResult: (success: boolean) => void;
  onCancel: () => void;
}

/**
 * Der Spieler würfelt selbst und meldet das Ergebnis – die App würfelt nicht.
 */
export function SkillCheckDialog({
  open,
  title,
  check,
  hints = [],
  children,
  onResult,
  onCancel,
}: SkillCheckDialogProps) {
  const t = useTranslations("epic");
  const tcom = useTranslations("common");

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent showCloseButton={false} data-testid="skill-check-dialog">
        <DialogHeader>
          <DialogTitle className="text-lg text-primary">{title}</DialogTitle>
          <DialogDescription data-testid="skill-check-roll">
            {t("checkRoll", { check })}
          </DialogDescription>
        </DialogHeader>
        {hints.map((hint) => (
          <p key={hint} className="text-sm text-muted-foreground">
            {hint}
          </p>
        ))}
        {children}
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} data-testid="skill-check-cancel">
            {tcom("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => onResult(false)}
            data-testid="skill-check-failure"
          >
            {t("checkFailure")}
          </Button>
          <Button onClick={() => onResult(true)} data-testid="skill-check-success">
            {t("checkSuccess")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
