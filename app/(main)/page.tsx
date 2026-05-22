// app/(main)/page.tsx — v2
// New: aggregates visits, computes ranking, attaches tags, shows
// onboarding when the user has zero restaurants.

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import HomeFilters from "@/components/home/HomeFilters";
import AIRecommend from "@/components/home/AIRecommend";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import { LargeTitle } from "@/components/ui/LargeTitle";
import Sym from "@/components/ui/Sym";
import { rankAll } from "@/lib/rankings";

const DEFAULT_CATEGORIES = ["전체", "한식", "일식", "중식", "양식", "카페", "술집", "기타"];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Restaurants — base list
  const { data: restaurantsData } = await supabase
    .from("restaurants")
    .select(
      "id, name, address, category, rating, is_favorite, created_at, images:restaurant_images(id, storage_path, is_primary)"
    )
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const restaurants = restaurantsData ?? [];

  // Empty state → onboarding tour
  if (restaurants.length === 0) {
    return (
      <>
        <div style={{ height: 48 }} />
        <LargeTitle
          title="내 맛집"
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
        <OnboardingTour />
      </>
    );
  }

  // Visits — one round-trip, aggregate in JS
  const { data: visitsData } = await supabase
    .from("visits")
    .select("restaurant_id, visited_at")
    .eq("user_id", user!.id);

  const visitMap = new Map<string, { count: number; last: string }>();
  for (const v of visitsData ?? []) {
    const cur = visitMap.get(v.restaurant_id) ?? { count: 0, last: "" };
    cur.count += 1;
    if (v.visited_at && v.visited_at > cur.last) cur.last = v.visited_at;
    visitMap.set(v.restaurant_id, cur);
  }

  // Tags — one round-trip, group by restaurant
  const { data: tagsData } = await supabase
    .from("restaurant_tags")
    .select("restaurant_id, tag")
    .in(
      "restaurant_id",
      restaurants.map((r) => r.id)
    );

  const tagMap = new Map<string, string[]>();
  for (const t of tagsData ?? []) {
    const list = tagMap.get(t.restaurant_id) ?? [];
    list.push(t.tag);
    tagMap.set(t.restaurant_id, list);
  }

  // Decorate + rank
  const decorated = restaurants.map((r) => ({
    ...r,
    visit_count: visitMap.get(r.id)?.count ?? 0,
    last_visit: visitMap.get(r.id)?.last || null,
    tags: tagMap.get(r.id) ?? [],
  }));

  const rankMap = rankAll(decorated);
  const list = decorated.map((r) => ({ ...r, rank: rankMap.get(r.id) }));

  // Header meta
  const count = list.length;
  const now = new Date();
  const thisMonth = list.filter((r) => {
    if (!r.created_at) return false;
    const d = new Date(r.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Categories
  const usedCategories = Array.from(
    new Set(list.map((r) => r.category).filter(Boolean) as string[])
  );
  const categories = ["전체", ...new Set([...DEFAULT_CATEGORIES.slice(1), ...usedCategories])];

  // Tags — most-used first (top 10 for the filter row)
  const tagCount = new Map<string, number>();
  for (const r of list) {
    for (const t of r.tags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
  }
  const popularTags = [...tagCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([t]) => t);

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

      <HomeFilters restaurants={list} categories={categories} popularTags={popularTags} />
    </>
  );
}
