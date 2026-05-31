import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const restaurantId = request.nextUrl.searchParams.get("restaurantId");

  const { data: collections } = await supabase
    .from("collections")
    .select("id, name, item_count, is_public")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  let alreadyIn: string[] = [];
  if (restaurantId) {
    const { data: rows } = await supabase
      .from("collection_items")
      .select("collection_id")
      .eq("restaurant_id", restaurantId);
    alreadyIn = (rows ?? []).map((r) => r.collection_id as string);
  }

  return NextResponse.json({
    collections: collections ?? [],
    alreadyIn,
  });
}
