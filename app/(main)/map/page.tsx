// app/(main)/map/page.tsx — 풀스크린 지도 + 풍부한 데이터
// 핀에 색상·크기 차별화를 위해 즐겨찾기·방문·위시 정보까지 같이 fetch.

import { createClient } from "@/lib/supabase/server";
import KakaoMap, { type MarkerData } from "@/components/map/KakaoMap";
import EmptyState from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4 queries in parallel — restaurants는 lat/lng 있는 것만, 나머지는 user 단위
  const [restaurantsRes, visitsRes, wishlistRes, scoresRes] = await Promise.all([
    supabase
      .from("restaurants")
      .select(
        "id, name, address, lat, lng, category, rating, is_favorite, phone, business_hours, note, menu, images:restaurant_images(storage_path, is_primary, blur_data_url)",
      )
      .eq("user_id", user!.id)
      .not("lat", "is", null),
    supabase
      .from("visits")
      .select("restaurant_id, visited_at")
      .eq("user_id", user!.id),
    supabase
      .from("collections")
      .select("collection_items(restaurant_id)")
      .eq("owner_id", user!.id)
      .eq("kind", "wishlist")
      .maybeSingle(),
    supabase
      .from("restaurant_scores")
      .select("restaurant_id, tier, elo")
      .eq("user_id", user!.id),
  ]);

  const restaurants = restaurantsRes.data ?? [];

  // Aggregate visit count + last visit per restaurant
  const visitAgg = new Map<string, { count: number; last: string | null }>();
  for (const v of visitsRes.data ?? []) {
    const cur = visitAgg.get(v.restaurant_id) ?? { count: 0, last: null as string | null };
    cur.count += 1;
    if (v.visited_at && (!cur.last || v.visited_at > cur.last)) cur.last = v.visited_at;
    visitAgg.set(v.restaurant_id, cur);
  }

  // Wishlist membership
  const wishIds = new Set<string>();
  const wishItems =
    (wishlistRes.data as { collection_items?: { restaurant_id: string }[] } | null)
      ?.collection_items ?? [];
  for (const it of wishItems) wishIds.add(it.restaurant_id);

  // Pairwise tier per restaurant
  const tierMap = new Map<string, number>();
  for (const s of scoresRes.data ?? []) {
    if (s.tier != null) tierMap.set(s.restaurant_id, s.tier);
  }

  type ImageRow = { storage_path: string; is_primary: boolean | null; blur_data_url: string | null };
  type BusinessHours = Record<string, string> | null;
  type Menu = { items?: { name: string; price: string | null }[]; price_range?: string | null } | null;
  const markers: MarkerData[] = restaurants
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => {
      const imgs = (r as { images?: ImageRow[] }).images ?? [];
      const primary = imgs.find((i) => i.is_primary) ?? imgs[0];
      const agg = visitAgg.get(r.id);
      const menu = r.menu as Menu;
      return {
        id: r.id,
        name: r.name,
        address: r.address,
        lat: r.lat!,
        lng: r.lng!,
        category: r.category,
        rating: r.rating,
        is_favorite: !!r.is_favorite,
        is_wishlist: wishIds.has(r.id),
        visit_count: agg?.count ?? 0,
        last_visit: agg?.last ?? null,
        tier: tierMap.has(r.id) ? (tierMap.get(r.id) as 0 | 1 | 2) : null,
        storage_path: primary?.storage_path ?? null,
        blur_data_url: primary?.blur_data_url ?? null,
        phone: r.phone ?? null,
        business_hours: (r.business_hours as BusinessHours) ?? null,
        note: r.note ?? null,
        price_range: menu?.price_range ?? null,
        menu_items: (menu?.items ?? []).slice(0, 3),
      };
    });

  if (markers.length === 0) {
    return (
      <>
        <div style={{ height: 48 }} />
        <EmptyState
          tone="var(--accent-2)"
          emoji="🗺️"
          title="지도가 비어 있어요"
          body="맛집을 추가할 때 주소를 입력하거나 지도에서 위치를 지정하면, 다녀온 곳이 핀으로 모여요."
          cta="맛집 추가"
          ctaHref="/restaurants/new"
          ctaIcon="plus"
        />
      </>
    );
  }

  // Map fills the viewport minus the TabBar (~96px) so the bottom nav stays visible.
  return (
    <div className="fixed inset-x-0 top-0" style={{ bottom: 96 }}>
      <KakaoMap restaurants={markers} />
    </div>
  );
}
