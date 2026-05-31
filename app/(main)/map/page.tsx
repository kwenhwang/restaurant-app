// app/(main)/map/page.tsx — v3
// Data logic unchanged. Empty state → unified EmptyState (F2). LargeTitle now serif.

import { createClient } from "@/lib/supabase/server";
import KakaoMap from "@/components/map/KakaoMap";
import { LargeTitle } from "@/components/ui/LargeTitle";
import EmptyState from "@/components/ui/EmptyState";

export default async function MapPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id, name, address, lat, lng, category, rating")
    .eq("user_id", user!.id)
    .not("lat", "is", null);

  const mapped = restaurants?.length ?? 0;

  return (
    <>
      <div style={{ height: 48 }} />
      <LargeTitle title="지도" meta={`주소가 등록된 ${mapped}곳을 보여드려요`} />

      {mapped === 0 ? (
        <EmptyState
          tone="var(--accent-2)"
          emoji="🗺️"
          title="지도가 비어 있어요"
          body="맛집을 추가할 때 주소를 입력하거나 지도에서 위치를 지정하면, 다녀온 곳이 핀으로 모여요."
          cta="맛집 추가"
          ctaHref="/restaurants/new"
          ctaIcon="plus"
        />
      ) : (
        <div className="px-4">
          <div
            className="rounded-[20px] overflow-hidden"
            style={{ boxShadow: "var(--shadow-2)", height: "calc(100vh - 280px)", minHeight: 420 }}
          >
            <KakaoMap restaurants={restaurants ?? []} />
          </div>
        </div>
      )}
    </>
  );
}
