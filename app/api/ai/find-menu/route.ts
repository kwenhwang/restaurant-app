import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateGroundedJSON } from "@/lib/ai/gemini";
import {
  readPlaceCache,
  writePlaceCache,
} from "@/lib/place-cache";
import { AIBadRequest, createAIRoute } from "@/lib/ai/handler";

interface MenuResult {
  found: boolean;
  items: { name: string; price: string | null }[];
  price_range: string | null;
  summary: string;
  source_hint: string;
}

interface CachedMenu {
  items: { name: string; price: string | null }[];
  price_range: string | null;
  summary: string | null;
  source: "ai-vision" | "manual" | "ai-search";
}

export const dynamic = "force-dynamic";

const OK_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const NEGATIVE_TTL_MS = 1 * 24 * 60 * 60 * 1000;

export const POST = createAIRoute<{ restaurantId: string; force: boolean }, unknown>({
  rateKey: "ai-find-menu",
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
      .select("id, name, address, category, lat, lng, menu")
      .eq("id", restaurantId)
      .eq("user_id", user.id)
      .single();

    if (!restaurant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const admin = createAdminClient();
    const cache = await readPlaceCache<CachedMenu>({
      admin,
      table: "place_menus",
      name: restaurant.name,
      lat: restaurant.lat,
      lng: restaurant.lng,
      okTtlMs: OK_TTL_MS,
      negTtlMs: NEGATIVE_TTL_MS,
    });

    if (!force && cache.fresh && cache.status === "ok" && cache.payload) {
      await supabase
        .from("restaurants")
        .update({ menu: cache.payload })
        .eq("id", restaurantId)
        .eq("user_id", user.id);
      return {
        found: true,
        items: cache.payload.items,
        price_range: cache.payload.price_range,
        summary: cache.payload.summary ?? "",
        source_hint: "다른 사용자가 이미 등록한 메뉴",
        from_cache: true,
      };
    }

    if (!force && cache.fresh && cache.status === "not_found") {
      return {
        found: false,
        items: [],
        price_range: null,
        summary: "메뉴를 찾지 못했어요. 잠시 후 '다시 찾기'로 재시도해 보세요.",
        source_hint: "",
        from_cache: true,
        can_retry: true,
      };
    }

    const locationHint = restaurant.address ? ` (주소: ${restaurant.address})` : "";
    const categoryHint = restaurant.category ? ` 카테고리: ${restaurant.category}.` : "";

    const prompt = `구글 검색으로 "${restaurant.name}"${locationHint}${categoryHint} 의 메뉴를 찾아.

**작업:** 검색 결과(블로그/맛집 글/배달앱)에서 대표 메뉴 최대 8개 추출. 다른 지역의 동명 가게 주의.

**출력 (마지막에 단 1개의 JSON 블록만, 추가 텍스트 없이):**
\`\`\`json
{"found":true,"items":[{"name":"메뉴명","price":"12,000원"}],"price_range":"8,000원~25,000원","summary":"한 문장 요약 40자 내외","source_hint":"출처 한 문장"}
\`\`\`

못 찾으면: {"found":false,"items":[],"price_range":null,"summary":"메뉴를 찾지 못했어요","source_hint":""}`;

    let result: MenuResult;
    try {
      const { data } = await generateGroundedJSON<MenuResult>(prompt, {
        temperature: 0.2,
        maxOutputTokens: 4000,
      });
      result = data;
    } catch (e) {
      const raw = e instanceof Error ? e.message : "AI error";
      const isQuota = /429|quota|rate.?limit/i.test(raw);
      if (!isQuota) {
        await writePlaceCache({
          admin,
          table: "place_menus",
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
            ? "AI 검색 사용량이 잠시 한도에 닿았어요. 잠시 후 다시 시도하거나 메뉴판 사진으로 추출해 보세요."
            : "메뉴 검색에 실패했어요. 잠시 후 다시 시도해 주세요.",
          code: isQuota ? "QUOTA_EXCEEDED" : "AI_ERROR",
        },
        { status: isQuota ? 429 : 502 },
      );
    }

    if (result.found && result.items?.length > 0) {
      const menuPayload: CachedMenu = {
        items: result.items.slice(0, 12),
        price_range: result.price_range,
        summary: result.summary,
        source: "ai-search",
      };

      await writePlaceCache({
        admin,
        table: "place_menus",
        name: restaurant.name,
        displayName: restaurant.name,
        lat: restaurant.lat,
        lng: restaurant.lng,
        status: "ok",
        payload: menuPayload,
      });

      await supabase
        .from("restaurants")
        .update({ menu: menuPayload })
        .eq("id", restaurantId)
        .eq("user_id", user.id);
    } else {
      await writePlaceCache({
        admin,
        table: "place_menus",
        name: restaurant.name,
        displayName: restaurant.name,
        lat: restaurant.lat,
        lng: restaurant.lng,
        status: "not_found",
        payload: null,
      });
    }

    return { ...result, from_cache: false };
  },
});
