"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Cropper from "react-easy-crop";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CropArea } from "@/lib/avatar/resize";

interface AvatarCropDialogProps {
  file: File | null;
  onCancel: () => void;
  onConfirm: (crop: CropArea) => Promise<void> | void;
  busy?: boolean;
}

export function AvatarCropDialog({ file, onCancel, onConfirm, busy }: AvatarCropDialogProps) {
  return (
    <Dialog open={file !== null} onOpenChange={(open) => !open && !busy && onCancel()}>
      {file && (
        <CropBody file={file} onCancel={onCancel} onConfirm={onConfirm} busy={busy ?? false} />
      )}
    </Dialog>
  );
}

interface CropBodyProps {
  file: File;
  onCancel: () => void;
  onConfirm: (crop: CropArea) => Promise<void> | void;
  busy: boolean;
}

function CropBody({ file, onCancel, onConfirm, busy }: CropBodyProps) {
  const t = useTranslations("settings");
  const imageUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<CropArea | null>(null);

  useEffect(() => () => URL.revokeObjectURL(imageUrl), [imageUrl]);

  const onCropComplete = useCallback((_: unknown, areaPixels: CropArea) => {
    setCroppedArea(areaPixels);
  }, []);

  async function handleConfirm() {
    if (!croppedArea) return;
    await onConfirm(croppedArea);
  }

  return (
    <DialogContent className="sm:max-w-md" data-testid="avatar-crop-dialog">
      <DialogHeader>
        <DialogTitle>{t("avatarCropTitle")}</DialogTitle>
      </DialogHeader>

      <div className="relative h-64 w-full overflow-hidden rounded-md bg-black/40">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor="avatar-crop-zoom" className="text-xs text-muted-foreground">
          {t("avatarCropZoom")}
        </label>
        <input
          id="avatar-crop-zoom"
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-primary"
          data-testid="avatar-crop-zoom"
        />
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onCancel} disabled={busy} data-testid="avatar-crop-cancel">
          {t("cancel")}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={busy || !croppedArea}
          data-testid="avatar-crop-confirm"
        >
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("avatarCropConfirm")}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
