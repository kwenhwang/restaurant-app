import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai/gemini";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = checkRateLimit({ key: `${user.id}:ai`, perMinute: 10, perDay: 100 });
  const rlRes = rateLimitResponse(rl);
  if (rlRes) return rlRes;

  const [{ data: restaurants }, { data: visits }] = await Promise.all([
    supabase
      .from("restaurants")
      .select("id, name, category, rating, is_favorite")
      .eq("user_id", user.id),
    supabase
      .from("visits")
      .select("visited_at, restaurant_id")
      .eq("user_id", user.id)
      .order("visited_at", { ascending: false })
      .limit(500),
  ]);

  if (!visits || visits.length === 0) {
    return NextResponse.json({
      text: "방문 기록을 남기기 시작하면, 패턴을 분석해 드릴게요.",
    });
  }

  // Aggregate stats to keep prompt compact
  const restaurantById = new Map((restaurants ?? []).map((r) => [r.id, r]));
  const byCategory = new Map<string, number>();
  const byMonth = new Map<string, number>();
  const byDay = new Map<string, number>(); // weekday 0-6
  const byRestaurant = new Map<string, number>();
  for (const v of visits) {
    const r = restaurantById.get(v.restaurant_id);
    const cat = r?.category ?? "기타";
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + 1);
    byRestaurant.set(v.restaurant_id, (byRestaurant.get(v.restaurant_id) ?? 0) + 1);
    const d = new Date(v.visited_at);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(monthKey, (byMonth.get(monthKey) ?? 0) + 1);
    const dayKey = String(d.getDay());
    byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + 1);
  }

  const topCats = [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topRestaurants = [...byRestaurant.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({
      name: restaurantById.get(id)?.name ?? "?",
      category: restaurantById.get(id)?.category ?? "?",
      visits: count,
    }));
  const last6Months = [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6);
  const dayDist = [0, 1, 2, 3, 4, 5, 6].map((d) => ({
    day: ["일", "월", "화", "수", "목", "금", "토"][d],
    count: byDay.get(String(d)) ?? 0,
  }));

  const summary = {
    total_visits: visits.length,
    total_restaurants: restaurants?.length ?? 0,
    favorites: (restaurants ?? []).filter((r) => r.is_favorite).length,
    avg_rating:
      ((restaurants ?? []).filter((r) => r.rating).reduce((s, r) => s + (r.rating ?? 0), 0) /
        Math.max(1, (restaurants ?? []).filter((r) => r.rating).length)).toFixed(1),
    top_categories: topCats.map(([c, n]) => ({ category: c, visits: n })),
    top_restaurants: topRestaurants,
    monthly_visits: last6Months.map(([m, n]) => ({ month: m, count: n })),
    weekday_distribution: dayDist,
  };

  const prompt = `너는 사용자의 식습관을 다정하게 짚어주는 미식 큐레이터야.
아래 통계를 보고 친근하고 통찰력 있는 2~3 문장 한국어 인사이트를 작성해.

**규칙:**
- 출력은 인사이트 본문만 (제목·머리말 없이)
- 80~140자 사이
- 친근한 반말 또는 정중한 존댓말 한쪽으로 일관 (존댓말 선호)
- 구체적 숫자/이름 1~2개 인용
- 행동 제안 한 가지 살짝 추가 (강요하지 말고 부드럽게)
- 이모지 1~2개 자연스럽게

**통계 (JSON):**
${JSON.stringify(summary)}`;

  try {
    const text = await generateText(prompt, { temperature: 0.85, maxOutputTokens: 300 });
    return NextResponse.json({ text }, {
      headers: { "Cache-Control": "private, max-age=3600" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
