import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/gemini";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

interface ParseResult {
  name: string | null;
  category: string | null;
  rating: number | null;
  memo: string | null;
}

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });


  const _rl = checkRateLimit({ key: `${user.id}:ai`, perMinute: 10, perDay: 100 });
  const _rlRes = rateLimitResponse(_rl);
  if (_rlRes) return _rlRes;
  const { transcript } = await request.json().catch(() => ({}));
  if (typeof transcript !== "string" || !transcript.trim()) {
    return NextResponse.json({ error: "transcript required" }, { status: 400 });
  }

  const prompt = `다음은 사용자가 음식점에 다녀와서 음성으로 말한 내용을 받아쓴 것이야.
여기서 맛집 정보를 추출해 JSON으로 출력해.

**받아쓴 내용:**
"${transcript.replace(/"/g, '\\"').slice(0, 500)}"

**추출 규칙:**
- name: 식당 이름 (지역명 포함 가능, 예: "강남 본가", "성수 어니언"). 분명히 추출 가능하면, 아니면 null
- category: 한식·중식·일식·양식·카페·술집·디저트·기타 중 하나, 모르겠으면 null
- rating: 1~5 정수. "별 다섯", "5점", "최고", "별로" 등 표현에서 추론. 안 나오면 null
- memo: 사용자의 감상·메뉴·분위기를 한 문장으로 정리 (60자 내외). 단순 사실만 있으면 null

**출력 (JSON만):**
{
  "name": <문자열|null>,
  "category": <문자열|null>,
  "rating": <1~5|null>,
  "memo": <문자열|null>
}`;

  try {
    const result = await generateJSON<ParseResult>(prompt, {
      temperature: 0.3,
      maxOutputTokens: 300,
    });

    // Normalize
    const valid = ["한식", "중식", "일식", "양식", "카페", "술집", "디저트", "기타"];
    if (result.category && !valid.includes(result.category)) result.category = null;
    if (result.rating !== null && (result.rating < 1 || result.rating > 5)) {
      result.rating = null;
    }
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
