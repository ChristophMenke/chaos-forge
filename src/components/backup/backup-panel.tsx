"use client";

import { useState } from "react";
import { CheckCircle2, Download, Loader2, Share, TriangleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { buildBackup, type BackupPhase, type BuiltBackup } from "@/lib/backup/build-backup";

type State =
  | { kind: "idle" }
  | { kind: "building"; phase: BackupPhase; done: number; total: number }
  | { kind: "ready"; backup: BuiltBackup; file: File; canShare: boolean }
  | { kind: "error" };

function formatSize(bytes: number, locale: string): string {
  const mb = bytes / (1024 * 1024);
  return `${new Intl.NumberFormat(locale === "en" ? "en-US" : "de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(mb)} MB`;
}

function canShareFile(file: File): boolean {
  return typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [file] });
}

/**
 * Admin backup in two taps: build the ZIP (data + uploaded images), then save
 * it — via the share sheet ("Save to Files" → iCloud Drive) where files can be
 * shared, otherwise as a download. Two steps because Safari only opens the
 * share sheet right after a tap, and building takes a few seconds.
 */
export function BackupPanel() {
  const t = useTranslations("backup");
  const locale = useLocale();
  const [state, setState] = useState<State>({ kind: "idle" });

  async function create() {
    setState({ kind: "building", phase: "data", done: 0, total: 0 });
    try {
      const backup = await buildBackup({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        onProgress: (phase, done, total) => setState({ kind: "building", phase, done, total }),
      });
      const file = new File([backup.zip as Uint8Array<ArrayBuffer>], backup.fileName, {
        type: "application/zip",
      });
      setState({ kind: "ready", backup, file, canShare: canShareFile(file) });
    } catch (error) {
      console.error("[Backup] build failed:", error);
      setState({ kind: "error" });
    }
  }

  async function share(file: File) {
    try {
      // Files only: with title/text, iOS sometimes drops "Save to Files".
      await navigator.share({ files: [file] });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("[Backup] share failed:", error);
      setState({ kind: "error" });
    }
  }

  async function download(file: File) {
    const { saveAs } = await import("file-saver");
    saveAs(file, file.name);
  }

  if (state.kind === "idle") {
    return (
      <Button onClick={create} data-testid="backup-create">
        {t("create")}
      </Button>
    );
  }

  if (state.kind === "building") {
    const label =
      state.phase === "data"
        ? t("loadingData")
        : state.phase === "images"
          ? t("loadingImages", { done: state.done, total: state.total })
          : t("zipping");
    return (
      <p
        className="flex items-center gap-2 text-sm text-muted-foreground"
        role="status"
        data-testid="backup-progress"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {label}
      </p>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="space-y-2" data-testid="backup-error">
        <p className="flex items-center gap-2 text-sm text-destructive" role="alert">
          <TriangleAlert className="h-4 w-4" />
          {t("error")}
        </p>
        <Button variant="outline" onClick={create}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  const { backup, file, canShare } = state;
  return (
    <div className="space-y-3" data-testid="backup-ready">
      <p className="flex items-center gap-2 text-sm text-foreground">
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        {t("ready", { name: backup.fileName, size: formatSize(file.size, locale) })}
      </p>
      {backup.failedImages.length > 0 && (
        <p className="text-xs text-amber-400">
          {t("failedImages", { count: backup.failedImages.length })}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => download(file)}>
          <Download className="h-4 w-4" />
          {t("download")}
        </Button>
        {canShare && (
          <Button onClick={() => share(file)}>
            <Share className="h-4 w-4" />
            {t("share")}
          </Button>
        )}
      </div>
    </div>
  );
}
