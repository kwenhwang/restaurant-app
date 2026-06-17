// app/(main)/page.tsx — v3
// Server logic unchanged from v2 (aggregates visits, ranks, attaches tags,
// onboarding when empty). Only presentational wiring changed:
//   · AIRecommend now also receives `images` so the hero can show photos (A2)
//   · greeting eyebrow copy

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import HomeFilters from "@/components/home/HomeFilters";
import AIRecommend from "@/components/home/AIRecommend";
import AIDiscover from "@/components/home/AIDiscover";
import FriendCollectionsSection from "@/components/home/FriendCollectionsSection";
import MonthlyReportBanner from "@/components/home/MonthlyReportBanner";
import { buildMonthlyReport } from "@/lib/monthly-report";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import RevisitNudge from "@/components/home/RevisitNudge";
import { LargeTitle } from "@/components/ui/LargeTitle";
import Sym from "@/components/ui/Sym";
import { rankAllByElo } from "@/lib/rankings";
import { pickRevisitCandidates } from "@/lib/revisit";

const DEFAULT_CATEGORIES = ["전체", "한식", "일식", "중식", "양식", "카페", "술집", "기타"];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: restaurantsData } = await supabase
    .from("restaurants")
    .select(
      "id, name, address, category, rating, is_favorite, created_at, images:restaurant_images(id, storage_path, is_primary)"
    )
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const restaurants = restaurantsData ?? [];

  if (restaurants.length === 0) {
    return (
      <>
        <div style={{ height: 48 }} />
        <LargeTitle
          eyebrow="환영해요"
          title="내 맛집"
          trailing={
            <Link
              href="/profile"
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
              style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04), inset 0 0 0 0.5px rgba(0,0,0,0.06)" }}
            >
              <Sym name="sparkles" size={18} />
            </Link>
          }
        />
        <OnboardingTour />
      </>
    );
  }

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

  const { data: tagsData } = await supabase
    .from("restaurant_tags")
    .select("restaurant_id, tag")
    .in("restaurant_id", restaurants.map((r) => r.id));

  const tagMap = new Map<string, string[]>();
  for (const t of tagsData ?? []) {
    const listT = tagMap.get(t.restaurant_id) ?? [];
    listT.push(t.tag);
    tagMap.set(t.restaurant_id, listT);
  }

  const decorated = restaurants.map((r) => ({
    ...r,
    visit_count: visitMap.get(r.id)?.count ?? 0,
    last_visit: visitMap.get(r.id)?.last || null,
    tags: tagMap.get(r.id) ?? [],
  }));

  const { data: scoreRows } = await supabase
    .from("restaurant_scores")
    .select("restaurant_id, elo")
    .eq("user_id", user!.id);
  const eloMap = new Map<string, number>();
  for (const s of scoreRows ?? []) eloMap.set(s.restaurant_id, s.elo);

  const rankMap = rankAllByElo(decorated, eloMap);
  const list = decorated.map((r) => ({ ...r, rank: rankMap.get(r.id) }));

  const count = list.length;
  const now = new Date();
  const thisMonth = list.filter((r) => {
    if (!r.created_at) return false;
    const d = new Date(r.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const usedCategories = Array.from(
    new Set(list.map((r) => r.category).filter(Boolean) as string[])
  );
  const categories = ["전체", ...new Set([...DEFAULT_CATEGORIES.slice(1), ...usedCategories])];

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
        meta={`총 ${count}곳 · 이번 달 +${thisMonth}`}
        trailing={
          <Link
            href="/profile"
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04), inset 0 0 0 0.5px rgba(0,0,0,0.06)" }}
          >
            <Sym name="sparkles" size={18} />
          </Link>
        }
      />

      <RevisitNudge candidates={pickRevisitCandidates(list, 3)} />

      {(() => {
        // Previous-month banner: surface only on the 1st–10th of the
        // current month, and only when last month has 3+ visits.
        const today = new Date();
        if (today.getDate() > 10) return null;
        const prev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const yyyymm = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
        const report = buildMonthlyReport({
          yyyymm,
          restaurants: list.map((r) => ({
            id: r.id,
            name: r.name,
            category: r.category ?? null,
            address: r.address ?? null,
            rating: r.rating ?? null,
            created_at: r.created_at ?? null,
          })),
          visits: (visitsData ?? []).map((v) => ({
            restaurant_id: v.restaurant_id,
            visited_at: v.visited_at,
          })),
        });
        if (report.visits < 3) return null;
        return (
          <MonthlyReportBanner
            yyyymm={yyyymm}
            visitsCount={report.visits}
            topCategory={report.categoryShare[0]?.category ?? null}
          />
        );
      })()}

      <AIRecommend
        restaurants={list.map((r) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          rating: r.rating,
          images: r.images,
        }))}
      />

      {count >= 3 && <AIDiscover />}

      <FriendCollectionsSection userId={user!.id} />

      <div style={{ height: 18 }} />

      <HomeFilters restaurants={list} categories={categories} popularTags={popularTags} />
    </>
  );
}
