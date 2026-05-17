import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import HomeFilters from "@/components/home/HomeFilters";
import AIRecommend from "@/components/home/AIRecommend";
import { LargeTitle } from "@/components/ui/LargeTitle";
import FAB from "@/components/ui/FAB";
import Sym from "@/components/ui/Sym";

const DEFAULT_CATEGORIES = ["전체", "한식", "일식", "중식", "양식", "카페", "술집", "기타"];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id, name, address, category, rating, is_favorite, created_at, images:restaurant_images(id, storage_path, is_primary)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const list = restaurants ?? [];
  const count = list.length;
  const now = new Date();
  const thisMonth = list.filter((r) => {
    if (!r.created_at) return false;
    const d = new Date(r.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Categories from actual data + defaults (de-duped, "전체" first)
  const usedCategories = Array.from(
    new Set(list.map((r) => r.category).filter(Boolean) as string[])
  );
  const categories = ["전체", ...new Set([...DEFAULT_CATEGORIES.slice(1), ...usedCategories])];

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

      <AIRecommend
        restaurants={list.map((r) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          rating: r.rating,
        }))}
      />

      <HomeFilters restaurants={list} categories={categories} />

      <FAB />
    </>
  );
}
