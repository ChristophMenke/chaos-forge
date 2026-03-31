import { createClient } from "@/lib/supabase/client";
import { resizeImageToSquare, cropAndResize } from "./resize";
import type { CropArea } from "./resize";
import { validateFile, type UploadResult } from "./upload";

const BUCKET = "npc-avatars";

export async function uploadNpcAvatar(
  file: File,
  npcId: string,
  cropArea?: CropArea
): Promise<UploadResult> {
  const validationError = validateFile(file);
  if (validationError) {
    return { url: null, error: validationError };
  }

  try {
    const resized = cropArea
      ? await cropAndResize(file, cropArea)
      : await resizeImageToSquare(file);
    const supabase = createClient();
    const path = `${npcId}.webp`;

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, resized, {
      contentType: "image/webp",
      upsert: true,
    });

    if (uploadError) {
      return { url: null, error: uploadError.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    const avatarUrl = `${publicUrl}?t=${Date.now()}`;
    const { error: dbError } = await supabase
      .from("chronicle_npcs")
      .update({ avatar_url: avatarUrl })
      .eq("id", npcId);

    if (dbError) {
      return { url: null, error: dbError.message };
    }

    return { url: avatarUrl, error: null };
  } catch (err) {
    return {
      url: null,
      error: err instanceof Error ? err.message : "Upload fehlgeschlagen.",
    };
  }
}

export async function deleteNpcAvatar(npcId: string): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from(BUCKET).remove([`${npcId}.webp`]);
  await supabase.from("chronicle_npcs").update({ avatar_url: null }).eq("id", npcId);
}
