import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import RestaurantCard from "@/components/restaurants/RestaurantCard";
import { LargeTitle } from "@/components/ui/LargeTitle";
import { Chip } from "@/components/ui/Chip";
import FAB from "@/components/ui/FAB";
import Sym from "@/components/ui/Sym";

const CATEGORIES = ["전체", "한식", "일식", "카페", "양식", "술집", "디저트"];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("*, images:restaurant_images(id, storage_path, is_primary)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const count = restaurants?.length ?? 0;
  const thisMonth =
    restaurants?.filter((r) => {
      const d = new Date(r.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length ?? 0;

  return (
    <>
      <div style={{ height: 48 }} />

      <LargeTitle
        eyebrow={user?.email ? `안녕하세요, ${user.email.split("@")[0]}님` : undefined}
        title="내 맛집"
        meta={`총 ${count}곳 · 이번 달 ${thisMonth}곳 추가`}
        trailing={
          <Link
            href="/profile"
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
            style={{
              boxShadow:
                "0 1px 2px rgba(0,0,0,0.04), inset 0 0 0 0.5px rgba(0,0,0,0.06)",
            }}
          >
            <Sym name="sparkles" size={18} />
          </Link>
        }
      />

      {/* Search */}
      <div className="px-5 pb-3">
        <div
          className="h-10 rounded-[12px] flex items-center gap-1.5 px-2.5"
          style={{ background: "rgba(118,118,128,0.12)", color: "var(--text-2)" }}
        >
          <Sym name="magnifyingglass" size={17} />
          <span className="text-[15px]">가게 이름, 카테고리</span>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 pb-3.5">
        {CATEGORIES.map((c, i) => (
          <Chip key={c} active={i === 0}>
            {c}
          </Chip>
        ))}
      </div>

      {/* Cards */}
      {restaurants && restaurants.length > 0 ? (
        <div className="px-4 flex flex-col gap-2.5">
          {restaurants.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}

      <FAB />
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center text-center py-20 px-8">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
      >
        <Sym name="fork.knife" size={28} strokeWidth={2} />
      </div>
      <h2 className="text-[17px] font-bold">아직 기록된 맛집이 없어요</h2>
      <p className="text-[14px] mt-1.5 max-w-[260px]" style={{ color: "var(--text-2)" }}>
        오늘 다녀온 그 가게부터 한 곳씩, 나만의 미식 지도를 만들어 보세요.
      </p>
      <Link
        href="/restaurants/new"
        className="mt-6 inline-flex items-center gap-1.5 h-11 px-5 rounded-full text-[15px] font-semibold text-white"
        style={{ background: "var(--accent)" }}
      >
        <Sym name="plus" size={16} strokeWidth={2.4} />
        첫 번째 맛집 추가
      </Link>
    </div>
  );
}
