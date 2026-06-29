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

  // 5 queries in parallel — restaurants는 lat/lng 있는 것만, 나머지는 user 단위
  const [restaurantsRes, visitsRes, wishlistRes] = await Promise.all([
    supabase
      .from("restaurants")
      .select(
        "id, name, address, lat, lng, category, rating, is_favorite, images:restaurant_images(storage_path, is_primary, blur_data_url)",
      )
      .eq("user_id", user!.id)
      .not("lat", "is", null),
    supabase
      .from("visits")
      .select("restaurant_id")
      .eq("user_id", user!.id),
    supabase
      .from("collections")
      .select("collection_items(restaurant_id)")
      .eq("owner_id", user!.id)
      .eq("kind", "wishlist")
      .maybeSingle(),
  ]);

  const restaurants = restaurantsRes.data ?? [];

  // Aggregate visit counts
  const visitCount = new Map<string, number>();
  for (const v of visitsRes.data ?? []) {
    visitCount.set(v.restaurant_id, (visitCount.get(v.restaurant_id) ?? 0) + 1);
  }

  // Wishlist membership
  const wishIds = new Set<string>();
  const wishItems =
    (wishlistRes.data as { collection_items?: { restaurant_id: string }[] } | null)
      ?.collection_items ?? [];
  for (const it of wishItems) wishIds.add(it.restaurant_id);

  type ImageRow = { storage_path: string; is_primary: boolean | null; blur_data_url: string | null };
  const markers: MarkerData[] = restaurants
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => {
      const imgs = (r as { images?: ImageRow[] }).images ?? [];
      const primary = imgs.find((i) => i.is_primary) ?? imgs[0];
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
        visit_count: visitCount.get(r.id) ?? 0,
        storage_path: primary?.storage_path ?? null,
        blur_data_url: primary?.blur_data_url ?? null,
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
