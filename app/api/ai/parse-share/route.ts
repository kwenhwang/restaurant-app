import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/gemini";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

interface ParseResult {
  name: string | null;
  address: string | null;
  category: string | null;
  rating: number | null;
}

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });


  const _rl = checkRateLimit({ key: `${user.id}:ai`, perMinute: 10, perDay: 100 });
  const _rlRes = rateLimitResponse(_rl);
  if (_rlRes) return _rlRes;
  const { text } = await request.json().catch(() => ({}));
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const trimmed = text.trim().slice(0, 1500);

  const prompt = `다음은 다른 앱(카카오맵, 네이버, 인스타, 블로그 등)에서 공유한 텍스트야.
여기서 음식점 정보를 추출해.

**공유된 내용:**
"""
${trimmed.replace(/"""/g, '"\\"\\"')}
"""

**추출 규칙:**
- name: 식당 상호명만. URL은 이름이 아님. 분명히 보이면, 아니면 null
- address: 도로명/지번 주소. 부분 주소도 OK (예: "서울 강남구 ..."). 안 보이면 null
- category: 한식·중식·일식·양식·카페·술집·디저트·기타 중 하나, 추론. 모르겠으면 null
- rating: 1~5 정수. 별점·점수 표현 있으면, 없으면 null

**출력 (JSON만):**
{
  "name": <문자열|null>,
  "address": <문자열|null>,
  "category": <문자열|null>,
  "rating": <1~5|null>
}`;

  try {
    const result = await generateJSON<ParseResult>(prompt, {
      temperature: 0.2,
      maxOutputTokens: 300,
    });
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
