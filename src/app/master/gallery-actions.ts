"use server";

/**
 * GM actions of the „Galerie des Chaos“. Every action checks the GM session
 * first and writes with the service client — the table and the bucket have no
 * write policies for normal users. Uploads go straight from the browser to
 * Supabase Storage via signed upload URLs, so neither the 1 MB server-action
 * limit nor Vercel's 4.5 MB body limit applies.
 */
import { checkGmSession } from "./actions";
import { createServiceClient } from "@/lib/supabase/service";
import { getAuthUser } from "@/lib/supabase/auth";
import { notifyApprovedUsers } from "@/lib/notifications";
import { GALLERY_BUCKET, galleryPaths, isGalleryPath } from "@/lib/gallery/paths";
import { nextSortOrders } from "@/lib/gallery/order";
import type { PreparedUpload, RegisterItem } from "@/lib/gallery/upload";
import type { GalleryImageRow } from "@/lib/supabase/types";

const MAX_BATCH = 20;
const MAX_TITLE = 120;
const MAX_DESCRIPTION = 2000;

type Failure = { success: false; error: string };
const UNAUTHORIZED: Failure = { success: false, error: "Unauthorized" };

async function loadGallery(service: ReturnType<typeof createServiceClient>) {
  const { data, error } = await service
    .from("gallery_images")
    .select("*")
    .order("sort_order", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as GalleryImageRow[];
}

export async function prepareGalleryUpload(
  count: number
): Promise<{ success: true; uploads: PreparedUpload[] } | Failure> {
  if (!(await checkGmSession())) return UNAUTHORIZED;
  if (!Number.isInteger(count) || count < 1 || count > MAX_BATCH) {
    return { success: false, error: "invalid_count" };
  }

  const bucket = createServiceClient().storage.from(GALLERY_BUCKET);
  const uploads: PreparedUpload[] = [];
  for (let i = 0; i < count; i++) {
    const id = crypto.randomUUID();
    const paths = galleryPaths(id);
    const [image, thumb] = await Promise.all([
      bucket.createSignedUploadUrl(paths.image),
      bucket.createSignedUploadUrl(paths.thumb),
    ]);
    if (image.error || thumb.error) {
      return { success: false, error: (image.error ?? thumb.error)!.message };
    }
    uploads.push({
      id,
      imagePath: paths.image,
      imageToken: image.data.token,
      thumbPath: paths.thumb,
      thumbToken: thumb.data.token,
    });
  }
  return { success: true, uploads };
}

export async function registerGalleryImages(
  items: RegisterItem[]
): Promise<{ success: true; images: GalleryImageRow[]; failedIds: string[] } | Failure> {
  if (!(await checkGmSession())) return UNAUTHORIZED;
  const service = createServiceClient();
  const bucket = service.storage.from(GALLERY_BUCKET);

  // Paths come from the id, never from the client, and both files must exist.
  const failedIds: string[] = [];
  const valid: (RegisterItem & { image: string; thumb: string })[] = [];
  for (const item of items.slice(0, MAX_BATCH)) {
    const paths = galleryPaths(item.id);
    if (!isGalleryPath(paths.image)) {
      failedIds.push(item.id);
      continue;
    }
    const [image, thumb] = await Promise.all([
      bucket.exists(paths.image),
      bucket.exists(paths.thumb),
    ]);
    if (!image.data || !thumb.data) {
      failedIds.push(item.id);
      continue;
    }
    valid.push({ ...item, ...paths });
  }
  if (valid.length === 0) return { success: true, images: [], failedIds };

  const { data: top } = await service
    .from("gallery_images")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const orders = nextSortOrders(
    (top as { sort_order: number } | null)?.sort_order ?? 0,
    valid.length
  );
  const user = await getAuthUser();

  const { data, error } = await service
    .from("gallery_images")
    .insert(
      valid.map((item, i) => ({
        id: item.id,
        image_path: item.image,
        thumb_path: item.thumb,
        width: Math.round(item.width) || null,
        height: Math.round(item.height) || null,
        sort_order: orders[i],
        created_by: user?.id ?? null,
      }))
    )
    .select();
  if (error) {
    console.error("[gallery] register failed", error.message);
    return { success: false, error: error.message };
  }

  await notifyApprovedUsers(service, {
    exceptUserId: user?.id ?? null,
    type: "gallery_images_added",
    details: { count: valid.length },
  });

  return { success: true, images: (data ?? []) as GalleryImageRow[], failedIds };
}

function cleanText(value: string | null, max: number): string | null | undefined {
  const trimmed = value?.trim() ?? "";
  if (trimmed.length > max) return undefined;
  return trimmed === "" ? null : trimmed;
}

export async function updateGalleryImage(
  id: string,
  texts: { title: string | null; description: string | null }
): Promise<{ success: true; image: GalleryImageRow } | Failure> {
  if (!(await checkGmSession())) return UNAUTHORIZED;
  const title = cleanText(texts.title, MAX_TITLE);
  const description = cleanText(texts.description, MAX_DESCRIPTION);
  if (title === undefined || description === undefined) {
    return { success: false, error: "too_long" };
  }

  const { data, error } = await createServiceClient()
    .from("gallery_images")
    .update({ title, description })
    .eq("id", id)
    .select()
    .single();
  if (error || !data) return { success: false, error: error?.message ?? "not_found" };
  return { success: true, image: data as GalleryImageRow };
}

export async function deleteGalleryImage(id: string): Promise<{ success: true } | Failure> {
  if (!(await checkGmSession())) return UNAUTHORIZED;
  const service = createServiceClient();

  const { data: row } = await service
    .from("gallery_images")
    .select("image_path, thumb_path")
    .eq("id", id)
    .maybeSingle();
  if (row) {
    const { image_path, thumb_path } = row as Pick<GalleryImageRow, "image_path" | "thumb_path">;
    const { error } = await service.storage.from(GALLERY_BUCKET).remove([image_path, thumb_path]);
    // An orphaned file is better than a scene the GM cannot get rid of.
    if (error) console.error("[gallery] file removal failed", error.message);
  }

  const { error } = await service.from("gallery_images").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function moveGalleryImage(
  id: string,
  direction: "up" | "down"
): Promise<{ success: true; images: GalleryImageRow[] } | Failure> {
  if (!(await checkGmSession())) return UNAUTHORIZED;
  const service = createServiceClient();

  const { data: current } = await service
    .from("gallery_images")
    .select("id, sort_order")
    .eq("id", id)
    .maybeSingle();
  if (!current) return { success: false, error: "not_found" };
  const order = (current as { sort_order: number }).sort_order;

  // "up" = towards the top of the list = the next higher sort_order.
  const neighbourQuery = service.from("gallery_images").select("id");
  const { data: neighbour } = await (
    direction === "up"
      ? neighbourQuery.gt("sort_order", order).order("sort_order", { ascending: true })
      : neighbourQuery.lt("sort_order", order).order("sort_order", { ascending: false })
  )
    .limit(1)
    .maybeSingle();

  if (neighbour) {
    const { error } = await service.rpc("swap_gallery_order", {
      a: id,
      b: (neighbour as { id: string }).id,
    });
    if (error) return { success: false, error: error.message };
  }

  return { success: true, images: await loadGallery(service) };
}
