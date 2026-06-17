import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateGroundedJSON } from "@/lib/ai/gemini";
import { readPlaceCache, writePlaceCache } from "@/lib/place-cache";
import { AIBadRequest, createAIRoute } from "@/lib/ai/handler";

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

export const POST = createAIRoute<{ restaurantId: string; force: boolean }, unknown>({
  rateKey: "ai-find-reviews",
  perMinute: 3,
  perDay: 30,
  parseBody: (raw) => {
    const obj = raw as { restaurantId?: unknown; force?: unknown };
    if (typeof obj.restaurantId !== "string" || !obj.restaurantId) {
      throw new AIBadRequest("restaurantId required");
    }
    return { restaurantId: obj.restaurantId, force: !!obj.force };
  },
  handler: async ({ supabase, user, body }) => {
    const { restaurantId, force } = body;

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
    const cache = await readPlaceCache<CachedReviews>({
      admin,
      table: "place_reviews",
      name: restaurant.name,
      lat: restaurant.lat,
      lng: restaurant.lng,
      okTtlMs: OK_TTL_MS,
      negTtlMs: NEGATIVE_TTL_MS,
    });

    if (!force && cache.fresh && cache.status === "ok" && cache.payload) {
      await supabase
        .from("restaurants")
        .update({ reviews: cache.payload })
        .eq("id", restaurantId)
        .eq("user_id", user.id);
      return { ...cache.payload, from_cache: true };
    }

    if (!force && cache.fresh && cache.status === "not_found") {
      return {
        found: false,
        summary: "후기를 찾지 못했어요",
        pros: [],
        cons: [],
        highlights: [],
        source_hint: "",
        from_cache: true,
      };
    }

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
        await writePlaceCache({
          admin,
          table: "place_reviews",
          name: restaurant.name,
          displayName: restaurant.name,
          lat: restaurant.lat,
          lng: restaurant.lng,
          status: "error",
          payload: null,
        });
      }
      return NextResponse.json(
        {
          error: isQuota
            ? "AI 검색 사용량이 잠시 한도에 닿았어요. 잠시 후 다시 시도해 주세요."
            : "후기 검색에 실패했어요. 잠시 후 다시 시도해 주세요.",
          code: isQuota ? "QUOTA_EXCEEDED" : "AI_ERROR",
        },
        { status: isQuota ? 429 : 502 },
      );
    }

    const payload: CachedReviews = { ...result, sources };

    if (result.found) {
      await writePlaceCache({
        admin,
        table: "place_reviews",
        name: restaurant.name,
        displayName: restaurant.name,
        lat: restaurant.lat,
        lng: restaurant.lng,
        status: "ok",
        payload,
      });
      await supabase
        .from("restaurants")
        .update({ reviews: payload })
        .eq("id", restaurantId)
        .eq("user_id", user.id);
    } else {
      await writePlaceCache({
        admin,
        table: "place_reviews",
        name: restaurant.name,
        displayName: restaurant.name,
        lat: restaurant.lat,
        lng: restaurant.lng,
        status: "not_found",
        payload: null,
      });
    }

    return { ...payload, from_cache: false };
  },
});
