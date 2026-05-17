import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeName, bucketCoord } from "@/lib/place-cache";

interface MenuPayload {
  items: { name: string; price: string | null }[];
  price_range: string | null;
  summary: string | null;
  source: string;
}

/**
 * Server-side cache lookup. Given a restaurant (id, name, lat, lng), check
 * place_menus for a matching cached menu. If found, copy to the user's
 * restaurants.menu (so future visits skip the lookup) AND return the data
 * for the current render.
 *
 * Returns null if no cache hit. Caller can then fall back to background fetch.
 */
export async function tryCachedMenu(args: {
  restaurantId: string;
  userId: string;
  name: string;
  lat: number | null;
  lng: number | null;
}): Promise<MenuPayload | null> {
  const admin = createAdminClient();
  const nameKey = normalizeName(args.name);
  const { latBucket, lngBucket } = bucketCoord(args.lat, args.lng);

  let query = admin
    .from("place_menus")
    .select("menu, fetch_status")
    .eq("name_normalized", nameKey);
  if (latBucket !== null) {
    query = query.eq("lat_bucket", latBucket).eq("lng_bucket", lngBucket);
  } else {
    query = query.is("lat_bucket", null).is("lng_bucket", null);
  }

  const { data: cached } = await query.maybeSingle();

  if (cached?.fetch_status === "ok" && cached.menu) {
    // Copy to user's restaurant so future page loads don't re-query
    await admin
      .from("restaurants")
      .update({ menu: cached.menu })
      .eq("id", args.restaurantId)
      .eq("user_id", args.userId);
    return cached.menu as MenuPayload;
  }

  return null;
}
