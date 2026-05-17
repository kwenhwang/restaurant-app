import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadImage, deleteImage } from "@/lib/storage";

const MAX_BYTES = 10 * 1024 * 1024;

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

  if (!file.type.startsWith("image/")) {
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

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${restaurantId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await uploadImage(path, buffer, file.type || "image/jpeg");
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("restaurant_images")
    .insert({ restaurant_id: restaurantId, storage_path: path, is_primary: isPrimary })
    .select()
    .single();

  if (error) {
    // Roll back MinIO upload if DB insert failed
    await deleteImage(path).catch(() => {});
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

  await deleteImage(image.storage_path).catch(() => {});

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
      await supabase
        .from("restaurant_images")
        .update({ is_primary: true })
        .eq("id", next.id);
    }
  }

  return NextResponse.json({ ok: true });
}
