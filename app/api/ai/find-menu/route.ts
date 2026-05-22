import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateGroundedJSON } from "@/lib/ai/gemini";
import { normalizeName, bucketCoord } from "@/lib/place-cache";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

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

// Successful menu cache: 30 days (menus don't change often)
const OK_TTL_MS = 30 * 24 * 60 * 60 * 1000;
// Not-found cache: 1 day (chains add new branches, info gets indexed later)
const NEGATIVE_TTL_MS = 1 * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });


  const _rl = checkRateLimit({ key: `${user.id}:ai-find-menu`, perMinute: 3, perDay: 30 });
  const _rlRes = rateLimitResponse(_rl);
  if (_rlRes) return _rlRes;
  const body = await request.json().catch(() => ({}));
  const { restaurantId, force } = body;
  if (!restaurantId || typeof restaurantId !== "string") {
    return NextResponse.json({ error: "restaurantId required" }, { status: 400 });
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, address, category, lat, lng, menu")
    .eq("id", restaurantId)
    .eq("user_id", user.id)
    .single();

  if (!restaurant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Admin client for cache reads/writes (RLS bypass to share across users)
  const admin = createAdminClient();
  const nameKey = normalizeName(restaurant.name);
  const { latBucket, lngBucket } = bucketCoord(restaurant.lat, restaurant.lng);

  // 1. Try cache first
  const cacheQuery = admin
    .from("place_menus")
    .select("menu, fetch_status, last_fetched_at")
    .eq("name_normalized", nameKey);
  if (latBucket !== null) {
    cacheQuery.eq("lat_bucket", latBucket).eq("lng_bucket", lngBucket);
  } else {
    cacheQuery.is("lat_bucket", null).is("lng_bucket", null);
  }
  const { data: cached } = await cacheQuery.maybeSingle();

  const cachedAgeMs = cached?.last_fetched_at
    ? Date.now() - new Date(cached.last_fetched_at).getTime()
    : Infinity;
  const ttl = cached?.fetch_status === "ok" ? OK_TTL_MS : NEGATIVE_TTL_MS;
  const isFresh = cachedAgeMs < ttl;

  // force=true bypasses cache entirely
  if (!force && cached && isFresh && cached.fetch_status === "ok" && cached.menu) {
    // Cache hit — copy to user's restaurant too
    await supabase
      .from("restaurants")
      .update({ menu: cached.menu })
      .eq("id", restaurantId)
      .eq("user_id", user.id);

    return NextResponse.json({
      found: true,
      items: (cached.menu as CachedMenu).items,
      price_range: (cached.menu as CachedMenu).price_range,
      summary: (cached.menu as CachedMenu).summary ?? "",
      source_hint: "다른 사용자가 이미 등록한 메뉴",
      from_cache: true,
    });
  }

  if (!force && cached && isFresh && cached.fetch_status === "not_found") {
    return NextResponse.json({
      found: false,
      items: [],
      price_range: null,
      summary: "메뉴를 찾지 못했어요. 잠시 후 '다시 찾기'로 재시도해 보세요.",
      source_hint: "",
      from_cache: true,
      can_retry: true,
    });
  }

  // 2. Cache miss or stale — call Gemini grounding
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
    const userMessage = isQuota
      ? "AI 검색 사용량이 잠시 한도에 닿았어요. 잠시 후 다시 시도하거나 메뉴판 사진으로 추출해 보세요."
      : "메뉴 검색에 실패했어요. 잠시 후 다시 시도해 주세요.";
    // Don't cache quota errors (transient); cache only true errors lightly
    if (!isQuota) {
      await admin
        .from("place_menus")
        .upsert({
          name_normalized: nameKey,
          lat_bucket: latBucket,
          lng_bucket: lngBucket,
          display_name: restaurant.name,
          fetch_status: "error",
          last_fetched_at: new Date().toISOString(),
        }, { onConflict: "name_normalized,lat_bucket,lng_bucket" });
    }
    return NextResponse.json(
      { error: userMessage, code: isQuota ? "QUOTA_EXCEEDED" : "AI_ERROR" },
      { status: isQuota ? 429 : 502 }
    );
  }

  // 3. Save to shared cache + user's restaurant
  if (result.found && result.items?.length > 0) {
    const menuPayload: CachedMenu = {
      items: result.items.slice(0, 12),
      price_range: result.price_range,
      summary: result.summary,
      source: "ai-search",
    };

    await admin.from("place_menus").upsert(
      {
        name_normalized: nameKey,
        lat_bucket: latBucket,
        lng_bucket: lngBucket,
        display_name: restaurant.name,
        menu: menuPayload,
        fetch_status: "ok",
        last_fetched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "name_normalized,lat_bucket,lng_bucket" }
    );

    await supabase
      .from("restaurants")
      .update({ menu: menuPayload })
      .eq("id", restaurantId)
      .eq("user_id", user.id);
  } else {
    // Not found — cache the negative result
    await admin.from("place_menus").upsert(
      {
        name_normalized: nameKey,
        lat_bucket: latBucket,
        lng_bucket: lngBucket,
        display_name: restaurant.name,
        menu: null,
        fetch_status: "not_found",
        last_fetched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "name_normalized,lat_bucket,lng_bucket" }
    );
  }

  return NextResponse.json({ ...result, from_cache: false });
}
