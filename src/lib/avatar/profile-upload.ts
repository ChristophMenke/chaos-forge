import { createClient } from "@/lib/supabase/client";
import { resizeImageToSquare, cropAndResize, type CropArea } from "./resize";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const BUCKET = "profile-avatars";

export interface ProfileUploadResult {
  url: string | null;
  error: string | null;
}

export function validateProfileAvatarFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Nur JPG, PNG oder WebP Dateien sind erlaubt.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "Die Datei darf maximal 10 MB groß sein.";
  }
  return null;
}

function profilePath(userId: string) {
  return `${userId}/profile.webp`;
}

async function uploadBlob(blob: Blob, userId: string): Promise<ProfileUploadResult> {
  try {
    const supabase = createClient();
    const path = profilePath(userId);

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, blob, {
      contentType: "image/webp",
      upsert: true,
    });
    if (uploadError) return { url: null, error: uploadError.message };

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const avatarUrl = `${publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", userId);
    if (updateError) return { url: null, error: updateError.message };

    return { url: avatarUrl, error: null };
  } catch (err) {
    return {
      url: null,
      error: err instanceof Error ? err.message : "Upload fehlgeschlagen.",
    };
  }
}

export async function uploadProfileAvatar(
  file: File,
  userId: string
): Promise<ProfileUploadResult> {
  const validationError = validateProfileAvatarFile(file);
  if (validationError) return { url: null, error: validationError };
  try {
    const resized = await resizeImageToSquare(file);
    return uploadBlob(resized, userId);
  } catch (err) {
    return {
      url: null,
      error: err instanceof Error ? err.message : "Upload fehlgeschlagen.",
    };
  }
}

export async function uploadProfileAvatarCropped(
  file: File,
  crop: CropArea,
  userId: string
): Promise<ProfileUploadResult> {
  const validationError = validateProfileAvatarFile(file);
  if (validationError) return { url: null, error: validationError };
  try {
    const cropped = await cropAndResize(file, crop);
    return uploadBlob(cropped, userId);
  } catch (err) {
    return {
      url: null,
      error: err instanceof Error ? err.message : "Upload fehlgeschlagen.",
    };
  }
}

export async function deleteProfileAvatar(userId: string): Promise<string | null> {
  const supabase = createClient();
  await supabase.storage.from(BUCKET).remove([profilePath(userId)]);
  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
  return error?.message ?? null;
}
