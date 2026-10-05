"use client";

/**
 * Datei-Auswahl für den Rescan: Dropzone, Vorschau-Kacheln, Präzisions-Schalter
 * und Scan-Auslöser. Bewusst von der Orchestrierung getrennt, damit
 * `rescan-view.tsx` nur noch den Ablauf beschreibt.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { validateImportFiles } from "@/app/characters/import/import-validation";

interface FilePreview {
  file: File;
  /** null bei PDFs — die bekommen eine Platzhalter-Kachel. */
  previewUrl: string | null;
}

export interface ScanUploadPanelProps {
  scanning: boolean;
  onScan: (files: File[], preciseMode: boolean) => void;
  onError: (message: string) => void;
}

export function ScanUploadPanel({ scanning, onScan, onError }: ScanUploadPanelProps) {
  const t = useTranslations("rescan");
  const tImport = useTranslations("import");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [preciseMode, setPreciseMode] = useState(false);

  // Ref auf den aktuellen Stand, damit das Unmount-Cleanup ihn erreicht, ohne
  // bei jeder Änderung neu zu registrieren (React-Compiler-konform).
  const previewsRef = useRef(previews);
  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      for (const p of previewsRef.current) {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      }
    };
  }, []);

  const validate = useCallback(
    (files: File[]): string | null => {
      const result = validateImportFiles(files);
      return !result.valid && result.errorKey ? tImport(result.errorKey, result.errorParams) : null;
    },
    [tImport]
  );

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;

    const error = validate([...previews.map((p) => p.file), ...selected]);
    if (error) {
      onError(error);
      return;
    }

    setPreviews((prev) => [
      ...prev,
      ...selected.map((file) => ({
        file,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      })),
    ]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(index: number) {
    setPreviews((prev) => {
      const removed = prev[index];
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  return (
    <div className="flex flex-col gap-4" data-testid="rescan-upload-panel">
      <div
        className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed border-border p-10 transition-colors hover:border-primary/50"
        onClick={() => fileInputRef.current?.click()}
        data-testid="rescan-dropzone"
      >
        {previews.length === 0 ? (
          <>
            <p className="text-muted-foreground">{t("dropzone")}</p>
            <p className="text-xs text-muted-foreground/70">{t("dropzoneHint")}</p>
          </>
        ) : (
          <p className="text-sm text-primary">
            {tImport("filesSelected", { count: previews.length })}
          </p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          onChange={handleSelect}
          className="hidden"
          data-testid="rescan-file-input"
        />
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {previews.map((preview, index) => (
            <div
              key={`${preview.file.name}-${index}`}
              className="relative flex flex-col items-center gap-2 rounded-md border border-border p-2"
              data-testid={`rescan-preview-${index}`}
            >
              {preview.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.previewUrl}
                  alt={preview.file.name}
                  className="h-24 w-full rounded object-cover"
                />
              ) : (
                <div className="flex h-24 w-full items-center justify-center rounded bg-muted text-sm font-medium text-primary">
                  PDF
                </div>
              )}
              <p className="w-full truncate text-center text-xs text-muted-foreground">
                {preview.file.name}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground shadow-sm hover:bg-destructive/80"
                aria-label={tImport("removeFile")}
                data-testid={`rescan-remove-file-${index}`}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {previews.length > 0 && (
        <div className="flex flex-col items-center gap-3">
          <label className="flex items-center gap-2 text-sm" data-testid="rescan-precise-toggle">
            <input
              type="checkbox"
              checked={preciseMode}
              onChange={(e) => setPreciseMode(e.target.checked)}
              className="rounded"
            />
            <span className="text-muted-foreground">{t("preciseMode")}</span>
          </label>
          <Button
            onClick={() =>
              onScan(
                previews.map((p) => p.file),
                preciseMode
              )
            }
            disabled={scanning}
            data-testid="rescan-scan-button"
          >
            {scanning ? (
              <>
                <Spinner className="mr-2" />
                {t("scanning")}
              </>
            ) : (
              t("scanButton")
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
