"use client";

import { useState, useRef, useCallback, useEffect, lazy, Suspense } from "react";
import { useTranslations } from "next-intl";
import type { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { AvatarDisplay } from "@/components/avatar-display";
import { validateFile } from "@/lib/avatar/upload";
import { uploadNpcAvatar, deleteNpcAvatar } from "@/lib/avatar/npc-upload";
import type { CropArea } from "@/lib/avatar/resize";

const Cropper = lazy(() => import("react-easy-crop"));

interface NpcAvatarUploadProps {
  npcId: string;
  npcName: string;
  currentAvatarUrl: string | null;
  onUploaded: (url: string | null) => void;
}

export function NpcAvatarUpload({
  npcId,
  npcName,
  currentAvatarUrl,
  onUploaded,
}: NpcAvatarUploadProps) {
  const t = useTranslations("avatar");
  const tcom = useTranslations("common");
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  function resetCropState() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setError(null);
  }

  // Clean up object URL on unmount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    []
  );

  function handleClose() {
    resetCropState();
    setIsOpen(false);
  }

  const handleFileSelected = useCallback(
    (file: File) => {
      setError(null);
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    },
    [previewUrl]
  );

  async function handleSaveCrop() {
    if (!selectedFile || !croppedAreaPixels) return;
    setUploading(true);
    setError(null);

    const result = await uploadNpcAvatar(selectedFile, npcId, croppedAreaPixels);
    setUploading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.url) {
      onUploaded(result.url);
      handleClose();
    }
  }

  async function handleRemove() {
    setUploading(true);
    try {
      await deleteNpcAvatar(npcId);
      onUploaded(null);
      handleClose();
    } catch {
      setError("Löschen fehlgeschlagen.");
    }
    setUploading(false);
  }

  return (
    <div data-testid="npc-avatar-upload">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group relative cursor-pointer"
        data-testid="npc-avatar-trigger"
      >
        <AvatarDisplay name={npcName} avatarUrl={currentAvatarUrl} size={64} />
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="text-[10px] text-white">{t("change")}</span>
        </div>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-label={t("uploadTitle")}
          onClick={handleClose}
          onKeyDown={(e) => e.key === "Escape" && handleClose()}
          data-testid="npc-avatar-modal"
        >
          <div
            className="mx-4 flex w-full max-w-md flex-col gap-4 rounded-lg border border-border bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-heading text-xl text-primary">{t("uploadTitle")}</h3>

            {previewUrl && selectedFile ? (
              <>
                <div className="relative h-72 w-full overflow-hidden rounded-md bg-black">
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    }
                  >
                    <Cropper
                      image={previewUrl}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                  </Suspense>
                </div>
                <div className="flex items-center gap-3">
                  <label htmlFor="npc-avatar-zoom" className="text-sm text-muted-foreground">
                    {t("zoom")}
                  </label>
                  <input
                    id="npc-avatar-zoom"
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer accent-primary"
                    style={{ minHeight: 44 }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetCropState();
                    fileInputRef.current?.click();
                  }}
                  className="text-sm text-muted-foreground underline"
                >
                  {t("pickAnother")}
                </button>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <AvatarDisplay name={npcName} avatarUrl={currentAvatarUrl} size={120} />
                </div>
                <div
                  className={`flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed p-8 transition-colors ${dragOver ? "border-primary bg-primary/10" : "border-border"}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handleFileSelected(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <p className="text-sm text-muted-foreground">{t("dropzone")}</p>
                  <p className="text-xs text-muted-foreground">{t("formats")}</p>
                </div>
                {currentAvatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={uploading}
                    className="text-sm text-destructive underline hover:text-destructive/80"
                    data-testid="npc-avatar-remove"
                  >
                    {t("remove")}
                  </button>
                )}
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelected(file);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="hidden"
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} style={{ minHeight: 44 }}>
                {tcom("cancel")}
              </Button>
              {selectedFile && croppedAreaPixels && (
                <Button onClick={handleSaveCrop} disabled={uploading} style={{ minHeight: 44 }}>
                  {uploading ? tcom("saving") : tcom("save")}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
