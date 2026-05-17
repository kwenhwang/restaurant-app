import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/gemini";

interface Recommendation {
  restaurantId: string;
  reason: string;
}

interface AIResult {
  greeting: string;
  recommendations: Recommendation[];
}

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Load user's restaurants + last visit dates (in one round-trip via separate queries in parallel)
  const [{ data: restaurants }, { data: visits }] = await Promise.all([
    supabase
      .from("restaurants")
      .select("id, name, category, rating, is_favorite, note, address")
      .eq("user_id", user.id),
    supabase
      .from("visits")
      .select("restaurant_id, visited_at")
      .eq("user_id", user.id)
      .order("visited_at", { ascending: false })
      .limit(200),
  ]);

  if (!restaurants || restaurants.length === 0) {
    return NextResponse.json({
      greeting: "아직 추천드릴 맛집이 없어요. 한 곳 등록부터!",
      recommendations: [],
    });
  }

  // Build per-restaurant summary including visit count + days since last visit
  const visitMap = new Map<string, { count: number; last: string | null }>();
  for (const v of visits ?? []) {
    const cur = visitMap.get(v.restaurant_id) ?? { count: 0, last: null };
    cur.count++;
    if (!cur.last || v.visited_at > cur.last) cur.last = v.visited_at;
    visitMap.set(v.restaurant_id, cur);
  }

  const now = new Date();
  const items = restaurants.map((r) => {
    const v = visitMap.get(r.id);
    const daysSince = v?.last
      ? Math.floor((now.getTime() - new Date(v.last).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    return {
      id: r.id,
      name: r.name,
      category: r.category ?? "기타",
      rating: r.rating ?? null,
      favorite: !!r.is_favorite,
      note: r.note ?? "",
      address: r.address ?? "",
      visit_count: v?.count ?? 0,
      days_since_last_visit: daysSince,
    };
  });

  const hour = now.getHours();
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][now.getDay()];
  const timeOfDay =
    hour < 6 ? "새벽" : hour < 11 ? "아침" : hour < 14 ? "점심" : hour < 17 ? "오후" : hour < 21 ? "저녁" : "밤";

  const prompt = `너는 한국 사용자의 개인 맛집 큐레이터야. 사용자가 직접 기록한 맛집 목록에서, 지금 이 시간에 가장 어울리는 곳을 2~3개 추천해.

**현재 시각 정보:**
- 요일: ${weekday}요일
- 시간대: ${timeOfDay} (${hour}시)
- 날짜: ${now.toISOString().slice(0, 10)}

**추천 기준 (중요도 순):**
1. 시간대 적합성 (아침엔 카페·브런치, 점심엔 한식·일식·가성비, 저녁엔 분위기·술집, 밤엔 야식·술집)
2. 마지막 방문 후 충분한 텀 (days_since_last_visit이 클수록 가산점, 단 아예 안 가본 곳은 신중)
3. 즐겨찾기(favorite) 또는 평점(rating) 높음
4. 다양성 (같은 카테고리 2개 연속 추천하지 말 것)

**사용자 맛집 목록 (JSON):**
${JSON.stringify(items, null, 0)}

**출력 형식 (JSON만, 다른 텍스트 없이):**
{
  "greeting": "한 문장 인사 (시간대 반영, 친근하고 짧게, 15자 내외)",
  "recommendations": [
    { "restaurantId": "<id>", "reason": "왜 지금 여기인지 한 문장 (30자 내외, 따뜻한 말투)" }
  ]
}

restaurantId는 반드시 위 목록의 id를 그대로 사용. 추천 1~3개. 후보가 부족하면 1개라도 OK.`;

  try {
    const result = await generateJSON<AIResult>(prompt, { temperature: 0.8 });

    // Validate: keep only recommendations with valid IDs
    const validIds = new Set(items.map((r) => r.id));
    const cleaned = (result.recommendations ?? [])
      .filter((r) => r.restaurantId && validIds.has(r.restaurantId))
      .slice(0, 3);

    return NextResponse.json(
      {
        greeting: result.greeting ?? "오늘은 어디 가볼까요?",
        recommendations: cleaned,
      },
      {
        headers: {
          // Browser-side cache for an hour; sw will also stash
          "Cache-Control": "private, max-age=3600",
        },
      }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
