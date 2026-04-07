"use client";

import { useState, useRef, useCallback, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { AvatarDisplay } from "@/components/avatar-display";
import { uploadAvatar, deleteAvatar, validateFile } from "@/lib/avatar/upload";
import type { CropArea } from "@/lib/avatar/resize";

const Cropper = lazy(() => import("react-easy-crop"));

interface AvatarUploadProps {
  characterId: string;
  userId: string;
  characterName: string;
  currentAvatarUrl: string | null;
  /** Display size in pixels (default 80). */
  size?: number;
  /** Shape variant: "circle" for lists, "square" for character sheet header. */
  variant?: "circle" | "square";
}

export function AvatarUpload({
  characterId,
  userId,
  characterName,
  currentAvatarUrl,
  size = 80,
  variant = "circle",
}: AvatarUploadProps) {
  const router = useRouter();
  const t = useTranslations("avatar");
  const tcom = useTranslations("common");
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  function resetCropState() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setError(null);
  }

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

      // Clean up previous preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

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

    const result = await uploadAvatar(selectedFile, userId, characterId, croppedAreaPixels);
    setUploading(false);

    if (result.error) {
      setError(result.error);
    } else {
      handleClose();
      router.refresh();
    }
  }

  async function handleRemoveAvatar() {
    setUploading(true);
    setError(null);
    try {
      await deleteAvatar(userId, characterId);
      handleClose();
      router.refresh();
    } catch {
      setError("Löschen fehlgeschlagen.");
    }
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelected(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
    // Reset input so re-selecting the same file triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="relative" data-testid="avatar-upload">
      {/* Avatar with hover overlay */}
      <button
        onClick={() => setIsOpen(true)}
        className="group relative cursor-pointer"
        data-testid="avatar-upload-trigger"
      >
        <AvatarDisplay
          name={characterName}
          avatarUrl={currentAvatarUrl}
          size={size}
          variant={variant}
        />
        <div
          className={`absolute inset-0 flex items-center justify-center ${variant === "circle" ? "rounded-full" : "rounded-lg"} bg-black/50 opacity-0 transition-opacity group-hover:opacity-100`}
        >
          <span className="text-xs text-white">{t("change")}</span>
        </div>
      </button>

      {/* Upload / Crop Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={handleClose}
          data-testid="avatar-upload-modal"
        >
          <div
            className="mx-4 flex w-full max-w-md flex-col gap-4 rounded-lg border border-border bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-heading text-xl text-primary">{t("uploadTitle")}</h3>

            {/* Show cropper when a file is selected, otherwise show drop zone */}
            {previewUrl && selectedFile ? (
              <>
                {/* Crop area */}
                <div
                  className="relative h-72 w-full overflow-hidden rounded-md bg-black"
                  data-testid="avatar-crop-area"
                >
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

                {/* Zoom slider */}
                <div className="flex items-center gap-3" data-testid="avatar-zoom-control">
                  <label htmlFor="avatar-zoom" className="text-sm text-muted-foreground">
                    {t("zoom")}
                  </label>
                  <input
                    id="avatar-zoom"
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

                {/* Pick a different file */}
                <button
                  type="button"
                  onClick={() => {
                    resetCropState();
                    fileInputRef.current?.click();
                  }}
                  className="text-sm text-muted-foreground underline"
                  data-testid="avatar-pick-another"
                >
                  {t("pickAnother")}
                </button>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <AvatarDisplay name={characterName} avatarUrl={currentAvatarUrl} size={120} />
                </div>

                {/* Drop Zone */}
                <div
                  className={`flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed p-8 transition-colors ${
                    dragOver ? "border-primary bg-primary/10" : "border-border"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="avatar-dropzone"
                >
                  <p className="text-sm text-muted-foreground">{t("dropzone")}</p>
                  <p className="text-xs text-muted-foreground">{t("formats")}</p>
                </div>
                {currentAvatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={uploading}
                    className="text-sm text-destructive underline hover:text-destructive/80"
                    data-testid="avatar-remove-button"
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
              onChange={handleFileSelect}
              className="hidden"
              data-testid="avatar-file-input"
            />

            {uploading && (
              <p className="text-center text-sm text-muted-foreground">{t("uploading")}</p>
            )}

            {error && (
              <p className="text-sm text-destructive" data-testid="avatar-upload-error">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                style={{ minHeight: 44 }}
                data-testid="avatar-cancel-button"
              >
                {tcom("cancel")}
              </Button>
              {selectedFile && croppedAreaPixels && (
                <Button
                  onClick={handleSaveCrop}
                  disabled={uploading}
                  style={{ minHeight: 44 }}
                  data-testid="avatar-save-crop"
                >
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
