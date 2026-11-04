"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ImagePlus, Images, Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { GlassCard } from "@/components/glass-card";
import { createClient } from "@/lib/supabase/client";
import { GALLERY_BUCKET, galleryPublicUrl } from "@/lib/gallery/paths";
import { neighbourFor } from "@/lib/gallery/order";
import { createImageVariants } from "@/lib/gallery/image-variants";
import { uploadGalleryFiles, type UploadProgress } from "@/lib/gallery/upload";
import {
  deleteGalleryImage,
  moveGalleryImage,
  prepareGalleryUpload,
  registerGalleryImages,
  updateGalleryImage,
} from "@/app/master/gallery-actions";
import type { GalleryImageRow } from "@/lib/supabase/types";

/** Server batch limit of prepareGalleryUpload. */
const MAX_BATCH = 20;

interface MasterGalleryPanelProps {
  initialImages: GalleryImageRow[];
}

function sortTopFirst(images: GalleryImageRow[]): GalleryImageRow[] {
  return [...images].sort((a, b) => b.sort_order - a.sort_order);
}

export function MasterGalleryPanel({ initialImages }: MasterGalleryPanelProps) {
  const t = useTranslations("master");
  const tcom = useTranslations("common");
  const locale = useLocale();
  const [images, setImages] = useState(() => sortTopFirst(initialImages));
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<GalleryImageRow | null>(null);
  const [deleting, setDeleting] = useState<GalleryImageRow | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList) {
    const files = Array.from(fileList).slice(0, MAX_BATCH);
    if (fileList.length > MAX_BATCH) {
      toast.warning(t("galleryTooMany", { max: MAX_BATCH }));
    }
    if (files.length === 0) return;

    const storage = createClient().storage.from(GALLERY_BUCKET);
    try {
      const { registered, failed } = await uploadGalleryFiles(
        files,
        {
          createVariants: createImageVariants,
          prepare: async (count) => {
            const res = await prepareGalleryUpload(count);
            if (!res.success) throw new Error(res.error);
            return res.uploads;
          },
          upload: async (path, token, blob) => {
            const { error } = await storage.uploadToSignedUrl(path, token, blob, {
              contentType: "image/webp",
            });
            if (error) throw error;
          },
          register: async (items) => {
            const res = await registerGalleryImages(items);
            if (!res.success) throw new Error(res.error);
            return res;
          },
        },
        setProgress
      );

      if (registered) setImages((prev) => sortTopFirst([...registered.images, ...prev]));
      const uploaded = files.length - failed.length;
      if (failed.length === 0) {
        toast.success(t("galleryUploaded", { count: uploaded }));
      } else {
        toast.error(
          t("galleryUploadPartial", {
            done: uploaded,
            total: files.length,
            files: failed.join(", "),
          })
        );
      }
    } catch (error) {
      console.error("[gallery] upload aborted", error);
      toast.error(t("galleryUploadFailed"));
    } finally {
      setProgress(null);
    }
  }

  async function handleMove(image: GalleryImageRow, direction: "up" | "down") {
    setBusyId(image.id);
    const res = await moveGalleryImage(image.id, direction);
    setBusyId(null);
    if (res.success) setImages(sortTopFirst(res.images));
    else toast.error(t("gallerySaveFailed"));
  }

  async function handleDelete() {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    setBusyId(target.id);
    const res = await deleteGalleryImage(target.id);
    setBusyId(null);
    if (res.success) {
      setImages((prev) => prev.filter((img) => img.id !== target.id));
      toast.success(t("galleryDeleted"));
    } else {
      toast.error(t("galleryDeleteFailed"));
    }
  }

  const uploading = progress !== null;
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <div className="space-y-4" data-testid="gm-gallery-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-foreground">
          <Images className="h-5 w-5 text-primary" />
          {t("galleryTitle")}
        </h2>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          data-testid="gm-gallery-upload"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          {t("galleryUpload")}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void handleFiles(e.target.files);
            e.target.value = "";
          }}
          data-testid="gm-gallery-file-input"
        />
      </div>

      {progress && (
        <div className="space-y-1" role="status" data-testid="gm-gallery-progress">
          <p className="text-sm text-muted-foreground">
            {t("galleryProgress", { done: progress.done, total: progress.total })}
            {progress.current && <span className="ml-2 truncate">{progress.current}</span>}
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {images.length === 0 ? (
        <GlassCard hover={false} className="p-6 text-center text-muted-foreground">
          <p data-testid="gm-gallery-empty">{t("galleryEmpty")}</p>
        </GlassCard>
      ) : (
        <ul className="space-y-2">
          {images.map((image) => {
            const busy = busyId === image.id;
            return (
              <li key={image.id} data-testid="gm-gallery-item" data-image-id={image.id}>
                <GlassCard hover={false} className="flex items-center gap-3 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={galleryPublicUrl(image.thumb_path)}
                    alt={image.title ?? t("galleryUntitled")}
                    loading="lazy"
                    className="h-16 w-24 shrink-0 rounded-md bg-black/40 object-cover sm:h-20 sm:w-28"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate font-heading font-semibold ${
                        image.title ? "text-foreground" : "italic text-muted-foreground"
                      }`}
                    >
                      {image.title ?? t("galleryUntitled")}
                    </p>
                    {image.description && (
                      <p className="line-clamp-1 text-sm text-muted-foreground">
                        {image.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t("galleryUploadedAt", {
                        date: dateFormat.format(new Date(image.created_at)),
                      })}
                    </p>
                  </div>
                  <div className="grid shrink-0 grid-cols-2 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => void handleMove(image, "up")}
                      disabled={busy || neighbourFor(images, image.id, "up") === null}
                      aria-label={t("galleryMoveUp")}
                      data-testid="gm-gallery-up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => void handleMove(image, "down")}
                      disabled={busy || neighbourFor(images, image.id, "down") === null}
                      aria-label={t("galleryMoveDown")}
                      data-testid="gm-gallery-down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditing(image)}
                      disabled={busy}
                      aria-label={t("galleryEdit")}
                      data-testid="gm-gallery-edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleting(image)}
                      disabled={busy}
                      aria-label={tcom("delete")}
                      className="text-destructive hover:text-destructive"
                      data-testid="gm-gallery-delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </GlassCard>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <EditImageDialog
          image={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setImages((prev) => prev.map((img) => (img.id === updated.id ? updated : img)));
            setEditing(null);
          }}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={t("galleryDeleteTitle")}
        message={t("galleryDeleteMessage")}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function EditImageDialog({
  image,
  onClose,
  onSaved,
}: {
  image: GalleryImageRow;
  onClose: () => void;
  onSaved: (image: GalleryImageRow) => void;
}) {
  const t = useTranslations("master");
  const tcom = useTranslations("common");
  const [title, setTitle] = useState(image.title ?? "");
  const [description, setDescription] = useState(image.description ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await updateGalleryImage(image.id, {
      title: title.trim() || null,
      description: description.trim() || null,
    });
    setSaving(false);
    if (res.success) {
      toast.success(t("gallerySaved"));
      onSaved(res.image);
    } else {
      toast.error(t("gallerySaveFailed"));
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent data-testid="gm-gallery-edit-dialog">
        <DialogHeader>
          <DialogTitle>{t("galleryEditTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="gm-gallery-title">{t("galleryFieldTitle")}</Label>
            <Input
              id="gm-gallery-title"
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("galleryFieldTitlePlaceholder")}
              data-testid="gm-gallery-edit-title"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="gm-gallery-description">{t("galleryFieldDescription")}</Label>
            <textarea
              id="gm-gallery-description"
              value={description}
              maxLength={2000}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("galleryFieldDescriptionPlaceholder")}
              className="min-h-[100px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              data-testid="gm-gallery-edit-description"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {tcom("cancel")}
          </Button>
          <Button onClick={() => void save()} disabled={saving} data-testid="gm-gallery-edit-save">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {tcom("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
