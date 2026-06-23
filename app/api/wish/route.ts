// POST /api/wish
//
// Quick-save a restaurant the user heard about but hasn't visited. Creates
// a `restaurants` row (no rating/photos/menu) and adds it to the user's
// "가고 싶은 곳" wishlist collection (auto-created on first wish).
//
// Body: { name, address?, lat?, lng?, category? }
// Returns: { restaurantId, collectionId }

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const WISHLIST_NAME = "가고 싶은 곳";
const WISHLIST_DESC = "다음에 가볼 곳 모음";

interface Body {
  name?: unknown;
  address?: unknown;
  lat?: unknown;
  lng?: unknown;
  category?: unknown;
}

const VALID_CATEGORIES = new Set([
  "한식", "중식", "일식", "양식", "카페", "술집", "디저트", "기타",
]);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = checkRateLimit({ key: `${user.id}:wish`, perMinute: 30, perDay: 300 });
  const rlRes = rateLimitResponse(rl);
  if (rlRes) return rlRes;

  const body = (await request.json().catch(() => ({}))) as Body;

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const address =
    typeof body.address === "string" ? body.address.trim().slice(0, 200) || null : null;
  const lat = typeof body.lat === "number" && isFinite(body.lat) ? body.lat : null;
  const lng = typeof body.lng === "number" && isFinite(body.lng) ? body.lng : null;
  const categoryRaw = typeof body.category === "string" ? body.category : "";
  const category = VALID_CATEGORIES.has(categoryRaw) ? categoryRaw : null;

  // 1. Insert restaurant (no rating, no menu — pure wishlist entry)
  const { data: created, error: insertErr } = await supabase
    .from("restaurants")
    .insert({
      user_id: user.id,
      name,
      address,
      lat,
      lng,
      category,
    })
    .select("id")
    .single();
  if (insertErr || !created) {
    return NextResponse.json(
      { error: insertErr?.message ?? "저장 실패" },
      { status: 500 },
    );
  }
  const restaurantId = created.id as string;

  // 2. Get-or-create the user's wishlist collection (unique-per-user)
  let wishlistId: string;
  const { data: existing } = await supabase
    .from("collections")
    .select("id")
    .eq("owner_id", user.id)
    .eq("kind", "wishlist")
    .maybeSingle();

  if (existing?.id) {
    wishlistId = existing.id as string;
  } else {
    const { data: createdCol, error: colErr } = await supabase
      .from("collections")
      .insert({
        owner_id: user.id,
        name: WISHLIST_NAME,
        description: WISHLIST_DESC,
        kind: "wishlist",
        is_public: false,
      })
      .select("id")
      .single();
    if (colErr || !createdCol) {
      // Don't fail the wish over the collection write — the restaurant is saved.
      return NextResponse.json({ restaurantId, collectionId: null, error: colErr?.message });
    }
    wishlistId = createdCol.id as string;
  }

  // 3. Link via collection_items (idempotent)
  await supabase.from("collection_items").upsert(
    {
      collection_id: wishlistId,
      restaurant_id: restaurantId,
      added_by: user.id,
    },
    { onConflict: "collection_id,restaurant_id", ignoreDuplicates: true },
  );

  return NextResponse.json({ restaurantId, collectionId: wishlistId });
}
