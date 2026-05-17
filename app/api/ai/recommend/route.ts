import { NextRequest, NextResponse } from "next/server";
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

function haversine(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Optional GPS coords for distance-aware recommendation
  const sp = request.nextUrl.searchParams;
  const userLat = parseFloat(sp.get("lat") ?? "");
  const userLng = parseFloat(sp.get("lng") ?? "");
  const hasCoord = isFinite(userLat) && isFinite(userLng);

  const [{ data: restaurants }, { data: visits }] = await Promise.all([
    supabase
      .from("restaurants")
      .select("id, name, category, rating, is_favorite, note, address, lat, lng")
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
    const distance_m =
      hasCoord && r.lat != null && r.lng != null
        ? Math.round(haversine(userLat, userLng, r.lat, r.lng))
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
      distance_m,
    };
  });

  // Pre-filter to nearby candidates if we have coords (top 15 by distance + favorites)
  let candidates = items;
  if (hasCoord) {
    const withDistance = items.filter((i) => i.distance_m !== null);
    const withoutDistance = items.filter((i) => i.distance_m === null);
    withDistance.sort((a, b) => (a.distance_m ?? 0) - (b.distance_m ?? 0));
    // Take nearest 15 + favorites that didn't make the cut
    const top = withDistance.slice(0, 15);
    const extraFavorites = withDistance
      .slice(15)
      .filter((i) => i.favorite)
      .slice(0, 5);
    candidates = [...top, ...extraFavorites, ...withoutDistance.slice(0, 3)];
  }

  const hour = now.getHours();
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][now.getDay()];
  const timeOfDay =
    hour < 6 ? "새벽" : hour < 11 ? "아침" : hour < 14 ? "점심" : hour < 17 ? "오후" : hour < 21 ? "저녁" : "밤";

  const distanceInstruction = hasCoord
    ? `**가장 중요:** 사용자는 지금 (위도 ${userLat.toFixed(4)}, 경도 ${userLng.toFixed(4)})에 있어. distance_m가 작은 곳을 강하게 우선해. 3000m(3km) 넘는 곳은 추천하지 마. distance_m이 null인 곳은 거리 모르므로 평점/즐겨찾기 강할 때만.`
    : `사용자 위치 모름. 거리는 무시하고 시간대·평점·즐겨찾기로 추천.`;

  const prompt = `너는 한국 사용자의 개인 맛집 큐레이터야. 사용자가 직접 기록한 맛집 목록에서, 지금 어울리는 곳을 1~3개 추천해.

**현재 시각:**
- 요일: ${weekday}요일, 시간대: ${timeOfDay} (${hour}시)
- 날짜: ${now.toISOString().slice(0, 10)}

${distanceInstruction}

**추천 기준 (우선순위):**
1. (좌표 있으면) 거리 가까움 — 멀면 추천 X
2. 시간대 적합성 (아침=카페·브런치, 점심=한식·일식·가성비, 저녁=분위기·술집, 밤=야식·술집)
3. 마지막 방문 후 텀 충분 (days_since_last_visit 큰 곳 가산점)
4. 즐겨찾기/평점 높음
5. 다양성 (같은 카테고리 연속 추천 X)

**맛집 목록 (JSON):**
${JSON.stringify(candidates, null, 0)}

**출력 (JSON만):**
{
  "greeting": "한 문장 인사 (15자 내외)",
  "recommendations": [
    { "restaurantId": "<id>", "reason": "왜 지금 여기인지 (30자 내외, 거리 있으면 'XXm 거리에' 같이 자연스럽게)" }
  ]
}

restaurantId는 위 목록의 id 그대로. 좋은 후보가 없으면 1개라도, 정 없으면 빈 배열.`;

  try {
    const result = await generateJSON<AIResult>(prompt, { temperature: 0.7 });

    // Validate: keep only recommendations with valid IDs and within reasonable distance
    const validIds = new Map(items.map((r) => [r.id, r]));
    const cleaned = (result.recommendations ?? [])
      .filter((r) => r.restaurantId && validIds.has(r.restaurantId))
      .filter((r) => {
        if (!hasCoord) return true;
        const item = validIds.get(r.restaurantId)!;
        if (item.distance_m === null) return true;
        return item.distance_m <= 5000; // hard cap 5km
      })
      .slice(0, 3);

    return NextResponse.json(
      {
        greeting: result.greeting ?? "오늘은 어디 가볼까요?",
        recommendations: cleaned,
      },
      { headers: { "Cache-Control": "private, max-age=600" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
