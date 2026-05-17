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

  const prompt = `너는 한국 맛집 데이터 수집가야. 구글 검색을 활용해서 아래 식당의 메뉴를 찾아.

**식당:** "${restaurant.name}"${locationHint}.${categoryHint}

**작업:**
1. 식당의 이름·주소·카테고리 정보로 인터넷 검색 (블로그·맛집 글·배달앱 등)
2. 메뉴와 가격 정보를 최대 12개까지 추출
3. 동일 메뉴가 여러 곳에서 다른 가격이면 가장 자주 언급되는 가격
4. 잘못된 식당이 매치될 위험 있으면 found=false 처리 (다른 지역·다른 가게 매치 방지)

**출력 (JSON만, 다른 텍스트 없이):**
\`\`\`json
{
  "found": true,
  "items": [{"name": "메뉴명", "price": "12,000원|null"}],
  "price_range": "8,000원~25,000원|null",
  "summary": "메뉴 한 문장 요약 (50자 내외)",
  "source_hint": "어떤 소스에서 찾았는지 (예: '블로그 후기 여러 곳', '배달앱 메뉴판')"
}
\`\`\`

찾지 못하면:
\`\`\`json
{ "found": false, "items": [], "price_range": null, "summary": "메뉴를 찾지 못했어요", "source_hint": "" }
\`\`\``;

  try {
    const { data, sources } = await generateGroundedJSON<MenuResult>(prompt, {
      temperature: 0.2,
      maxOutputTokens: 2000,
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
