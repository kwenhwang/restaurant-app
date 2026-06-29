// app/api/ai/discover/route.ts
//
// AI Friend Curation — finds NEW restaurants outside the user's list,
// matched to their taste. Uses Gemini Grounding (web search) so we don't
// invent fake places.

import { NextResponse } from "next/server";
import { generateGroundedJSON } from "@/lib/ai/gemini";
import { createAIRoute } from "@/lib/ai/handler";

export const dynamic = "force-dynamic";

interface Pick {
  name: string;
  category: string;
  area: string;
  reason: string;
}

interface AIResult {
  picks: Pick[];
}

interface ResponseShape {
  picks: Pick[];
  sources: { url: string; title?: string }[];
  area: string;
}

function extractRegion(address: string): string | null {
  const m = address.match(/([가-힣]+(?:구|동|시))/);
  return m?.[1] ?? null;
}

export const GET = createAIRoute<null, ResponseShape>({
  rateKey: "ai-discover",
  perMinute: 2,
  perDay: 15,
  handler: async ({ supabase, user, request }) => {
    const sp = request.nextUrl.searchParams;
    const userLat = parseFloat(sp.get("lat") ?? "");
    const userLng = parseFloat(sp.get("lng") ?? "");
    const hasCoord = isFinite(userLat) && isFinite(userLng);

    // 즐겨찾기 OR tier 0/1(좋아함·괜찮음) 가게를 취향 시드로 사용
    const { data: scoresForTop } = await supabase
      .from("restaurant_scores")
      .select("restaurant_id, tier, elo")
      .eq("user_id", user.id)
      .in("tier", [0, 1]);
    const tierRids = (scoresForTop ?? []).map((s) => s.restaurant_id);

    const orParts = ["is_favorite.eq.true"];
    if (tierRids.length) orParts.push(`id.in.(${tierRids.join(",")})`);

    const { data: top } = await supabase
      .from("restaurants")
      .select("id, name, category, is_favorite, address")
      .eq("user_id", user.id)
      .or(orParts.join(","))
      .limit(10);

    if (!top || top.length < 3) {
      return NextResponse.json(
        {
          error: "맛집을 3곳 이상 등록하고 대결 평가를 해주세요. 더 정확한 추천을 드릴 수 있어요.",
          code: "NEED_MORE_DATA",
        },
        { status: 400 },
      );
    }

    const tierByRid = new Map<string, number>();
    for (const s of scoresForTop ?? []) tierByRid.set(s.restaurant_id, s.tier);

    const areaMap = new Map<string, number>();
    for (const r of top) {
      const region = r.address ? extractRegion(r.address) : null;
      if (region) areaMap.set(region, (areaMap.get(region) ?? 0) + 1);
    }
    const topArea = [...areaMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "서울";

    const catMap = new Map<string, number>();
    for (const r of top) {
      if (r.category) catMap.set(r.category, (catMap.get(r.category) ?? 0) + 1);
    }
    const topCats = [...catMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c);

    const tasteLines = top
      .map((r) => {
        const t = tierByRid.get(r.id);
        const tag = r.is_favorite
          ? " ♥즐겨찾기"
          : t === 0
            ? " 😍좋아함"
            : t === 1
              ? " 🙂괜찮음"
              : "";
        return `- ${r.name}${r.category ? ` (${r.category})` : ""}${tag}`;
      })
      .join("\n");

    const locationLine = hasCoord
      ? `사용자 현재 위치 좌표: ${userLat.toFixed(4)}, ${userLng.toFixed(4)} (${topArea} 근처)`
      : `사용자가 주로 가는 지역: ${topArea}`;

    const prompt = `당신은 한국 맛집을 큐레이션하는 친구입니다.

**사용자의 취향 (이미 등록·좋아하는 곳)**
${tasteLines}

선호 카테고리: ${topCats.join(", ")}
${locationLine}

**작업**
구글 검색으로 위 사용자가 좋아할 만한, **위 목록에는 없는** 새로운 한국 맛집 5곳을 추천해주세요.
- 위 지역 또는 인근에서 실제 운영 중인 곳만
- 같은 취향이지만 다른 분위기/특색이 있는 곳 우선 (다양성)
- 광고성·체인 대형 프랜차이즈는 제외
- 이름은 정확히 (구글에서 바로 찾을 수 있도록)

**출력 (JSON 한 블록만):**
\`\`\`json
{
  "picks": [
    {
      "name": "정확한 가게 이름",
      "category": "한식|중식|일식|양식|카페|술집|디저트|기타",
      "area": "동/구 (예: 성수동, 강남역)",
      "reason": "왜 이 사용자에게 어울리는지 (40자 내)"
    }
  ]
}
\`\`\`

picks 정확히 5개. 같은 카테고리만 반복하지 말 것.`;

    const r = await generateGroundedJSON<AIResult>(prompt, {
      temperature: 0.6,
      maxOutputTokens: 4000,
    });

    return {
      picks: r.data.picks ?? [],
      sources: r.sources.map((s) => ({ url: s.uri, title: s.title })),
      area: topArea,
    };
  },
});
