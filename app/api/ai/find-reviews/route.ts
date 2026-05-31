import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateGroundedJSON } from "@/lib/ai/gemini";
import { normalizeName, bucketCoord } from "@/lib/place-cache";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

interface ReviewResult {
  found: boolean;
  summary: string;
  pros: string[];
  cons: string[];
  highlights: string[];
  source_hint: string;
}

interface CachedReviews extends ReviewResult {
  sources?: { url: string; title?: string }[];
}

export const dynamic = "force-dynamic";

const OK_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const NEGATIVE_TTL_MS = 1 * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = checkRateLimit({ key: `${user.id}:ai-find-reviews`, perMinute: 3, perDay: 30 });
  const rlRes = rateLimitResponse(rl);
  if (rlRes) return rlRes;

  const { restaurantId, force } = await request.json().catch(() => ({}));
  if (!restaurantId || typeof restaurantId !== "string") {
    return NextResponse.json({ error: "restaurantId required" }, { status: 400 });
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, address, category, lat, lng, reviews")
    .eq("id", restaurantId)
    .eq("user_id", user.id)
    .single();

  if (!restaurant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const nameKey = normalizeName(restaurant.name);
  const { latBucket, lngBucket } = bucketCoord(restaurant.lat, restaurant.lng);

  // Cache lookup
  let cq = admin
    .from("place_reviews")
    .select("reviews, fetch_status, last_fetched_at")
    .eq("name_normalized", nameKey);
  if (latBucket !== null) cq = cq.eq("lat_bucket", latBucket).eq("lng_bucket", lngBucket);
  else cq = cq.is("lat_bucket", null).is("lng_bucket", null);
  const { data: cached } = await cq.maybeSingle();

  const cachedAgeMs = cached?.last_fetched_at
    ? Date.now() - new Date(cached.last_fetched_at).getTime()
    : Infinity;
  const ttl = cached?.fetch_status === "ok" ? OK_TTL_MS : NEGATIVE_TTL_MS;
  const isFresh = cachedAgeMs < ttl;

  if (!force && cached && isFresh && cached.fetch_status === "ok" && cached.reviews) {
    await supabase
      .from("restaurants")
      .update({ reviews: cached.reviews })
      .eq("id", restaurantId)
      .eq("user_id", user.id);
    return NextResponse.json({ ...(cached.reviews as CachedReviews), from_cache: true });
  }

  if (!force && cached && isFresh && cached.fetch_status === "not_found") {
    return NextResponse.json({
      found: false,
      summary: "후기를 찾지 못했어요",
      pros: [],
      cons: [],
      highlights: [],
      source_hint: "",
      from_cache: true,
    });
  }

  // Build prompt
  const locationHint = restaurant.address ? ` (주소: ${restaurant.address})` : "";
  const categoryHint = restaurant.category ? ` 카테고리: ${restaurant.category}.` : "";

  const prompt = `구글 검색으로 "${restaurant.name}"${locationHint}${categoryHint} 의 블로그·맛집 후기를 찾아 요약해.

**작업:**
- 네이버 블로그, 티스토리, 인스타 후기, 식신·망고플레이트·다이닝코드 등 검색
- 여러 출처의 공통 의견을 종합 (체리피킹 금지)
- 사용자가 가게 가기 전에 알면 좋을 핵심 정리

**출력 (JSON 1개 블록만):**
\`\`\`json
{
  "found": true,
  "summary": "한 문장 종합 평 (50자 내외, 친근한 톤)",
  "pros": ["장점 1", "장점 2", "장점 3"],
  "cons": ["단점/주의점 1", "단점 2"],
  "highlights": ["인기 메뉴 또는 시그니처", "분위기 키워드", "방문 팁"],
  "source_hint": "어떤 출처에서 종합했는지 한 문장"
}
\`\`\`

못 찾으면: {"found":false,"summary":"후기를 찾지 못했어요","pros":[],"cons":[],"highlights":[],"source_hint":""}

- pros/cons 각 0~4개. 단점 없으면 빈 배열.
- 광고성/홍보 문구는 제외하고 실제 후기 톤만.`;

  let result: ReviewResult;
  let sources: { url: string; title?: string }[];
  try {
    const r = await generateGroundedJSON<ReviewResult>(prompt, {
      temperature: 0.3,
      maxOutputTokens: 4000,
    });
    result = r.data;
    sources = r.sources.map((s) => ({ url: s.uri, title: s.title }));
  } catch (e) {
    const raw = e instanceof Error ? e.message : "AI error";
    const isQuota = /429|quota|rate.?limit/i.test(raw);
    if (!isQuota) {
      await admin.from("place_reviews").upsert({
        name_normalized: nameKey,
        lat_bucket: latBucket,
        lng_bucket: lngBucket,
        display_name: restaurant.name,
        fetch_status: "error",
        last_fetched_at: new Date().toISOString(),
      }, { onConflict: "name_normalized,lat_bucket,lng_bucket" });
    }
    return NextResponse.json(
      {
        error: isQuota
          ? "AI 검색 사용량이 잠시 한도에 닿았어요. 잠시 후 다시 시도해 주세요."
          : "후기 검색에 실패했어요. 잠시 후 다시 시도해 주세요.",
        code: isQuota ? "QUOTA_EXCEEDED" : "AI_ERROR",
      },
      { status: isQuota ? 429 : 502 }
    );
  }

  const payload: CachedReviews = { ...result, sources };

  if (result.found) {
    await admin.from("place_reviews").upsert({
      name_normalized: nameKey,
      lat_bucket: latBucket,
      lng_bucket: lngBucket,
      display_name: restaurant.name,
      reviews: payload,
      fetch_status: "ok",
      last_fetched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "name_normalized,lat_bucket,lng_bucket" });

    await supabase
      .from("restaurants")
      .update({ reviews: payload })
      .eq("id", restaurantId)
      .eq("user_id", user.id);
  } else {
    await admin.from("place_reviews").upsert({
      name_normalized: nameKey,
      lat_bucket: latBucket,
      lng_bucket: lngBucket,
      display_name: restaurant.name,
      reviews: null,
      fetch_status: "not_found",
      last_fetched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "name_normalized,lat_bucket,lng_bucket" });
  }

  return NextResponse.json({ ...payload, from_cache: false });
}
