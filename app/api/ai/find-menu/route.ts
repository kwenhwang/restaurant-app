import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateGroundedJSON } from "@/lib/ai/gemini";

interface MenuResult {
  found: boolean;
  items: { name: string; price: string | null }[];
  price_range: string | null;
  summary: string;
  source_hint: string;
}

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { restaurantId } = await request.json().catch(() => ({}));
  if (!restaurantId || typeof restaurantId !== "string") {
    return NextResponse.json({ error: "restaurantId required" }, { status: 400 });
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, address, category")
    .eq("id", restaurantId)
    .eq("user_id", user.id)
    .single();

  if (!restaurant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const locationHint = restaurant.address
    ? ` (주소: ${restaurant.address})`
    : "";
  const categoryHint = restaurant.category
    ? ` 카테고리: ${restaurant.category}.`
    : "";

  const prompt = `구글 검색으로 "${restaurant.name}"${locationHint}${categoryHint} 의 메뉴를 찾아.

**작업:** 검색 결과(블로그/맛집 글/배달앱)에서 대표 메뉴 최대 8개 추출. 다른 지역의 동명 가게 주의.

**출력 (마지막에 단 1개의 JSON 블록만, 추가 텍스트 없이):**
\`\`\`json
{"found":true,"items":[{"name":"메뉴명","price":"12,000원"}],"price_range":"8,000원~25,000원","summary":"한 문장 요약 40자 내외","source_hint":"출처 한 문장"}
\`\`\`

못 찾으면: {"found":false,"items":[],"price_range":null,"summary":"메뉴를 찾지 못했어요","source_hint":""}`;

  try {
    const { data, sources } = await generateGroundedJSON<MenuResult>(prompt, {
      temperature: 0.2,
      maxOutputTokens: 4000,
    });

    return NextResponse.json({
      ...data,
      sources: sources.map((s) => ({ url: s.uri, title: s.title })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
