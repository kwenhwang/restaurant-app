// app/(main)/wishlist/page.tsx — "아직 안 간 곳" 전용 탭
// wishlist kind 컬렉션을 자동 로드하고 큰 CTA로 빠른 등록 진입점을 제공.

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import RestaurantCard from "@/components/restaurants/RestaurantCard";
import EmptyState from "@/components/ui/EmptyState";
import Sym from "@/components/ui/Sym";
import QuickWishButton from "@/components/home/QuickWishButton";

export const dynamic = "force-dynamic";

type ImageRow = {
  id: string;
  storage_path: string;
  is_primary: boolean | null;
  blur_data_url: string | null;
};

type RestaurantRow = {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  is_favorite: boolean | null;
  restaurant_images: ImageRow[];
};

type ItemRow = {
  restaurant_id: string;
  created_at: string;
  restaurants: RestaurantRow;
};

export default async function WishlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // wishlist 컬렉션 1건 (없으면 첫 찜 시 자동 생성됨)
  const { data: collection } = await supabase
    .from("collections")
    .select("id")
    .eq("owner_id", user.id)
    .eq("kind", "wishlist")
    .maybeSingle();

  let items: ItemRow[] = [];
  if (collection?.id) {
    const { data } = await supabase
      .from("collection_items")
      .select(
        "restaurant_id, created_at, restaurants!inner(id, name, category, address, is_favorite, restaurant_images(id, storage_path, is_primary, blur_data_url))",
      )
      .eq("collection_id", collection.id)
      .order("created_at", { ascending: false });
    items = (data ?? []) as unknown as ItemRow[];
  }

  return (
    <main className="pb-32 px-4 max-w-screen-sm mx-auto">
      <header className="flex items-center justify-between pt-4 pb-3">
        <div>
          <h1 className="font-display text-[26px] font-extrabold leading-tight">찜</h1>
          <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
            아직 안 간 곳 · 다음에 갈 후보
          </p>
        </div>
        <QuickWishButton />
      </header>

      <Link
        href="/capture"
        className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-4"
        style={{ background: "var(--accent-soft)", color: "var(--accent-press)" }}
      >
        <span className="text-[22px]">✨</span>
        <div className="flex-1">
          <div className="font-display text-[15px] font-extrabold">새로 찜하기</div>
          <div className="text-[12px]" style={{ color: "var(--text-2)" }}>
            가게 이름 검색 · 공유 받기 · 빠른 등록
          </div>
        </div>
        <Sym name="chevron.right" size={18} />
      </Link>

      {items.length === 0 ? (
        <EmptyState
          tone="var(--accent-2)"
          emoji="🔖"
          title="아직 찜한 곳이 없어요"
          body="가고 싶은 곳을 발견하면 미리 모아두세요. 그 동네 갔을 때 알려드릴게요."
          cta="첫 찜 추가하기"
          ctaHref="/capture"
          ctaIcon="plus"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 animate-fade-up">
          {items.map((it) => {
            const r = it.restaurants;
            return (
              <RestaurantCard
                key={it.restaurant_id}
                restaurant={{
                  id: r.id,
                  name: r.name,
                  category: r.category,
                  address: r.address,
                  is_favorite: r.is_favorite ?? false,
                  images: r.restaurant_images?.map((i) => ({
                    id: i.id,
                    storage_path: i.storage_path,
                    is_primary: !!i.is_primary,
                    blur_data_url: i.blur_data_url,
                  })),
                }}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
