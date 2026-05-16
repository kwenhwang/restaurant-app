import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadImage, deleteImage } from "@/lib/storage";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const restaurantId = formData.get("restaurantId") as string;

  if (!file || !restaurantId) {
    return NextResponse.json({ error: "Missing file or restaurantId" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${restaurantId}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await uploadImage(path, buffer, file.type || "image/jpeg");

  const { data, error } = await supabase
    .from("restaurant_images")
    .insert({ restaurant_id: restaurantId, storage_path: path, is_primary: false })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ image: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const path = request.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  await deleteImage(path);
  return NextResponse.json({ ok: true });
}
