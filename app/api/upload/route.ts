import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadImage, deleteImage } from "@/lib/storage";
import { generateBlurDataURL } from "@/lib/image-placeholder";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"]);
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
]);

/** Quick magic-byte sniff. Returns true if the first bytes look like a known image. */
function looksLikeImage(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  )
    return true;
  // GIF: GIF87a / GIF89a
  if (
    buf[0] === 0x47 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x38 &&
    (buf[4] === 0x37 || buf[4] === 0x39) &&
    buf[5] === 0x61
  )
    return true;
  // WEBP: RIFF....WEBP
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  )
    return true;
  // HEIC/HEIF: starts with ftyp + heic/heix/mif1
  if (
    buf[4] === 0x66 &&
    buf[5] === 0x74 &&
    buf[6] === 0x79 &&
    buf[7] === 0x70
  )
    return true;
  return false;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  const restaurantId = formData.get("restaurantId");

  if (!(file instanceof File) || typeof restaurantId !== "string") {
    return NextResponse.json({ error: "Missing file or restaurantId" }, { status: 400 });
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 415 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 413 });
  }

  // Verify ownership of restaurant
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("id", restaurantId)
    .eq("user_id", user.id)
    .single();

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 403 });
  }

  // Determine if this should be primary (first image)
  const { count } = await supabase
    .from("restaurant_images")
    .select("*", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId);

  const isPrimary = (count ?? 0) === 0;

  const rawExt = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const ext = ALLOWED_EXT.has(rawExt) ? rawExt : "jpg";
  const path = `${restaurantId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // Magic-byte sanity check — guards against MIME spoofing where a
  // non-image is uploaded with a faked `image/*` Content-Type.
  if (!looksLikeImage(buffer)) {
    return NextResponse.json({ error: "Not a valid image" }, { status: 415 });
  }

  // Start generating the blur placeholder while we upload to MinIO.
  // Failing to generate one is non-fatal — consumers fall back to a category gradient.
  const blurPromise = generateBlurDataURL(buffer);

  try {
    await uploadImage(path, buffer, file.type || "image/jpeg");
  } catch (e) {
    console.error("[upload] MinIO upload failed:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const blurDataUrl = await blurPromise;

  const { data, error } = await supabase
    .from("restaurant_images")
    .insert({
      restaurant_id: restaurantId,
      storage_path: path,
      is_primary: isPrimary,
      blur_data_url: blurDataUrl,
    })
    .select()
    .single();

  if (error) {
    // Roll back MinIO upload if DB insert failed
    await deleteImage(path).catch((e) =>
      console.error("[upload] rollback deleteImage failed for", path, e),
    );
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ image: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const imageId = request.nextUrl.searchParams.get("id");
  if (!imageId) {
    return NextResponse.json({ error: "Missing image id" }, { status: 400 });
  }

  // Look up image + its restaurant ownership
  const { data: image } = await supabase
    .from("restaurant_images")
    .select("id, storage_path, restaurant_id, is_primary, restaurants!inner(user_id)")
    .eq("id", imageId)
    .single();

  // restaurants!inner with select ensures the row only returns when user matches; double-check below
  const ownerId = (image as { restaurants?: { user_id: string } } | null)?.restaurants?.user_id;
  if (!image || ownerId !== user.id) {
    return NextResponse.json({ error: "Image not found" }, { status: 403 });
  }

  await deleteImage(image.storage_path).catch((e) =>
    console.error("[upload] deleteImage failed for", image.storage_path, e),
  );

  const { error: delErr } = await supabase
    .from("restaurant_images")
    .delete()
    .eq("id", imageId);

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  // If the deleted image was primary, promote the next image (oldest first)
  if (image.is_primary) {
    const { data: next } = await supabase
      .from("restaurant_images")
      .select("id")
      .eq("restaurant_id", image.restaurant_id)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (next) {
      // Belt-and-suspenders: scope the update to the SAME restaurant too,
      // even though `next.id` is already scoped to it.
      await supabase
        .from("restaurant_images")
        .update({ is_primary: true })
        .eq("id", next.id)
        .eq("restaurant_id", image.restaurant_id);
    }
  }

  return NextResponse.json({ ok: true });
}
